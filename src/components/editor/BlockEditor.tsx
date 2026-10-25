import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Smile,
  Check,
  Loader2,
  ChevronRight,
  Database,
  ExternalLink,
  Code
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PageBlock, BlockType, PageDocument } from '../../types';
import { SlashCommandMenu } from './SlashCommandMenu';

const PRESET_ICONS = ['📄', '🚀', '💡', '🎯', '📊', '⚡', '📝', '📦', '🎨', '🧠', '🔍', '📌', '⚙️', '💻', '📈', '🌟'];

const PRESET_COVERS = [
  'linear-gradient(to right, #4f46e5, #06b6d4)',
  'linear-gradient(to right, #ec4899, #8b5cf6)',
  'linear-gradient(to right, #f59e0b, #ef4444)',
  'linear-gradient(to right, #10b981, #3b82f6)',
  'linear-gradient(to right, #6366f1, #d946ef)',
  'linear-gradient(to right, #1e293b, #334155)',
];

export const BlockEditor: React.FC<{ pageId: string }> = ({ pageId }) => {
  const {
    pages,
    updatePage,
    setSelectedPageId,
    setActiveView,
    createPage,
    databases,
    isFullWidth
  } = useWorkspace();

  const page = pages.find(p => p.id === pageId);

  const [title, setTitle] = useState(page?.title || '');
  const [icon, setIcon] = useState(page?.icon || '📄');
  const [coverImage, setCoverImage] = useState(page?.coverImage || '');
  const [blocks, setBlocks] = useState<PageBlock[]>(page?.blocks || []);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  // Slash Command State
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    blockId: string;
    query: string;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    blockId: '',
    query: '',
    position: { top: 0, left: 0 },
  });

  // Keep state in sync when pageId changes
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setIcon(page.icon || '📄');
      setCoverImage(page.coverImage || '');
      setBlocks(page.blocks?.length ? page.blocks : [
        {
          id: 'b_' + Math.random().toString(36).substring(2, 9),
          type: 'paragraph',
          content: { text: '' },
          order: 0,
        }
      ]);
    }
  }, [pageId, page?.id]);

  // Debounced Auto-Save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback((updatedTitle: string, updatedBlocks: PageBlock[], updatedIcon: string, updatedCover: string) => {
    if (!page) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updatePage(page.id, {
          title: updatedTitle || 'Sem título',
          blocks: updatedBlocks,
          icon: updatedIcon,
          coverImage: updatedCover,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Falha ao salvar página:', err);
        setSaveStatus('error');
      }
    }, 600);
  }, [page, updatePage]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerSave(newTitle, blocks, icon, coverImage);
  };

  const handleIconSelect = (newIcon: string) => {
    setIcon(newIcon);
    setIsIconPickerOpen(false);
    triggerSave(title, blocks, newIcon, coverImage);
  };

  const handleCoverSelect = (cover: string) => {
    setCoverImage(cover);
    setIsCoverPickerOpen(false);
    triggerSave(title, blocks, icon, cover);
  };

  const handleRemoveCover = () => {
    setCoverImage('');
    setIsCoverPickerOpen(false);
    triggerSave(title, blocks, icon, '');
  };

  // Block Manipulation Methods
  const updateBlockContent = (blockId: string, partialContent: Partial<PageBlock['content']>) => {
    const nextBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          content: { ...b.content, ...partialContent }
        };
      }
      return b;
    });
    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  const addBlockAfter = (afterBlockId?: string, type: BlockType = 'paragraph') => {
    const newBlock: PageBlock = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      type,
      content: { text: '' },
      order: blocks.length,
    };

    let nextBlocks: PageBlock[];
    if (afterBlockId) {
      const idx = blocks.findIndex(b => b.id === afterBlockId);
      nextBlocks = [
        ...blocks.slice(0, idx + 1),
        newBlock,
        ...blocks.slice(idx + 1)
      ];
    } else {
      nextBlocks = [...blocks, newBlock];
    }

    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  const removeBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      // Don't remove last block, just clear it
      updateBlockContent(blockId, { text: '' });
      return;
    }
    const nextBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  const duplicateBlock = (blockId: string) => {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;
    const target = blocks[idx];
    const duplicated: PageBlock = {
      ...target,
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      content: { ...target.content },
    };
    const nextBlocks = [
      ...blocks.slice(0, idx + 1),
      duplicated,
      ...blocks.slice(idx + 1)
    ];
    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const nextBlocks = [...blocks];
    const temp = nextBlocks[idx];
    nextBlocks[idx] = nextBlocks[targetIdx];
    nextBlocks[targetIdx] = temp;

    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  const changeBlockType = (blockId: string, newType: BlockType) => {
    const nextBlocks = blocks.map(b => {
      if (b.id === blockId) {
        let initialContent = { ...b.content };
        if (newType === 'table' && !initialContent.tableRows) {
          initialContent.tableRows = [
            [{ text: 'Item' }, { text: 'Valor' }, { text: 'Nota' }],
            [{ text: 'Exemplo 1' }, { text: '100' }, { text: 'Ativo' }],
            [{ text: 'Exemplo 2' }, { text: '250' }, { text: 'Pendente' }]
          ];
        } else if (newType === 'callout' && !initialContent.calloutIcon) {
          initialContent.calloutIcon = '💡';
        }
        return {
          ...b,
          type: newType,
          content: initialContent
        };
      }
      return b;
    });
    setBlocks(nextBlocks);
    triggerSave(title, nextBlocks, icon, coverImage);
  };

  // Slash Command triggers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, block: PageBlock) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (slashMenu.isOpen) return;
      e.preventDefault();
      addBlockAfter(block.id, 'paragraph');
    } else if (e.key === 'Backspace' && !block.content.text && blocks.length > 1) {
      e.preventDefault();
      removeBlock(block.id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, blockId: string) => {
    const val = e.target.value;
    updateBlockContent(blockId, { text: val });

    // Check slash command trigger
    if (val.startsWith('/')) {
      const rect = e.target.getBoundingClientRect();
      setSlashMenu({
        isOpen: true,
        blockId,
        query: val.slice(1),
        position: {
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
        }
      });
    } else if (slashMenu.isOpen) {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleSelectSlashCommand = (type: BlockType) => {
    if (!slashMenu.blockId) return;
    changeBlockType(slashMenu.blockId, type);
    updateBlockContent(slashMenu.blockId, { text: '' });
    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  };

  // Subpages of current page
  const subpages = pages.filter(p => !p.deletedAt && p.parentId === pageId);
  const parentPage = page?.parentId ? pages.find(p => p.id === page.parentId) : null;

  if (!page) {
    return (
      <div className="py-20 text-center text-slate-400">
        Página não encontrada ou excluída.
      </div>
    );
  }

  return (
    <div className="min-h-full pb-32">
      {/* Cover Header */}
      {coverImage ? (
        <div
          style={{ background: coverImage }}
          className="h-44 w-full relative group transition-all"
        >
          <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsCoverPickerOpen(true)}
              className="px-2.5 py-1 text-xs bg-black/60 hover:bg-black/80 text-white rounded-md backdrop-blur-xs"
            >
              Alterar capa
            </button>
            <button
              type="button"
              onClick={handleRemoveCover}
              className="px-2.5 py-1 text-xs bg-black/60 hover:bg-black/80 text-white rounded-md backdrop-blur-xs"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="h-6 w-full" />
      )}

      {/* Main Page Canvas Container */}
      <div className={`mx-auto px-4 md:px-12 transition-all ${isFullWidth ? 'max-w-full' : 'max-w-4xl'}`}>
        {/* Cover & Icon Adder Controls if none */}
        <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
          {!coverImage && (
            <button
              type="button"
              onClick={() => setIsCoverPickerOpen(true)}
              className="hover:text-slate-700 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              <ImageIcon size={13} />
              <span>Adicionar capa</span>
            </button>
          )}

          {/* Save Status pill */}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
            {saveStatus === 'saving' && (
              <>
                <Loader2 size={11} className="animate-spin text-indigo-500" />
                <span>Salvando alterações...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check size={11} className="text-emerald-500" />
                <span>Salvo na nuvem</span>
              </>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-500">Erro ao salvar</span>
            )}
          </div>
        </div>

        {/* Cover Picker Modal Popover */}
        {isCoverPickerOpen && (
          <div className="mt-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl space-y-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
              Escolha uma capa
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_COVERS.map((cov, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCoverSelect(cov)}
                  style={{ background: cov }}
                  className="h-12 rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* Page Icon & Title */}
        <div className="mt-4 space-y-2">
          {/* Icon trigger */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
              className="text-4xl hover:opacity-80 transition-opacity p-1 rounded-md"
              title="Mudar ícone"
            >
              {icon}
            </button>

            {isIconPickerOpen && (
              <div className="absolute left-0 top-12 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 grid grid-cols-4 gap-2 text-2xl w-48">
                {PRESET_ICONS.map((ico, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleIconSelect(ico)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md text-center"
                  >
                    {ico}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Parent Page Breadcrumb indicator if subpage */}
          {parentPage && (
            <div
              onClick={() => {
                setSelectedPageId(parentPage.id);
                setActiveView('page');
              }}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md cursor-pointer transition-colors"
            >
              <span>{parentPage.icon || '📄'}</span>
              <span className="truncate max-w-[200px]">{parentPage.title}</span>
              <ChevronRight size={12} />
            </div>
          )}

          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Sem título"
            className="w-full text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-700 bg-transparent border-none outline-hidden p-0"
          />
        </div>

        {/* Subpages Section if any */}
        {subpages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Subpáginas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subpages.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => {
                    setSelectedPageId(sub.id);
                    setActiveView('page');
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors"
                >
                  <span>{sub.icon || '📄'}</span>
                  <span className="truncate">{sub.title || 'Sem título'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocks Workspace */}
        <div className="mt-8 space-y-1 relative">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="group/block relative flex items-start gap-1 py-1 rounded-md transition-colors"
            >
              {/* Left Block Controls (Grip, Add, Menu) */}
              <div className="opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 pt-1.5 shrink-0 transition-opacity">
                <button
                  type="button"
                  onClick={() => addBlockAfter(block.id, 'paragraph')}
                  title="Inserir bloco abaixo"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                >
                  <Plus size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 'up')}
                  disabled={idx === 0}
                  title="Mover para cima"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 text-slate-400"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 'down')}
                  disabled={idx === blocks.length - 1}
                  title="Mover para baixo"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 text-slate-400"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBlock(block.id)}
                  title="Duplicar bloco"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  title="Excluir bloco"
                  className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Block Content Renderer */}
              <div className="flex-1 min-w-0">
                {/* Paragraph */}
                {block.type === 'paragraph' && (
                  <input
                    type="text"
                    value={block.content.text || ''}
                    onChange={e => handleInputChange(e, block.id)}
                    onKeyDown={e => handleKeyDown(e, block)}
                    placeholder="Digite '/' para comandos..."
                    className="w-full text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-300 dark:placeholder:text-zinc-700 bg-transparent border-none outline-hidden py-1"
                  />
                )}

                {/* Heading 1 */}
                {block.type === 'h1' && (
                  <input
                    type="text"
                    value={block.content.text || ''}
                    onChange={e => handleInputChange(e, block.id)}
                    onKeyDown={e => handleKeyDown(e, block)}
                    placeholder="Título 1"
                    className="w-full text-2xl font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 bg-transparent border-none outline-hidden py-1 mt-2 mb-1"
                  />
                )}

                {/* Heading 2 */}
                {block.type === 'h2' && (
                  <input
                    type="text"
                    value={block.content.text || ''}
                    onChange={e => handleInputChange(e, block.id)}
                    onKeyDown={e => handleKeyDown(e, block)}
                    placeholder="Título 2"
                    className="w-full text-xl font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 bg-transparent border-none outline-hidden py-1 mt-1"
                  />
                )}

                {/* Heading 3 */}
                {block.type === 'h3' && (
                  <input
                    type="text"
                    value={block.content.text || ''}
                    onChange={e => handleInputChange(e, block.id)}
                    onKeyDown={e => handleKeyDown(e, block)}
                    placeholder="Título 3"
                    className="w-full text-base font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 bg-transparent border-none outline-hidden py-1"
                  />
                )}

                {/* Checklist / Todo */}
                {block.type === 'todo' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!block.content.checked}
                      onChange={e => updateBlockContent(block.id, { checked: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.content.text || ''}
                      onChange={e => handleInputChange(e, block.id)}
                      onKeyDown={e => handleKeyDown(e, block)}
                      placeholder="Tarefa a fazer..."
                      className={`flex-1 text-sm bg-transparent border-none outline-hidden py-1 ${
                        block.content.checked ? 'line-through text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-200'
                      }`}
                    />
                  </div>
                )}

                {/* Bullet List */}
                {block.type === 'bullet_list' && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 shrink-0 mt-1" />
                    <input
                      type="text"
                      value={block.content.text || ''}
                      onChange={e => handleInputChange(e, block.id)}
                      onKeyDown={e => handleKeyDown(e, block)}
                      placeholder="Item da lista..."
                      className="flex-1 text-sm text-slate-800 dark:text-zinc-200 bg-transparent border-none outline-hidden py-1"
                    />
                  </div>
                )}

                {/* Numbered List */}
                {block.type === 'numbered_list' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={block.content.text || ''}
                      onChange={e => handleInputChange(e, block.id)}
                      onKeyDown={e => handleKeyDown(e, block)}
                      placeholder="Item numerado..."
                      className="flex-1 text-sm text-slate-800 dark:text-zinc-200 bg-transparent border-none outline-hidden py-1"
                    />
                  </div>
                )}

                {/* Quote */}
                {block.type === 'quote' && (
                  <div className="border-l-3 border-indigo-500 pl-3 py-0.5">
                    <input
                      type="text"
                      value={block.content.text || ''}
                      onChange={e => handleInputChange(e, block.id)}
                      onKeyDown={e => handleKeyDown(e, block)}
                      placeholder="Citação ou nota reflexiva..."
                      className="w-full text-sm italic text-slate-700 dark:text-zinc-300 bg-transparent border-none outline-hidden py-1"
                    />
                  </div>
                )}

                {/* Callout */}
                {block.type === 'callout' && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                    <span className="text-lg leading-none shrink-0">{block.content.calloutIcon || '💡'}</span>
                    <input
                      type="text"
                      value={block.content.text || ''}
                      onChange={e => handleInputChange(e, block.id)}
                      onKeyDown={e => handleKeyDown(e, block)}
                      placeholder="Texto do destaque..."
                      className="w-full text-sm text-slate-800 dark:text-zinc-200 bg-transparent border-none outline-hidden"
                    />
                  </div>
                )}

                {/* Code Block */}
                {block.type === 'code' && (
                  <div className="bg-slate-900 text-slate-100 dark:bg-zinc-900 rounded-xl p-3 border border-slate-800 dark:border-zinc-800 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                      <span className="uppercase">Código</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (block.content.text) navigator.clipboard.writeText(block.content.text);
                        }}
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Copy size={11} />
                        <span>Copiar</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={block.content.text || ''}
                      onChange={e => updateBlockContent(block.id, { text: e.target.value })}
                      placeholder="// Digite ou cole seu código aqui..."
                      className="w-full bg-transparent border-none outline-hidden text-emerald-400 font-mono resize-y"
                    />
                  </div>
                )}

                {/* Table Block */}
                {block.type === 'table' && (
                  <div className="overflow-x-auto my-2 border border-slate-200 dark:border-zinc-800 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        {(block.content.tableRows || [
                          [{ text: 'Coluna 1' }, { text: 'Coluna 2' }],
                          [{ text: 'Dado A' }, { text: 'Dado B' }]
                        ]).map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 dark:bg-zinc-800 font-semibold' : 'border-t border-slate-200 dark:border-zinc-800'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-200 dark:border-zinc-800 last:border-r-0">
                                <input
                                  type="text"
                                  value={cell.text}
                                  onChange={e => {
                                    const nextRows = [...(block.content.tableRows || [])];
                                    nextRows[rIdx][cIdx] = { text: e.target.value };
                                    updateBlockContent(block.id, { tableRows: nextRows });
                                  }}
                                  className="w-full bg-transparent border-none outline-hidden"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Divider */}
                {block.type === 'divider' && (
                  <div className="py-3">
                    <hr className="border-t border-slate-200 dark:border-zinc-800" />
                  </div>
                )}

                {/* Image Block */}
                {block.type === 'image' && (
                  <div className="space-y-1.5 p-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50 dark:bg-zinc-800/40">
                    <input
                      type="text"
                      value={block.content.url || ''}
                      onChange={e => updateBlockContent(block.id, { url: e.target.value })}
                      placeholder="Cole o URL da imagem (https://...)"
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1 text-slate-800 dark:text-zinc-200"
                    />
                    {block.content.url && (
                      <img
                        src={block.content.url}
                        alt="Imagem da página"
                        className="max-h-80 rounded-md object-contain mx-auto"
                      />
                    )}
                  </div>
                )}

                {/* Database View Block */}
                {block.type === 'database_view' && (
                  <div className="p-4 border border-indigo-200 dark:border-indigo-900/60 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          Base de Dados Integrada
                        </span>
                      </div>
                      <select
                        value={block.content.databaseId || ''}
                        onChange={e => updateBlockContent(block.id, { databaseId: e.target.value })}
                        className="text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md px-2 py-1 text-slate-700 dark:text-zinc-200"
                      >
                        <option value="">Selecione uma base de dados...</option>
                        {databases.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.icon || '🗄️'} {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {block.content.databaseId && (
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        Visualização sincronizada com a base de dados do workspace.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Bottom quick adder */}
          <div
            onClick={() => addBlockAfter(undefined, 'paragraph')}
            className="py-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Plus size={14} />
            <span>Clique para adicionar novo bloco</span>
          </div>
        </div>
      </div>

      {/* Floating Slash Command Palette */}
      {slashMenu.isOpen && (
        <SlashCommandMenu
          query={slashMenu.query}
          onSelect={handleSelectSlashCommand}
          onClose={() => setSlashMenu(prev => ({ ...prev, isOpen: false }))}
          position={slashMenu.position}
        />
      )}
    </div>
  );
};
