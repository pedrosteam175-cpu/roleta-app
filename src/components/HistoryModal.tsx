'use client';
import { useEffect, useState } from 'react';

interface Spin {
  id: string; betAmount: number; mainResult: number; bonusResult: number;
  totalMultiplier: number; winAmount: number; createdAt: string;
}
interface Transaction {
  id: string; type: string; status: string; amount: number;
  description: string; createdAt: string;
}

interface HistoryModalProps { onClose: () => void; }

export default function HistoryModal({ onClose }: HistoryModalProps) {
  const [tab, setTab] = useState<'spins' | 'transactions'>('spins');
  const [spins, setSpins] = useState<Spin[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history', { credentials: 'include' }).then(r => r.json()).then(d => {
      setSpins(d.spins ?? []);
      setTransactions(d.transactions ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const typeColors: Record<string, string> = {
    deposit: 'var(--accent-green)', withdrawal: 'var(--accent-red)',
    spin_win: 'var(--accent-gold)', spin_loss: 'var(--accent-red)',
    bonus: '#00aaff', affiliate_commission: '#aa88ff',
  };
  const typeLabels: Record<string, string> = {
    deposit: 'Depósito', withdrawal: 'Saque', spin_win: 'Ganho',
    spin_loss: 'Perda', bonus: 'Bônus', affiliate_commission: 'Comissão',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>📜 Histórico</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <button className={`tab-btn ${tab === 'spins' ? 'active' : ''}`} onClick={() => setTab('spins')}>Giros</button>
          <button className={`tab-btn ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>Transações</button>
        </div>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Carregando...</p>
        ) : tab === 'spins' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {spins.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum giro ainda</p> : spins.map(s => (
              <div key={s.id} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>
                    {s.mainResult}x × {s.bonusResult}x = <span style={{ color: 'var(--accent-gold)' }}>{s.totalMultiplier}x</span>
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Aposta: R$ {s.betAmount.toFixed(2)} • {new Date(s.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+R$ {s.winAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhuma transação ainda</p> : transactions.map(t => (
              <div key={t.id} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: typeColors[t.type] ?? '#fff' }}>{typeLabels[t.type] ?? t.type}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: t.type === 'withdrawal' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {t.type === 'withdrawal' ? '-' : '+'}R$ {t.amount.toFixed(2)}
                  </p>
                  <p style={{ fontSize: 11, color: t.status === 'completed' ? 'var(--accent-green)' : '#ffaa00' }}>{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
