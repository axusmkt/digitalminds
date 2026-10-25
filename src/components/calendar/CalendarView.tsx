import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Video,
  Briefcase,
  Target,
  Flag,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Sun,
  Sunrise,
  CheckSquare,
  ListTodo,
  ExternalLink,
  Info,
  Tag as TagIcon,
  AlignLeft,
  Check
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Task, TaskPriority, TaskStatus, Milestone } from '../../types';

// Types for inspected items
type InspectedItem =
  | { type: 'task'; data: Task }
  | { type: 'milestone'; data: Milestone & { projectId: string; projectName: string; projectColor: string } }
  | { type: 'project_deadline'; data: { id: string; projectId: string; projectName: string; projectColor: string; projectIcon: string; type: 'target_date' | 'start_date'; title: string; status: string; priority: string; description?: string } };

export const CalendarView: React.FC = () => {
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setSelectedProjectId,
    setActiveView,
    isFullWidth
  } = useWorkspace();

  const [currentDate, setCurrentDate] = useState(new Date());

  // 2 Main Calendar Views: 'all' | 'projects' | 'commitments'
  const [calendarMode, setCalendarMode] = useState<'all' | 'projects' | 'commitments'>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');

  // Today & Tomorrow calculations
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Selected Date for the Day Planner (defaults to tomorrow for next-day planning, or today)
  const [plannerDate, setPlannerDate] = useState<string>(tomorrowStr);

  // Quick inline add inside Day Planner
  const [plannerQuickTitle, setPlannerQuickTitle] = useState('');
  const [plannerQuickTime, setPlannerQuickTime] = useState('');
  const [plannerQuickType, setPlannerQuickType] = useState<'meeting' | 'task'>('task');
  const [plannerQuickProjectId, setPlannerQuickProjectId] = useState('');
  const [isAddingPlannerItem, setIsAddingPlannerItem] = useState(false);

  // Full Event / Task Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDate, setModalDate] = useState(todayStr);
  const [modalTime, setModalTime] = useState('09:00');
  const [modalCategory, setModalCategory] = useState<'commitment' | 'project_task'>('commitment');
  const [modalProjectId, setModalProjectId] = useState('');
  const [modalPriority, setModalPriority] = useState<TaskPriority>('medium');
  const [modalDescription, setModalDescription] = useState('');
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Detailed Item Inspector Modal (shows rich info about tasks, milestones, and project deadlines)
  const [inspectedItem, setInspectedItem] = useState<InspectedItem | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setPlannerDate(todayStr);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // All active tasks with due date
  const activeTasks = tasks.filter(t => !t.deletedAt && t.dueDate);

  // Filter based on active project filter
  const projectScopedTasks = selectedProjectFilter === 'all'
    ? activeTasks
    : activeTasks.filter(t => t.projectId === selectedProjectFilter);

  // Filter by calendar view mode (Projetos vs Compromissos vs Todos)
  const filteredTasks = projectScopedTasks.filter(t => {
    const isCommitment = Boolean(t.time) || t.itemType === 'meeting' || t.itemType === 'call' || t.itemType === 'appointment';
    if (calendarMode === 'projects') {
      return Boolean(t.projectId) && !isCommitment;
    }
    if (calendarMode === 'commitments') {
      return isCommitment || !t.projectId;
    }
    return true; // 'all'
  });

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = filteredTasks.reduce((acc, t) => {
    if (!t.dueDate) return acc;
    if (!acc[t.dueDate]) acc[t.dueDate] = [];
    acc[t.dueDate].push(t);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group milestones by date string
  const milestonesByDate = projects.reduce((acc, p) => {
    if (selectedProjectFilter !== 'all' && p.id !== selectedProjectFilter) return acc;
    (p.milestones || []).forEach(m => {
      if (!m.dueDate) return;
      if (!acc[m.dueDate]) acc[m.dueDate] = [];
      acc[m.dueDate].push({
        ...m,
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color || '#6366f1'
      });
    });
    return acc;
  }, {} as Record<string, Array<Milestone & { projectId: string; projectName: string; projectColor: string }>>);

  // Group project deadlines and start dates by date string
  const projectDeadlinesByDate = projects.reduce((acc, p) => {
    if (selectedProjectFilter !== 'all' && p.id !== selectedProjectFilter) return acc;

    // Target Date (Prazo Final de Projeto)
    if (p.targetDate) {
      if (!acc[p.targetDate]) acc[p.targetDate] = [];
      acc[p.targetDate].push({
        id: `p_target_${p.id}`,
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color || '#6366f1',
        projectIcon: p.icon || '📁',
        type: 'target_date',
        title: `Prazo Final: ${p.name}`,
        status: p.status,
        priority: p.priority,
        description: p.description
      });
    }

    // Start Date (Início de Projeto)
    if (p.startDate) {
      if (!acc[p.startDate]) acc[p.startDate] = [];
      acc[p.startDate].push({
        id: `p_start_${p.id}`,
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color || '#6366f1',
        projectIcon: p.icon || '📁',
        type: 'start_date',
        title: `Início do Projeto: ${p.name}`,
        status: p.status,
        priority: p.priority,
        description: p.description
      });
    }
    return acc;
  }, {} as Record<string, Array<{
    id: string;
    projectId: string;
    projectName: string;
    projectColor: string;
    projectIcon: string;
    type: 'target_date' | 'start_date';
    title: string;
    status: string;
    priority: string;
    description?: string;
  }>>);

  // Open modal prefilled with date
  const handleOpenAddModal = (dateStr?: string, category: 'commitment' | 'project_task' = 'commitment') => {
    setModalDate(dateStr || plannerDate || todayStr);
    setModalCategory(category);
    setModalTitle('');
    setModalTime(category === 'commitment' ? '10:00' : '');
    setModalProjectId(selectedProjectFilter !== 'all' ? selectedProjectFilter : '');
    setModalPriority('medium');
    setModalDescription('');
    setIsEventModalOpen(true);
  };

  // Submit modal event
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || isSubmittingModal) return;

    setIsSubmittingModal(true);
    try {
      await createTask({
        title: modalTitle.trim(),
        dueDate: modalDate,
        time: modalTime.trim() || undefined,
        itemType: modalCategory === 'commitment' ? 'meeting' : 'task',
        projectId: modalProjectId || undefined,
        priority: modalPriority,
        description: modalDescription.trim() || undefined,
        status: 'todo'
      });

      setIsEventModalOpen(false);
      setModalTitle('');
      setModalDescription('');
    } catch (err) {
      console.error('Falha ao adicionar evento ao calendário:', err);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Quick submit inside the day planner
  const handleAddPlannerItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerQuickTitle.trim() || isAddingPlannerItem) return;

    setIsAddingPlannerItem(true);
    try {
      await createTask({
        title: plannerQuickTitle.trim(),
        dueDate: plannerDate,
        time: plannerQuickTime.trim() || undefined,
        itemType: plannerQuickType,
        projectId: plannerQuickProjectId || undefined,
        status: 'todo',
        priority: 'medium'
      });

      setPlannerQuickTitle('');
      setPlannerQuickTime('');
    } catch (err) {
      console.error('Falha ao planejar item:', err);
    } finally {
      setIsAddingPlannerItem(false);
    }
  };

  // Helper to jump directly to a linked project
  const handleJumpToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveView('projects');
  };

  // Items for the selected day planner
  const plannerTasks = (tasksByDate[plannerDate] || []).filter(t => !t.deletedAt);
  const plannerMilestones = milestonesByDate[plannerDate] || [];
  const plannerDeadlines = projectDeadlinesByDate[plannerDate] || [];

  // Split into commitments (timed/meetings) vs tasks (actions)
  const dayCommitments = plannerTasks
    .filter(t => Boolean(t.time) || t.itemType === 'meeting' || t.itemType === 'call' || t.itemType === 'appointment')
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const dayActionTasks = plannerTasks.filter(
    t => !Boolean(t.time) && t.itemType !== 'meeting' && t.itemType !== 'call' && t.itemType !== 'appointment'
  );

  const formatPlannerDateTitle = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-7xl'}`}>
      {/* Top Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Calendário & Planejamento
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              Totalmente Vinculado aos Projetos
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Planeje seu próximo dia, alinhe reuniões e acompanhe prazos de entregas e tarefas de projetos em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Add Event / Commitment Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal(plannerDate, 'commitment')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
          >
            <Plus size={15} />
            <span>Novo Evento / Compromisso</span>
          </button>

          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={e => setSelectedProjectFilter(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-zinc-300"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.icon || '📁'} {p.name}
              </option>
            ))}
          </select>

          {/* Month Navigator */}
          <div className="flex items-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={prevMonth}
              title="Mês Anterior"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-500"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={nextMonth}
              title="Próximo Mês"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2 Distinct Views Switcher (Projetos vs Compromissos vs Todos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-2 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCalendarMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              calendarMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CalendarDays size={14} />
            <span>Visão Integrada (Todos)</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarMode('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              calendarMode === 'projects'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
            }`}
          >
            <Briefcase size={14} />
            <span>1. Visualização de Projetos & Entregas</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarMode('commitments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              calendarMode === 'commitments'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30'
            }`}
          >
            <Clock size={14} />
            <span>2. Visualização de Compromissos & Reuniões</span>
          </button>
        </div>

        {/* Current Month & Year Display */}
        <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 px-2">
          <CalendarIcon size={14} className="text-indigo-600" />
          <span>{monthNames[month]} de {year}</span>
        </div>
      </div>

      {/* Main Two-Column Layout: Calendar Grid (Col 1 & 2) + Day & Next-Day Planner (Col 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Calendar Month Matrix (2 cols on lg) */}
        <div className="lg:col-span-2 border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 text-center py-2 text-xs font-semibold text-slate-500">
            {weekDays.map((d, idx) => (
              <div key={idx}>{d}</div>
            ))}
          </div>

          {/* Days matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-zinc-800/80">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayIndex + idx + 1;
              return (
                <div
                  key={'prev_' + idx}
                  className="min-h-[115px] p-1.5 bg-slate-50/30 dark:bg-zinc-950/20 text-slate-300 dark:text-zinc-700 text-xs select-none"
                >
                  <span>{dayNum}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const monthStr = String(month + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const fullDateStr = `${year}-${monthStr}-${dayStr}`;
              const isToday = fullDateStr === todayStr;
              const isSelectedPlannerDate = fullDateStr === plannerDate;
              const isTomorrow = fullDateStr === tomorrowStr;

              const dayTasks = tasksByDate[fullDateStr] || [];
              const dayMilestones = milestonesByDate[fullDateStr] || [];
              const dayDeadlines = projectDeadlinesByDate[fullDateStr] || [];

              const totalItemsCount = dayTasks.length + dayMilestones.length + dayDeadlines.length;

              return (
                <div
                  key={'curr_' + day}
                  onClick={() => setPlannerDate(fullDateStr)}
                  className={`min-h-[115px] p-1.5 transition-all group cursor-pointer relative flex flex-col justify-between ${
                    isSelectedPlannerDate
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500 ring-inset'
                      : isToday
                      ? 'bg-amber-50/30 dark:bg-amber-950/10'
                      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div>
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-amber-500 text-white'
                              : isSelectedPlannerDate
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {day}
                        </span>
                        {isTomorrow && (
                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded">
                            Amanhã
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {totalItemsCount > 0 && (
                          <span className="text-[9px] font-semibold text-slate-400 px-1">
                            {totalItemsCount}
                          </span>
                        )}
                        {/* Quick Add Button on this day */}
                        <button
                          type="button"
                          title="Adicionar evento nesta data"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddModal(fullDateStr, 'commitment');
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-800 transition-opacity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Chips Section */}
                    <div className="space-y-1">
                      {/* 1. Project Deadlines (Prazos Finais de Projetos) */}
                      {dayDeadlines.map(deadline => (
                        <div
                          key={deadline.id}
                          title={`Clique para ver detalhes do projeto: ${deadline.projectName}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedItem({ type: 'project_deadline', data: deadline });
                          }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1 truncate font-semibold hover:brightness-95 transition-all shadow-2xs"
                        >
                          <Target size={10} className="text-indigo-600 shrink-0" />
                          <span className="truncate">{deadline.title}</span>
                        </div>
                      ))}

                      {/* 2. Project Milestones (Marcos & Entregáveis) */}
                      {dayMilestones.map(m => (
                        <div
                          key={m.id}
                          title={`Marco: ${m.title} (Projeto: ${m.projectName}) - Clique para ver detalhes`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedItem({ type: 'milestone', data: m });
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 truncate font-medium border hover:brightness-95 transition-all shadow-2xs ${
                            m.completed
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 line-through'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80'
                          }`}
                        >
                          <Flag size={9} className={m.completed ? 'text-emerald-500 shrink-0' : 'text-rose-500 shrink-0'} />
                          <span className="truncate font-semibold">{m.title}</span>
                          <span className="text-[8px] text-slate-400 opacity-80 shrink-0">({m.projectName})</span>
                        </div>
                      ))}

                      {/* 3. Tasks & Scheduled Commitments */}
                      {dayTasks.slice(0, 3).map(task => {
                        const isDone = task.status === 'done';
                        const isCommitment = Boolean(task.time) || task.itemType === 'meeting' || task.itemType === 'call';
                        const linkedProject = projects.find(p => p.id === task.projectId);

                        return (
                          <div
                            key={task.id}
                            title={`${task.title}${linkedProject ? ` (Projeto: ${linkedProject.name})` : ''} - Clique para ver detalhes completos`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedItem({ type: 'task', data: task });
                            }}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 transition-all hover:brightness-95 shadow-2xs ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 line-through'
                                : isCommitment
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-medium'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                            }`}
                          >
                            {task.time ? (
                              <span className="font-bold text-[9px] bg-purple-200/70 dark:bg-purple-900/70 px-0.5 rounded shrink-0">
                                {task.time}
                              </span>
                            ) : isCommitment ? (
                              <Clock size={10} className="text-purple-600 shrink-0" />
                            ) : linkedProject ? (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: linkedProject.color || '#6366f1' }}
                                title={`Projeto: ${linkedProject.name}`}
                              />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{task.title}</span>
                          </div>
                        );
                      })}

                      {dayTasks.length > 3 && (
                        <div className="text-[9px] text-slate-400 font-semibold pl-1">
                          +{dayTasks.length - 3} mais tarefas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Planejador do Próximo Dia / Hoje (Clear Daily Planning Panel) */}
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun size={17} className="text-amber-500" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Planejador Diário
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {plannerDate === tomorrowStr ? 'Próximo Dia' : plannerDate === todayStr ? 'Hoje' : 'Data Focada'}
              </span>
            </div>

            {/* Quick Switcher for Today vs Tomorrow */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setPlannerDate(todayStr)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                  plannerDate === todayStr
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                }`}
              >
                <Sun size={13} />
                <span>Hoje</span>
              </button>

              <button
                type="button"
                onClick={() => setPlannerDate(tomorrowStr)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                  plannerDate === tomorrowStr
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                }`}
              >
                <Sunrise size={13} />
                <span>Próximo Dia (Amanhã)</span>
              </button>
            </div>

            {/* Formatted Date Title & Date Input */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 capitalize">
                {formatPlannerDateTitle(plannerDate)}
              </p>
              <input
                type="date"
                value={plannerDate}
                onChange={e => setPlannerDate(e.target.value)}
                className="text-[11px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-zinc-300"
              />
            </div>
          </div>

          {/* Quick Schedule Form for this specific date */}
          <form onSubmit={handleAddPlannerItem} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={plannerQuickTitle}
                onChange={e => setPlannerQuickTitle(e.target.value)}
                placeholder={
                  plannerQuickType === 'meeting'
                    ? 'Reunião, Call ou Compromisso...'
                    : 'Tarefa vinculada a projeto ou avulsa...'
                }
                className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-zinc-200 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!plannerQuickTitle.trim() || isAddingPlannerItem}
                className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
              >
                {isAddingPlannerItem ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Type Switcher */}
              <div className="flex items-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setPlannerQuickType('task')}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-medium ${
                    plannerQuickType === 'task'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setPlannerQuickType('meeting')}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-medium ${
                    plannerQuickType === 'meeting'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Compromisso
                </button>
              </div>

              {/* Time Picker */}
              <div className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                <input
                  type="time"
                  value={plannerQuickTime}
                  onChange={e => setPlannerQuickTime(e.target.value)}
                  placeholder="Horário"
                  className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-zinc-300"
                />
              </div>

              {/* Project Select (Fully links to projects) */}
              <select
                value={plannerQuickProjectId}
                onChange={e => setPlannerQuickProjectId(e.target.value)}
                className="text-[11px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-zinc-300 max-w-[130px] truncate"
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Section 1: Compromissos & Reuniões (Meetings & Commitments) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Clock size={13} />
                <span>Reuniões & Compromissos ({dayCommitments.length})</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              {dayCommitments.map(item => {
                const isDone = item.status === 'done';
                const linkedProject = projects.find(p => p.id === item.projectId);

                return (
                  <div
                    key={item.id}
                    onClick={() => setInspectedItem({ type: 'task', data: item })}
                    className="p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between gap-2 group cursor-pointer hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(item);
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-purple-300 dark:border-purple-700 hover:border-purple-500'
                        }`}
                      >
                        {isDone && <CheckCircle2 size={12} className="stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.time && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200/70 dark:bg-purple-900/70 text-purple-900 dark:text-purple-200">
                              {item.time}
                            </span>
                          )}
                          <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-zinc-100'}`}>
                            {item.title}
                          </span>
                        </div>
                        {linkedProject && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5 font-medium">
                            <Briefcase size={10} />
                            Projeto: {linkedProject.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Ver detalhes"
                        className="p-1 text-slate-400 hover:text-purple-600 rounded"
                      >
                        <Info size={13} />
                      </button>
                      <button
                        type="button"
                        title="Excluir compromisso"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {dayCommitments.length === 0 && (
                <div className="py-3 px-3 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-zinc-800/20 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                  Nenhuma reunião ou compromisso agendado para este dia.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Tarefas a Serem Concluídas (Actions & Tasks of Projects) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <CheckSquare size={13} />
                <span>Tarefas a Concluir ({dayActionTasks.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                {dayActionTasks.filter(t => t.status === 'done').length}/{dayActionTasks.length} concluídas
              </span>
            </div>

            <div className="space-y-1.5">
              {dayActionTasks.map(task => {
                const isDone = task.status === 'done';
                const linkedProject = projects.find(p => p.id === task.projectId);

                return (
                  <div
                    key={task.id}
                    onClick={() => setInspectedItem({ type: 'task', data: task })}
                    className="p-2 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/30 flex items-center justify-between gap-2 group hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(task);
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-zinc-600 hover:border-indigo-500'
                        }`}
                      >
                        {isDone && <CheckCircle2 size={12} className="stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className={`text-xs block truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-200 font-medium'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {linkedProject && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJumpToProject(linkedProject.id);
                              }}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate hover:underline flex items-center gap-0.5"
                            >
                              📁 {linkedProject.name}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 rounded font-semibold uppercase ${
                            task.status === 'done'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {task.status === 'done' ? 'Concluída' : task.status === 'in_progress' ? 'Em andamento' : 'A fazer'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Ver mais informações"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      >
                        <Info size={13} />
                      </button>

                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
                        className="text-[10px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-zinc-300"
                      >
                        <option value="todo">A Fazer</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="done">Concluída</option>
                      </select>

                      <button
                        type="button"
                        title="Excluir tarefa"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {dayActionTasks.length === 0 && (
                <div className="py-3 px-3 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-zinc-800/20 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                  Nenhuma tarefa agendada para ser concluída neste dia.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Marcos & Prazos Finais de Projetos no Dia */}
          {(plannerMilestones.length > 0 || plannerDeadlines.length > 0) && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Flag size={13} />
                <span>Prazos & Marcos de Projetos ({plannerMilestones.length + plannerDeadlines.length})</span>
              </h3>
              <div className="space-y-1">
                {/* Deadlines */}
                {plannerDeadlines.map(d => (
                  <div
                    key={d.id}
                    onClick={() => setInspectedItem({ type: 'project_deadline', data: d })}
                    className="p-2 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                        <Target size={12} className="text-indigo-600" />
                        {d.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Projeto: {d.projectName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToProject(d.projectId);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-indigo-200"
                    >
                      <span>Abrir Projeto</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                ))}

                {/* Milestones */}
                {plannerMilestones.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setInspectedItem({ type: 'milestone', data: m })}
                    className="p-2 rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                        {m.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Projeto: {m.projectName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${m.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {m.completed ? 'Entregue' : 'Marco'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToProject(m.projectId);
                        }}
                        className="text-[10px] text-rose-700 hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED INSPECTION MODAL (Visualizar Mais Informações sobre as Tarefas do Calendário) */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header with Type & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {inspectedItem.type === 'task' ? (
                  inspectedItem.data.time || inspectedItem.data.itemType === 'meeting' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Clock size={12} />
                      Compromisso / Reunião
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <CheckSquare size={12} />
                      Tarefa Vinculada
                    </span>
                  )
                ) : inspectedItem.type === 'milestone' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <Flag size={12} />
                    Marco de Projeto
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Target size={12} />
                    Prazo Final de Projeto
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                {inspectedItem.type === 'task'
                  ? inspectedItem.data.title
                  : inspectedItem.type === 'milestone'
                  ? inspectedItem.data.title
                  : inspectedItem.data.title}
              </h2>
            </div>

            {/* Project Linkage Card */}
            {(() => {
              const projectId =
                inspectedItem.type === 'task'
                  ? inspectedItem.data.projectId
                  : inspectedItem.type === 'milestone'
                  ? inspectedItem.data.projectId
                  : inspectedItem.data.projectId;

              const project = projects.find(p => p.id === projectId);

              if (project) {
                return (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{project.icon || '📁'}</span>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 block">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Status: {project.status === 'in_progress' ? 'Em Andamento' : project.status === 'completed' ? 'Concluído' : 'Planejado'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInspectedItem(null);
                        handleJumpToProject(project.id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 shadow-2xs"
                    >
                      <span>Abrir Projeto</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                );
              }

              return (
                <div className="text-xs text-slate-400 italic">
                  Compromisso avulso (não vinculado a nenhum projeto).
                </div>
              );
            })()}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {inspectedItem.type === 'task' && (
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <div className="pt-0.5">
                    <select
                      value={inspectedItem.data.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as TaskStatus;
                        await updateTask(inspectedItem.data.id, { status: newStatus });
                        setInspectedItem({
                          type: 'task',
                          data: { ...inspectedItem.data, status: newStatus }
                        });
                      }}
                      className="text-xs font-semibold rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-slate-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <option value="todo">A Fazer</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="done">Concluída</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Data & Prazo</span>
                <p className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 pt-1">
                  <CalendarIcon size={13} className="text-slate-400" />
                  <span>
                    {inspectedItem.type === 'task'
                      ? inspectedItem.data.dueDate || 'Sem data'
                      : inspectedItem.type === 'milestone'
                      ? inspectedItem.data.dueDate
                      : inspectedItem.data.type === 'target_date'
                      ? 'Prazo Final'
                      : 'Data de Início'}
                  </span>
                </p>
              </div>

              {inspectedItem.type === 'task' && inspectedItem.data.time && (
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Horário Agendado</span>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 pt-1">
                    <Clock size={13} className="text-purple-500" />
                    <span>{inspectedItem.data.time}</span>
                  </p>
                </div>
              )}

              {inspectedItem.type === 'task' && (
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prioridade</span>
                  <p className="font-semibold capitalize text-slate-800 dark:text-zinc-200 pt-1">
                    {inspectedItem.data.priority === 'urgent'
                      ? 'Urgente'
                      : inspectedItem.data.priority === 'high'
                      ? 'Alta'
                      : inspectedItem.data.priority === 'medium'
                      ? 'Média'
                      : 'Baixa'}
                  </p>
                </div>
              )}
            </div>

            {/* Description / Notes */}
            {inspectedItem.type === 'task' && inspectedItem.data.description && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <AlignLeft size={12} />
                  <span>Descrição / Pauta</span>
                </span>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/60 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {inspectedItem.data.description}
                </div>
              </div>
            )}

            {/* Subtasks if any */}
            {inspectedItem.type === 'task' && inspectedItem.data.subtasks && inspectedItem.data.subtasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Subtarefas ({inspectedItem.data.subtasks.filter(s => s.completed).length}/{inspectedItem.data.subtasks.length})
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {inspectedItem.data.subtasks.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-zinc-800/40 text-xs text-slate-700 dark:text-zinc-300"
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          const nextSubs = (inspectedItem.data.subtasks || []).map(s =>
                            s.id === sub.id ? { ...s, completed: !s.completed } : s
                          );
                          await updateTask(inspectedItem.data.id, { subtasks: nextSubs });
                          setInspectedItem({
                            type: 'task',
                            data: { ...inspectedItem.data, subtasks: nextSubs }
                          });
                        }}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          sub.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-zinc-600'
                        }`}
                      >
                        {sub.completed && <Check size={10} />}
                      </button>
                      <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
              {inspectedItem.type === 'task' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await deleteTask(inspectedItem.data.id);
                    setInspectedItem(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Excluir</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {inspectedItem.type === 'task' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleTaskComplete(inspectedItem.data);
                      setInspectedItem({
                        type: 'task',
                        data: {
                          ...inspectedItem.data,
                          status: inspectedItem.data.status === 'done' ? 'todo' : 'done'
                        }
                      });
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      inspectedItem.data.status === 'done'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                    }`}
                  >
                    {inspectedItem.data.status === 'done' ? 'Reabrir Tarefa' : 'Marcar como Concluída'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR NEW EVENT / COMMITMENT OR PROJECT TASK */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  Agendar no Calendário
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Category selector: Compromisso vs Tarefa de Projeto */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalCategory('commitment')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    modalCategory === 'commitment'
                      ? 'bg-white dark:bg-zinc-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <Clock size={14} />
                  <span>Compromisso / Reunião</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalCategory('project_task')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    modalCategory === 'project_task'
                      ? 'bg-white dark:bg-zinc-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Tarefa / Entrega</span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {modalCategory === 'commitment' ? 'Título do Compromisso ou Reunião *' : 'Título da Tarefa ou Entrega *'}
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  placeholder={
                    modalCategory === 'commitment'
                      ? 'Ex: Reunião de Alinhamento com Cliente, Call de Vendas...'
                      : 'Ex: Concluir protótipo de alta fidelidade...'
                  }
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <CalendarIcon size={12} />
                    <span>Data *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={e => setModalDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Clock size={12} />
                    <span>Horário</span>
                  </label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={e => setModalTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Project & Priority Row (Full linkage to Projects) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Vincular a Projeto
                  </label>
                  <select
                    value={modalProjectId}
                    onChange={e => setModalProjectId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200"
                  >
                    <option value="">Nenhum (Geral / Avulso)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.icon || '📁'} {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Prioridade
                  </label>
                  <select
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Notes / Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Notas / Pauta
                </label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={e => setModalDescription(e.target.value)}
                  placeholder="Detalhes adicionais, link da videochamada ou pauta..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-200 placeholder-slate-400 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!modalTitle.trim() || isSubmittingModal}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {isSubmittingModal && <Loader2 size={13} className="animate-spin" />}
                  <span>Salvar no Calendário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
