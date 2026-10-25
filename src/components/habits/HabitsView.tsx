import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  Pause,
  Play,
  Trash2,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Habit } from '../../types';

export const HabitsView: React.FC = () => {
  const {
    habits,
    habitEntries,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitToday,
    isFullWidth
  } = useWorkspace();

  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('⚡');
  const [newColor, setNewColor] = useState('#3b82f6');

  // Compute the last 7 days (Monday to Sunday or past 7 days)
  const pastDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
    return {
      dateStr,
      dayLabel: dayLabel.replace('.', ''),
      dayNum: d.getDate(),
      isToday: i === 6,
    };
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createHabit({
        title: newTitle.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        color: newColor,
        frequency: 'daily',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
      });

      setNewTitle('');
      setNewDescription('');
      setNewIcon('⚡');
      setIsNewHabitModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar hábito:', err);
      setIsNewHabitModalOpen(false);
    }
  };

  const handleTogglePause = async (habit: Habit) => {
    await updateHabit(habit.id, { paused: !habit.paused });
  };

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-5xl'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Rotinas & Hábitos
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Acompanhe a sua consistência diária e construa sequências sólidas de execução.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewHabitModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
        >
          <Plus size={14} />
          <span>Novo Hábito</span>
        </button>
      </div>

      {/* Habits Consistency Matrix */}
      <div className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        {/* Table Header with 7 Days */}
        <div className="grid grid-cols-12 p-4 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 bg-slate-50/60 dark:bg-zinc-800/40 items-center">
          <div className="col-span-5">Hábito</div>
          <div className="col-span-2 text-center">Sequência</div>
          <div className="col-span-5 grid grid-cols-7 text-center">
            {pastDays.map(d => (
              <div key={d.dateStr} className={`flex flex-col items-center ${d.isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                <span className="text-[10px] uppercase">{d.dayLabel}</span>
                <span className="text-xs">{d.dayNum}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Habits Rows */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {habits.map(habit => {
            return (
              <div
                key={habit.id}
                className="grid grid-cols-12 p-3.5 items-center hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {/* Habit Info (Col 5) */}
                <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-xl shrink-0 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                    {habit.icon || '⚡'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-medium block truncate ${habit.paused ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-zinc-100'}`}>
                      {habit.title}
                    </span>
                    {habit.description && (
                      <span className="text-[10px] text-slate-400 truncate block">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Streak (Col 2) */}
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <Flame size={15} className="text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {habit.streak || 0} dias
                  </span>
                </div>

                {/* Past 7 days check circles (Col 5) */}
                <div className="col-span-5 grid grid-cols-7 items-center justify-items-center">
                  {pastDays.map(d => {
                    const isCompleted = habitEntries.some(
                      e => e.habitId === habit.id && e.date === d.dateStr && e.completed
                    );

                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => d.isToday && toggleHabitToday(habit.id)}
                        disabled={!d.isToday}
                        title={d.isToday ? 'Clique para marcar como concluído hoje' : `${d.dateStr}: ${isCompleted ? 'Concluído' : 'Não registrado'}`}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : d.isToday
                            ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-transparent'
                            : 'bg-slate-100 dark:bg-zinc-800 text-transparent'
                        }`}
                      >
                        {isCompleted && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {habits.length === 0 && (
            <div className="py-16 text-center text-xs text-slate-400">
              Nenhum hábito cadastrado ainda. Clique em "Novo Hábito" para começar!
            </div>
          )}
        </div>
      </div>

      {/* New Habit Modal */}
      {isNewHabitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Criar Novo Hábito
              </h3>
              <button
                type="button"
                onClick={() => setIsNewHabitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div className="flex items-center gap-2">
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
                    Título do Hábito *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Beber 2L de água, Meditação"
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Descrição ou gatilho
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Ex: Todo dia após o café da manhã..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewHabitModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                >
                  Salvar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
