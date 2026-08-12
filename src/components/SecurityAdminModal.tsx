import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Plus, 
  Trash2, 
  Building, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  UserCheck
} from 'lucide-react';
import { getStoredSecuritySettings, saveSecuritySettings } from './AuthGate';

interface SecurityAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export default function SecurityAdminModal({ isOpen, onClose, currentUserEmail }: SecurityAdminModalProps) {
  const [settings, setSettings] = useState(getStoredSecuritySettings());
  const [newDomain, setNewDomain] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = newDomain.trim().toLowerCase().replace('@', '');
    if (!cleaned || !cleaned.includes('.')) {
      setErrorMsg('Informe um domínio válido (ex: empresa.com.br)');
      return;
    }

    if (settings.domains.includes(cleaned)) {
      setErrorMsg('Este domínio já está cadastrado.');
      return;
    }

    const updatedDomains = [...settings.domains, cleaned];
    saveSecuritySettings(updatedDomains, settings.emails);
    setSettings(prev => ({ ...prev, domains: updatedDomains }));
    setNewDomain('');
    setErrorMsg(null);
    setSuccessMsg(`Domínio @${cleaned} adicionado com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    if (settings.domains.length <= 1) {
      setErrorMsg('É necessário manter ao menos um domínio corporativo cadastrado.');
      return;
    }

    const updatedDomains = settings.domains.filter(d => d !== domainToRemove);
    saveSecuritySettings(updatedDomains, settings.emails);
    setSettings(prev => ({ ...prev, domains: updatedDomains }));
    setSuccessMsg(`Domínio @${domainToRemove} removido.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = newEmail.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@') || !cleaned.includes('.')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    if (settings.emails.includes(cleaned)) {
      setErrorMsg('Este e-mail já possui autorização explícita.');
      return;
    }

    const updatedEmails = [...settings.emails, cleaned];
    saveSecuritySettings(settings.domains, updatedEmails);
    setSettings(prev => ({ ...prev, emails: updatedEmails }));
    setNewEmail('');
    setErrorMsg(null);
    setSuccessMsg(`E-mail ${cleaned} autorizado!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedEmails = settings.emails.filter(e => e !== emailToRemove);
    saveSecuritySettings(settings.domains, updatedEmails);
    setSettings(prev => ({ ...prev, emails: updatedEmails }));
    setSuccessMsg(`E-mail ${emailToRemove} removido.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-2xl bg-[#1C1C1C] border border-[#262626] rounded-[18px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#242424] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[10px] bg-[#00FFBB]/10 border border-[#00FFBB]/25 text-[#00FFBB]">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Gerenciamento de Acessos
                <span className="badge-primary-green text-[10px] bg-[#00FFBB] text-black !text-black px-2 py-0.5 rounded-full font-mono font-black uppercase">
                  AllevoTech Security
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Gerencie os domínios corporativos e e-mails de colaboradores autorizados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#2E2E2E] rounded-[8px] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Active Admin Banner */}
          <div className="p-3.5 bg-[#242424] border border-[#262626] rounded-[12px] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <UserCheck size={16} className="text-[#00FFBB]" />
              <span>Sua sessão ativa: <strong className="text-white font-mono">{currentUserEmail}</strong></span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#00FFBB] bg-[#00FFBB]/10 border border-[#00FFBB]/20 px-2.5 py-1 rounded-[6px]">
              Administrador
            </span>
          </div>

          {/* Feedback Banners */}
          {successMsg && (
            <div className="p-3 bg-[#00FFBB]/10 border border-[#00FFBB]/30 rounded-[10px] text-xs text-[#00FFBB] font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[10px] text-xs text-red-400 font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Allowed Company Domains */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Building size={16} className="text-[#66BEFF]" />
                Domínios Corporativos Autorizados
              </h4>
              <span className="text-[11px] text-zinc-500 font-normal">Qualquer e-mail nestes domínios terá acesso</span>
            </div>

            <form onSubmit={handleAddDomain} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-mono font-bold text-xs">@</span>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="novodominio.com.br"
                  className="w-full pl-7 pr-3 py-2 bg-[#242424] border border-[#383838] rounded-[10px] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#00FFBB]"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: '#00FFBB', color: '#000000' }}
                className="btn-primary-green px-4 py-2 bg-[#00FFBB] hover:bg-[#00E5A7] active:bg-[#00B383] text-black font-black text-xs rounded-[10px] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={16} color="#000000" stroke="#000000" strokeWidth={2.5} className="text-black stroke-black shrink-0" />
                <span style={{ color: '#000000' }} className="text-black font-black">Add Domínio</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {settings.domains.map((domain: string) => (
                <div
                  key={domain}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#242424] border border-[#262626] rounded-[10px] text-xs font-mono font-semibold text-zinc-200 group hover:border-[#00FFBB]/40 transition-colors"
                >
                  <span className="text-[#00FFBB]">@{domain}</span>
                  <button
                    onClick={() => handleRemoveDomain(domain)}
                    title="Remover domínio"
                    className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Specific Individual Authorized Emails */}
          <div className="space-y-3 pt-4 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Mail size={16} className="text-[#00FFBB]" />
                E-mails Individuais Explicitamente Autorizados
              </h4>
              <span className="text-[11px] text-zinc-500 font-normal">Liberados individualmente</span>
            </div>

            <form onSubmit={handleAddEmail} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="parceiro@consultoria.com"
                className="flex-1 px-3 py-2 bg-[#242424] border border-[#383838] rounded-[10px] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#00FFBB]"
              />
              <button
                type="submit"
                style={{ backgroundColor: '#00FFBB', color: '#000000' }}
                className="btn-primary-green px-4 py-2 bg-[#00FFBB] hover:bg-[#00E5A7] active:bg-[#00B383] text-black font-black text-xs rounded-[10px] flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={16} color="#000000" stroke="#000000" strokeWidth={2.5} className="text-black stroke-black shrink-0" />
                <span style={{ color: '#000000' }} className="text-black font-black">Liberar E-mail</span>
              </button>
            </form>

            <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {settings.emails.map((email: string) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2.5 px-3 bg-[#242424] border border-[#262626] rounded-[10px] text-xs text-zinc-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00FFBB]" />
                    <span className="font-mono font-semibold">{email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    title="Remover e-mail"
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#242424] border-t border-[#262626] flex items-center justify-between">
          <span className="font-mono text-[11px] text-zinc-500 flex items-center gap-1">
            <Lock size={12} className="text-[#00FFBB]" />
            Alterações salvas e aplicadas em tempo real.
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1C1C1C] hover:bg-[#2E2E2E] border border-[#262626] hover:border-[#383838] text-xs font-bold text-white rounded-[10px] transition-colors cursor-pointer"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
}
