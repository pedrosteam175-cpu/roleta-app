'use client';
import { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserData) => void;
  referralCode?: string;
}

interface UserData {
  id: string; name: string; email: string; balance: number;
  bonusBalance?: number; affiliateCode: string;
}

export default function AuthModal({ onClose, onSuccess, referralCode }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState(referralCode ?? '');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .replace(/(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
      .replace(/(\d{3})(\d{3})$/, '$1.$2')
      .replace(/(\d{3})$/, '$1');
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, cpf, password, referralCode: refCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSuccess(data.user);
    } catch { setError('Erro de conexão'); }
    finally { setLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSuccess(data.user);
    } catch { setError('Erro de conexão'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
            {tab === 'register' ? '🎰 Criar Conta' : '👋 Entrar'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Criar Conta</button>
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Entrar</button>
        </div>

        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'register' && (
              <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 12, padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--accent-green)' }}>
                🎁 Ganhe <strong>R$ 1.000,00</strong> de bônus ao se cadastrar!
              </div>
            )}
            <input className="input-field" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} required />
            <input className="input-field" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-field" placeholder="CPF (000.000.000-00)" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} required maxLength={14} />
            <input className="input-field" type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <input className="input-field" placeholder="Código de afiliado (opcional)" value={refCode} onChange={e => setRefCode(e.target.value)} />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Conta Grátis'}</button>
          </form>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input className="input-field" type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              Não tem conta?{' '}
              <button type="button" onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontWeight: 700 }}>
                Criar gratuitamente
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
