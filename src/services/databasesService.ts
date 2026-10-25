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
import { DatabaseSchema, DatabaseRecordItem, DatabaseProperty, DatabaseViewConfig } from '../types';

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

export const databasesService = {
  async getWorkspaceDatabases(workspaceId: string): Promise<DatabaseSchema[]> {
    const path = 'databases';
    try {
      const q = query(
        collection(db, path),
        where('workspaceId', '==', workspaceId)
      );
      const snapshot = await getDocs(q);
      const databases: DatabaseSchema[] = [];
      snapshot.forEach(docSnap => {
        databases.push({ id: docSnap.id, ...(docSnap.data() as Omit<DatabaseSchema, 'id'>) });
      });
      return databases;
    } catch (err) {
      console.warn('Erro ao carregar bases de dados:', err);
      return [];
    }
  },

  async createDatabase(data: {
    workspaceId: string;
    name: string;
    description?: string;
    icon?: string;
    properties?: DatabaseProperty[];
    views?: DatabaseViewConfig[];
  }): Promise<DatabaseSchema> {
    const path = 'databases';
    const dbRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const defaultProperties: DatabaseProperty[] = data.properties || [
      { id: 'prop_title', name: 'Nome', type: 'text' },
      {
        id: 'prop_status',
        name: 'Status',
        type: 'select',
        options: [
          { id: 'opt_1', label: 'Não iniciado', color: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300' },
          { id: 'opt_2', label: 'Em andamento', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
          { id: 'opt_3', label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
        ]
      },
      {
        id: 'prop_priority',
        name: 'Prioridade',
        type: 'select',
        options: [
          { id: 'pri_low', label: 'Baixa', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
          { id: 'pri_med', label: 'Média', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
          { id: 'pri_high', label: 'Alta', color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300' },
        ]
      },
      { id: 'prop_date', name: 'Data', type: 'date' }
    ];

    const defaultViews: DatabaseViewConfig[] = data.views || [
      { id: 'view_table', name: 'Tabela Principal', type: 'table' },
      { id: 'view_kanban', name: 'Quadro Status', type: 'kanban', groupByPropertyId: 'prop_status' }
    ];

    const newDb: DatabaseSchema = cleanUndefined({
      id: dbRef.id,
      workspaceId: data.workspaceId || 'workspace_default_main',
      name: data.name,
      description: data.description || '',
      icon: data.icon || '🗄️',
      properties: defaultProperties,
      views: defaultViews,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await setDoc(dbRef, newDb);
    } catch (err) {
      console.error('Erro ao salvar base no Firestore:', err);
    }

    return newDb;
  },

  async updateDatabase(databaseId: string, updates: Partial<DatabaseSchema>): Promise<void> {
    const path = `databases/${databaseId}`;
    try {
      await updateDoc(doc(db, 'databases', databaseId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar base de dados:', err);
    }
  },

  async deleteDatabase(databaseId: string): Promise<void> {
    const path = `databases/${databaseId}`;
    try {
      await deleteDoc(doc(db, 'databases', databaseId));
    } catch (err) {
      console.error('Erro ao excluir base de dados:', err);
    }
  },

  async getDatabaseRecords(databaseId: string): Promise<DatabaseRecordItem[]> {
    const path = 'databaseRecords';
    try {
      const q = query(
        collection(db, path),
        where('databaseId', '==', databaseId)
      );
      const snapshot = await getDocs(q);
      const records: DatabaseRecordItem[] = [];
      snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...(docSnap.data() as Omit<DatabaseRecordItem, 'id'>) });
      });
      return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Erro ao carregar registros:', err);
      return [];
    }
  },

  async createRecord(data: {
    databaseId: string;
    workspaceId: string;
    title: string;
    values: Record<string, any>;
    userId: string;
  }): Promise<DatabaseRecordItem> {
    const path = 'databaseRecords';
    const recRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const newRecord: DatabaseRecordItem = cleanUndefined({
      id: recRef.id,
      databaseId: data.databaseId,
      workspaceId: data.workspaceId || 'workspace_default_main',
      title: data.title || 'Sem título',
      values: data.values || {},
      createdBy: data.userId || 'workspace_user_main',
      createdAt: now,
      updatedAt: now,
    });

    try {
      await setDoc(recRef, newRecord);
    } catch (err) {
      console.error('Erro ao salvar registro no Firestore:', err);
    }

    return newRecord;
  },

  async updateRecord(recordId: string, updates: Partial<DatabaseRecordItem>): Promise<void> {
    const path = `databaseRecords/${recordId}`;
    try {
      await updateDoc(doc(db, 'databaseRecords', recordId), cleanUndefined({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Erro ao atualizar registro:', err);
    }
  },

  async deleteRecord(recordId: string): Promise<void> {
    const path = `databaseRecords/${recordId}`;
    try {
      await deleteDoc(doc(db, 'databaseRecords', recordId));
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  }
};
