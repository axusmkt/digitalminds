import React from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  CheckSquare,
  FolderKanban
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const TrashView: React.FC = () => {
  const {
    pages,
    tasks,
    projects,
    restorePage,
    permanentlyDeletePage,
    isFullWidth
  } = useWorkspace();

  const deletedPages = pages.filter(p => !!p.deletedAt);
  const deletedTasks = tasks.filter(t => !!t.deletedAt);
  const deletedProjects = projects.filter(p => !!p.deletedAt);

  const totalDeleted = deletedPages.length + deletedTasks.length + deletedProjects.length;

  const handlePermanentDeletePage = async (pageId: string) => {
    if (window.confirm('Tem certeza? A exclusão permanente não pode ser desfeita.')) {
      await permanentlyDeletePage(pageId);
    }
  };

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-4xl'}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Trash2 size={24} className="text-rose-500" />
          <span>Lixeira do Workspace</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Itens arquivados e removidos temporariamente. Restaure-os ou exclua-os permanentemente.
        </p>
      </div>

      {totalDeleted === 0 ? (
        <div className="py-20 text-center space-y-2 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
            A lixeira está vazia
          </p>
          <p className="text-xs text-slate-400">
            Itens excluídos aparecerão aqui antes da exclusão definitiva.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Deleted Pages */}
          {deletedPages.length > 0 && (
            <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} />
                <span>Páginas ({deletedPages.length})</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {deletedPages.map(page => (
                  <div key={page.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span>{page.icon || '📄'}</span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                        {page.title || 'Sem título'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => restorePage(page.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 transition-colors font-medium"
                      >
                        <RotateCcw size={12} />
                        <span>Restaurar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeletePage(page.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Excluir permanentemente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Tasks */}
          {deletedTasks.length > 0 && (
            <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={12} />
                <span>Tarefas ({deletedTasks.length})</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {deletedTasks.map(task => (
                  <div key={task.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-zinc-200 truncate flex-1">
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
