import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../services/firebase';
import {
  Workspace,
  PageDocument,
  Task,
  Project,
  DatabaseSchema,
  DatabaseRecordItem,
  Goal,
  Habit,
  HabitEntry,
  QuickNote,
  ActiveNavView,
  UserRole
} from '../types';
import { workspaceService } from '../services/workspaceService';
import { pagesService } from '../services/pagesService';
import { tasksService } from '../services/tasksService';
import { projectsService } from '../services/projectsService';
import { databasesService } from '../services/databasesService';
import { goalsHabitsService } from '../services/goalsHabitsService';
import { notesService } from '../services/notesService';

const SESSION_STORAGE_KEY = 'axus_vault_session_v1';
const LOCKOUT_STORAGE_KEY = 'axus_vault_lockout_v1';
const LOCK_TIMEOUT_KEY = 'axus_vault_timeout_mins';
const SESSION_SALT = 'AXUS_ZERO_TRUST_VAULT_2026_SALT';

async function computeSha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

interface StoredVaultSession {
  username: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

interface WorkspaceContextType {
  // Auth & Security Vault
  user: User | null;
  isAuthenticated: boolean;
  authUsername: string;
  authLoading: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  lockTimeoutMinutes: number;
  setLockTimeoutMinutes: (mins: number) => void;
  loginWithCredentials: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  lockSession: () => void;
  currentUserRole: UserRole;

  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string, icon: string) => Promise<Workspace>;
  updateWorkspace: (updates: Partial<Workspace>) => Promise<void>;
  inviteMember: (email: string, role: UserRole) => Promise<void>;

  // Navigation & View
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedDatabaseId: string | null;
  setSelectedDatabaseId: (id: string | null) => void;

  // Data Collections
  pages: PageDocument[];
  tasks: Task[];
  projects: Project[];
  databases: DatabaseSchema[];
  goals: Goal[];
  habits: Habit[];
  habitEntries: HabitEntry[];
  notes: QuickNote[];
  dataLoading: boolean;

  // Refresh
  refreshAllData: () => Promise<void>;

  // Pages actions
  createPage: (parentId?: string | null, title?: string, icon?: string) => Promise<PageDocument>;
  updatePage: (id: string, updates: Partial<PageDocument>) => Promise<void>;
  softDeletePage: (id: string) => Promise<void>;
  restorePage: (id: string) => Promise<void>;
  permanentlyDeletePage: (id: string) => Promise<void>;
  toggleFavoritePage: (id: string) => Promise<void>;

  // Tasks actions
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (task: Task) => Promise<void>;

  // Projects actions
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Databases actions
  createDatabase: (name: string, icon?: string) => Promise<DatabaseSchema>;
  updateDatabase: (id: string, updates: Partial<DatabaseSchema>) => Promise<void>;
  deleteDatabase: (id: string) => Promise<void>;
  createDatabaseRecord: (databaseId: string, title: string, values?: Record<string, any>) => Promise<DatabaseRecordItem>;

