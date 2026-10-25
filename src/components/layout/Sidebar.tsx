import React, { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  CalendarDays,
  Calendar as CalendarIcon,
  FolderKanban,
  Target,
  Repeat,
  Database,
  Trash2,
  Settings,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Star,
  MoreHorizontal,
  PanelLeftClose,
  Sparkles,
  Share2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PageDocument, ActiveNavView } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    activeView,
    setActiveView,
    selectedPageId,
    setSelectedPageId,
    pages,
    tasks,
    projects,
    databases,
    createPage,
    softDeletePage,
    toggleFavoritePage,
    isSidebarCollapsed,
    toggleSidebar,
    setIsSearchModalOpen,
    setIsSettingsModalOpen,
    setIsNewWorkspaceModalOpen,
    setIsShareModalOpen,
  } = useWorkspace();

  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [contextMenuPageId, setContextMenuPageId] = useState<string | null>(null);

  // Toggle page hierarchy branch
  const togglePageExpand = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  // Filter active pages (not deleted)
  const activePages = pages.filter(p => !p.deletedAt);
  const favoritePages = activePages.filter(p => p.isFavorite);
  const rootPages = activePages.filter(p => !p.parentId);

  const getSubpages = (parentId: string) => {
    return activePages.filter(p => p.parentId === parentId);
  };

  // Counts
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasksCount = tasks.filter(t => !t.deletedAt && t.status !== 'done' && t.status !== 'archived').length;
  const todayTasksCount = tasks.filter(t => !t.deletedAt && t.status !== 'done' && t.dueDate === todayStr).length;
  const activeProjectsCount = projects.filter(p => !p.deletedAt && p.status === 'in_progress').length;
  const deletedCount = pages.filter(p => p.deletedAt).length + tasks.filter(t => t.deletedAt).length + projects.filter(p => p.deletedAt).length;

  const navigateTo = (view: ActiveNavView) => {
    setSelectedPageId(null);
    setActiveView(view);
  };

  const selectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setActiveView('page');
  };

  const handleCreateSubpage = async (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages(prev => ({ ...prev, [parentId]: true }));
    await createPage(parentId, 'Nova subpágina', '📄');
  };

  const renderPageItem = (page: PageDocument, level = 0) => {
    const subpages = getSubpages(page.id);
    const hasSubpages = subpages.length > 0;
    const isExpanded = !!expandedPages[page.id];
    const isSelected = activeView === 'page' && selectedPageId === page.id;

    return (
      <div key={page.id} className="group/item select-none">
        <div
          onClick={() => selectPage(page.id)}
          style={{ paddingLeft: `${12 + level * 14}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-md text-sm cursor-pointer transition-colors ${
            isSelected
              ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center min-w-0 gap-1.5 flex-1">
            {hasSubpages ? (
              <button
                type="button"
                onClick={(e) => togglePageExpand(page.id, e)}
                className="p-0.5 rounded hover:bg-slate-300/50 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-3.5 inline-block" />
            )}
            <span className="text-base leading-none shrink-0">{page.icon || '📄'}</span>
            <span className="truncate text-xs font-normal">{page.title || 'Sem título'}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button
              type="button"
              title="Adicionar subpágina"
              onClick={(e) => handleCreateSubpage(page.id, e)}
              className="p-1 rounded hover:bg-slate-300/60 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
            >
              <Plus size={13} />
            </button>
            <div className="relative">
              <button
                type="button"
                title="Mais opções"
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuPageId(contextMenuPageId === page.id ? null : page.id);
                }}
                className="p-1 rounded hover:bg-slate-300/60 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <MoreHorizontal size={13} />
              </button>

              {contextMenuPageId === page.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 z-50 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleFavoritePage(page.id);
                      setContextMenuPageId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                  >
                    <Star size={13} className={page.isFavorite ? 'text-amber-500 fill-amber-500' : ''} />
                    {page.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      createPage(page.parentId, `${page.title} (Cópia)`, page.icon);
                      setContextMenuPageId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                  >
                    <FileText size={13} />
                    Duplicar página
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                  <button
                    type="button"
                    onClick={() => {
                      softDeletePage(page.id);
                      setContextMenuPageId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 size={13} />
                    Mover para a lixeira
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nested Subpages */}
        {hasSubpages && isExpanded && (
          <div className="space-y-0.5">
            {subpages.map(sub => renderPageItem(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isSidebarCollapsed) {
    return (
      <div className="w-12 bg-slate-50 dark:bg-zinc-900/90 border-r border-slate-200 dark:border-zinc-800 flex flex-col items-center py-3 select-none">
        <button
          onClick={toggleSidebar}
          title="Expandir barra lateral"
          className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
        >
          <ChevronRight size={18} />
        </button>
        <div className="my-2 border-t border-slate-200 dark:border-zinc-800 w-6" />
        <button
          onClick={() => navigateTo('dashboard')}
          title="Início"
          className={`p-2 rounded-md ${activeView === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
        >
          <LayoutDashboard size={18} />
        </button>
        <button
          onClick={() => navigateTo('tasks')}
          title="Tarefas"
          className={`p-2 rounded-md ${activeView === 'tasks' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
        >
          <CheckSquare size={18} />
        </button>
        <button
          onClick={() => navigateTo('projects')}
          title="Projetos"
          className={`p-2 rounded-md ${activeView === 'projects' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
        >
          <FolderKanban size={18} />
        </button>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          title="Busca Global (Cmd+K)"
          className="p-2 mt-auto rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-800"
        >
          <Search size={18} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-slate-50/95 dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800/80 flex flex-col h-screen select-none shrink-0 transition-all">
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-slate-200/60 dark:border-zinc-800/60 relative">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 -ml-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-left transition-colors flex-1 min-w-0"
          >
            <span className="w-6 h-6 rounded flex items-center justify-center text-sm bg-white dark:bg-zinc-800 shadow-xs border border-slate-200/70 dark:border-zinc-700">
              {currentWorkspace?.icon || '✨'}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                {currentWorkspace?.name || 'Workspace OS'}
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-zinc-500">
                Workspace OS
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            title="Recolher barra lateral"
            className="p-1.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Workspace Dropdown */}
        {isWorkspaceMenuOpen && (
          <div className="absolute left-3 right-3 top-14 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 text-xs">
            <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Seus Workspaces
            </div>
            {workspaces.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setCurrentWorkspace(w);
                  setIsWorkspaceMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                  currentWorkspace?.id === w.id ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span>{w.icon || '🚀'}</span>
                <span className="truncate flex-1">{w.name}</span>
                {currentWorkspace?.id === w.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
            ))}
            <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
            <button
              type="button"
              onClick={() => {
                setIsWorkspaceMenuOpen(false);
                setIsNewWorkspaceModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <Plus size={14} />
              Criar novo workspace
            </button>
          </div>
        )}
      </div>

      {/* Global Search Bar Trigger */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-500 dark:text-zinc-400 bg-slate-200/50 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200/60 dark:border-zinc-700/50"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <span>Buscar no workspace...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'dashboard'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard size={15} />
              <span>Início</span>
            </div>
            <Sparkles size={12} className="text-amber-500 opacity-80" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('inbox')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'inbox'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox size={15} />
              <span>Caixa de entrada</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('tasks')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'tasks'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare size={15} />
              <span>Minhas tarefas</span>
            </div>
            {pendingTasksCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('today')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'today'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} />
              <span>Hoje</span>
            </div>
            {todayTasksCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
                {todayTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('calendar')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'calendar'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarIcon size={15} />
              <span>Calendário</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('projects')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'projects' || activeView === 'project-detail'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderKanban size={15} />
              <span>Projetos</span>
            </div>
            {activeProjectsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full">
                {activeProjectsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('goals')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'goals'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Target size={15} />
              <span>Metas</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('habits')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'habits'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Repeat size={15} />
              <span>Rotinas & Hábitos</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('databases')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'databases' || activeView === 'database-detail'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database size={15} />
              <span>Bases de Dados</span>
            </div>
            {databases.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-full">
                {databases.length}
              </span>
            )}
          </button>
        </div>

        {/* Favorites section */}
        {favoritePages.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Star size={11} className="text-amber-500 fill-amber-500" />
              <span>Favoritos</span>
            </div>
            <div className="space-y-0.5">
              {favoritePages.map(page => (
                <div
                  key={'fav_' + page.id}
                  onClick={() => selectPage(page.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    activeView === 'page' && selectedPageId === page.id
                      ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm">{page.icon || '📄'}</span>
                  <span className="truncate flex-1">{page.title || 'Sem título'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hierarchical Pages Tree */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            <span>Páginas</span>
            <button
              type="button"
              onClick={() => createPage(null, 'Nova página', '📄')}
              title="Criar nova página raiz"
              className="p-1 rounded hover:bg-slate-200/70 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5">
            {rootPages.map(page => renderPageItem(page))}
            {rootPages.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400 dark:text-zinc-500 italic">
                Nenhuma página ainda. Clique no + para criar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-2 border-t border-slate-200/70 dark:border-zinc-800/70 space-y-0.5 text-xs">
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200"
        >
          <Share2 size={15} />
          <span>Membros & Compartilhar</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200"
        >
          <Settings size={15} />
          <span>Configurações</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('trash')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md ${
            activeView === 'trash'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trash2 size={15} />
            <span>Lixeira</span>
          </div>
          {deletedCount > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">{deletedCount}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
