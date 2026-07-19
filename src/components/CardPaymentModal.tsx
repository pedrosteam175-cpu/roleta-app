'use client';
import { useState } from 'react';

interface CardPaymentModalProps {
  amount: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  onBack: () => void;
}

export default function CardPaymentModal({ amount, onClose, onSuccess, onBack }: CardPaymentModalProps) {
  // Card fields
  const [holderName, setHolderName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [ccv, setCcv] = useState('');

  // Holder info
  const [cpf, setCpf] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState(0);

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }
  function formatCpf(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .replace(/(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
      .replace(/(\d{3})(\d{3})$/, '$1.$2')
      .replace(/(\d{3})$/, '$1');
  }
  function formatCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{5})(\d{3})$/, '$1-$2');
  }
  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      .replace(/(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const [mm, yy] = expiry.split('/');
    try {
      const res = await fetch('/api/payment/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          card: { holderName, number: number.replace(/\s/g, ''), expiryMonth: mm, expiryYear: `20${yy}`, ccv },
          holderInfo: { name: holderName, cpf, postalCode, addressNumber, phone },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setNewBalance(data.newBalance ?? 0);
      setSuccess(true);
      if (data.newBalance) onSuccess(data.newBalance);
    } catch { setError('Erro de conexão. Tente novamente.'); }
    finally { setLoading(false); }
  }

  const inputStyle = { marginBottom: 0 };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" style={{ textAlign: 'center', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Pagamento confirmado!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Saldo creditado com sucesso</p>
          <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid var(--accent-green)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-green)' }}>
              +R$ {amount.toFixed(2)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>adicionado ao seu saldo</p>
          </div>
          <button className="btn-primary" onClick={onClose}>Jogar Agora 🎰</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>💳 Pagar com Cartão</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Valor: <strong style={{ color: 'var(--accent-green)' }}>R$ {amount.toFixed(2)}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Card section */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Dados do Cartão</p>

          <input className="input-field" style={inputStyle} placeholder="Nome no cartão" value={holderName}
            onChange={e => setHolderName(e.target.value.toUpperCase())} required />

          <input className="input-field" style={inputStyle} placeholder="Número do cartão"
            value={number} onChange={e => setNumber(formatCard(e.target.value))}
            maxLength={19} required inputMode="numeric" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input-field" placeholder="Validade MM/AA"
              value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
              maxLength={5} required inputMode="numeric" />
            <input className="input-field" placeholder="CVV"
              value={ccv} onChange={e => setCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4} required inputMode="numeric" />
          </div>

          {/* Holder info */}
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>Dados do Titular</p>

          <input className="input-field" style={inputStyle} placeholder="CPF do titular"
            value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} maxLength={14} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input-field" placeholder="CEP"
              value={postalCode} onChange={e => setPostalCode(formatCep(e.target.value))} maxLength={9} required />
            <input className="input-field" placeholder="Número (endereço)"
              value={addressNumber} onChange={e => setAddressNumber(e.target.value)} required />
          </div>

          <input className="input-field" style={inputStyle} placeholder="Telefone (com DDD)"
            value={phone} onChange={e => setPhone(formatPhone(e.target.value))} maxLength={15} required inputMode="numeric" />

          <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>Pagamento seguro via <strong style={{ color: '#fff' }}>Asaas</strong> • Dados criptografados</span>
          </div>

          {error && <p style={{ color: 'var(--accent-red)', fontSize: 14, fontWeight: 600 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ fontSize: 16, padding: '14px' }}>
            {loading ? '⏳ Processando...' : `💳 Pagar R$ ${amount.toFixed(2)}`}
          </button>

          <button type="button" className="btn-ghost" onClick={onBack} style={{ fontSize: 13 }}>
            ← Voltar
          </button>
        </form>
      </div>
    </div>
  );
}
