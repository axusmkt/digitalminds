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
import { QuickNote } from '../types';
import { pagesService } from './pagesService';
import { tasksService } from './tasksService';

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

export const notesService = {
  async getWorkspaceNotes(workspaceId: string): Promise<QuickNote[]> {
    const path = 'notes';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const notes: QuickNote[] = [];
      snapshot.forEach(docSnap => {
        notes.push({ id: docSnap.id, ...(docSnap.data() as Omit<QuickNote, 'id'>) });
      });
      return notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (err) {
      console.warn('Erro ao carregar notas:', err);
      return [];
    }
  },

  async createNote(data: {
    workspaceId: string;
    title?: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
    userId: string;
  }): Promise<QuickNote> {
    const path = 'notes';
    const noteRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newNote: QuickNote = cleanUndefined({
      id: noteRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      title: data.title || (data.content.slice(0, 30) || 'Nota rápida'),
      content: data.content,
      tags: data.tags || [],
      isPinned: data.isPinned || false,
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
    });

    try {
      await setDoc(noteRef, newNote);
    } catch (err) {
      console.error('Erro ao salvar nota no Firestore:', err);
    }

    return newNote;
  },

  async updateNote(noteId: string, updates: Partial<QuickNote>): Promise<void> {
    const path = `notes/${noteId}`;
    try {
      await updateDoc(doc(db, 'notes', noteId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Erro ao atualizar nota:', err);
    }
  },

  async deleteNote(noteId: string): Promise<void> {
    const path = `notes/${noteId}`;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (err) {
      console.error('Erro ao excluir nota:', err);
    }
  },

  // Convert note to a full Page document preserving content
  async convertToPage(note: QuickNote, userId: string) {
    const newPage = await pagesService.createPage({
      workspaceId: note.workspaceId || 'workspace_default_main',
      title: note.title,
      userId,
      icon: '💡',
      initialBlocks: [
        {
          id: 'b_' + Math.random().toString(36).substring(2, 9),
          type: 'paragraph',
          content: { text: note.content },
          order: 0,
        }
      ]
    });
    await this.deleteNote(note.id);
    return newPage;
  },

  // Convert note to a Task preserving content
  async convertToTask(note: QuickNote, userId: string) {
    const newTask = await tasksService.createTask({
      workspaceId: note.workspaceId || 'workspace_default_main',
      title: note.title,
      description: note.content,
      tags: note.tags,
      userId,
    });
    await this.deleteNote(note.id);
    return newTask;
  }
};
