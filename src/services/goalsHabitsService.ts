import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Goal, GoalStatus, Habit, HabitEntry } from '../types';

function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const goalsHabitsService = {
  // GOALS
  async getWorkspaceGoals(workspaceId: string): Promise<Goal[]> {
    const path = 'goals';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const goals: Goal[] = [];
      snapshot.forEach(docSnap => {
        goals.push({ id: docSnap.id, ...(docSnap.data() as Omit<Goal, 'id'>) });
      });
      return goals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Erro ao carregar metas:', err);
      return [];
    }
  },

  async createGoal(data: {
    workspaceId: string;
    title: string;
    description?: string;
    category?: string;
    targetValue: number;
    currentValue?: number;
    metric?: string;
    startDate?: string;
    targetDate?: string;
    userId: string;
  }): Promise<Goal> {
    const path = 'goals';
    const goalRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newGoal: Goal = cleanUndefined({
      id: goalRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      title: data.title || 'Nova Meta',
      description: data.description || '',
      category: data.category || 'Geral',
      targetValue: data.targetValue || 100,
      currentValue: data.currentValue || 0,
      metric: data.metric || '%',
      status: (data.currentValue || 0) >= (data.targetValue || 100) ? 'achieved' : 'in_progress',
      startDate: data.startDate || '',
      targetDate: data.targetDate || '',
      relatedTaskIds: [],
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
    });

    try {
      await setDoc(goalRef, newGoal);
    } catch (err) {
      console.error('Erro ao salvar meta no Firestore:', err);
    }

    return newGoal;
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    const path = `goals/${goalId}`;
    try {
      await updateDoc(doc(db, 'goals', goalId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
    }
  },

  async deleteGoal(goalId: string): Promise<void> {
    const path = `goals/${goalId}`;
    try {
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
    }
  },

  // HABITS
  async getWorkspaceHabits(workspaceId: string): Promise<Habit[]> {
    const path = 'habits';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const habits: Habit[] = [];
      snapshot.forEach(docSnap => {
        habits.push({ id: docSnap.id, ...(docSnap.data() as Omit<Habit, 'id'>) });
      });
      return habits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Erro ao carregar hábitos:', err);
      return [];
    }
  },

  async createHabit(data: {
    workspaceId: string;
    title: string;
    description?: string;
    frequency?: 'daily' | 'weekly';
    targetDays?: number[];
    icon?: string;
    color?: string;
    userId: string;
  }): Promise<Habit> {
    const path = 'habits';
    const habitRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newHabit: Habit = cleanUndefined({
      id: habitRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      title: data.title || 'Novo Hábito',
      description: data.description || '',
      frequency: data.frequency || 'daily',
      targetDays: data.targetDays || [0, 1, 2, 3, 4, 5, 6],
      icon: data.icon || '⚡',
      color: data.color || '#3b82f6',
      streak: 0,
      paused: false,
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
    });

    try {
      await setDoc(habitRef, newHabit);
    } catch (err) {
      console.error('Erro ao salvar hábito no Firestore:', err);
    }

    return newHabit;
  },

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    const path = `habits/${habitId}`;
    try {
      await updateDoc(doc(db, 'habits', habitId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar hábito:', err);
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    const path = `habits/${habitId}`;
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (err) {
      console.error('Erro ao excluir hábito:', err);
    }
  },

  // HABIT ENTRIES
  async getHabitEntries(workspaceId: string): Promise<HabitEntry[]> {
    const path = 'habitEntries';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const entries: HabitEntry[] = [];
      snapshot.forEach(docSnap => {
        entries.push({ id: docSnap.id, ...(docSnap.data() as Omit<HabitEntry, 'id'>) });
      });
      return entries;
    } catch (err) {
      console.warn('Erro ao carregar entradas de hábitos:', err);
      return [];
    }
  },

  async toggleHabitEntry(
    habitId: string,
    workspaceId: string,
    date: string,
    userId: string
  ): Promise<{ completed: boolean; streak: number }> {
    const path = 'habitEntries';
    const entryId = `${habitId}_${date}`;
    try {
      const entryRef = doc(db, 'habitEntries', entryId);
      const snap = await getDocs(query(collection(db, path), where('habitId', '==', habitId)));
      const habitEntriesList: HabitEntry[] = [];
      let currentCompleted = false;

      snap.forEach(d => {
        const item = d.data() as HabitEntry;
        if (d.id === entryId) {
          currentCompleted = item.completed;
        } else if (item.completed) {
          habitEntriesList.push(item);
        }
      });

      const nextCompleted = !currentCompleted;

      if (nextCompleted) {
        await setDoc(entryRef, {
          id: entryId,
          habitId,
          workspaceId: workspaceId || 'workspace_default_main',
          date,
          completed: true,
          completedAt: new Date().toISOString(),
          userId: userId || 'workspace_user_main',
        });
        habitEntriesList.push({
          id: entryId,
          habitId,
          workspaceId: workspaceId || 'workspace_default_main',
          date,
          completed: true,
          userId: userId || 'workspace_user_main'
        });
      } else {
        await deleteDoc(entryRef);
      }

      // Calculate streak from real continuous completed dates up to today
      const sortedDates = habitEntriesList
        .map(e => e.date)
        .sort()
        .reverse();

      let streak = 0;
      let checkDate = new Date();
      let currentDateStr = checkDate.toISOString().split('T')[0];

      if (sortedDates.includes(currentDateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        while (sortedDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        while (sortedDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      await updateDoc(doc(db, 'habits', habitId), {
        streak,
        updatedAt: new Date().toISOString(),
      });

      return { completed: nextCompleted, streak };
    } catch (err) {
      console.error('Erro ao alternar hábito:', err);
      return { completed: true, streak: 1 };
    }
  }
};
