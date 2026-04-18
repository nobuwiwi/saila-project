import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { cardsApi } from '../../api/cards';
import { CardDetailDrawer } from './CardDetailDrawer';
import type { Workspace, BusinessCard } from '../../types';

interface OutletContext {
  selectedWorkspace: Workspace | null;
}

export function CardsPage() {
  const { selectedWorkspace } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();

  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    thumbnail: true,
    company: true,
    name: true,
    title: true,
    phone: true,
    email: true,
    date: true,
    status: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards', selectedWorkspace?.id],
    queryFn: () => cardsApi.getCards(selectedWorkspace?.id),
    enabled: !!selectedWorkspace,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BusinessCard> }) =>
      cardsApi.updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', selectedWorkspace?.id] });
    },
  });

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">
          左サイドバーからワークスペースを選択してください
        </p>
      </div>
    );
  }

  const handleRowClick = (card: BusinessCard) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#eeeeee] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-end p-3 border-b border-[#eeeeee] bg-gray-50/50">
        <div className="relative">
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            表示項目
          </button>
          
          {showColMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColMenu(false)} />
              <div className="absolute right-0 mt-1 max-h-64 overflow-y-auto w-48 bg-white border border-gray-200 shadow-lg rounded-md z-20 py-1">
                {Object.entries({
                  thumbnail: '名刺画像',
                  company: '会社名',
                  name: '氏名',
                  title: '役職',
                  phone: '電話番号',
                  email: 'メールアドレス',
                  date: '登録日',
                  status: 'ステータス',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                      className="rounded border-gray-300 text-[#6366f1] focus:ring-[#6366f1]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <span className="text-sm text-gray-400">読み込み中...</span>
          </div>
        ) : !cards || cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-[14px] font-medium text-gray-900">名刺がありません</h3>
            <p className="text-[13px] text-gray-500 mt-1">
              「名刺を追加」から新しい名刺を登録してください。
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-[#f7f7f8] sticky top-0 z-10 border-b border-[#eeeeee]">
              <tr>
                {visibleColumns.thumbnail && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-16">画像</th>}
                {visibleColumns.company && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">会社名</th>}
                {visibleColumns.name && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">氏名</th>}
                {visibleColumns.title && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">役職</th>}
                {visibleColumns.phone && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">電話番号</th>}
                {visibleColumns.email && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">メールアドレス</th>}
                {visibleColumns.status && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-24">状態</th>}
                {visibleColumns.date && <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-28 text-right">登録日</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {cards.map((card) => (
                <tr 
                  key={card.id} 
                  onClick={() => handleRowClick(card)}
                  className="group hover:bg-[#fcfcff] cursor-pointer transition-colors"
                >
                  {visibleColumns.thumbnail && (
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                       {card.thumbnail ? (
                         <div className="relative group/thumb w-12 h-8">
                           <img 
                             src={card.thumbnail} 
                             alt="thumbnail" 
                             className="w-full h-full object-cover rounded shadow-sm border border-gray-200"
                           />
                           {/* Hover preview */}
                           <div className="hidden group-hover/thumb:block absolute top-[110%] left-[-20%] z-50 p-1 bg-white border border-gray-200 shadow-xl rounded-lg pointer-events-none">
                             <img src={card.image ?? card.thumbnail} alt="preview" className="w-[300px] max-w-none object-contain rounded-md" />
                           </div>
                         </div>
                       ) : (
                         <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                           <span className="text-[10px] text-gray-400">No Img</span>
                         </div>
                       )}
                    </td>
                  )}
                  {visibleColumns.company && (
                    <td className="px-4 py-3 text-[13px] text-gray-900 truncate max-w-[150px]">
                      <EditableCell 
                         value={card.parsed_data?.company_name} 
                         onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, company_name: val } } })} 
                      />
                    </td>
                  )}
                  {visibleColumns.name && (
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-900 truncate max-w-[120px]">
                      <EditableCell 
                         value={card.parsed_data?.full_name} 
                         onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, full_name: val } } })} 
                      />
                    </td>
                  )}
                  {visibleColumns.title && (
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                      <EditableCell 
                         value={card.parsed_data?.title} 
                         onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, title: val } } })} 
                      />
                    </td>
                  )}
                  {visibleColumns.phone && (
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                      <EditableCell 
                         value={card.parsed_data?.phone || card.parsed_data?.mobile} 
                         onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, phone: val } } })} 
                      />
                    </td>
                  )}
                  {visibleColumns.email && (
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[150px]">
                      <EditableCell 
                         value={card.parsed_data?.email} 
                         onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, email: val } } })} 
                      />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={card.analysis_status} />
                    </td>
                  )}
                  {visibleColumns.date && (
                    <td className="px-4 py-3 text-[12px] text-gray-400 text-right whitespace-nowrap">
                      {new Date(card.created_at).toLocaleDateString()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CardDetailDrawer 
        isOpen={drawerOpen} 
        card={selectedCard} 
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCard(null);
        }} 
      />
    </div>
  );
}

// Badge Component
function StatusBadge({ status }: { status: BusinessCard['analysis_status'] }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
    processing: 'bg-blue-50 text-blue-600 border-blue-200',
    done: 'bg-green-50 text-green-600 border-green-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
  };
  const labels = {
    pending: '解析待ち',
    processing: '解析中',
    done: '完了',
    failed: '失敗',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Editable Cell Component
function EditableCell({ value, onSave }: { value?: string, onSave: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const commit = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        onClick={(e) => e.stopPropagation()} // Edit itself shouldn't trigger row click
        className="w-full px-1 py-0.5 text-[13px] border-b border-[#6366f1] focus:outline-none bg-white -mx-1"
      />
    );
  }

  return (
    <div 
      onDoubleClick={(e) => {
        e.stopPropagation();
        setLocalValue(value || '');
        setIsEditing(true);
      }}
      className="min-h-[20px] w-full"
    >
      {value || <span className="text-transparent group-hover:text-gray-300">-</span>}
    </div>
  );
}
