import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Table as TableIcon,
  Columns,
  LayoutList,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  Trash2,
  X,
  Check,
  Calendar,
  Tag,
  Hash,
  Type,
  Link as LinkIcon,
  Mail,
  CheckSquare
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  DatabaseSchema,
  DatabaseRecordItem,
  DatabaseProperty,
  PropertyType,
  DatabaseViewType
} from '../../types';
import { databasesService } from '../../services/databasesService';

export const DatabaseView: React.FC = () => {
  const {
    databases,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    selectedDatabaseId,
    setSelectedDatabaseId,
    createDatabaseRecord,
    isFullWidth
  } = useWorkspace();

  const [currentDbId, setCurrentDbId] = useState<string>(
    selectedDatabaseId || databases[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<DatabaseViewType>('table');
  const [records, setRecords] = useState<DatabaseRecordItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // New Database Modal
  const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newDbIcon, setNewDbIcon] = useState('🗄️');

  // New Property Modal
  const [isNewPropModalOpen, setIsNewPropModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyType>('text');

  // Selected Record Drawer
  const [selectedRecord, setSelectedRecord] = useState<DatabaseRecordItem | null>(null);

  // Active Database
  const activeDb = databases.find(d => d.id === currentDbId) || databases[0];

  useEffect(() => {
    if (activeDb) {
      setCurrentDbId(activeDb.id);
      loadRecords(activeDb.id);
    }
  }, [activeDb?.id]);

  const loadRecords = async (dbId: string) => {
    setLoadingRecords(true);
    try {
      const recs = await databasesService.getDatabaseRecords(dbId);
      setRecords(recs);
    } catch (err) {
      console.error('Erro ao carregar registros:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    try {
      const created = await createDatabase(newDbName.trim(), newDbIcon);
      setCurrentDbId(created.id);
      setNewDbName('');
      setIsNewDbModalOpen(false);
    } catch (err) {
      console.error('Erro ao criar database:', err);
      setIsNewDbModalOpen(false);
    }
  };

  const handleAddProperty = async () => {
    if (!activeDb || !newPropName.trim()) return;
    try {
      const propId = 'prop_' + Math.random().toString(36).substring(2, 9);
      const newProp: DatabaseProperty = {
        id: propId,
        name: newPropName.trim(),
        type: newPropType,
        options: newPropType === 'select' ? [
          { id: 'opt_1', label: 'Opção 1', color: 'bg-blue-500/20 text-blue-700' },
          { id: 'opt_2', label: 'Opção 2', color: 'bg-emerald-500/20 text-emerald-700' }
        ] : undefined
      };

      const nextProps = [...activeDb.properties, newProp];
      await updateDatabase(activeDb.id, { properties: nextProps });
      setNewPropName('');
      setIsNewPropModalOpen(false);
    } catch (err) {
      console.error('Erro ao adicionar propriedade:', err);
      setIsNewPropModalOpen(false);
    }
  };

  const handleAddRecord = async () => {
    if (!activeDb) return;
    try {
      const newRec = await createDatabaseRecord(activeDb.id, 'Novo Registro');
      setRecords(prev => [newRec, ...prev]);
      setSelectedRecord(newRec);
    } catch (err) {
      console.error('Erro ao adicionar registro:', err);
    }
  };

  const handleUpdateRecordField = async (recordId: string, propertyId: string, value: any) => {
    const updated = records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          values: {
            ...r.values,
            [propertyId]: value
          }
        };
      }
      return r;
    });
    setRecords(updated);

    const targetRec = updated.find(r => r.id === recordId);
    if (targetRec) {
      await databasesService.updateRecord(recordId, { values: targetRec.values });
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(targetRec);
      }
    }
  };

  const handleUpdateRecordTitle = async (recordId: string, newTitle: string) => {
    const updated = records.map(r => r.id === recordId ? { ...r, title: newTitle } : r);
    setRecords(updated);
    await databasesService.updateRecord(recordId, { title: newTitle });
    if (selectedRecord && selectedRecord.id === recordId) {
      setSelectedRecord(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
    if (selectedRecord?.id === recordId) setSelectedRecord(null);
    await databasesService.deleteRecord(recordId);
  };

  const getPropertyIcon = (type: PropertyType) => {
    switch (type) {
      case 'text': return <Type size={13} />;
      case 'number': return <Hash size={13} />;
      case 'select': return <Tag size={13} />;
      case 'date': return <Calendar size={13} />;
      case 'checkbox': return <CheckSquare size={13} />;
      case 'url': return <LinkIcon size={13} />;
      case 'email': return <Mail size={13} />;
      default: return <Tag size={13} />;
    }
  };

  if (!activeDb) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <Database size={40} className="mx-auto text-slate-300 dark:text-zinc-700" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-200">
          Nenhuma Base de Dados Encontrada
        </h2>
        <p className="text-xs text-slate-500">
          Crie sua primeira base de dados flexível com campos personalizados, estilo Notion.
        </p>
        <button
          type="button"
          onClick={() => setIsNewDbModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
        >
          Criar Base de Dados
        </button>

        {isNewDbModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-left space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Nova Base de Dados
              </h3>
              <form onSubmit={handleCreateDatabase} className="space-y-3">
                <input
                  type="text"
                  required
                  value={newDbName}
                  onChange={e => setNewDbName(e.target.value)}
                  placeholder="Nome da base (ex: Roadmap, Clientes)"
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDbModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`py-6 px-4 md:px-8 mx-auto space-y-6 ${isFullWidth ? 'max-w-full' : 'max-w-6xl'}`}>
      {/* Header and Database Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 bg-slate-100 dark:bg-zinc-800 rounded-xl">
            {activeDb.icon || '🗄️'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                {activeDb.name}
              </h1>
              {databases.length > 1 && (
                <select
                  value={activeDb.id}
                  onChange={e => setCurrentDbId(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-zinc-800 border-none rounded px-2 py-1 text-slate-600 dark:text-zinc-400"
                >
                  {databases.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {records.length} registros cadastrados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewDbModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300"
          >
            + Nova Base
          </button>
          <button
            type="button"
            onClick={handleAddRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors"
          >
            <Plus size={14} />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Views Bar (Table, Kanban, List) */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'table'
                ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <TableIcon size={14} />
            <span>Tabela</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'kanban'
                ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Columns size={14} />
            <span>Quadro Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'list'
                ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <LayoutList size={14} />
            <span>Lista</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPropModalOpen(true)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium"
        >
          <Plus size={13} />
          <span>Nova Propriedade</span>
        </button>
      </div>

      {/* TABLE VIEW */}
      {activeTab === 'table' && (
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-x-auto shadow-2xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                <th className="p-3 font-semibold min-w-[200px]">Nome</th>
                {activeDb.properties.map(prop => (
                  <th key={prop.id} className="p-3 font-semibold min-w-[150px]">
                    <div className="flex items-center gap-1.5">
                      {getPropertyIcon(prop.type)}
                      <span>{prop.name}</span>
                    </div>
                  </th>
                ))}
                <th className="p-3 w-10 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {records.map(rec => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 group"
                >
                  <td className="p-3">
                    <input
                      type="text"
                      value={rec.title}
                      onChange={e => handleUpdateRecordTitle(rec.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-hidden font-medium text-slate-900 dark:text-zinc-100"
                    />
                  </td>
                  {activeDb.properties.map(prop => {
                    const val = rec.values?.[prop.id];
                    return (
                      <td key={prop.id} className="p-3">
                        {prop.type === 'select' ? (
                          <select
                            value={val || ''}
                            onChange={e => handleUpdateRecordField(rec.id, prop.id, e.target.value)}
                            className="bg-transparent border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-zinc-300"
                          >
                            <option value="">Nenhum</option>
                            {(prop.options || []).map(opt => (
                              <option key={opt.id} value={opt.label}>{opt.label}</option>
                            ))}
                          </select>
                        ) : prop.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={e => handleUpdateRecordField(rec.id, prop.id, e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        ) : prop.type === 'date' ? (
                          <input
                            type="date"
                            value={val || ''}
                            onChange={e => handleUpdateRecordField(rec.id, prop.id, e.target.value)}
                            className="bg-transparent border-none outline-hidden text-slate-700 dark:text-zinc-300"
                          />
                        ) : (
                          <input
                            type={prop.type === 'number' ? 'number' : 'text'}
                            value={val || ''}
                            onChange={e => handleUpdateRecordField(rec.id, prop.id, e.target.value)}
                            placeholder="Vazio"
                            className="w-full bg-transparent border-none outline-hidden text-slate-700 dark:text-zinc-300 placeholder:text-slate-300"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum registro ainda. Clique em "+ Novo Registro" para adicionar.
            </div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['A Fazer', 'Em Andamento', 'Concluído'].map(columnStatus => {
            const colRecords = records.filter(r => (r.values?.['prop_status'] || 'A Fazer') === columnStatus);
            return (
              <div
                key={columnStatus}
                className="bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3 min-h-[350px] space-y-3"
              >
                <div className="flex items-center justify-between font-semibold text-xs text-slate-700 dark:text-zinc-300">
                  <span>{columnStatus}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-zinc-800 rounded-full">
                    {colRecords.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colRecords.map(rec => (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-xl shadow-2xs hover:border-indigo-400 cursor-pointer space-y-1.5"
                    >
                      <span className="text-xs font-medium text-slate-900 dark:text-zinc-100 block truncate">
                        {rec.title}
                      </span>
                      {rec.values?.['prop_date'] && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {rec.values['prop_date']}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {activeTab === 'list' && (
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 divide-y divide-slate-100 dark:divide-zinc-800 shadow-2xs">
          {records.map(rec => (
            <div
              key={rec.id}
              onClick={() => setSelectedRecord(rec)}
              className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                {rec.title}
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {rec.values?.['prop_status'] && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px]">
                    {rec.values['prop_status']}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecord(rec.id);
                  }}
                  className="hover:text-rose-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Property Modal */}
      {isNewPropModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Adicionar Nova Propriedade
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Nome da coluna / propriedade
                </label>
                <input
                  type="text"
                  value={newPropName}
                  onChange={e => setNewPropName(e.target.value)}
                  placeholder="Ex: Responsável, Categoria, Valor"
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Tipo de dado
                </label>
                <select
                  value={newPropType}
                  onChange={e => setNewPropType(e.target.value as PropertyType)}
                  className="w-full text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-slate-900 dark:text-zinc-100"
                >
                  <option value="text">Texto simples</option>
                  <option value="number">Número</option>
                  <option value="select">Seleção (Select)</option>
                  <option value="date">Data</option>
                  <option value="checkbox">Caixa de seleção (Checkbox)</option>
                  <option value="url">Link / URL</option>
                  <option value="email">E-mail</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPropModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddProperty}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium"
                >
                  Salvar Propriedade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 w-full max-w-lg h-full p-6 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs uppercase font-semibold text-slate-400">
                Registro da Base
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <input
                type="text"
                value={selectedRecord.title}
                onChange={e => handleUpdateRecordTitle(selectedRecord.id, e.target.value)}
                className="w-full text-xl font-bold text-slate-900 dark:text-zinc-100 bg-transparent border-none outline-hidden"
              />

              <div className="space-y-3 pt-2">
                {activeDb.properties.map(prop => {
                  const val = selectedRecord.values?.[prop.id];
                  return (
                    <div key={prop.id} className="grid grid-cols-3 gap-2 items-center text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 truncate">
                        {getPropertyIcon(prop.type)}
                        {prop.name}
                      </span>
                      <div className="col-span-2">
                        {prop.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={e => handleUpdateRecordField(selectedRecord.id, prop.id, e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                        ) : prop.type === 'date' ? (
                          <input
                            type="date"
                            value={val || ''}
                            onChange={e => handleUpdateRecordField(selectedRecord.id, prop.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded p-1 text-slate-800 dark:text-zinc-200"
                          />
                        ) : (
                          <input
                            type={prop.type === 'number' ? 'number' : 'text'}
                            value={val || ''}
                            onChange={e => handleUpdateRecordField(selectedRecord.id, prop.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded p-1.5 text-slate-800 dark:text-zinc-200"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between">
              <button
                type="button"
                onClick={() => handleDeleteRecord(selectedRecord.id)}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Excluir registro</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
