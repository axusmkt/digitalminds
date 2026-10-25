import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Pin,
  Trash2,
  FileText,
  CheckSquare,
  Search,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { QuickNote } from '../../types';

export const NotesView: React.FC = () => {
  const {
    notes,
    createNote,
    updateNote,
    deleteNote,
    convertNoteToPage,
    convertNoteToTask,
    isFullWidth
  } = useWorkspace();

  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      await createNote(newContent.trim(), tags);
      setNewContent('');
      setNewTags('');
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (searchQuery) {
      return (
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-5xl'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Caixa de Entrada & Notas Rápidas
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Capture pensamentos instantaneamente e converta em páginas ou tarefas quando estiver pronto.
          </p>
        </div>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
        <textarea
          rows={3}
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="O que está na sua cabeça agora? Digite ideias, anotações de reunião ou lembretes..."
          className="w-full text-xs bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl p-3 text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <input
            type="text"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            placeholder="Tags separadas por vírgula (ex: Ideia, Reunião)"
            className="text-xs bg-transparent border-none outline-hidden text-slate-600 dark:text-zinc-400 placeholder:text-slate-400 flex-1"
          />

          <button
            type="submit"
            disabled={!newContent.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>Salvar Nota</span>
          </button>
        </div>
      </form>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <Search size={14} className="text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar notas rápidas..."
          className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 dark:text-zinc-200 placeholder:text-slate-400"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <button
                  type="button"
                  onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                  className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                    note.isPinned ? 'text-indigo-600 fill-indigo-600' : 'text-slate-400'
                  }`}
                >
                  <Pin size={13} />
                </button>
              </div>

              <p className="text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">
                {note.content}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {note.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Convert Actions Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => convertNoteToPage(note)}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  <FileText size={12} />
                  <span>→ Página</span>
                </button>
                <button
                  type="button"
                  onClick={() => convertNoteToTask(note)}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <CheckSquare size={12} />
                  <span>→ Tarefa</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="text-slate-400 hover:text-rose-500 p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Nenhuma nota rápida encontrada.
          </div>
        )}
      </div>
    </div>
  );
};
