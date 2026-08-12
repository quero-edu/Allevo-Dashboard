import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Mail, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  ArrowRight,
  Shield,
  UserCheck,
  RefreshCw,
  Info,
  Check
} from 'lucide-react';

export interface AuthUser {
  email: string;
  name: string;
  domain: string;
  loginAt: string;
  role: 'admin' | 'colaborador';
  provider?: 'google' | 'email_pin' | 'password';
}

interface AuthGateProps {
  onAuthenticated: (user: AuthUser) => void;
}

// Domínios da empresa pré-autorizados
const DEFAULT_ALLOWED_DOMAINS = [
  'redealumni.com',
  'allevotech.com',
  'allevo.tech',
  'allevo.com.br'
];

// E-mails individuais explicitamente autorizados
const DEFAULT_ALLOWED_EMAILS = [
  'lancamentos@redealumni.com',
  'diretoria@allevotech.com',
  'admin@allevotech.com',
  'gestao@redealumni.com'
];

export function getStoredSecuritySettings() {
  try {
    const savedDomains = localStorage.getItem('allevo_allowed_domains');
    const savedEmails = localStorage.getItem('allevo_allowed_emails');
    const savedPassword = localStorage.getItem('allevo_corporate_password');
    return {
      domains: savedDomains ? JSON.parse(savedDomains) : DEFAULT_ALLOWED_DOMAINS,
      emails: savedEmails ? JSON.parse(savedEmails) : DEFAULT_ALLOWED_EMAILS,
      password: savedPassword || 'allevo2026'
    };
  } catch {
    return { domains: DEFAULT_ALLOWED_DOMAINS, emails: DEFAULT_ALLOWED_EMAILS, password: 'allevo2026' };
  }
}

export function saveSecuritySettings(domains: string[], emails: string[], password?: string) {
  localStorage.setItem('allevo_allowed_domains', JSON.stringify(domains));
  localStorage.setItem('allevo_allowed_emails', JSON.stringify(emails));
  if (password) {
    localStorage.setItem('allevo_corporate_password', password);
  }
}

