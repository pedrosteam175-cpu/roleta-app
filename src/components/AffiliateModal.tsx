'use client';
import { useEffect, useState } from 'react';

interface AffiliateModalProps { onClose: () => void; }

interface AffiliateData {
  affiliateCode: string; affiliateLevel: string; commission: number;
  totalReferrals: number; earnings: number; appUrl: string;
}

const levelLabels: Record<string, string> = {
  iniciante: '🥉 Iniciante', intermediario: '🥈 Intermediário',
  avancado: '🥇 Avançado', master: '💎 Master',
};

export default function AffiliateModal({ onClose }: AffiliateModalProps) {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/affiliate', { credentials: 'include' }).then(r => r.json()).then(d => setData(d)).finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!data) return;
    const url = `${data.appUrl || window.location.origin}?ref=${data.affiliateCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>🤝 Afiliados</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</p> : data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-card2)', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Seu link de convite</p>
              <p style={{ fontSize: 14, wordBreak: 'break-all', color: 'var(--accent-green)', marginBottom: 12 }}>
                {(data.appUrl || window.location.origin)}?ref={data.affiliateCode}
              </p>
              <button className="btn-primary" onClick={copyLink}>{copied ? '✅ Copiado!' : '📋 Copiar Link'}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Nível', value: levelLabels[data.affiliateLevel] ?? data.affiliateLevel },
                { label: 'Comissão', value: `${data.commission}% RevShare` },
                { label: 'Indicados', value: data.totalReferrals },
                { label: 'Ganhos', value: `R$ ${data.earnings.toFixed(2)}` },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-card2)', borderRadius: 12, padding: 16 }}>
              <h4 style={{ marginBottom: 12, fontWeight: 700 }}>Níveis de Comissão</h4>
              {[
                { label: '🥉 Iniciante', desc: '0–10 indicados', pct: '3%' },
                { label: '🥈 Intermediário', desc: '11–50 indicados', pct: '5%' },
                { label: '🥇 Avançado', desc: '51–100 indicados', pct: '7%' },
                { label: '💎 Master', desc: '100+ indicados', pct: '10%' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: 14 }}>{l.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{l.desc}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{l.pct}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
