import React, { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Trash2,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Goal, GoalStatus } from '../../types';

export const GoalsView: React.FC = () => {
  const { goals, createGoal, updateGoal, deleteGoal, isFullWidth } = useWorkspace();

  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newTargetValue, setNewTargetValue] = useState<number>(100);
  const [newCurrentValue, setNewCurrentValue] = useState<number>(0);
  const [newMetric, setNewMetric] = useState('%');
  const [newStartDate, setNewStartDate] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createGoal({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        targetValue: Number(newTargetValue) || 100,
        currentValue: Number(newCurrentValue) || 0,
        metric: newMetric,
        startDate: newStartDate,
        targetDate: newTargetDate,
      });

      setNewTitle('');
      setNewDescription('');
      setNewTargetValue(100);
      setNewCurrentValue(0);
      setNewMetric('%');
      setIsNewGoalModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      setIsNewGoalModalOpen(false);
    }
  };

  const handleIncrement = async (goal: Goal, amount: number) => {
    const nextVal = Math.max(0, goal.currentValue + amount);
    const nextStatus: GoalStatus = nextVal >= goal.targetValue ? 'achieved' : 'in_progress';
    await updateGoal(goal.id, {
      currentValue: nextVal,
      status: nextStatus
    });
  };

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'achieved':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">Alcançada 🎉</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">Em Andamento</span>;
      case 'paused':
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">Pausada</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">Não Iniciada</span>;
    }
  };

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-6xl'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Metas & Objetivos (OKRs)
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Defina marcos estratégicos e acompanhe seu avanço numérico em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewGoalModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
        >
          <Plus size={14} />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const percentage = Math.min(100, Math.round((goal.currentValue / (goal.targetValue || 1)) * 100));

          return (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    {goal.category}
                  </span>
                  {getStatusBadge(goal.status)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar & Value Stepper */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs">
                    <span className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                      {goal.currentValue}
                    </span>
                    <span className="text-slate-400 ml-1">
                      / {goal.targetValue} {goal.metric}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {percentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-indigo-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Quick Increment Steppers */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleIncrement(goal, -5)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 text-slate-700 dark:text-zinc-300"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncrement(goal, -1)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 text-slate-700 dark:text-zinc-300"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncrement(goal, 1)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-medium"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncrement(goal, 5)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-zinc-800 rounded hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-medium"
                    >
                      +5
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Nenhuma meta cadastrada ainda. Clique em "Nova Meta" para começar!
          </div>
        )}
      </div>

      {/* New Goal Modal */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Criar Nova Meta
              </h3>
              <button
                type="button"
                onClick={() => setIsNewGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Ler 12 livros este ano"
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Saúde, Carreira, Finanças..."
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Valor Inicial
                  </label>
                  <input
                    type="number"
                    value={newCurrentValue}
                    onChange={e => setNewCurrentValue(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Valor Alvo
                  </label>
                  <input
                    type="number"
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Métrica
                  </label>
                  <input
                    type="text"
                    value={newMetric}
                    onChange={e => setNewMetric(e.target.value)}
                    placeholder="%, R$, un"
                    className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
