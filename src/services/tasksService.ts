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
import { Task, TaskPriority, TaskStatus, Subtask } from '../types';

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

export const tasksService = {
  async getWorkspaceTasks(workspaceId: string, includeArchived = false): Promise<Task[]> {
    const path = 'tasks';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const tasks: Task[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Task, 'id'>;
        if (!includeArchived && data.deletedAt) {
          return;
        }
        tasks.push({ id: docSnap.id, ...data });
      });

      return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Erro ao listar tarefas:', err);
      return [];
    }
  },

  async createTask(data: {
    workspaceId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    startDate?: string;
    time?: string;
    itemType?: Task['itemType'];
    projectId?: string;
    pageId?: string;
    tags?: string[];
    subtasks?: Subtask[];
    userId: string;
  }): Promise<Task> {
    const path = 'tasks';
    const taskRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newTask: Task = cleanUndefined({
      id: taskRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      title: data.title || 'Nova tarefa',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      startDate: data.startDate,
      time: data.time,
      itemType: data.itemType,
      projectId: data.projectId || '',
      pageId: data.pageId || '',
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    try {
      await setDoc(taskRef, newTask);
    } catch (err) {
      console.warn('Aviso ao persistir tarefa no Firestore:', err);
    }

    return newTask;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const path = `tasks/${taskId}`;
    const payload: Partial<Task> = cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    if (updates.status === 'done' && !updates.completedAt) {
      payload.completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'done') {
      payload.completedAt = '';
    }

    try {
      await updateDoc(doc(db, 'tasks', taskId), payload);
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  },

  async softDeleteTask(taskId: string): Promise<void> {
    const path = `tasks/${taskId}`;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao mover tarefa para lixeira:', err);
    }
  },

  async restoreTask(taskId: string): Promise<void> {
    const path = `tasks/${taskId}`;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        deletedAt: null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao restaurar tarefa:', err);
    }
  },

  async permanentlyDeleteTask(taskId: string): Promise<void> {
    const path = `tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    }
  }
};
