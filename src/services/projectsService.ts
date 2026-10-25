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
import { Project, ProjectStatus, TaskPriority, Milestone } from '../types';

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

export const projectsService = {
  async getWorkspaceProjects(workspaceId: string, includeArchived = false): Promise<Project[]> {
    const path = 'projects';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const projects: Project[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Project, 'id'>;
        if (!includeArchived && data.deletedAt) {
          return;
        }
        projects.push({ id: docSnap.id, ...data });
      });

      return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Erro ao listar projetos:', err);
      return [];
    }
  },

  async createProject(data: {
    workspaceId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    status?: ProjectStatus;
    priority?: TaskPriority;
    startDate?: string;
    targetDate?: string;
    ownerId: string;
    tags?: string[];
    milestones?: Milestone[];
  }): Promise<Project> {
    const path = 'projects';
    const projectRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newProject: Project = cleanUndefined({
      id: projectRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      name: data.name || 'Novo projeto',
      description: data.description || '',
      icon: data.icon || '📁',
      color: data.color || '#6366f1',
      status: data.status || 'in_progress',
      priority: data.priority || 'medium',
      startDate: data.startDate || '',
      targetDate: data.targetDate || '',
      ownerId: data.ownerId || 'workspace_user_main',
      tags: data.tags || [],
      milestones: data.milestones || [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    try {
      await setDoc(projectRef, newProject);
    } catch (err) {
      console.error('Erro ao salvar projeto no Firestore:', err);
    }

    return newProject;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, 'projects', projectId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar projeto:', err);
    }
  },

  async softDeleteProject(projectId: string): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao mover projeto para lixeira:', err);
    }
  },

  async restoreProject(projectId: string): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        deletedAt: null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao restaurar projeto:', err);
    }
  },

  async permanentlyDeleteProject(projectId: string): Promise<void> {
    const path = `projects/${projectId}`;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      console.error('Erro ao excluir projeto:', err);
    }
  }
};
