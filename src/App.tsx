/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { BlockEditor } from './components/editor/BlockEditor';
import { TasksView } from './components/tasks/TasksView';
import { ProjectsView } from './components/projects/ProjectsView';
import { DatabaseView } from './components/database/DatabaseView';
import { CalendarView } from './components/calendar/CalendarView';
import { GoalsView } from './components/goals/GoalsView';
import { HabitsView } from './components/habits/HabitsView';
import { NotesView } from './components/notes/NotesView';
import { TrashView } from './components/trash/TrashView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { ShareModal } from './components/modals/ShareModal';
import { NewWorkspaceModal } from './components/modals/NewWorkspaceModal';
import { SettingsModal } from './components/modals/SettingsModal';

const WorkspaceAppContent: React.FC = () => {
  const { activeView, selectedPageId, isAuthenticated, authLoading } = useWorkspace();

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <ShieldCheck size={22} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <Loader2 size={14} className="animate-spin text-indigo-500" />
          <span>Verificando assinatura de segurança...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inbox':
        return <NotesView />;
      case 'tasks':
        return <TasksView filterMode="all" />;
      case 'today':
        return <TasksView filterMode="today" />;
      case 'upcoming':
        return <TasksView filterMode="upcoming" />;
      case 'calendar':
        return <CalendarView />;
      case 'projects':
      case 'project-detail':
        return <ProjectsView />;
      case 'goals':
        return <GoalsView />;
      case 'habits':
        return <HabitsView />;
      case 'databases':
      case 'database-detail':
        return <DatabaseView />;
      case 'page':
        return selectedPageId ? (
          <BlockEditor pageId={selectedPageId} />
        ) : (
          <Dashboard />
        );
      case 'trash':
        return <TrashView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased font-sans">
      {/* Hierarchical Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* View Canvas with custom scroll */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <ShareModal />
      <NewWorkspaceModal />
      <SettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceAppContent />
    </WorkspaceProvider>
  );
}
