'use client';
import { useState, useEffect } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';
type TestResult = { success: boolean; name?: string; email?: string; environment?: string; error?: string; detail?: string };

export default function AdminConfig() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://www.asaas.com/api/v3');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [bonusInicial, setBonusInicial] = useState('1000');
  const [saqueMinimo, setSaqueMinimo] = useState('0');

  const [saveStatus, setSaveStatus] = useState<Status>('idle');
  const [testStatus, setTestStatus] = useState<Status>('idle');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loadError, setLoadError] = useState('');

  // Webhook state
  const [webhookStatus, setWebhookStatus] = useState<Status>('idle');
  const [webhookResult, setWebhookResult] = useState<{ success?: boolean; webhookUrl?: string; savedUrl?: string; savedToken?: string; error?: string } | null>(null);
  const [appUrl, setAppUrl] = useState('');

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/config', {
      headers: { 'x-admin-password': password, 'x-admin-email': email },
    });
    if (!res.ok) { setAuthError('E-mail ou senha incorretos'); return; }
    const data = await res.json();
    setAuthed(true);
    setAppUrl(window.location.origin);
    populate(data.config ?? {});
    loadWebhookStatus(password, email);
  }

  async function loadWebhookStatus(pwd: string, eml: string) {
    try {
      const res = await fetch('/api/admin/webhook', {
        headers: { 'x-admin-password': pwd, 'x-admin-email': eml },
      });
      if (res.ok) {
        const d = await res.json();
        setWebhookResult({ savedUrl: d.savedUrl, savedToken: d.savedToken });
      }
    } catch {}
  }

  async function handleRegisterWebhook() {
    setWebhookStatus('loading');
    setWebhookResult(null);
    try {
      const res = await fetch('/api/admin/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
          'x-admin-email': email,
        },
        body: JSON.stringify({ appUrl }),
      });
      const data = await res.json();
      setWebhookResult(data);
      setWebhookStatus(data.success ? 'success' : 'error');
    } catch {
      setWebhookStatus('error');
      setWebhookResult({ error: 'Falha na conexão' });
    }
  }

  function populate(cfg: Record<string, string>) {
    if (cfg.asaas_api_key) setApiKey(cfg.asaas_api_key);
    if (cfg.asaas_api_url) setApiUrl(cfg.asaas_api_url);
    if (cfg.stripe_secret_key) setStripeSecretKey(cfg.stripe_secret_key);
    if (cfg.stripe_webhook_secret) setStripeWebhookSecret(cfg.stripe_webhook_secret);
    if (cfg.stripe_publishable_key) setStripePublishableKey(cfg.stripe_publishable_key);
    if (cfg.bonus_inicial) setBonusInicial(cfg.bonus_inicial);
    if (cfg.saque_minimo) setSaqueMinimo(cfg.saque_minimo);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus('loading');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
          'x-admin-email': email,
        },
        body: JSON.stringify({
          asaas_api_key: apiKey,
          asaas_api_url: apiUrl,
          stripe_secret_key: stripeSecretKey,
          stripe_webhook_secret: stripeWebhookSecret,
          stripe_publishable_key: stripePublishableKey,
          bonus_inicial: bonusInicial,
          saque_minimo: saqueMinimo,
        }),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleTest() {
    setTestStatus('loading');
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-asaas', {
        method: 'POST',
        headers: { 'x-admin-password': password, 'x-admin-email': email },
      });
      const data = await res.json();
      setTestResult(data);
      setTestStatus(data.success ? 'success' : 'error');
    } catch {
      setTestStatus('error');
      setTestResult({ success: false, error: 'Falha na conexão' });
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="modal-box" style={{ maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 40 }}>🔐</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Painel Admin</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Roleta da Sorte — Configurações</p>
          </div>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              className="input-field" type="email"
              placeholder="E-mail de administrador"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <input
              className="input-field" type="password"
              placeholder="Senha"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            {authError && <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{authError}</p>}
            <button className="btn-primary" type="submit">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', fontSize: 14, color: '#fff', textDecoration: 'none' }}>
            ← Voltar
          </a>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900 }}>⚙️ Configurações</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Integração Asaas &amp; parâmetros do jogo</p>
          </div>
        </div>

        {loadError && (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, padding: 12, fontSize: 13, color: 'var(--accent-red)' }}>
            {loadError}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Asaas section */}
          <AsaasSection
            apiKey={apiKey} setApiKey={setApiKey}
            apiUrl={apiUrl} setApiUrl={setApiUrl}
            onTest={handleTest}
            testStatus={testStatus}
            testResult={testResult}
          />

          {/* Stripe section */}
          <StripeSection
            secretKey={stripeSecretKey} setSecretKey={setStripeSecretKey}
            webhookSecret={stripeWebhookSecret} setWebhookSecret={setStripeWebhookSecret}
            publishableKey={stripePublishableKey} setPublishableKey={setStripePublishableKey}
          />

          {/* Game params section */}
          <GameParamsSection
            bonusInicial={bonusInicial} setBonusInicial={setBonusInicial}
            saqueMinimo={saqueMinimo} setSaqueMinimo={setSaqueMinimo}
          />

          {/* Webhook section */}
          <WebhookSection
            appUrl={appUrl} setAppUrl={setAppUrl}
            onRegister={handleRegisterWebhook}
            status={webhookStatus}
            result={webhookResult}
          />

          {/* Save button */}
          <button className="btn-primary" type="submit" disabled={saveStatus === 'loading'} style={{ fontSize: 16, padding: '14px' }}>
            {saveStatus === 'loading' ? '💾 Salvando...' : saveStatus === 'success' ? '✅ Salvo com sucesso!' : '💾 Salvar Configurações'}
          </button>
          {saveStatus === 'error' && <p style={{ color: 'var(--accent-red)', textAlign: 'center', fontSize: 14 }}>Erro ao salvar. Tente novamente.</p>}
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AsaasSection({ apiKey, setApiKey, apiUrl, setApiUrl, onTest, testStatus, testResult }: {
  apiKey: string; setApiKey: (v: string) => void;
  apiUrl: string; setApiUrl: (v: string) => void;
  onTest: () => void;
  testStatus: Status;
  testResult: TestResult | null;
}) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💳 Asaas — Pagamentos PIX</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Acesse <strong style={{ color: '#fff' }}>app.asaas.com → Configurações → Integrações → Chave API</strong> para copiar sua chave.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Chave API <span style={{ color: 'var(--accent-red)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="input-field"
              type={showKey ? 'text' : 'password'}
              placeholder="$aact_YTU5YTE0M2M3..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ paddingRight: 48 }}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            A chave começa com <code style={{ color: 'var(--accent-green)' }}>$aact_</code>
          </p>
        </div>

        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Ambiente</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '🏭 Produção', value: 'https://www.asaas.com/api/v3' },
              { label: '🧪 Sandbox', value: 'https://sandbox.asaas.com/api/v3' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setApiUrl(opt.value)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                  background: apiUrl === opt.value ? 'rgba(0,255,136,0.15)' : 'var(--bg-card2)',
                  border: apiUrl === opt.value ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                  color: apiUrl === opt.value ? 'var(--accent-green)' : 'var(--text-primary)',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test connection */}
        <div>
          <button type="button" className="btn-ghost" onClick={onTest}
            disabled={testStatus === 'loading' || !apiKey}
            style={{ width: '100%', padding: '10px', fontSize: 14 }}>
            {testStatus === 'loading' ? '⏳ Testando...' : '🔌 Testar Conexão com Asaas'}
          </button>

          {testResult && (
            <div style={{
              marginTop: 10, borderRadius: 10, padding: 12, fontSize: 13,
              background: testResult.success ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
              border: `1px solid ${testResult.success ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
            }}>
              {testResult.success ? (
                <>
                  <p style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✅ Conexão bem-sucedida!</p>
                  <p style={{ color: '#aaa', marginTop: 4 }}>Conta: <strong style={{ color: '#fff' }}>{testResult.name}</strong></p>
                  <p style={{ color: '#aaa' }}>E-mail: <strong style={{ color: '#fff' }}>{testResult.email}</strong></p>
                  <p style={{ color: '#aaa' }}>Ambiente: <strong style={{ color: 'var(--accent-gold)' }}>{testResult.environment}</strong></p>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--accent-red)', fontWeight: 700 }}>❌ {testResult.error}</p>
                  {testResult.detail && <p style={{ color: '#888', marginTop: 4, fontSize: 12 }}>{testResult.detail}</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WebhookSection({ appUrl, setAppUrl, onRegister, status, result }: {
  appUrl: string; setAppUrl: (v: string) => void;
  onRegister: () => void;
  status: Status;
  result: { success?: boolean; webhookUrl?: string; savedUrl?: string; savedToken?: string; error?: string } | null;
}) {
  const webhookUrl = appUrl ? `${appUrl}/api/payment/webhook` : '/api/payment/webhook';
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔔 Webhook — Confirmação Automática</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Quando um PIX for pago, o Asaas notifica esta URL e o saldo é creditado automaticamente.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Current webhook URL */}
        {result?.savedUrl && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>✅ Webhook ativo em:</p>
            <p style={{ fontSize: 13, color: 'var(--accent-green)', wordBreak: 'break-all' }}>{result.savedUrl}</p>
            {result.savedToken && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Token: {result.savedToken}</p>
            )}
          </div>
        )}

        {/* App URL input */}
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            URL do seu site <span style={{ color: 'var(--accent-red)' }}>*</span>
          </label>
          <input
            className="input-field"
            placeholder="https://seusite.com"
            value={appUrl}
            onChange={e => setAppUrl(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            URL pública do deploy. O webhook será: <code style={{ color: 'var(--accent-green)' }}>{webhookUrl}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-primary" onClick={onRegister}
            disabled={status === 'loading' || !appUrl}
            style={{ flex: 1, padding: '10px', fontSize: 14 }}>
            {status === 'loading' ? '⏳ Registrando...' : result?.savedUrl ? '🔄 Atualizar Webhook' : '🔔 Registrar Webhook no Asaas'}
          </button>
          <button type="button" className="btn-ghost" onClick={copyUrl} style={{ padding: '10px 14px', fontSize: 13 }}>
            {copied ? '✅' : '📋'}
          </button>
        </div>

        {result && !result.savedUrl && (
          <div style={{
            borderRadius: 10, padding: 12, fontSize: 13,
            background: result.success ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,68,0.08)',
            border: `1px solid ${result.success ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
          }}>
            {result.success ? (
              <>
                <p style={{ color: 'var(--accent-green)', fontWeight: 700 }}>✅ Webhook registrado com sucesso!</p>
                <p style={{ color: '#aaa', marginTop: 4, wordBreak: 'break-all' }}>URL: {result.webhookUrl}</p>
                <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Token de segurança gerado e salvo automaticamente.</p>
              </>
            ) : (
              <p style={{ color: 'var(--accent-red)', fontWeight: 700 }}>❌ {result.error}</p>
            )}
          </div>
        )}

        <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>📋 Eventos monitorados:</p>
          <p>• PAYMENT_RECEIVED — PIX recebido e confirmado</p>
          <p>• PAYMENT_CONFIRMED — Pagamento confirmado manualmente</p>
          <p>• PAYMENT_OVERDUE — Pagamento vencido (sem ação)</p>
        </div>
      </div>
    </div>
  );
}