  // Goals & Habits actions
  createGoal: (data: Partial<Goal>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  createHabit: (data: Partial<Habit>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitToday: (habitId: string) => Promise<void>;

  // Notes actions
  createNote: (content: string, tags?: string[]) => Promise<QuickNote>;
  updateNote: (id: string, updates: Partial<QuickNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  convertNoteToPage: (note: QuickNote) => Promise<void>;
  convertNoteToTask: (note: QuickNote) => Promise<void>;

  // Modals & UI Controls
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isNewWorkspaceModalOpen: boolean;
  setIsNewWorkspaceModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isFullWidth: boolean;
  toggleFullWidth: () => void;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: 'workspace_default_main',
  name: 'Axus Workspace',
  icon: '🛡️',
  ownerId: 'workspace_user_main',
  members: ['workspace_user_main'],
  memberDetails: {
    workspace_user_main: {
      userId: 'workspace_user_main',
      email: 'axus@digitalminds.security',
      displayName: 'Axus',
      photoURL: '',
      role: 'owner',
      joinedAt: new Date().toISOString()
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>('Axus');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [lockTimeoutMinutes, setLockTimeoutMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem(LOCK_TIMEOUT_KEY);
    const parsed = saved ? parseInt(saved, 10) : 30;
    return Number.isNaN(parsed) ? 30 : parsed;
  });

  const setLockTimeoutMinutes = (mins: number) => {
    setLockTimeoutMinutesState(mins);
    localStorage.setItem(LOCK_TIMEOUT_KEY, String(mins));
  };

  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(DEFAULT_WORKSPACE);

  const [activeView, setActiveView] = useState<ActiveNavView>('dashboard');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(null);

  const [pages, setPages] = useState<PageDocument[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [databases, setDatabases] = useState<DatabaseSchema[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('workspace_os_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('workspace_os_theme', theme);
  }, [theme]);

  // Restore lockout state and verify existing cryptographic session on boot
  useEffect(() => {
    let mounted = true;
    const verifyBootSession = async () => {
      try {
        // Check brute-force lockout state
        const rawLockout = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        if (rawLockout) {
          const parsedLock = JSON.parse(rawLockout);
          if (parsedLock.lockoutUntil && parsedLock.lockoutUntil > Date.now()) {
            if (mounted) {
              setLockoutUntil(parsedLock.lockoutUntil);
              setFailedAttempts(parsedLock.failedAttempts || 5);
            }
          } else {
            localStorage.removeItem(LOCKOUT_STORAGE_KEY);
          }
        }

        // Check active session token in sessionStorage or localStorage
        const rawSession =
          sessionStorage.getItem(SESSION_STORAGE_KEY) ||
          localStorage.getItem(SESSION_STORAGE_KEY);

        if (rawSession) {
          const session: StoredVaultSession = JSON.parse(rawSession);
          if (session.expiresAt > Date.now() && session.username === 'Axus') {
            const expectedSig = await computeSha256Hex(
              `${session.username}:${session.issuedAt}:${session.expiresAt}:${SESSION_SALT}`
            );
            if (constantTimeEqual(session.signature, expectedSig)) {
              if (mounted) {
                setAuthUsername(session.username);
                setIsAuthenticated(true);
              }
            } else {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    verifyBootSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Clear lockout timer automatically when expired
  useEffect(() => {
    if (!lockoutUntil) return;
    const remaining = lockoutUntil - Date.now();
    if (remaining <= 0) {
      setLockoutUntil(null);
      setFailedAttempts(0);
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      return;
    }
    const timer = setTimeout(() => {
      setLockoutUntil(null);
      setFailedAttempts(0);
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    }, remaining);
    return () => clearTimeout(timer);
  }, [lockoutUntil]);

  const lockSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setIsSettingsModalOpen(false);
    setIsSearchModalOpen(false);
    setIsShareModalOpen(false);
    setIsNewWorkspaceModalOpen(false);
  }, []);

  // Auto-lock on inactivity when authenticated
  useEffect(() => {
    if (!isAuthenticated || lockTimeoutMinutes <= 0) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;
    const timeoutMs = lockTimeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        lockSession();
      }, timeoutMs);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticated, lockTimeoutMinutes, lockSession]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleFullWidth = () => {
    setIsFullWidth(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const effectiveUserId = 'workspace_user_main';
  const effectiveUserEmail = 'axus@digitalminds.security';
  const effectiveUserName = 'Axus';

  const [workspaceInitialized, setWorkspaceInitialized] = useState(false);

  // Load Workspaces for User only when authenticated
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      let list = await workspaceService.getUserWorkspaces(effectiveUserId);
      if (list.length === 0) {
        const initialWs = await workspaceService.createWorkspace({
          id: 'workspace_default_main',
          name: 'Axus Workspace',
          icon: '🛡️',
          ownerId: effectiveUserId,
          ownerEmail: effectiveUserEmail,
          ownerName: effectiveUserName,
        });
        list = [initialWs];
      }
      setWorkspaces(list);
      setCurrentWorkspace(list[0]);
    } catch (err) {
      console.warn('Erro ao carregar workspaces:', err);
    } finally {
      setWorkspaceInitialized(true);
    }
  }, [isAuthenticated, effectiveUserId, effectiveUserEmail, effectiveUserName]);

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaces();
    } else {
      setWorkspaceInitialized(false);
    }
  }, [isAuthenticated, loadWorkspaces]);

  // Load All Data for current workspace
  const refreshAllData = useCallback(async () => {
    if (!isAuthenticated || !currentWorkspace) return;
    setDataLoading(true);
    try {
      const [
        fetchedPages,
        fetchedTasks,
        fetchedProjects,
        fetchedDbs,
        fetchedGoals,
        fetchedHabits,
        fetchedEntries,
        fetchedNotes
      ] = await Promise.all([
        pagesService.getWorkspacePages(currentWorkspace.id, true),
        tasksService.getWorkspaceTasks(currentWorkspace.id, true),
        projectsService.getWorkspaceProjects(currentWorkspace.id, true),
        databasesService.getWorkspaceDatabases(currentWorkspace.id),
        goalsHabitsService.getWorkspaceGoals(currentWorkspace.id),
        goalsHabitsService.getWorkspaceHabits(currentWorkspace.id),
        goalsHabitsService.getHabitEntries(currentWorkspace.id),
        notesService.getWorkspaceNotes(currentWorkspace.id)
      ]);

      setPages(fetchedPages);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
      setDatabases(fetchedDbs);
      setGoals(fetchedGoals);
      setHabits(fetchedHabits);
      setHabitEntries(fetchedEntries);
      setNotes(fetchedNotes);

      // Seed initial welcoming content if workspace is completely fresh
      if (fetchedPages.length === 0 && fetchedTasks.length === 0 && fetchedProjects.length === 0) {
        await seedDefaultWorkspaceContent(currentWorkspace.id, effectiveUserId);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do workspace:', err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, currentWorkspace, effectiveUserId]);

  // Helper to seed initial high quality content
  const seedDefaultWorkspaceContent = async (workspaceId: string, userId: string) => {
    try {
      const welcomePage = await pagesService.createPage({
        workspaceId,
        title: 'Bem-vindo ao Workspace OS',
        icon: '🚀',
        userId,
        initialBlocks: [
          {
            id: 'b1',
            type: 'h1',
            content: { text: 'Bem-vindo ao seu novo centro de produtividade' },
            order: 0,
          },
          {
            id: 'b2',
            type: 'callout',
            content: {
              text: 'O Workspace OS reúne documentos em blocos, tarefas, projetos, metas, hábitos e bases de dados conectadas em um único lugar ágil e elegante.',
              calloutIcon: '💡'
            },
            order: 1,
          },
          {
            id: 'b3',
            type: 'paragraph',
            content: { text: 'Digite / em qualquer linha para abrir o menu de blocos rápidos (títulos, listas, checklists, citações, tabelas e visualizações de dados).' },
            order: 2,
          },
          {
            id: 'b4',
            type: 'todo',
            content: { text: 'Experimente criar uma subtarefa ou subpágina na barra lateral', checked: false },
            order: 3,
          },
          {
            id: 'b5',
            type: 'todo',
            content: { text: 'Abra a Busca Global com Cmd+K ou Ctrl+K', checked: true },
            order: 4,
          }
        ]
      });

      const initialProject = await projectsService.createProject({
        workspaceId,
        name: 'Lançamento do Produto',
        description: 'Roadmap de desenvolvimento, testes e lançamento oficial.',
        icon: '🎯',
        color: '#6366f1',
        ownerId: userId,
        status: 'in_progress',
        priority: 'high',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        milestones: [
          { id: 'm1', title: 'Validação de Design & Arquitetura', dueDate: new Date().toISOString().split('T')[0], completed: true },
          { id: 'm2', title: 'Integração com Banco de Dados', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], completed: true },
          { id: 'm3', title: 'Lançamento Beta', dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], completed: false }
        ]
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await tasksService.createTask({
        workspaceId,
        title: 'Revisar estrutura de páginas e subdocumentos',
        status: 'done',
        priority: 'high',
        dueDate: todayStr,
        projectId: initialProject.id,
        userId,
      });
      await tasksService.createTask({
        workspaceId,
        title: 'Configurar metas e hábitos da semana',
        status: 'in_progress',
        priority: 'urgent',
        dueDate: todayStr,
        projectId: initialProject.id,
        userId,
      });
      await tasksService.createTask({
        workspaceId,
        title: 'Explorar as bases de dados e visões Kanban',
        status: 'todo',
        priority: 'medium',
        dueDate: tomorrowStr,
        projectId: initialProject.id,
        userId,
      });

      await goalsHabitsService.createGoal({
        workspaceId,
        title: 'Concluir Sprint de Integração',
        description: 'Finalizar todos os módulos prioritários e testes de aceitação.',
        category: 'Engenharia',
        targetValue: 100,
        currentValue: 65,
        metric: '%',
        userId,
      });

      await goalsHabitsService.createHabit({
        workspaceId,
        title: 'Revisão diária de tarefas e prioridades',
        frequency: 'daily',
        icon: '🎯',
        color: '#10b981',
        userId,
      });

      await notesService.createNote({
        workspaceId,
        title: 'Ideia: automações de fluxo de trabalho',
        content: 'Permitir mover automaticamente tarefas de backlog para a sprint quando forem marcadas como prioridade urgente.',
        tags: ['Ideias', 'Backlog'],
        userId,
      });

      const [p, t, pr, g, h, n] = await Promise.all([
        pagesService.getWorkspacePages(workspaceId, true),
        tasksService.getWorkspaceTasks(workspaceId, true),
        projectsService.getWorkspaceProjects(workspaceId, true),
        goalsHabitsService.getWorkspaceGoals(workspaceId),
        goalsHabitsService.getWorkspaceHabits(workspaceId),
        notesService.getWorkspaceNotes(workspaceId)
      ]);
      setPages(p);
      setTasks(t);
      setProjects(pr);
      setGoals(g);
      setHabits(h);
      setNotes(n);
      setSelectedPageId(welcomePage.id);
    } catch (e) {
      console.warn('Seed error:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && workspaceInitialized && currentWorkspace) {
      refreshAllData();
    }
  }, [isAuthenticated, workspaceInitialized, currentWorkspace, refreshAllData]);

  // High-Security Credential Authentication (Axus / Axus2026@)
  const loginWithCredentials = async (
    usernameInput: string,
    passwordInput: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    // Check active brute-force lockout
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Muitas tentativas inválidas. Cofre bloqueado temporariamente por ${secs}s.`
      };
    }

    const normalizedUser = usernameInput.trim();

    // Compute cryptographic SHA-256 digests using Web Crypto API
    const [userHash, expectedUserHash, passHash, expectedPassHash] = await Promise.all([
      computeSha256Hex(`${normalizedUser}:${SESSION_SALT}`),
      computeSha256Hex(`Axus:${SESSION_SALT}`),
      computeSha256Hex(`${passwordInput}:${SESSION_SALT}`),
      computeSha256Hex(`Axus2026@:${SESSION_SALT}`)
    ]);

    const isUserValid = constantTimeEqual(userHash, expectedUserHash);
    const isPassValid = constantTimeEqual(passHash, expectedPassHash);

    if (!isUserValid || !isPassValid) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        const lockUntilTime = Date.now() + 30 * 1000; // 30s lockout
        setLockoutUntil(lockUntilTime);
        localStorage.setItem(
          LOCKOUT_STORAGE_KEY,
          JSON.stringify({ failedAttempts: nextAttempts, lockoutUntil: lockUntilTime })
        );
        return {
          success: false,
          error: 'Limite máximo de 5 tentativas excedido. Acesso bloqueado por 30 segundos.'
        };
      }

      const remaining = 5 - nextAttempts;
      return {
        success: false,
        error: `Credenciais inválidas. Verifique o usuário e a senha (${remaining} ${
          remaining === 1 ? 'tentativa restante' : 'tentativas restantes'
        }).`
      };
    }

    // Reset failed attempts on valid login
    setFailedAttempts(0);
    setLockoutUntil(null);
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);

    // Issue signed session token
    const issuedAt = Date.now();
    const expiresAt = issuedAt + (rememberMe ? 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
    const signature = await computeSha256Hex(
      `Axus:${issuedAt}:${expiresAt}:${SESSION_SALT}`
    );

    const sessionPayload: StoredVaultSession = {
      username: 'Axus',
      issuedAt,
      expiresAt,
      signature
    };

    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
    }

    setAuthUsername('Axus');
    setIsAuthenticated(true);
    return { success: true };
  };

  // Auth Methods
  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Falha no login com Google:', err);
    }
  };

  const logout = async () => {
    lockSession();
    try {
      await signOutUser();
    } catch {
      // Ignore if not signed into Firebase Auth
    }
    setUser(null);
  };

  const currentUserRole: UserRole = currentWorkspace?.memberDetails?.[effectiveUserId]?.role || 'owner';

  // Workspace actions
  const createWorkspace = async (name: string, icon: string): Promise<Workspace> => {
    const ws = await workspaceService.createWorkspace({
      name,
      icon,
      ownerId: effectiveUserId,
      ownerEmail: effectiveUserEmail,
      ownerName: effectiveUserName,
      ownerPhoto: user?.photoURL || undefined,
    });
    setWorkspaces(prev => [...prev, ws]);
    setCurrentWorkspace(ws);
    return ws;
  };

  const updateWorkspace = async (updates: Partial<Workspace>) => {
    if (!currentWorkspace) return;
    await workspaceService.updateWorkspace(currentWorkspace.id, updates);
    setCurrentWorkspace(prev => ({ ...prev, ...updates }));
    setWorkspaces(prev => prev.map(w => (w.id === currentWorkspace.id ? { ...w, ...updates } : w)));
  };

  const inviteMember = async (email: string, role: UserRole) => {
    if (!currentWorkspace) return;
    const updated = await workspaceService.inviteMember(currentWorkspace.id, email, role, currentWorkspace);
    setCurrentWorkspace(updated);
    setWorkspaces(prev => prev.map(w => (w.id === updated.id ? updated : w)));
  };

  // Pages actions
  const createPage = async (parentId?: string | null, title?: string, icon?: string): Promise<PageDocument> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newPage = await pagesService.createPage({
      workspaceId: wsId,
      parentId,
      title: title || 'Sem título',
      icon: icon || '📄',
      userId: effectiveUserId,
    });
    setPages(prev => [newPage, ...prev]);
    setSelectedPageId(newPage.id);
    setActiveView('page');
    return newPage;
  };

  const updatePage = async (id: string, updates: Partial<PageDocument>) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)));
    await pagesService.updatePage(id, updates);
  };

  const softDeletePage = async (id: string) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, deletedAt: new Date().toISOString(), deletedBy: effectiveUserId } : p)));
    if (selectedPageId === id) {
      setSelectedPageId(null);
      setActiveView('dashboard');
    }
    await pagesService.softDeletePage(id, effectiveUserId);
  };

  const restorePage = async (id: string) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, deletedAt: null, deletedBy: null } : p)));
    await pagesService.restorePage(id);
  };

  const permanentlyDeletePage = async (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    await pagesService.permanentlyDeletePage(id);
  };

  const toggleFavoritePage = async (id: string) => {
    const page = pages.find(p => p.id === id);
    if (!page) return;
    const nextVal = !page.isFavorite;
    await updatePage(id, { isFavorite: nextVal });
  };

  // Tasks actions
  const createTask = async (data: Partial<Task>): Promise<Task> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newTask = await tasksService.createTask({
      workspaceId: wsId,
      title: data.title || 'Nova tarefa',
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      startDate: data.startDate,
      time: data.time,
      itemType: data.itemType,
      projectId: data.projectId,
      pageId: data.pageId,
      tags: data.tags,
      subtasks: data.subtasks,
      userId: effectiveUserId,
    });
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)));
    await tasksService.updateTask(id, updates);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t)));
    await tasksService.softDeleteTask(id);
  };

  const toggleTaskComplete = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: nextStatus });
  };

  // Projects actions
  const createProject = async (data: Partial<Project>): Promise<Project> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newProject = await projectsService.createProject({
      workspaceId: wsId,
      name: data.name || 'Novo projeto',
      description: data.description,
      icon: data.icon,
      color: data.color,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      targetDate: data.targetDate,
      ownerId: effectiveUserId,
      tags: data.tags,
      milestones: data.milestones,
    });
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)));
    await projectsService.updateProject(id, updates);
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p)));
    await projectsService.softDeleteProject(id);
  };

  // Databases actions
  const createDatabase = async (name: string, icon?: string): Promise<DatabaseSchema> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newDb = await databasesService.createDatabase({
      workspaceId: wsId,
      name,
      icon,
    });
    setDatabases(prev => [newDb, ...prev]);
    return newDb;
  };

  const updateDatabase = async (id: string, updates: Partial<DatabaseSchema>) => {
    setDatabases(prev => prev.map(d => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)));
    await databasesService.updateDatabase(id, updates);
  };

  const deleteDatabase = async (id: string) => {
    setDatabases(prev => prev.filter(d => d.id !== id));
    await databasesService.deleteDatabase(id);
  };

  const createDatabaseRecord = async (databaseId: string, title: string, values?: Record<string, any>) => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    return await databasesService.createRecord({
      databaseId,
      workspaceId: wsId,
      title,
      values: values || {},
      userId: effectiveUserId,
    });
  };

  // Goals & Habits
  const createGoal = async (data: Partial<Goal>): Promise<Goal> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newGoal = await goalsHabitsService.createGoal({
      workspaceId: wsId,
      title: data.title || 'Nova Meta',
      description: data.description,
      category: data.category,
      targetValue: data.targetValue || 100,
      currentValue: data.currentValue || 0,
      metric: data.metric,
      startDate: data.startDate,
      targetDate: data.targetDate,
      userId: effectiveUserId,
    });
    setGoals(prev => [newGoal, ...prev]);
    return newGoal;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)));
    await goalsHabitsService.updateGoal(id, updates);
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await goalsHabitsService.deleteGoal(id);
  };

  const createHabit = async (data: Partial<Habit>): Promise<Habit> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newHabit = await goalsHabitsService.createHabit({
      workspaceId: wsId,
      title: data.title || 'Novo Hábito',
      description: data.description,
      frequency: data.frequency,
      targetDays: data.targetDays,
      icon: data.icon,
      color: data.color,
      userId: effectiveUserId,
    });
    setHabits(prev => [newHabit, ...prev]);
    return newHabit;
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h)));
    await goalsHabitsService.updateHabit(id, updates);
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await goalsHabitsService.deleteHabit(id);
  };

  const toggleHabitToday = async (habitId: string) => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const today = new Date().toISOString().split('T')[0];
    const { completed, streak } = await goalsHabitsService.toggleHabitEntry(
      habitId,
      wsId,
      today,
      effectiveUserId
    );

    setHabits(prev => prev.map(h => (h.id === habitId ? { ...h, streak } : h)));
    setHabitEntries(prev => {
      const entryId = `${habitId}_${today}`;
      if (completed) {
        return [...prev, { id: entryId, habitId, workspaceId: wsId, date: today, completed: true, userId: effectiveUserId }];
      } else {
        return prev.filter(e => e.id !== entryId);
      }
    });
  };

  // Notes actions
  const createNote = async (content: string, tags?: string[]): Promise<QuickNote> => {
    const wsId = currentWorkspace?.id || 'workspace_default_main';
    const newNote = await notesService.createNote({
      workspaceId: wsId,
      content,
      tags,
      userId: effectiveUserId,
    });
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<QuickNote>) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)));
    await notesService.updateNote(id, updates);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await notesService.deleteNote(id);
  };

  const convertNoteToPage = async (note: QuickNote) => {
    const page = await notesService.convertToPage(note, effectiveUserId);
    setNotes(prev => prev.filter(n => n.id !== note.id));
    setPages(prev => [page, ...prev]);
    setSelectedPageId(page.id);
    setActiveView('page');
  };

  const convertNoteToTask = async (note: QuickNote) => {
    const task = await notesService.convertToTask(note, effectiveUserId);
    setNotes(prev => prev.filter(n => n.id !== note.id));
    setTasks(prev => [task, ...prev]);
    setActiveView('tasks');
  };

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        isAuthenticated,
        authUsername,
        authLoading,
        failedAttempts,
        lockoutUntil,
        lockTimeoutMinutes,
        setLockTimeoutMinutes,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        lockSession,
        currentUserRole,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        createWorkspace,
        updateWorkspace,
        inviteMember,
        activeView,
        setActiveView,
        selectedPageId,
        setSelectedPageId,
        selectedProjectId,
        setSelectedProjectId,
        selectedDatabaseId,
        setSelectedDatabaseId,
        pages,
        tasks,
        projects,
        databases,
        goals,
        habits,
        habitEntries,
        notes,
        dataLoading,
        refreshAllData,
        createPage,
        updatePage,
        softDeletePage,
        restorePage,
        permanentlyDeletePage,
        toggleFavoritePage,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        createProject,
        updateProject,
        deleteProject,
        createDatabase,
        updateDatabase,
        deleteDatabase,
        createDatabaseRecord,
        createGoal,
        updateGoal,
        deleteGoal,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabitToday,
        createNote,
        updateNote,
        deleteNote,
        convertNoteToPage,
        convertNoteToTask,
        isSidebarCollapsed,
        toggleSidebar,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isNewWorkspaceModalOpen,
        setIsNewWorkspaceModalOpen,
        isShareModalOpen,
        setIsShareModalOpen,
        theme,
        toggleTheme,
        isFullWidth,
        toggleFullWidth,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
