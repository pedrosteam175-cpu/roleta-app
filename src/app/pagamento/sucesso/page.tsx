'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PagamentoSucesso() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => {
      if (s <= 1) { clearInterval(t); router.push('/'); }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Pagamento confirmado!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 24 }}>
          Seu saldo foi creditado automaticamente. Bom jogo!
        </p>
        <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 16, padding: '16px 24px', marginBottom: 24 }}>
          <p style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: 18 }}>✅ Saldo adicionado à sua conta</p>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Redirecionando em {seconds}s...</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push('/')}>
          Jogar Agora 🎰
        </button>
      </div>
    </div>
  );
}
