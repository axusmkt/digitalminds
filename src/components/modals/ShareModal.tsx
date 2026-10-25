import React, { useState } from 'react';
import {
  Share2,
  X,
  Mail,
  Shield,
  UserPlus,
  Check,
  UserCheck
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { UserRole } from '../../types';

export const ShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    currentWorkspace,
    inviteMember,
  } = useWorkspace();

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('editor');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  if (!isShareModalOpen || !currentWorkspace) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    await inviteMember(inviteEmail.trim(), selectedRole);
    setInviteEmail('');
    setInvitedSuccess(true);
    setTimeout(() => setInvitedSuccess(false), 3000);
  };

  const membersList = Object.values(currentWorkspace.memberDetails || {});

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'viewer': return 'Leitor';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Compartilhar Workspace
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsShareModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
            Convidar novo membro por e-mail
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as UserRole)}
              className="text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2.5 text-slate-700 dark:text-zinc-300"
            >
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
              <option value="viewer">Leitor</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <UserPlus size={14} />
              <span>Convidar</span>
            </button>
          </div>

          {invitedSuccess && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check size={12} />
              <span>Membro adicionado ao workspace com sucesso!</span>
            </div>
          )}
        </form>

        {/* Members List */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Membros Atuais ({membersList.length})
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/70 dark:border-zinc-800 rounded-xl overflow-hidden">
            {membersList.map(member => (
              <div
                key={member.userId}
                className="p-3 flex items-center justify-between text-xs bg-white dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                    {(member.displayName || member.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900 dark:text-zinc-100 block truncate">
                      {member.displayName || member.email}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {member.email}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium capitalize">
                  {getRoleLabel(member.role)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(false)}
            className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-medium rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
