import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Target,
  ArrowRight,
  Plus,
  Star,
  FileText,
  Flame,
  Check,
  Send,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Dashboard: React.FC = () => {
  const {
    user,
    pages,
    tasks,
    projects,
    goals,
    habits,
    habitEntries,
    notes,
    setActiveView,
    setSelectedPageId,
    setSelectedProjectId,
    createPage,
    createTask,
    toggleTaskComplete,
    toggleHabitToday,
    createNote,
    convertNoteToPage,
    convertNoteToTask,
    deleteNote,
    isFullWidth,
  } = useWorkspace();

  const [quickIdeaText, setQuickIdeaText] = useState('');

  // Contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'Produtividade';

  // Format date in pt-BR
  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Metrics calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter(t => !t.deletedAt);
  const pendingTasks = activeTasks.filter(t => t.status !== 'done' && t.status !== 'archived');
  const todayTasks = activeTasks.filter(t => t.dueDate === todayStr);
  const overdueTasks = pendingTasks.filter(t => t.dueDate && t.dueDate < todayStr);
  const completedTasks = activeTasks.filter(t => t.status === 'done');
  const activeProjects = projects.filter(p => !p.deletedAt && p.status === 'in_progress');
  const activeGoals = goals.filter(g => g.status === 'in_progress');

  // Today habit entries
  const todayEntries = habitEntries.filter(e => e.date === todayStr && e.completed);

  // Favorite & Recent Pages
  const activePages = pages.filter(p => !p.deletedAt);
  const favoritePages = activePages.filter(p => p.isFavorite);
  const recentPages = [...activePages].slice(0, 4);

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIdeaText.trim()) return;
    await createNote(quickIdeaText.trim());
    setQuickIdeaText('');
  };

  // Helper to compute project progress from real associated tasks
  const getProjectProgress = (projectId: string) => {
    const projectTasks = activeTasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const doneTasks = projectTasks.filter(t => t.status === 'done');
    return Math.round((doneTasks.length / projectTasks.length) * 100);
  };

  return (
    <div className={`py-8 px-4 md:px-8 mx-auto space-y-8 ${isFullWidth ? 'max-w-full' : 'max-w-5xl'}`}>
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-xs tracking-wide uppercase">
            <Sparkles size={14} />
            <span>Workspace OS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mt-1">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 capitalize mt-0.5">
            {formattedToday}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => createPage(null, 'Nova página', '📄')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-700 dark:text-zinc-200 rounded-lg shadow-2xs transition-all"
          >
            <Plus size={14} />
            <span>Nova Página</span>
          </button>
          <button
            type="button"
            onClick={() => createTask({ title: 'Nova tarefa', dueDate: todayStr })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
          >
            <Plus size={14} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Quick Idea Capture Scratchpad */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-purple-50/70 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-xl p-3.5 shadow-2xs">
        <form onSubmit={handleQuickCapture} className="flex items-center gap-2">
          <input
            type="text"
            value={quickIdeaText}
            onChange={e => setQuickIdeaText(e.target.value)}
            placeholder="Captura rápida: digite uma ideia, pensamento ou nota para salvar instantaneamente..."
            className="flex-1 bg-white/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!quickIdeaText.trim()}
            className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send size={13} />
            <span>Capturar</span>
          </button>
        </form>
      </div>

      {/* Real Metric Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveView('today')}
          className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-indigo-400/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Hoje</span>
            <Calendar size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {todayTasks.filter(t => t.status === 'done').length}/{todayTasks.length}
            </span>
            <span className="text-[11px] text-slate-400">tarefas</span>
          </div>
        </div>

        <div
          onClick={() => setActiveView('tasks')}
          className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-amber-400/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Pendentes</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {pendingTasks.length}
            </span>
            {overdueTasks.length > 0 && (
              <span className="text-[11px] font-medium text-rose-500 flex items-center gap-0.5">
                <AlertCircle size={10} />
                {overdueTasks.length} atrasada(s)
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setActiveView('projects')}
          className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-purple-400/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Projetos Ativos</span>
            <FolderKanban size={16} className="text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {activeProjects.length}
            </span>
            <span className="text-[11px] text-slate-400">em andamento</span>
          </div>
        </div>

        <div
          onClick={() => setActiveView('goals')}
          className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:border-emerald-400/50 transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Metas & Hábitos</span>
            <Flame size={16} className="text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              {todayEntries.length}/{habits.length}
            </span>
            <span className="text-[11px] text-slate-400">hábitos hoje</span>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Tasks of the Day & Projects / Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tasks & Recent Pages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                  Tarefas Prioritárias
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('tasks')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ver todas</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-1.5">
              {pendingTasks.slice(0, 5).map(task => {
                const isOverdue = task.dueDate && task.dueDate < todayStr;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task)}
                        className="w-4 h-4 rounded-sm border border-slate-300 dark:border-zinc-600 hover:border-indigo-500 flex items-center justify-center transition-colors"
                      >
                        {task.status === 'done' && <Check size={12} className="text-indigo-600" />}
                      </button>
                      <span className={`text-xs truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-[10px] ${isOverdue ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                          {task.dueDate === todayStr ? 'Hoje' : task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {pendingTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  🎉 Tudo em dia! Nenhuma tarefa pendente para o momento.
                </div>
              )}
            </div>
          </div>

          {/* Quick Notes Scratchpad Gallery */}
          {notes.length > 0 && (
            <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Inbox size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                    Notas Rápidas & Ideias Capturadas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('inbox')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Abrir Caixa de Entrada</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notes.slice(0, 4).map(note => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-2"
                  >
                    <p className="text-xs text-slate-700 dark:text-zinc-300 line-clamp-3">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => convertNoteToPage(note)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          → Criar Página
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => convertNoteToTask(note)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          → Tarefa
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent & Favorite Pages */}
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                  Páginas Recentes & Favoritas
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recentPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setActiveView('page');
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200/70 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                >
                  <span className="text-lg">{page.icon || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                      {page.title || 'Sem título'}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Atualizado há pouco
                    </span>
                  </div>
                  {page.isFavorite && (
                    <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Active Projects & Daily Habits */}
        <div className="space-y-6">
          {/* Active Projects Widget with Computed Progress */}
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderKanban size={16} className="text-purple-500" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                  Projetos em Curso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('projects')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {activeProjects.slice(0, 3).map(proj => {
                const progress = getProjectProgress(proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setActiveView('project-detail');
                    }}
                    className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span>{proj.icon || '📁'}</span>
                        <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                          {proj.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: proj.color || '#6366f1'
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhum projeto ativo no momento.
                </div>
              )}
            </div>
          </div>

          {/* Daily Habits Checklist with Real Streaks */}
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                  Rotinas de Hoje
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('habits')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-2">
              {habits.slice(0, 4).map(habit => {
                const isCompletedToday = habitEntries.some(
                  e => e.habitId === habit.id && e.date === todayStr && e.completed
                );
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleHabitToday(habit.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isCompletedToday
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-300 dark:border-zinc-600 hover:border-emerald-500'
                        }`}
                      >
                        {isCompletedToday && <Check size={13} />}
                      </button>
                      <span className="text-sm">{habit.icon || '⚡'}</span>
                      <span className={`text-xs truncate ${isCompletedToday ? 'line-through text-slate-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 shrink-0">
                      <Flame size={12} />
                      <span>{habit.streak || 0}d</span>
                    </div>
                  </div>
                );
              })}

              {habits.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Crie seus hábitos para acompanhar sua consistência.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
