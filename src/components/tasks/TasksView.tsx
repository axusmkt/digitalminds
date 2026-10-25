import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  LayoutList,
  Columns,
  Trash2,
  Calendar,
  Tag,
  FolderKanban,
  Check,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Task, TaskPriority, TaskStatus, Subtask } from '../../types';

export const TasksView: React.FC<{ filterMode?: 'all' | 'today' | 'upcoming' }> = ({ filterMode = 'all' }) => {
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    isFullWidth
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Create Task Modal / Drawer
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newDueDate, setNewDueDate] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');

  // Selected Task for Subtask / Detail drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Filtering
  const activeTasks = tasks.filter(t => !t.deletedAt);
  const filteredTasks = activeTasks.filter(t => {
    // Mode
    if (filterMode === 'today' && t.dueDate !== todayStr) return false;
    if (filterMode === 'upcoming' && (!t.dueDate || t.dueDate < todayStr || t.dueDate > next7DaysStr)) return false;

    // Search
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Priority filter
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;

    // Project filter
    if (filterProject !== 'all' && t.projectId !== filterProject) return false;

    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tags = newTagsStr
        ? newTagsStr.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      await createTask({
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        status: newStatus,
        dueDate: newDueDate || (filterMode === 'today' ? todayStr : ''),
        projectId: newProjectId || undefined,
        tags,
      });

      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setNewDueDate('');
      setNewProjectId('');
      setNewTagsStr('');
      setIsNewTaskModalOpen(false);
    } catch (err) {
      console.error('Falha ao criar tarefa:', err);
      // Close modal gracefully so user is never locked
      setIsNewTaskModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const nextSubtasks = [...(selectedTask.subtasks || []), newSub];
    await updateTask(selectedTask.id, { subtasks: nextSubtasks });
    setSelectedTask({ ...selectedTask, subtasks: nextSubtasks });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = async (subId: string) => {
    if (!selectedTask) return;
    const nextSubtasks = (selectedTask.subtasks || []).map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    await updateTask(selectedTask.id, { subtasks: nextSubtasks });
    setSelectedTask({ ...selectedTask, subtasks: nextSubtasks });
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!selectedTask) return;
    const nextSubtasks = (selectedTask.subtasks || []).filter(s => s.id !== subId);
    await updateTask(selectedTask.id, { subtasks: nextSubtasks });
    setSelectedTask({ ...selectedTask, subtasks: nextSubtasks });
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold">Urgente</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">Alta</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">Média</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">Baixa</span>;
    }
  };

  const columns: { status: TaskStatus; label: string; dotColor: string }[] = [
    { status: 'todo', label: 'Não iniciada (A Fazer)', dotColor: 'bg-slate-400' },
    { status: 'in_progress', label: 'Em andamento', dotColor: 'bg-blue-500' },
    { status: 'done', label: 'Concluída', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-6xl'}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {filterMode === 'today' ? 'Tarefas de Hoje' : filterMode === 'upcoming' ? 'Próximos 7 Dias' : 'Gerenciador de Tarefas'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Organize, priorize e acompanhe o progresso das suas entregas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Columns size={14} />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutList size={14} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
          >
            <Plus size={14} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título de tarefa..."
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 dark:text-zinc-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-zinc-300"
          >
            <option value="all">Todas as prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-zinc-300"
          >
            <option value="all">Todos os projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {col.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium px-1.5 py-0.2 bg-slate-200/60 dark:bg-zinc-800 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus(col.status);
                      setIsNewTaskModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="space-y-2 flex-1">
                  {colTasks.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
                    const relatedProj = projects.find(p => p.id === task.projectId);
                    const subtasks = task.subtasks || [];
                    const completedSubs = subtasks.filter(s => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl shadow-2xs cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task);
                            }}
                            className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <span className={`text-xs font-medium flex-1 line-clamp-2 ${
                            task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-zinc-100'
                          }`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Project / Tags badge */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {relatedProj && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                              <span>{relatedProj.icon || '📁'}</span>
                              <span className="truncate max-w-[100px]">{relatedProj.name}</span>
                            </span>
                          )}
                          {getPriorityBadge(task.priority)}
                        </div>

                        {/* Footer: Due date & Subtask progress */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                          {task.dueDate ? (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-semibold' : ''}`}>
                              <Calendar size={11} />
                              <span>{task.dueDate === todayStr ? 'Hoje' : task.dueDate}</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          {subtasks.length > 0 && (
                            <span className="text-[10px]">
                              {completedSubs}/{subtasks.length} subtarefas
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhuma tarefa nesta coluna.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filteredTasks.map(task => {
              const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'done';
              const relatedProj = projects.find(p => p.id === task.projectId);

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskComplete(task);
                      }}
                      className="text-slate-400 hover:text-indigo-600 shrink-0"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-medium block truncate ${
                        task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-zinc-100'
                      }`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-[11px] text-slate-400 truncate block">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {relatedProj && (
                      <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-zinc-400">
                        {relatedProj.name}
                      </span>
                    )}
                    {getPriorityBadge(task.priority)}
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                        {task.dueDate === todayStr ? 'Hoje' : task.dueDate}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                Nenhuma tarefa correspondente aos filtros atuais.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Criar Nova Tarefa
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Título da tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Concluir documentação da API..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Notas adicionais sobre a tarefa..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Data Limite (Prazo)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Projeto Vinculado
                  </label>
                  <select
                    value={newProjectId}
                    onChange={e => setNewProjectId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="">Nenhum</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.icon || '📁'} {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={newTagsStr}
                    onChange={e => setNewTagsStr(e.target.value)}
                    placeholder="frontend, bug, sprint"
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    'Salvar Tarefa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail & Subtasks Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs uppercase font-semibold text-slate-400">
                Detalhes da Tarefa
              </span>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {/* Title inline edit */}
              <div>
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={e => {
                    const next = { ...selectedTask, title: e.target.value };
                    setSelectedTask(next);
                    updateTask(selectedTask.id, { title: e.target.value });
                  }}
                  className="w-full text-lg font-bold text-slate-900 dark:text-zinc-100 bg-transparent border-none outline-hidden"
                />
              </div>

              {/* Status and Priority selectors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl text-xs">
                <div>
                  <span className="block text-slate-400 mb-1">Status</span>
                  <select
                    value={selectedTask.status}
                    onChange={e => {
                      const next = { ...selectedTask, status: e.target.value as TaskStatus };
                      setSelectedTask(next);
                      updateTask(selectedTask.id, { status: e.target.value as TaskStatus });
                    }}
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md p-1"
                  >
                    <option value="todo">Não iniciada</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="done">Concluída</option>
                    <option value="archived">Arquivada</option>
                  </select>
                </div>

                <div>
                  <span className="block text-slate-400 mb-1">Prioridade</span>
                  <select
                    value={selectedTask.priority}
                    onChange={e => {
                      const next = { ...selectedTask, priority: e.target.value as TaskPriority };
                      setSelectedTask(next);
                      updateTask(selectedTask.id, { priority: e.target.value as TaskPriority });
                    }}
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md p-1"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Subtasks Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                    Subtarefas / Checklist
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {(selectedTask.subtasks || []).filter(s => s.completed).length}/{(selectedTask.subtasks || []).length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(selectedTask.subtasks || []).map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`text-xs truncate ${sub.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {sub.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add subtask input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Adicionar subtarefa e pressionar Enter..."
                      className="flex-1 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700"
              >
                <Trash2 size={13} />
                <span>Mover para lixeira</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
