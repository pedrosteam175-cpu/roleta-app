'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import WheelCanvas from './WheelCanvas';
import AuthModal from './AuthModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import HistoryModal from './HistoryModal';
import AffiliateModal from './AffiliateModal';

interface User {
  id: string; name: string; email: string; cpf?: string;
  balance: number; bonusBalance?: number; affiliateCode: string;
}

// Segment counts for angle calculation
const MAIN_COUNT = 9;
const BONUS_COUNT = 4;

// Map result value to segment index
const MAIN_VALUES = [1, 2, 3, 5, 10, 20, 50, 100, 0.5];
const BONUS_VALUES = [1, 2, 3, 4];

function valueToAngle(value: number, values: number[], total: number): number {
  const idx = values.indexOf(value);
  if (idx === -1) return 0;
  const arc = (2 * Math.PI) / total;
  return idx * arc;
}

export default function RoletaApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [modal, setModal] = useState<null | 'auth' | 'deposit' | 'withdraw' | 'history' | 'affiliate' | 'win'>(null);
  const [betAmount, setBetAmount] = useState(0.5);
  const [spinning, setSpinning] = useState(false);
  const [flash, setFlash] = useState(false);

  // Wheel animation
  const [mainRotation, setMainRotation] = useState(0);
  const [bonusRotation, setBonusRotation] = useState(0);
  const mainRotRef = useRef(0);
  const bonusRotRef = useRef(0);
  const animRef = useRef<number>(0);

  // Win state
  const [winData, setWinData] = useState<{ mainResult: number; bonusResult: number; totalMultiplier: number; winAmount: number } | null>(null);
  const [floatingWin, setFloatingWin] = useState<{ key: number; amount: number } | null>(null);

  // Wheel size
  const [wheelSize, setWheelSize] = useState(220);
  const [bonusWheelSize, setBonusWheelSize] = useState(140);

  useEffect(() => {
    function updateSizes() {
      const w = window.innerWidth;
      if (w < 400) { setWheelSize(160); setBonusWheelSize(100); }
      else if (w < 600) { setWheelSize(200); setBonusWheelSize(125); }
      else { setWheelSize(240); setBonusWheelSize(150); }
    }
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setUser(d.user);
    }).finally(() => setAuthLoading(false));
  }, []);

  const spinWheels = useCallback(async () => {
    if (spinning || !user) return;
    if (user.balance < betAmount) { alert('Saldo insuficiente'); return; }

    setSpinning(true);
    setWinData(null);

    // Start spinning animation
    let mainSpeed = 0.25;
    let bonusSpeed = 0.18;
    let startTime: number | null = null;
    const SPIN_DURATION = flash ? 3000 : 5000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      mainSpeed = 0.25 * (1 - ease * 0.85);
      bonusSpeed = 0.18 * (1 - ease * 0.85);

      mainRotRef.current += mainSpeed;
      bonusRotRef.current += bonusSpeed;
      setMainRotation(mainRotRef.current);
      setBonusRotation(bonusRotRef.current);

      if (progress < 0.7) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Fetch result and stop on correct segment
        fetch('/api/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ betAmount }),
        }).then(r => r.json()).then(data => {
          if (data.error) {
            alert(data.error);
            setSpinning(false);
            return;
          }

          const mainTarget = valueToAngle(data.mainResult, MAIN_VALUES, MAIN_COUNT);
          const bonusTarget = valueToAngle(data.bonusResult, BONUS_VALUES, BONUS_COUNT);

          // Snap to the winning segment (add extra rotations for visual effect)
          const extraRotations = Math.PI * 4;
          const mainFinal = Math.ceil(mainRotRef.current / (2 * Math.PI)) * (2 * Math.PI) + extraRotations + mainTarget;
          const bonusFinal = Math.ceil(bonusRotRef.current / (2 * Math.PI)) * (2 * Math.PI) + extraRotations + bonusTarget;

          // Animate to final position
          const snapDuration = 1200;
          const snapStart = performance.now();
          const snapMainStart = mainRotRef.current;
          const snapBonusStart = bonusRotRef.current;

          const snapAnimate = (ts: number) => {
            const p = Math.min((ts - snapStart) / snapDuration, 1);
            const e = 1 - Math.pow(1 - p, 4);
            const curMain = snapMainStart + (mainFinal - snapMainStart) * e;
            const curBonus = snapBonusStart + (bonusFinal - snapBonusStart) * e;
            mainRotRef.current = curMain;
            bonusRotRef.current = curBonus;
            setMainRotation(curMain);
            setBonusRotation(curBonus);

            if (p < 1) {
              animRef.current = requestAnimationFrame(snapAnimate);
            } else {
              setUser(prev => prev ? { ...prev, balance: data.newBalance } : prev);
              setWinData(data);
              setFloatingWin({ key: Date.now(), amount: data.winAmount });
              setModal('win');
              setSpinning(false);
              setTimeout(() => setFloatingWin(null), 2000);
            }
          };
          animRef.current = requestAnimationFrame(snapAnimate);
        }).catch(() => {
          setSpinning(false);
          alert('Erro ao girar');
        });
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, user, betAmount, flash]);

  function handleLogout() {
    fetch('/api/auth/me', { method: 'DELETE', credentials: 'include' }).then(() => setUser(null));
  }

  const menuItems = user ? [
    { label: '💰 Depositar', action: () => setModal('deposit') },
    { label: '💸 Sacar', action: () => setModal('withdraw') },
    { label: '📜 Histórico', action: () => setModal('history') },
    { label: '🤝 Afiliado', action: () => setModal('affiliate') },
    { label: '📊 Painel Admin', action: () => { window.location.href = '/admin/painel'; } },
    { label: '⚙️ Configurações', action: () => { window.location.href = '/admin'; } },
    { label: '🚪 Sair', action: handleLogout },
  ] : [];

  const [menuOpen, setMenuOpen] = useState(false);

  const BET_STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100];

  function changeBet(dir: 1 | -1) {
    const idx = BET_STEPS.indexOf(betAmount);
    const next = idx + dir;
    if (next >= 0 && next < BET_STEPS.length) setBetAmount(BET_STEPS[next]);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎰</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(90deg, #ffd700, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Roleta da Sorte
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gire e Ganhe Sempre!</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 10, padding: '6px 14px', textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saldo</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-green)' }}>
                  R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(v => !v)}
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 20 }}>
                  👤
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 700 }}>{user.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                    {menuItems.map(item => (
                      <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }}
                        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', fontSize: 14, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >{item.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }} onClick={() => setModal('auth')}>
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </header>

      {/* Main game area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 20 }}>
        {/* Wheels */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Main wheel */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Pointer */}
            <div style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '24px solid #ffd700', marginBottom: -2, zIndex: 10, filter: 'drop-shadow(0 2px 6px #ffd70066)' }} />
            <div style={{ borderRadius: '50%', padding: 4, background: 'linear-gradient(135deg, #ffd70044, #00ff8822)', border: '2px solid rgba(255,215,0,0.4)' }} className={spinning ? 'pulsing' : ''}>
              <WheelCanvas type="main" rotation={mainRotation} size={wheelSize} />
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Roleta Principal</p>
          </div>

          {/* Bonus wheel */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '16px solid #00ff88', marginBottom: -2, zIndex: 10, filter: 'drop-shadow(0 2px 4px #00ff8866)' }} />
            <div style={{ borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg, #00ff8822, #ffd70022)', border: '2px solid rgba(0,255,136,0.3)' }}>
              <WheelCanvas type="bonus" rotation={bonusRotation} size={bonusWheelSize} />
            </div>
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>Multiplicador Bônus</p>
          </div>
        </div>

        {/* Floating win effect */}
        {floatingWin && (
          <div key={floatingWin.key} style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, fontWeight: 900, color: 'var(--accent-gold)', zIndex: 200, animation: 'float-up 1.5s ease-out forwards', pointerEvents: 'none', textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>
            +R$ {floatingWin.amount.toFixed(2)}
          </div>
        )}

        {/* Game controls */}
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: '20px 24px' }}>
          {/* Bet control */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Valor do Giro</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-gold)' }}>
                R$ {betAmount.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => changeBet(-1)} disabled={betAmount === BET_STEPS[0]}
                style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card2)', border: '1px solid var(--border)', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                −
              </button>
              <div style={{ flex: 1, background: 'var(--bg-card2)', borderRadius: 10, overflow: 'hidden', height: 8 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #00ff88, #ffd700)', width: `${(BET_STEPS.indexOf(betAmount) / (BET_STEPS.length - 1)) * 100}%`, transition: 'width 0.2s' }} />
              </div>
              <button onClick={() => changeBet(1)} disabled={betAmount === BET_STEPS[BET_STEPS.length - 1]}
                style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card2)', border: '1px solid var(--border)', cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                +
              </button>
            </div>
          </div>

          {/* Flash mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>⚡ Modo Flash</span>
            <button onClick={() => setFlash(v => !v)}
              style={{ width: 48, height: 26, borderRadius: 13, background: flash ? 'var(--accent-green)' : 'var(--bg-card2)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: flash ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            </button>
          </div>

          {/* Spin button */}
          <button
            className="btn-spin"
            style={{ width: '100%', padding: '18px', borderRadius: 16, fontSize: 18, letterSpacing: 1 }}
            onClick={() => user ? spinWheels() : setModal('auth')}
            disabled={spinning}
          >
            {spinning ? '⏳ Girando...' : user ? '🎰 GIRAR' : '🎰 ENTRAR E JOGAR'}
          </button>

          {user && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setModal('deposit')}>+ Depositar</button>
              <button className="btn-ghost" style={{ flex: 1, fontSize: 13 }} onClick={() => setModal('withdraw')}>Sacar</button>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: '16px 20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent-gold)' }}>💎 Como Funciona</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <p>🎰 <strong style={{ color: '#fff' }}>Roleta Principal:</strong> 0.5x a 100x sua aposta</p>
            <p>✨ <strong style={{ color: '#fff' }}>Bônus:</strong> Multiplica por 1x, 2x, 3x ou 4x</p>
            <p>💰 <strong style={{ color: '#fff' }}>Prêmio:</strong> Aposta × Principal × Bônus</p>
            <p>🎁 <strong style={{ color: 'var(--accent-green)' }}>Bônus Inicial: R$ 1.000,00</strong> para novos jogadores!</p>
            <p>💳 <strong style={{ color: '#fff' }}>PIX:</strong> Sem valor mínimo de depósito ou saque</p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modal === 'auth' && (
        <AuthModal
          onClose={() => setModal(null)}
          onSuccess={u => { setUser(u); setModal(null); }}
          referralCode={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') ?? '' : ''}
        />
      )}
      {modal === 'deposit' && user && (
        <DepositModal
          onClose={() => setModal(null)}
          onSuccess={newBalance => { setUser(prev => prev ? { ...prev, balance: newBalance } : prev); setModal(null); }}
        />
      )}
      {modal === 'withdraw' && user && (
        <WithdrawModal
          balance={user.balance}
          cpf={user.cpf ?? ''}
          name={user.name}
          onClose={() => setModal(null)}
          onSuccess={newBalance => { setUser(prev => prev ? { ...prev, balance: newBalance } : prev); setModal(null); }}
        />
      )}
      {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
      {modal === 'affiliate' && <AffiliateModal onClose={() => setModal(null)} />}

      {/* Win modal */}
      {modal === 'win' && winData && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ textAlign: 'center', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }} className="win-text">Parabéns!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Você ganhou</p>
            <div style={{ background: 'rgba(0,255,136,0.1)', border: '2px solid var(--accent-green)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent-green)' }}>
                R$ {winData.winAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                {winData.mainResult}x multiplicado por {winData.bonusResult}x
              </p>
            </div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 14 }}>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Saldo atual</p>
                <p style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                  R$ {user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setModal(null)}>Continuar</button>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
