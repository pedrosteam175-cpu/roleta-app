'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalUsers: number; totalSpins: number;
  totalDeposited: number; totalWithdrawn: number;
  pendingWithdrawAmount: number; pendingWithdrawCount: number;
  totalBalances: number;
}
interface User {
  id: string; name: string; email: string; cpf: string;
  balance: number; totalDeposited: number; totalWithdrawn: number;
  affiliateLevel: string; createdAt: string;
}
interface Withdrawal {
  id: string; userId: string; userName: string; userEmail: string;
  amount: number; status: string; pixKey: string; pixName: string;
  pixCpf: string; createdAt: string;
}

type Tab = 'dashboard' | 'users' | 'withdrawals' | 'config';

// ── Helpers ──────────────────────────────────────────────────────────────────
const brl = (v: number) => `R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const dt = (s: string) => new Date(s).toLocaleString('pt-BR');

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: color ?? 'var(--accent-green)' }}>{value}</p>
    </div>
  );
}

function LoginScreen({ email, setEmail, password, setPassword, onSubmit, error }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; error: string;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>🔐</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Painel Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Roleta da Sorte</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input-field" type="email" placeholder="E-mail de administrador" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error}</p>}
          <button className="btn-primary" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

function AdminHeader({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'users', label: '👥 Usuários' },
    { key: 'withdrawals', label: '💸 Saques' },
    { key: 'config', label: '⚙️ Config' },
  ];
  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#fff', textDecoration: 'none' }}>← Jogo</a>
        <h1 style={{ fontSize: 16, fontWeight: 800, background: 'linear-gradient(90deg,#ffd700,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin</h1>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: tab === t.key ? 'rgba(0,255,136,0.15)' : 'none', border: tab === t.key ? '1px solid var(--accent-green)' : '1px solid transparent', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: tab === t.key ? 'var(--accent-green)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');

  const headers: Record<string, string> = authed
    ? { 'x-admin-password': password, 'x-admin-email': email, 'Content-Type': 'application/json' }
    : {};

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/stats', { headers: { 'x-admin-password': password, 'x-admin-email': email } });
    if (!res.ok) { setAuthError('E-mail ou senha incorretos'); return; }
    setAuthed(true);
  }

  if (!authed) return <LoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleAuth} error={authError} />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader tab={tab} setTab={setTab} />
      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {tab === 'dashboard' && <DashboardTab headers={headers} />}
        {tab === 'users' && <UsersTab headers={headers} />}
        {tab === 'withdrawals' && <WithdrawalsTab headers={headers} />}
        {tab === 'config' && <div style={{ textAlign: 'center', paddingTop: 40 }}><a href="/admin" style={{ color: 'var(--accent-green)' }}>← Abrir painel de configurações</a></div>}
      </div>
    </div>
  );
}

// ── DashboardTab ─────────────────────────────────────────────────────────────
function DashboardTab({ headers }: { headers: Record<string, string> }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { headers }).then(r => r.json()).then(d => setStats(d)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Carregando...</p>;
  if (!stats) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>📊 Visão Geral</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total de Usuários" value={String(stats.totalUsers)} color="#00aaff" />
        <StatCard label="Total de Giros" value={String(stats.totalSpins)} color="#aa88ff" />
        <StatCard label="Total Depositado" value={brl(stats.totalDeposited)} color="var(--accent-green)" />
        <StatCard label="Total Sacado" value={brl(stats.totalWithdrawn)} color="var(--accent-red)" />
        <StatCard label="Saques Pendentes" value={`${stats.pendingWithdrawCount} (${brl(stats.pendingWithdrawAmount)})`} color="#ffaa00" />
        <StatCard label="Saldo Total dos Usuários" value={brl(stats.totalBalances)} color="var(--accent-gold)" />
      </div>
    </div>
  );
}

// ── UsersTab ─────────────────────────────────────────────────────────────────
function UsersTab({ headers }: { headers: Record<string, string> }) {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { headers }).then(r => r.json()).then(d => setUserList(d.users ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = userList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf.includes(search)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>👥 Usuários ({userList.length})</h2>
        <input className="input-field" style={{ maxWidth: 260 }} placeholder="Buscar por nome, e-mail ou CPF..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {['Nome', 'E-mail', 'CPF', 'Saldo', 'Depositado', 'Sacado', 'Cadastro'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.cpf}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--accent-green)', fontWeight: 700 }}>{brl(u.balance)}</td>
                  <td style={{ padding: '10px 12px' }}>{brl(u.totalDeposited)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--accent-red)' }}>{brl(u.totalWithdrawn)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dt(u.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── WithdrawalsTab ────────────────────────────────────────────────────────────
function WithdrawalsTab({ headers }: { headers: Record<string, string> }) {
  const [list, setList] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/withdrawals', { headers }).then(r => r.json()).then(d => setList(d.withdrawals ?? [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    const label = action === 'approve' ? 'aprovar' : 'rejeitar';
    if (!confirm(`Confirma ${label} este saque?`)) return;
    setActing(id);
    const res = await fetch('/api/admin/withdrawals', {
      method: 'POST', headers, body: JSON.stringify({ transactionId: id, action }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); }
    setActing(null);
    load();
  }

  const filtered = list.filter(w => filter === 'all' || w.status === filter);
  const statusColor: Record<string, string> = { pending: '#ffaa00', completed: 'var(--accent-green)', cancelled: 'var(--accent-red)', failed: 'var(--accent-red)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>💸 Saques ({list.length})</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pending', 'completed', 'cancelled', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: filter === f ? '1px solid var(--accent-green)' : '1px solid var(--border)', background: filter === f ? 'rgba(0,255,136,0.1)' : 'none', color: filter === f ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {f === 'pending' ? '⏳ Pendentes' : f === 'completed' ? '✅ Aprovados' : f === 'cancelled' ? '❌ Rejeitados' : '📋 Todos'}
            </button>
          ))}
        </div>
      </div>
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Carregando...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(w => (
            <div key={w.id} className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{w.userName} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>({w.userEmail})</span></p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PIX: {w.pixKey} • {dt(w.createdAt)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-gold)' }}>{brl(w.amount)}</p>
                  <p style={{ fontSize: 11, color: statusColor[w.status] ?? '#fff', fontWeight: 600 }}>{w.status.toUpperCase()}</p>
                </div>
                {w.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleAction(w.id, 'approve')} disabled={acting === w.id}
                      style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid var(--accent-green)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--accent-green)', fontSize: 13, fontWeight: 700 }}>
                      {acting === w.id ? '...' : '✅ Aprovar'}
                    </button>
                    <button onClick={() => handleAction(w.id, 'reject')} disabled={acting === w.id}
                      style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--accent-red)', fontSize: 13, fontWeight: 700 }}>
                      ❌ Rejeitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum saque {filter === 'all' ? '' : filter}</p>}
        </div>
      )}
    </div>
  );
}
