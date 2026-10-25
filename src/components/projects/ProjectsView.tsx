import React, { useState } from 'react';
import {
  Plus,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Flag,
  LayoutGrid,
  List,
  Columns,
  X,
  Target,
  Sparkles,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Project, ProjectStatus, TaskPriority, Milestone, TaskStatus } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    tasks,
    selectedProjectId,
    setSelectedProjectId,
    activeView,
    setActiveView,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    isFullWidth
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Project Form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('in_progress');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newStartDate, setNewStartDate] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  // Milestone Form inside Project Detail
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Project Tasks Management inside Project Detail
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');
  const [newProjectTaskStatus, setNewProjectTaskStatus] = useState<TaskStatus>('todo');
  const [newProjectTaskPriority, setNewProjectTaskPriority] = useState<TaskPriority>('medium');
  const [newProjectTaskDueDate, setNewProjectTaskDueDate] = useState('');
  const [projectTaskFilter, setProjectTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [isSubmittingProjectTask, setIsSubmittingProjectTask] = useState(false);

  const activeProjects = projects.filter(p => !p.deletedAt);
  const activeTasks = tasks.filter(t => !t.deletedAt);

  // Compute progress safely
  const calculateProgress = (projectId: string) => {
    const projectTasks = activeTasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createProject({
        name: newName.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        color: newColor,
        status: newStatus,
        priority: newPriority,
        startDate: newStartDate,
        targetDate: newTargetDate,
      });

      setNewName('');
      setNewDescription('');
      setNewIcon('📁');
      setNewColor('#6366f1');
      setNewStartDate('');
      setNewTargetDate('');
      setIsNewProjectModalOpen(false);
    } catch (err) {
      console.error('Falha ao criar projeto:', err);
      setIsNewProjectModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a specific project is selected, render Project Detail View
  const currentProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const handleAddMilestone = async () => {
    if (!currentProject || !newMilestoneTitle.trim() || isSubmittingMilestone) return;
    setIsSubmittingMilestone(true);
    try {
      const milestone: Milestone = {
        id: 'm_' + Math.random().toString(36).substring(2, 9),
        title: newMilestoneTitle.trim(),
        dueDate: newMilestoneDate || new Date().toISOString().split('T')[0],
        completed: false,
      };
      const nextMilestones = [...(currentProject.milestones || []), milestone];
      await updateProject(currentProject.id, { milestones: nextMilestones });
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
    } catch (err) {
      console.error('Falha ao adicionar marco:', err);
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!currentProject) return;
    try {
      const nextMilestones = (currentProject.milestones || []).filter(m => m.id !== milestoneId);
      await updateProject(currentProject.id, { milestones: nextMilestones });
    } catch (err) {
      console.error('Falha ao excluir marco:', err);
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!currentProject) return;
    try {
      const nextMilestones = (currentProject.milestones || []).map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      await updateProject(currentProject.id, { milestones: nextMilestones });
    } catch (err) {
      console.error('Falha ao alternar marco:', err);
    }
  };

  const handleAddProjectTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentProject || !newProjectTaskTitle.trim() || isSubmittingProjectTask) return;
    setIsSubmittingProjectTask(true);
    try {
      await createTask({
        title: newProjectTaskTitle.trim(),
        projectId: currentProject.id,
        status: newProjectTaskStatus,
        priority: newProjectTaskPriority,
        dueDate: newProjectTaskDueDate ? newProjectTaskDueDate : undefined,
      });
      setNewProjectTaskTitle('');
      setNewProjectTaskDueDate('');
    } catch (err) {
      console.error('Falha ao criar tarefa do projeto:', err);
    } finally {
      setIsSubmittingProjectTask(false);
    }
  };

  // Status Labels
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">Em Andamento</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">Concluído</span>;
      case 'paused':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">Pausado</span>;
      case 'planned':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">Planejado</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">Cancelado</span>;
    }
  };

  if (currentProject) {
    const projectTasks = activeTasks.filter(t => t.projectId === currentProject.id);
    const progress = calculateProgress(currentProject.id);

    return (
      <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-5xl'}`}>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedProjectId(null);
            setActiveView('projects');
          }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Voltar para todos os projetos</span>
        </button>

        {/* Project Header Banner */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                {currentProject.icon || '📁'}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  {currentProject.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {currentProject.description || 'Sem descrição definida.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(currentProject.status)}
              <button
                type="button"
                onClick={() => {
                  deleteProject(currentProject.id);
                  setSelectedProjectId(null);
                  setActiveView('projects');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                title="Excluir projeto"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-zinc-300">Progresso Geral</span>
              <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentProject.color || '#6366f1'
                }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-zinc-800">
            {currentProject.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Início: {currentProject.startDate}</span>
              </div>
            )}
            {currentProject.targetDate && (
              <div className="flex items-center gap-1.5">
                <Target size={13} />
                <span>Prazo Final: {currentProject.targetDate}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>{projectTasks.filter(t => t.status === 'done').length}/{projectTasks.length} tarefas concluídas</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Linked Tasks Table & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linked Tasks Table (2 Cols on lg) */}
          <div className="lg:col-span-2 border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Columns size={16} className="text-indigo-600" />
                  Tarefas do Projeto
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organizadas por status: A Fazer, Em Andamento e Concluído
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/80 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setProjectTaskFilter('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    projectTaskFilter === 'all'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Todas ({projectTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectTaskFilter('todo')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    projectTaskFilter === 'todo'
                      ? 'bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-400 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  A Fazer ({projectTasks.filter(t => t.status === 'todo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectTaskFilter('in_progress')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    projectTaskFilter === 'in_progress'
                      ? 'bg-white dark:bg-zinc-700 text-blue-700 dark:text-blue-400 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Em Andamento ({projectTasks.filter(t => t.status === 'in_progress').length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectTaskFilter('done')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    projectTaskFilter === 'done'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Concluído ({projectTasks.filter(t => t.status === 'done').length})
                </button>
              </div>
            </div>

            {/* Quick Add Task Form */}
            <form onSubmit={handleAddProjectTask} className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={newProjectTaskTitle}
                  onChange={e => setNewProjectTaskTitle(e.target.value)}
                  placeholder="Nome da nova tarefa vinculada..."
                  className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newProjectTaskTitle.trim() || isSubmittingProjectTask}
                  className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                >
                  {isSubmittingProjectTask ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Adicionar Tarefa</span>
                </button>
              </div>

              {/* Status, Priority & Due Date selectors for the new task */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                  <select
                    value={newProjectTaskStatus}
                    onChange={e => setNewProjectTaskStatus(e.target.value as TaskStatus)}
                    className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-2 py-1 text-slate-700 dark:text-zinc-300"
                  >
                    <option value="todo">A Fazer</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Prioridade:</span>
                  <select
                    value={newProjectTaskPriority}
                    onChange={e => setNewProjectTaskPriority(e.target.value as TaskPriority)}
                    className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-2 py-1 text-slate-700 dark:text-zinc-300"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Prazo:</span>
                  <input
                    type="date"
                    value={newProjectTaskDueDate}
                    onChange={e => setNewProjectTaskDueDate(e.target.value)}
                    className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-2 py-1 text-slate-700 dark:text-zinc-300"
                  />
                </div>
              </div>
            </form>

            {/* Tasks Table */}
            <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 text-slate-500 font-medium">
                      <th className="py-2.5 px-3 w-36">Status</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Tarefa</th>
                      <th className="py-2.5 px-3 w-28">Prioridade</th>
                      <th className="py-2.5 px-3 w-28">Prazo</th>
                      <th className="py-2.5 px-3 w-16 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {projectTasks
                      .filter(t => (projectTaskFilter === 'all' ? true : t.status === projectTaskFilter))
                      .map(task => {
                        const isDone = task.status === 'done';
                        const isInProgress = task.status === 'in_progress';

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                          >
                            {/* Status Selector Dropdown */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <select
                                value={task.status}
                                onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
                                className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                                    : isInProgress
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                                }`}
                              >
                                <option value="todo">A Fazer</option>
                                <option value="in_progress">Em Andamento</option>
                                <option value="done">Concluído</option>
                              </select>
                            </td>

                            {/* Task Title & Checkbox */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskComplete(task)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 dark:border-zinc-600 hover:border-indigo-500'
                                  }`}
                                >
                                  {isDone && <CheckCircle2 size={12} className="stroke-[3]" />}
                                </button>
                                <span className={`font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                                  {task.title}
                                </span>
                              </div>
                            </td>

                            {/* Priority Badge */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : task.priority === 'high'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    : task.priority === 'medium'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                                }`}
                              >
                                {task.priority === 'urgent'
                                  ? 'Urgente'
                                  : task.priority === 'high'
                                  ? 'Alta'
                                  : task.priority === 'medium'
                                  ? 'Média'
                                  : 'Baixa'}
                              </span>
                            </td>

                            {/* Due Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                              {task.dueDate ? (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar size={12} className="text-slate-400" />
                                  {task.dueDate}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-zinc-600">-</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                title="Excluir tarefa"
                                onClick={() => deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {projectTasks.filter(t => (projectTaskFilter === 'all' ? true : t.status === projectTaskFilter)).length === 0 && (
                <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-medium text-slate-500 dark:text-zinc-400">
                    Nenhuma tarefa {projectTaskFilter === 'todo' ? 'a fazer' : projectTaskFilter === 'in_progress' ? 'em andamento' : projectTaskFilter === 'done' ? 'concluída' : 'cadastrada'}.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Utilize o formulário acima para adicionar uma nova tarefa ao projeto.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Milestones & Deliverables (1 Col on lg) */}
          <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-indigo-600" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                  Marcos & Entregáveis
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {(currentProject.milestones || []).filter(m => m.completed).length}/{(currentProject.milestones || []).length}
              </span>
            </div>

            {/* New Milestone Form */}
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 text-xs">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={e => setNewMilestoneTitle(e.target.value)}
                placeholder="Título do marco ou entregável..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-200 placeholder-slate-400"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={e => setNewMilestoneDate(e.target.value)}
                  className="flex-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-200"
                />
                <button
                  type="button"
                  disabled={!newMilestoneTitle.trim() || isSubmittingMilestone}
                  onClick={handleAddMilestone}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0"
                >
                  {isSubmittingMilestone ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Milestones List with Delete Option */}
            <div className="space-y-2">
              {(currentProject.milestones || []).map(milestone => (
                <div
                  key={milestone.id}
                  className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => handleToggleMilestone(milestone.id)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs block font-medium truncate ${milestone.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {milestone.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {milestone.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Delete Milestone Button */}
                  <button
                    type="button"
                    title="Apagar este marco"
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {(currentProject.milestones || []).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-medium text-slate-500 dark:text-zinc-400">Nenhum marco cadastrado.</p>
                  <p className="text-[11px] text-slate-400">Adicione datas de entregas importantes acima.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All Projects Overview Grid
  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-6xl'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Projetos
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Gerencie iniciativas completas com objetivos, tarefas vinculadas e marcos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
        >
          <Plus size={14} />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProjects.map(proj => {
          const progress = calculateProgress(proj.id);
          const projectTasks = activeTasks.filter(t => t.projectId === proj.id);

          return (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setActiveView('project-detail');
              }}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 shadow-2xs cursor-pointer transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-2xl p-2 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                    {proj.icon || '📁'}
                  </span>
                  {getStatusBadge(proj.status)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {proj.description || 'Sem descrição.'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{projectTasks.length} tarefas</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{progress}%</span>
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
            </div>
          );
        })}

        {activeProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Nenhum projeto criado ainda. Clique em "Novo Projeto" para começar!
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Criar Novo Projeto
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Ícone
                  </label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={e => setNewIcon(e.target.value)}
                    className="w-12 text-center text-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Refatoração do App Mobile"
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Objetivos e escopo do projeto..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ProjectStatus)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  >
                    <option value="planned">Planejado</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Prazo Final
                  </label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
