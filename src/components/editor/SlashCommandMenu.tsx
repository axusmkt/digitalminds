import React, { useState, useEffect, useRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  AlertCircle,
  Code,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Database
} from 'lucide-react';
import { BlockType } from '../../types';

interface SlashItem {
  type: BlockType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SLASH_COMMANDS: SlashItem[] = [
  { type: 'paragraph', title: 'Texto', description: 'Parágrafo comum para notas e escrita.', icon: <Type size={16} /> },
  { type: 'h1', title: 'Título 1', description: 'Título de seção principal grande.', icon: <Heading1 size={16} /> },
  { type: 'h2', title: 'Título 2', description: 'Subtítulo médio para organização.', icon: <Heading2 size={16} /> },
  { type: 'h3', title: 'Título 3', description: 'Subtítulo menor de seção.', icon: <Heading3 size={16} /> },
  { type: 'todo', title: 'Checklist', description: 'Item de tarefa com caixa de seleção.', icon: <CheckSquare size={16} /> },
  { type: 'bullet_list', title: 'Lista com marcadores', description: 'Lista simples com pontos.', icon: <List size={16} /> },
  { type: 'numbered_list', title: 'Lista numerada', description: 'Lista ordenada por números.', icon: <ListOrdered size={16} /> },
  { type: 'callout', title: 'Destaque / Callout', description: 'Caixa de alerta com ícone destacado.', icon: <AlertCircle size={16} /> },
  { type: 'quote', title: 'Citação', description: 'Bloco de citação elegante com barra lateral.', icon: <Quote size={16} /> },
  { type: 'code', title: 'Bloco de código', description: 'Trecho de código com fonte monoespaçada.', icon: <Code size={16} /> },
  { type: 'table', title: 'Tabela simples', description: 'Grade de dados tabular com linhas e colunas.', icon: <TableIcon size={16} /> },
  { type: 'divider', title: 'Divisor', description: 'Linha sutil horizontal de separação.', icon: <Minus size={16} /> },
  { type: 'image', title: 'Imagem', description: 'Inserir imagem por URL com legenda.', icon: <ImageIcon size={16} /> },
  { type: 'database_view', title: 'Base de dados', description: 'Incorporar visualização de dados conectada.', icon: <Database size={16} /> },
];

interface SlashCommandMenuProps {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  onSelect,
  onClose,
  position
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 text-xs text-slate-400"
      >
        Nenhum bloco encontrado para "{query}"
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-50 w-72 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-1.5 text-xs select-none"
    >
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        Blocos Básicos
      </div>
      {filteredCommands.map((cmd, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <div
            key={cmd.type}
            onClick={() => onSelect(cmd.type)}
            onMouseEnter={() => setSelectedIndex(idx)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className={`p-1.5 rounded-md border ${
              isSelected
                ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-800 text-indigo-600'
                : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-500'
            }`}>
              {cmd.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-slate-900 dark:text-zinc-100 truncate">
                {cmd.title}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {cmd.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
