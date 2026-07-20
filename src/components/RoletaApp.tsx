'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WheelCanvas from './WheelCanvas';
import AuthModal from './AuthModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import HistoryModal from './HistoryModal';
import AffiliateModal from './AffiliateModal';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  balance: number;
  bonusBalance?: number;
  affiliateCode: string;
}

interface SpinResult {
  mainResult: number;
  bonusResult: number;
  totalMultiplier: number;
  winAmount: number;
}

// Must stay in sync with the segment values drawn by WheelCanvas.
const MAIN_VALUES = [1, 2, 3, 5, 10, 20, 50, 100, 0.5];
const BONUS_VALUES = [1, 2, 3, 4];

const QUICK_BETS = [5, 10, 25, 50, 100];

const TWO_PI = Math.PI * 2;

/**
 * Computes a rotation target (in radians) that will land the wheel's pointer
 * (fixed at the top, 12 o'clock) on the segment holding `value`, always
 * moving forward from `current` by at least `minExtraSpins` full turns so
 * the animation always spins visibly forward.
 */
function computeTargetRotation(
  current: number,
  values: number[],
  value: number,
  minExtraSpins: number
): number {
  const index = Math.max(values.indexOf(value), 0);
  const arc = TWO_PI / values.length;
  // Angle (mod 2π) that places this segment's center under the top pointer.
  const normalizedTarget = (((-(index + 0.5) * arc) % TWO_PI) + TWO_PI) % TWO_PI;
  const currentBase = Math.floor(current / TWO_PI) * TWO_PI;
  return currentBase + minExtraSpins * TWO_PI + normalizedTarget;
}

function animateRotation(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  onDone: () => void
) {
  const start = performance.now();

  function tick(now: number) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    onUpdate(from + (to - from) * eased);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onDone();
    }
  }

  requestAnimationFrame(tick);
}

export default function RoletaApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  const [showAuth, setShowAuth] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);

  const [betAmount, setBetAmount] = useState('10');
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);

  const [mainRotation, setMainRotation] = useState(0);
  const [bonusRotation, setBonusRotation] = useState(0);
  const mainRotationRef = useRef(0);
  const bonusRotationRef = useRef(0);

  // Load the authenticated user (if any) and capture a referral code from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.user ?? null;
      })
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  const updateMainRotation = useCallback((value: number) => {
    mainRotationRef.current = value;
    setMainRotation(value);
  }, []);

  const updateBonusRotation = useCallback((value: number) => {
    bonusRotationRef.current = value;
    setBonusRotation(value);
  }, []);

  const handleAuthSuccess = useCallback((userData: User) => {
    setUser(userData);
    setShowAuth(false);
    setError('');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE', credentials: 'include' });
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setLastResult(null);
    }
  }, []);

  const handleDepositSuccess = useCallback((newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : prev));
    setShowDeposit(false);
  }, []);

  const handleWithdrawSuccess = useCallback((newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : prev));
  }, []);

  const handleSpin = useCallback(async () => {
    if (spinning) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    const bet = parseFloat(betAmount);
    if (!bet || bet <= 0) {
      setError('Informe um valor de aposta válido');
      return;
    }
    if (bet > user.balance) {
      setError('Saldo insuficiente');
      return;
    }

    setError('');
    setLastResult(null);
    setSpinning(true);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ betAmount: bet }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao girar a roleta');
        setSpinning(false);
        return;
      }

      const mainTarget = computeTargetRotation(mainRotationRef.current, MAIN_VALUES, data.mainResult, 5);
      const bonusTarget = computeTargetRotation(bonusRotationRef.current, BONUS_VALUES, data.bonusResult, 7);
      const duration = 4000;

      animateRotation(mainRotationRef.current, mainTarget, duration, updateMainRotation, () => {});
      animateRotation(bonusRotationRef.current, bonusTarget, duration, updateBonusRotation, () => {
        setSpinning(false);
        setLastResult({
          mainResult: data.mainResult,
          bonusResult: data.bonusResult,
          totalMultiplier: data.totalMultiplier,
          winAmount: data.winAmount,
        });
        setUser((prev) => (prev ? { ...prev, balance: data.newBalance } : prev));
      });
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setSpinning(false);
    }
  }, [betAmount, spinning, user, updateMainRotation, updateBonusRotation]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      <header style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>🎰 Roleta da Sorte</h1>

        {!loadingUser && (
          user ? (
            <button className="btn-ghost" onClick={handleLogout}>Sair</button>
          ) : (
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowAuth(true)}>
              Entrar
            </button>
          )
        )}
      </header>

      {user && (
        <div className="card" style={{
          width: '100%',
          maxWidth: 480,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saldo disponível</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>
              R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => setShowDeposit(true)}>💰 Depositar</button>
            <button className="btn-ghost" onClick={() => setShowWithdraw(true)}>💸 Sacar</button>
          </div>
        </div>
      )}

      <div className={`card ${spinning ? 'pulsing' : ''}`} style={{
        width: '100%',
        maxWidth: 480,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center' }}>
          <div className="wheel-glow">
            <WheelCanvas type="main" rotation={mainRotation} size={220} />
          </div>
          <div className="wheel-glow">
            <WheelCanvas type="bonus" rotation={bonusRotation} size={120} />
          </div>
        </div>

        {lastResult && !spinning && (
          <div className="win-text" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {lastResult.mainResult}x × {lastResult.bonusResult}x = {lastResult.totalMultiplier}x
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-gold)' }}>
              +R$ {lastResult.winAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {QUICK_BETS.map((v) => (
              <button
                key={v}
                type="button"
                disabled={spinning}
                onClick={() => setBetAmount(String(v))}
                style={{
                  background: betAmount === String(v) ? 'rgba(0,255,136,0.15)' : 'var(--bg-card2)',
                  border: betAmount === String(v) ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '8px 4px',
                  cursor: spinning ? 'not-allowed' : 'pointer',
                  color: betAmount === String(v) ? 'var(--accent-green)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                R$ {v}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
            <input
              className="input-field"
              style={{ paddingLeft: 40 }}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Valor da aposta"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={spinning}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--accent-red)', fontSize: 14, textAlign: 'center' }}>{error}</p>
          )}

          <button className="btn-spin" style={{ borderRadius: 12, padding: '16px 24px', fontSize: 18 }} disabled={spinning} onClick={handleSpin}>
            {spinning ? 'Girando...' : user ? '🎲 Girar Roleta' : '🔒 Entrar para Jogar'}
          </button>
        </div>
      </div>

      {user && (
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowHistory(true)}>📜 Histórico</button>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAffiliate(true)}>🤝 Afiliados</button>
        </div>
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} referralCode={referralCode} />
      )}

      {showDeposit && user && (
        <DepositModal onClose={() => setShowDeposit(false)} onSuccess={handleDepositSuccess} />
      )}

      {showWithdraw && user && (
        <WithdrawModal
          balance={user.balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} />
      )}

      {showAffiliate && (
        <AffiliateModal onClose={() => setShowAffiliate(false)} />
      )}
    </div>
  );
    }
      
