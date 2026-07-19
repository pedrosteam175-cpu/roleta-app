'use client';
import { useState } from 'react';
import CardPaymentModal from './CardPaymentModal';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'card'>('amount');

  function handleCard(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(amount);
    if (!v || v <= 0) return;
    setStep('card');
  }

  if (step === 'card') {
    return (
      <CardPaymentModal
        amount={parseFloat(amount)}
        onClose={onClose}
        onSuccess={onSuccess}
        onBack={() => setStep('amount')}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>💰 Depositar</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleCard} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Method badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.2)', borderRadius: 10, padding: '10px 14px' }}>
            <span style={{ fontSize: 20 }}>💳</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Cartão de Crédito</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aprovação instantânea • Sem valor mínimo</p>
            </div>
          </div>

          {/* Quick amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {QUICK_AMOUNTS.map(v => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                style={{
                  background: amount === String(v) ? 'rgba(0,255,136,0.15)' : 'var(--bg-card2)',
                  border: amount === String(v) ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
                  color: amount === String(v) ? 'var(--accent-green)' : 'var(--text-primary)',
                  fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                }}>R$ {v}</button>
            ))}
          </div>

          {/* Custom amount */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
            <input className="input-field" style={{ paddingLeft: 40 }}
              type="number" step="0.01" min="0.01" placeholder="Outro valor"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <button className="btn-primary" type="submit" disabled={!amount || parseFloat(amount) <= 0}>
            Continuar para pagamento →
          </button>
        </form>
      </div>
    </div>
  );
}
