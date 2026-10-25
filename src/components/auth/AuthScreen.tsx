import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  KeyRound,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const AuthScreen: React.FC = () => {
  const {
    loginWithCredentials,
    failedAttempts,
    lockoutUntil,
    theme,
    toggleTheme
  } = useWorkspace();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const diff = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutSeconds(diff);
      if (diff === 0) {
        setErrorMessage(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 500);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = lockoutSeconds > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut || isSubmitting) return;

    if (!username.trim() || !password) {
      setErrorMessage('Informe o usuário e a senha de segurança para continuar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await loginWithCredentials(username, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Acesso negado. Credenciais incorretas.');
        setPassword('');
      }
    } catch {
      setErrorMessage('Erro ao validar credenciais criptográficas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between p-4 sm:p-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 select-none relative overflow-hidden">
      {/* Subtle Ambient Security Grid Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] dark:opacity-[0.08]" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight block text-slate-900 dark:text-zinc-100">
              Digital Minds • Axus Vault
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Criptografia SHA-256 Ativa
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 shadow-xs transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main Vault Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
            <Lock size={12} />
            <span>Acesso Restrito • Nível Zero-Trust</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
            Autenticação de Segurança
          </h1>

          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            Insira suas credenciais mestras para desbloquear o workspace e sincronizar dados protegidos.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 text-[11px]">
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-medium">
              <Fingerprint size={15} className="text-indigo-500 shrink-0" />
              <span>Proteção Anti-Força Bruta</span>
            </div>
            <span
              className={`font-semibold ${
                failedAttempts > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isLockedOut
                ? `Bloqueado (${lockoutSeconds}s)`
                : `${5 - failedAttempts}/5 tentativas`}
            </span>
          </div>

          {/* Error or Lockout Alert */}
          {(errorMessage || isLockedOut) && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {isLockedOut ? 'Bloqueio Temporário de Segurança' : 'Falha na Autenticação'}
                </p>
                <p className="text-[11px] opacity-90">
                  {isLockedOut
                    ? `Por segurança, novas tentativas estão bloqueadas. Aguarde ${lockoutSeconds} segundos para tentar novamente.`
                    : errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="vault-username"
                className="block text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Usuário Autorizado
              </label>
              <div className="relative">
                <UserIcon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
                />
                <input
                  id="vault-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  disabled={isLockedOut || isSubmitting}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="vault-password"
                className="block text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Chave / Senha de Acesso
              </label>
              <div className="relative">
                <KeyRound
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
                />
                <input
                  id="vault-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLockedOut || isSubmitting}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50 transition-all font-mono"
                />
                <button
                  type="button"
                   tabIndex={-1}
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Session Persistence Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Manter sessão assinada por 24h</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                SHA-256
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLockedOut || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Verificando Assinatura Criptográfica...</span>
                </>
              ) : isLockedOut ? (
                <>
                  <Lock size={15} />
                  <span>Acesso Bloqueado ({lockoutSeconds}s)</span>
                </>
              ) : (
                <>
                  <span>Desbloquear Plataforma</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Security Layers List */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-2 text-left text-[11px] text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Verificação em tempo constante contra ataques de timing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Bloqueio automático por inatividade e proteção anti-brute force</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>Validação estrita de esquemas no Cloud Firestore</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-2">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Ambiente Protegido • Digital Minds Planejamento</span>
      </div>
    </div>
  );
};
