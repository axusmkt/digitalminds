import React, { useState } from 'react';
import {
  ChevronRight,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Star,
  Share2,
  Plus,
  Loader2,
  FileText,
  CheckSquare,
  FolderKanban,
  StickyNote,
  ShieldCheck,
  Lock,
  LogOut,
  Settings
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Header: React.FC = () => {
  const {
    currentWorkspace,
    activeView,
    setActiveView,
    selectedPageId,
    pages,
    toggleFavoritePage,
    theme,
    toggleTheme,
    isFullWidth,
    toggleFullWidth,
    setIsShareModalOpen,
    setIsSettingsModalOpen,
    createPage,
    createTask,
    createProject,
    createNote,
    dataLoading,
    authUsername,
    lockSession,
    logout,
  } = useWorkspace();

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentPage = pages.find(p => p.id === selectedPageId);

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [{ label: currentWorkspace?.name || 'Workspace', onClick: () => setActiveView('dashboard') }];

    if (activeView === 'dashboard') {
      crumbs.push({ label: 'Início', onClick: () => {} });
    } else if (activeView === 'inbox') {
      crumbs.push({ label: 'Caixa de Entrada', onClick: () => {} });
    } else if (activeView === 'tasks') {
      crumbs.push({ label: 'Tarefas', onClick: () => {} });
    } else if (activeView === 'today') {
      crumbs.push({ label: 'Hoje', onClick: () => {} });
    } else if (activeView === 'calendar') {
      crumbs.push({ label: 'Calendário', onClick: () => {} });
    } else if (activeView === 'projects' || activeView === 'project-detail') {
      crumbs.push({ label: 'Projetos', onClick: () => setActiveView('projects') });
    } else if (activeView === 'goals') {
      crumbs.push({ label: 'Metas', onClick: () => {} });
    } else if (activeView === 'habits') {
      crumbs.push({ label: 'Hábitos & Rotinas', onClick: () => {} });
    } else if (activeView === 'databases' || activeView === 'database-detail') {
      crumbs.push({ label: 'Bases de Dados', onClick: () => setActiveView('databases') });
    } else if (activeView === 'trash') {
      crumbs.push({ label: 'Lixeira', onClick: () => {} });
    } else if (activeView === 'page' && currentPage) {
      crumbs.push({ label: `${currentPage.icon || '📄'} ${currentPage.title || 'Sem título'}`, onClick: () => {} });
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="h-12 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
      {/* Left: Breadcrumbs & Save Indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 min-w-0">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
              <span
                onClick={crumb.onClick}
                className={`truncate max-w-[200px] cursor-pointer hover:text-slate-900 dark:hover:text-zinc-100 ${
                  idx === crumbs.length - 1 ? 'font-medium text-slate-800 dark:text-zinc-200' : ''
                }`}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Persistence & Security Status */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-zinc-800 text-[11px] text-slate-400 dark:text-zinc-500">
          {dataLoading ? (
            <>
              <Loader2 size={12} className="animate-spin text-indigo-500" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Cofre Protegido</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Favorite page button (only when viewing page) */}
        {activeView === 'page' && currentPage && (
          <button
            type="button"
            onClick={() => toggleFavoritePage(currentPage.id)}
            title={currentPage.isFavorite ? 'Remover dos favoritos' : 'Favoritar página'}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
          >
            <Star
              size={15}
              className={currentPage.isFavorite ? 'text-amber-500 fill-amber-500' : ''}
            />
          </button>
        )}

        {/* Full width toggle */}
        <button
          type="button"
          onClick={toggleFullWidth}
          title={isFullWidth ? 'Largura padrão' : 'Largura total'}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
        >
          {isFullWidth ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Quick Lock Button */}
        <button
          type="button"
          onClick={lockSession}
          title="Bloquear Cofre Agora"
          className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Lock size={15} />
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-md transition-colors"
        >
          <Share2 size={13} />
          <span>Compartilhar</span>
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-md shadow-xs transition-opacity"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Criar</span>
          </button>

          {isQuickCreateOpen && (
            <div
              onClick={() => setIsQuickCreateOpen(false)}
              className="absolute right-0 top-9 z-50 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 text-xs"
            >
              <button
                type="button"
                onClick={() => createPage(null, 'Nova página')}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-left"
              >
                <FileText size={14} className="text-blue-500" />
                <span>Nova Página</span>
              </button>
              <button
                type="button"
                onClick={() => createTask({ title: 'Nova tarefa rápida' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-left"
              >
                <CheckSquare size={14} className="text-emerald-500" />
                <span>Nova Tarefa</span>
              </button>
              <button
                type="button"
                onClick={() => createProject({ name: 'Novo Projeto' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-left"
              >
                <FolderKanban size={14} className="text-purple-500" />
                <span>Novo Projeto</span>
              </button>
              <button
                type="button"
                onClick={() => createNote('Nova anotação rápida')}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-left"
              >
                <StickyNote size={14} className="text-amber-500" />
                <span>Nota Rápida</span>
              </button>
            </div>
          )}
        </div>

        {/* Authenticated User Badge & Dropdown */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {authUsername ? authUsername.charAt(0).toUpperCase() : 'A'}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-zinc-200">
              {authUsername || 'Axus'}
            </span>
          </button>

          {isUserMenuOpen && (
            <div
              onClick={() => setIsUserMenuOpen(false)}
              className="absolute right-0 top-10 z-50 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 text-xs"
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">{authUsername || 'Axus'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                    Master Vault
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block truncate">
                  Sessão criptográfica ativa
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-left"
              >
                <Settings size={14} className="text-slate-400" />
                <span>Configurações de Segurança</span>
              </button>

              <button
                type="button"
                onClick={lockSession}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 text-left font-medium"
              >
                <Lock size={14} />
                <span>Bloquear Cofre Agora</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left font-medium"
              >
                <LogOut size={14} />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

