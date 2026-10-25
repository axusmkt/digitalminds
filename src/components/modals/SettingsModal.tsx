import React, { useState } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Download,
  ShieldCheck,
  User,
  Globe,
  Clock,
  Lock,
  LogOut
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    theme,
    toggleTheme,
    authUsername,
    lockTimeoutMinutes,
    setLockTimeoutMinutes,
    lockSession,
    logout,
    currentWorkspace,
    pages,
    tasks,
    projects,
    goals,
    habits,
    notes,
    databases,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'general' | 'export' | 'privacy'>('general');

  if (!isSettingsModalOpen) return null;

  const handleExportData = () => {
    const backupData = {
      workspace: currentWorkspace,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data: {
        pages,
        tasks,
        projects,
        goals,
        habits,
        notes,
        databases,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Configurações do Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 mr-6 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            Geral & Aparência
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 border-b-2 mr-6 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            Exportar Dados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            Segurança & Privacidade
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme Selector */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 block">
                    Tema da Interface
                  </span>
                  <span className="text-slate-400">
                    Alternar entre modo claro limpo e modo escuro confortável
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-medium"
                >
                  {theme === 'dark' ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
                  <span className="capitalize">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
                </button>
              </div>

              {/* Locale & Region */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-indigo-500" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 block">
                      Idioma & Padrão de Dados
                    </span>
                    <span className="text-slate-400">
                      Português Brasileiro (pt-BR) • DD/MM/AAAA
                    </span>
                  </div>
                </div>
                <span className="text-emerald-600 font-semibold">Ativo</span>
              </div>

              {/* Current Workspace Info */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-slate-400">Workspace Atual</span>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{currentWorkspace?.icon || '🛡️'}</span>
                  <span>{currentWorkspace?.name}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-slate-500">
                Gere um arquivo JSON completo com todas as suas páginas, blocos, tarefas, projetos, bases de dados, notas e metas salvas no Cloud Firestore.
              </p>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-3">
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>• {pages.length} Páginas e documentos</div>
                  <div>• {tasks.length} Tarefas</div>
                  <div>• {projects.length} Projetos</div>
                  <div>• {databases.length} Bases de dados</div>
                  <div>• {notes.length} Notas rápidas</div>
                  <div>• {goals.length} Metas & {habits.length} Hábitos</div>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
                >
                  <Download size={14} />
                  <span>Baixar Backup Completo (.JSON)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <ShieldCheck size={17} />
                    <span>Zero-Trust Master Vault Ativo</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    SHA-256
                  </span>
                </div>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                  Sessão autenticada para o operador <strong className="text-slate-900 dark:text-zinc-100">{authUsername || 'Axus'}</strong>.
                  Proteção contra força bruta (bloqueio após 5 tentativas) e validação estrita de esquemas no Cloud Firestore ativas.
                </p>
              </div>

              {/* Inactivity Auto-Lock */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 block">
                      Bloqueio Automático por Inatividade
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Exigir senha novamente após período sem uso
                    </span>
                  </div>
                </div>
                <select
                  value={lockTimeoutMinutes}
                  onChange={e => setLockTimeoutMinutes(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-medium text-xs"
                >
                  <option value={5}>5 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={0}>Nunca</option>
                </select>
              </div>

              {/* Immediate Lock / Logout Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={lockSession}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-colors cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Bloquear Cofre Agora</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Encerrar Sessão</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 flex justify-end">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