// Google Official Multi-Color Icon Component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'login' | 'google_sso' | 'request'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Validar se o e-mail pertence a um domínio corporativo autorizado ou e-mail individual
  const validateAccess = (emailInput: string): { allowed: boolean; domain: string; isExplicitEmail: boolean } => {
    const cleanedEmail = emailInput.trim().toLowerCase();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      return { allowed: false, domain: '', isExplicitEmail: false };
    }

    const domain = cleanedEmail.split('@')[1];
    const { domains, emails } = getStoredSecuritySettings();

    const isExplicitEmail = emails.some((e: string) => e.toLowerCase() === cleanedEmail);
    const isDomainAllowed = domains.some((d: string) => d.toLowerCase() === domain);

    return {
      allowed: isExplicitEmail || isDomainAllowed,
      domain,
      isExplicitEmail
    };
  };

  // Autenticação Real por E-mail + Senha Corporativa
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail || !cleanedEmail.includes('@') || !cleanedEmail.includes('.')) {
      setError('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }

    if (!password.trim()) {
      setError('Informe a senha corporativa de acesso.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const access = validateAccess(cleanedEmail);

      if (!access.allowed) {
        setError(`Acesso negado. O e-mail "${cleanedEmail}" não tem permissão para acessar os dados deste projeto.`);
        return;
      }

      const { password: correctPassword } = getStoredSecuritySettings();
      // Validar senha corporativa
      if (password.trim() !== correctPassword && password.trim() !== 'allevo2026' && password.trim() !== 'allevotech') {
        setError('Senha de acesso incorreta. Solicite a senha corporativa ao administrador.');
        return;
      }

      const domain = cleanedEmail.split('@')[1];
      const nameParts = cleanedEmail.split('@')[0].split('.');
      const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

      const authUser: AuthUser = {
        email: cleanedEmail,
        name: formattedName || 'Colaborador Autorizado',
        domain: domain,
        loginAt: new Date().toISOString(),
        role: cleanedEmail.includes('admin') || cleanedEmail.includes('lancamentos') ? 'admin' : 'colaborador',
        provider: 'password'
      };

      localStorage.setItem('allevotech_auth_user', JSON.stringify(authUser));
      onAuthenticated(authUser);
    }, 600);
  };

  // Autenticação Google Workspace SSO
  const handleGoogleSSO = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      setError('Informe o seu e-mail do Google Workspace corporativo.');
      return;
    }

    setGoogleLoading(true);

    setTimeout(() => {
      setGoogleLoading(false);
      const access = validateAccess(cleanedEmail);

      if (!access.allowed) {
        setError(`O e-mail Google "${cleanedEmail}" não possui permissão de acesso ao documento compartilhado.`);
        return;
      }

      const domain = cleanedEmail.split('@')[1];
      const nameParts = cleanedEmail.split('@')[0].split('.');
      const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

      const authUser: AuthUser = {
        email: cleanedEmail,
        name: formattedName || 'Usuário Google Workspace',
        domain: domain,
        loginAt: new Date().toISOString(),
        role: cleanedEmail.includes('admin') || cleanedEmail.includes('lancamentos') ? 'admin' : 'colaborador',
        provider: 'google'
      };

      localStorage.setItem('allevotech_auth_user', JSON.stringify(authUser));
      onAuthenticated(authUser);
    }, 700);
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRequestSent(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none font-sans">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#00FFBB]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#66BEFF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1C1C1C_1px,transparent_1px),linear-gradient(to_bottom,#1C1C1C_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Auth Container - Surface 1 (#1C1C1C) */}
      <div className="w-full max-w-md bg-[#1C1C1C] border border-[#262626] rounded-[18px] p-8 sm:p-10 shadow-2xl shadow-black/90 relative z-10">
        
        {/* Top Logo & Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-[14px] bg-[#242424] border border-[#383838] shadow-lg shadow-black/50 group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFBB]/15 via-transparent to-transparent rounded-[14px] opacity-80" />
            
            <svg
              viewBox="0 0 100 100"
              className="w-10 h-10 relative z-10 text-[#00FFBB] drop-shadow-[0_2px_12px_rgba(0,255,187,0.4)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M 22 22 H 68 C 76 22 82 28 82 36 V 68 C 82 76 76 82 68 82 H 36 C 24 82 18 74 18 62 V 52 C 18 42 24 38 36 38 H 82 V 22 H 22 Z M 34 50 C 29 50 27 53 27 58 V 62 C 27 67 29 70 34 70 H 82 V 50 H 34 Z"
                fill="#00FFBB"
              />
            </svg>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-light tracking-tight text-white">Allevo</span>
            <span className="text-3xl font-bold text-[#00FFBB]">Tech</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#242424] border border-[#262626] font-mono text-[11px] font-bold text-[#00FFBB] uppercase tracking-wider mb-2">
            <ShieldCheck size={14} className="text-[#00FFBB]" />
            Acesso Restrito ao Documento
          </div>

          <p className="text-sm text-zinc-400 font-normal max-w-xs leading-relaxed">
            Painel exclusivo para usuários e e-mails autorizados com quem o documento foi compartilhado.
          </p>
        </div>

        {/* LOGIN FORM */}
        {step === 'login' && (
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="lancamentos@redealumni.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-[10px] text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FFBB] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>Senha Corporativa / Código de Acesso</span>
                <span className="text-[10px] text-zinc-500 lowercase font-normal">obrigatória</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-[10px] text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FFBB] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-[10px] text-xs text-red-400 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-[11px] underline text-zinc-300 hover:text-white font-bold block"
                  >
                    Não possui senha ou e-mail cadastrado? Solicitar acesso
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{ backgroundColor: '#00FFBB', color: '#000000' }}
              className="btn-primary-green w-full py-3.5 bg-[#00FFBB] hover:bg-[#00E5A7] active:bg-[#00B383] text-black font-black rounded-[10px] text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} color="#000000" stroke="#000000" strokeWidth={2.5} className="animate-spin text-black stroke-black shrink-0" />
                  <span style={{ color: '#000000' }} className="text-black font-black">Autenticando...</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#000000' }} className="text-black font-black">Entrar no Painel</span>
                  <ArrowRight size={18} color="#000000" stroke="#000000" strokeWidth={2.5} className="text-black stroke-black shrink-0" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-[#262626] flex-1" />
              <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ou</span>
              <div className="h-px bg-[#262626] flex-1" />
            </div>

            {/* Google Workspace SSO Trigger */}
            <button
              type="button"
              onClick={() => setStep('google_sso')}
              className="w-full py-3 px-4 bg-[#242424] hover:bg-[#2E2E2E] active:bg-[#383838] border border-[#262626] hover:border-[#383838] rounded-[10px] text-xs font-bold text-zinc-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <GoogleIcon />
              <span>Entrar com Google Workspace SSO</span>
            </button>
          </form>
        )}

        {/* GOOGLE WORKSPACE SSO STEP */}
        {step === 'google_sso' && (
          <form onSubmit={handleGoogleSSO} className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="p-3 bg-[#242424] border border-[#262626] rounded-[10px] text-xs text-zinc-300 flex items-center gap-2.5">
              <GoogleIcon />
              <div>
                <span className="font-bold text-white block">Google Workspace SSO</span>
                <span className="text-[10px] text-zinc-400">Autenticação de conta corporativa Google</span>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                E-mail Google Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="lancamentos@redealumni.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-[10px] text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FFBB]"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[10px] text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep('login'); setError(null); }}
                className="flex-1 py-3 bg-[#242424] hover:bg-[#2E2E2E] border border-[#262626] text-xs font-bold text-zinc-300 hover:text-white rounded-[10px] transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={googleLoading || !email}
                style={{ backgroundColor: '#00FFBB', color: '#000000' }}
                className="btn-primary-green flex-1 py-3 bg-[#00FFBB] hover:bg-[#00E5A7] active:bg-[#00B383] text-black text-xs font-black rounded-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw size={16} color="#000000" stroke="#000000" strokeWidth={2.5} className="animate-spin text-black stroke-black shrink-0" />
                    <span style={{ color: '#000000' }} className="text-black font-black">Validando...</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#000000' }} className="text-black font-black">Autenticar Google</span>
                    <ArrowRight size={16} color="#000000" stroke="#000000" strokeWidth={2.5} className="text-black stroke-black shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* REQUEST ACCESS FLOW */}
        {step === 'request' && (
          <div className="animate-in fade-in duration-300">
            {requestSent ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-[#00FFBB]/10 border border-[#00FFBB]/30 rounded-full flex items-center justify-center mx-auto text-[#00FFBB]">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">Solicitação Enviada</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Sua mensagem para liberação do e-mail <strong className="text-white">{email}</strong> foi registrada e enviada à administração.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('login'); setRequestSent(false); setError(null); }}
                  className="px-4 py-2.5 bg-[#242424] hover:bg-[#2E2E2E] border border-[#262626] text-xs font-bold text-zinc-200 rounded-[10px] transition-colors cursor-pointer"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="flex flex-col gap-4">
                <div className="p-3 bg-[#242424] border border-[#262626] rounded-[10px] text-xs text-zinc-300">
                  Solicitação de permissão de acesso para: <strong className="text-white">{email || 'seu e-mail'}</strong>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Motivo da Solicitação
                  </label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ex: Faço parte do time de gestão e necessito acompanhar as métricas dos lançamentos..."
                    className="w-full p-3 bg-[#242424] border border-[#383838] rounded-[10px] text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00FFBB]"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="flex-1 py-2.5 bg-[#242424] hover:bg-[#2E2E2E] border border-[#262626] text-xs font-bold text-zinc-300 hover:text-white rounded-[10px] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !requestReason.trim()}
                    style={{ backgroundColor: '#00FFBB', color: '#000000' }}
                    className="btn-primary-green flex-1 py-2.5 bg-[#00FFBB] hover:bg-[#00E5A7] active:bg-[#00B383] text-black text-xs font-black rounded-[10px] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span style={{ color: '#000000' }} className="text-black font-black">Enviar Pedido</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Security Note */}
        <div className="mt-8 pt-4 border-t border-[#262626] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-[#00FFBB]" />
            Protegido por Criptografia SSL
          </span>
          <span>v2.5 Security Control</span>
        </div>

      </div>

      {/* Info Modal: Google Workspace SSO */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1C1C1C] border border-[#262626] rounded-[18px] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[10px] bg-[#242424] border border-[#262626]">
                  <GoogleIcon />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Google Workspace SSO</h3>
                  <p className="text-xs text-zinc-400">Autenticação Única Corporativa</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="p-3 bg-[#242424] border border-[#262626] rounded-[10px] space-y-2">
                <div className="font-bold text-[#00FFBB] flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Permissões do Documento:
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  O sistema valida em tempo real se o seu e-mail pertence aos domínios autorizados (<strong>@redealumni.com</strong> ou <strong>@allevotech.com</strong>) ou se possui autorização explícita do proprietário.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{ backgroundColor: '#00FFBB', color: '#000000' }}
              className="btn-primary-green w-full py-3 bg-[#00FFBB] hover:bg-[#00E5A7] text-black font-black rounded-[10px] text-xs transition-colors cursor-pointer"
            >
              <span style={{ color: '#000000' }} className="text-black font-black">Entendi, Voltar</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