function GameParamsSection({ bonusInicial, setBonusInicial, saqueMinimo, setSaqueMinimo }: {
  bonusInicial: string; setBonusInicial: (v: string) => void;
  saqueMinimo: string; setSaqueMinimo: (v: string) => void;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎮 Parâmetros do Jogo</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Bônus Inicial (R$)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
            <input className="input-field" style={{ paddingLeft: 40 }} type="number" min="0" step="1"
              value={bonusInicial} onChange={e => setBonusInicial(e.target.value)} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Crédito automático para novos usuários no cadastro</p>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Saque Mínimo (R$)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>R$</span>
            <input className="input-field" style={{ paddingLeft: 40 }} type="number" min="0" step="0.01"
              value={saqueMinimo} onChange={e => setSaqueMinimo(e.target.value)} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Defina 0 para sem mínimo</p>
        </div>
      </div>
    </div>
  );
}

function StripeSection({ secretKey, setSecretKey, webhookSecret, setWebhookSecret, publishableKey, setPublishableKey }: {
  secretKey: string; setSecretKey: (v: string) => void;
  webhookSecret: string; setWebhookSecret: (v: string) => void;
  publishableKey: string; setPublishableKey: (v: string) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [showWh, setShowWh] = useState(false);
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>💳 Stripe — Pagamentos por Cartão</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Acesse <strong style={{ color: '#fff' }}>dashboard.stripe.com → Developers → API Keys</strong> para copiar suas chaves.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Chave Publicável
            <span style={{ marginLeft: 8, fontSize: 11, color: '#888' }}>pk_live_... ou pk_test_...</span>
          </label>
          <input className="input-field" type="text"
            placeholder="pk_live_..." value={publishableKey} onChange={e => setPublishableKey(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Chave Secreta <span style={{ color: 'var(--accent-red)' }}>*</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: '#ffaa00' }}>sk_live_... (produção) ou sk_test_... (testes)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input className="input-field" type={showKey ? 'text' : 'password'}
              placeholder="sk_live_..." value={secretKey} onChange={e => setSecretKey(e.target.value)}
              style={{ paddingRight: 48 }} />
            <button type="button" onClick={() => setShowKey(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Webhook Secret
            <span style={{ marginLeft: 8, fontSize: 11, color: '#888' }}>whsec_... (opcional, para confirmação automática)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input className="input-field" type={showWh ? 'text' : 'password'}
              placeholder="whsec_..." value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
              style={{ paddingRight: 48 }} />
            <button type="button" onClick={() => setShowWh(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showWh ? '🙈' : '👁️'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            URL do webhook: <code style={{ color: 'var(--accent-green)' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/stripe</code>
          </p>
        </div>
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <p>✅ Aceita Visa, Mastercard, American Express</p>
          <p style={{ marginTop: 4 }}>✅ Funciona imediatamente sem aprovação manual</p>
          <p style={{ marginTop: 4 }}>✅ Saldo creditado automaticamente via webhook</p>
        </div>
      </div>
    </div>
  );
}
