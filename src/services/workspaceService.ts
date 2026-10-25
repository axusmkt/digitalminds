import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Workspace, WorkspaceMember, UserRole } from '../types';

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

export const workspaceService = {
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const path = 'workspaces';
    try {
      // Query where user is owner or member
      const q = query(
        collection(db, path),
        where('members', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      const workspaces: Workspace[] = [];
      snapshot.forEach(docSnap => {
        workspaces.push({ id: docSnap.id, ...(docSnap.data() as Omit<Workspace, 'id'>) });
      });

      // Also fetch where user is owner
      const qOwner = query(
        collection(db, path),
        where('ownerId', '==', userId)
      );
      const ownerSnap = await getDocs(qOwner);
      ownerSnap.forEach(docSnap => {
        if (!workspaces.some(w => w.id === docSnap.id)) {
          workspaces.push({ id: docSnap.id, ...(docSnap.data() as Omit<Workspace, 'id'>) });
        }
      });

      return workspaces;
    } catch (err) {
      console.warn('Erro ao listar workspaces no Firestore:', err);
      return [];
    }
  },

  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const path = `workspaces/${workspaceId}`;
    try {
      const snap = await getDoc(doc(db, 'workspaces', workspaceId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<Workspace, 'id'>) };
    } catch (err) {
      console.warn('Erro ao buscar workspace:', err);
      return null;
    }
  },

  async createWorkspace(data: {
    id?: string;
    name: string;
    icon: string;
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    ownerPhoto?: string;
  }): Promise<Workspace> {
    const path = 'workspaces';
    try {
      const workspaceRef = data.id ? doc(db, path, data.id) : doc(collection(db, path));
      const now = new Date().toISOString();
      const initialMember: WorkspaceMember = {
        userId: data.ownerId,
        email: data.ownerEmail,
        displayName: data.ownerName,
        photoURL: data.ownerPhoto || '',
        role: 'owner',
        joinedAt: now,
      };

      const newWorkspace: Workspace = cleanUndefined({
        id: workspaceRef.id,
        name: data.name,
        icon: data.icon || '🚀',
        ownerId: data.ownerId,
        members: [data.ownerId],
        memberDetails: {
          [data.ownerId]: initialMember,
        },
        createdAt: now,
        updatedAt: now,
      });

      try {
        await setDoc(workspaceRef, newWorkspace);
      } catch (err) {
        console.warn('Aviso ao salvar workspace no Firestore:', err);
      }
      return newWorkspace;
    } catch (err) {
      console.warn('Erro inesperado em createWorkspace:', err);
      return {
        id: data.id || 'ws_' + Math.random().toString(36).substring(2, 9),
        name: data.name,
        icon: data.icon || '🚀',
        ownerId: data.ownerId,
        members: [data.ownerId],
        memberDetails: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },

  async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    const path = `workspaces/${workspaceId}`;
    try {
      await updateDoc(doc(db, 'workspaces', workspaceId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar workspace:', err);
    }
  },

  async inviteMember(
    workspaceId: string,
    email: string,
    role: UserRole,
    currentWorkspace: Workspace
  ): Promise<Workspace> {
    const path = `workspaces/${workspaceId}`;
    try {
      // Create guest/invited member identifier
      const pseudoId = 'user_' + Math.random().toString(36).substring(2, 9);
      const newMember: WorkspaceMember = {
        userId: pseudoId,
        email,
        displayName: email.split('@')[0],
        photoURL: '',
        role,
        joinedAt: new Date().toISOString(),
      };

      const updatedMembers = [...(currentWorkspace.members || []), pseudoId];
      const updatedDetails = {
        ...(currentWorkspace.memberDetails || {}),
        [pseudoId]: newMember,
      };

      await updateDoc(doc(db, 'workspaces', workspaceId), cleanUndefined({
        members: updatedMembers,
        memberDetails: updatedDetails,
        updatedAt: new Date().toISOString(),
      }));

      return {
        ...currentWorkspace,
        members: updatedMembers,
        memberDetails: updatedDetails,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      throw err;
    }
  }
};
