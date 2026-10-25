import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  CheckSquare,
  FolderKanban,
  Database,
  StickyNote,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    pages,
    tasks,
    projects,
    databases,
    notes,
    setSelectedPageId,
    setSelectedProjectId,
    setSelectedDatabaseId,
    setActiveView,
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingPages = pages.filter(p => !p.deletedAt && (!q || p.title.toLowerCase().includes(q)));
  const matchingTasks = tasks.filter(t => !t.deletedAt && (!q || t.title.toLowerCase().includes(q)));
  const matchingProjects = projects.filter(p => !p.deletedAt && (!q || p.name.toLowerCase().includes(q)));
  const matchingDatabases = databases.filter(d => (!q || d.name.toLowerCase().includes(q)));
  const matchingNotes = notes.filter(n => (!q || n.content.toLowerCase().includes(q)));

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setActiveView('page');
    setIsSearchModalOpen(false);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveView('project-detail');
    setIsSearchModalOpen(false);
  };

  const handleSelectDatabase = (databaseId: string) => {
    setSelectedDatabaseId(databaseId);
    setActiveView('databases');
    setIsSearchModalOpen(false);
  };

  const handleSelectTask = () => {
    setActiveView('tasks');
    setIsSearchModalOpen(false);
  };

  const handleSelectNote = () => {
    setActiveView('inbox');
    setIsSearchModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar páginas, tarefas, projetos, notas..."
            className="flex-1 text-sm bg-transparent border-none outline-hidden text-slate-800 dark:text-zinc-100 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Pages */}
          {matchingPages.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} />
                <span>Páginas</span>
              </div>
              {matchingPages.slice(0, 4).map(page => (
                <div
                  key={page.id}
                  onClick={() => handleSelectPage(page.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="text-base">{page.icon || '📄'}</span>
                  <span className="truncate flex-1 font-medium">{page.title || 'Sem título'}</span>
                  <ArrowRight size={12} className="text-slate-400 opacity-60" />
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={11} />
                <span>Tarefas</span>
              </div>
              {matchingTasks.slice(0, 4).map(task => (
                <div
                  key={task.id}
                  onClick={handleSelectTask}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate flex-1">{task.title}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{task.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {matchingProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderKanban size={11} />
                <span>Projetos</span>
              </div>
              {matchingProjects.slice(0, 3).map(proj => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="text-base">{proj.icon || '📁'}</span>
                  <span className="truncate flex-1 font-medium">{proj.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{proj.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Databases */}
          {matchingDatabases.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database size={11} />
                <span>Bases de Dados</span>
              </div>
              {matchingDatabases.slice(0, 3).map(db => (
                <div
                  key={db.id}
                  onClick={() => handleSelectDatabase(db.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="text-base">{db.icon || '🗄️'}</span>
                  <span className="truncate flex-1 font-medium">{db.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {matchingNotes.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote size={11} />
                <span>Notas Rápidas</span>
              </div>
              {matchingNotes.slice(0, 3).map(note => (
                <div
                  key={note.id}
                  onClick={handleSelectNote}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200 transition-colors"
                >
                  <span className="truncate flex-1 text-slate-600 dark:text-zinc-300">{note.content}</span>
                </div>
              ))}
            </div>
          )}

          {matchingPages.length === 0 && matchingTasks.length === 0 && matchingProjects.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Navegação instantânea</span>
            <span>Esc para fechar</span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">Workspace OS</span>
        </div>
      </div>
    </div>
  );
};
