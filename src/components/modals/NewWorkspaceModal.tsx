import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

const PRESET_WS_ICONS = ['🚀', '💼', '⚡', '🌟', '🎯', '💡', '🏢', '🛠️', '🎨', '🧠'];

export const NewWorkspaceModal: React.FC = () => {
  const {
    isNewWorkspaceModalOpen,
    setIsNewWorkspaceModalOpen,
    createWorkspace,
  } = useWorkspace();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');

  if (!isNewWorkspaceModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createWorkspace(name.trim(), icon);
    setName('');
    setIsNewWorkspaceModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />
            <span>Criar Workspace</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsNewWorkspaceModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Escolha um ícone
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_WS_ICONS.map((ico, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setIcon(ico)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                    icon === ico
                      ? 'bg-indigo-100 dark:bg-indigo-950 border border-indigo-500 scale-110'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Nome do Workspace *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: StartUp Inc, Pessoal, Freelance"
              className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsNewWorkspaceModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
            >
              Criar Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
