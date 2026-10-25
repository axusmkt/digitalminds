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
import { PageDocument, PageBlock } from '../types';

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

export const pagesService = {
  async getWorkspacePages(workspaceId: string, includeArchived = false): Promise<PageDocument[]> {
    const path = 'pages';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const pages: PageDocument[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<PageDocument, 'id'>;
        if (!includeArchived && data.deletedAt) {
          return;
        }
        pages.push({ id: docSnap.id, ...data });
      });

      return pages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (err) {
      console.warn('Erro ao listar páginas:', err);
      return [];
    }
  },

  async createPage(data: {
    workspaceId: string;
    parentId?: string | null;
    title: string;
    icon?: string;
    coverImage?: string;
    userId: string;
    initialBlocks?: PageBlock[];
  }): Promise<PageDocument> {
    const path = 'pages';
    const pageRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const defaultBlocks: PageBlock[] = data.initialBlocks || [
      {
        id: 'b_' + Math.random().toString(36).substring(2, 9),
        type: 'paragraph',
        content: { text: '' },
        order: 0,
      }
    ];

    const newPage: PageDocument = cleanUndefined({
      id: pageRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      parentId: data.parentId || null,
      title: data.title || 'Sem título',
      icon: data.icon || '📄',
      coverImage: data.coverImage || '',
      isFavorite: false,
      isArchived: false,
      isShared: false,
      blocks: defaultBlocks,
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    try {
      await setDoc(pageRef, newPage);
    } catch (err) {
      console.error('Erro ao salvar página no Firestore:', err);
    }

    return newPage;
  },

  async updatePage(pageId: string, updates: Partial<PageDocument>): Promise<void> {
    const path = `pages/${pageId}`;
    try {
      await updateDoc(doc(db, 'pages', pageId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar página:', err);
    }
  },

  async softDeletePage(pageId: string, userId: string): Promise<void> {
    const path = `pages/${pageId}`;
    try {
      await updateDoc(doc(db, 'pages', pageId), {
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao mover página para lixeira:', err);
    }
  },

  async restorePage(pageId: string): Promise<void> {
    const path = `pages/${pageId}`;
    try {
      await updateDoc(doc(db, 'pages', pageId), {
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao restaurar página:', err);
    }
  },

  async permanentlyDeletePage(pageId: string): Promise<void> {
    const path = `pages/${pageId}`;
    try {
      await deleteDoc(doc(db, 'pages', pageId));
    } catch (err) {
      console.error('Erro ao excluir página permanentemente:', err);
    }
  }
};
