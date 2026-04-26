import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../../api/cards';
import { CardDetailDrawer } from './CardDetailDrawer';
import { CardUploadModal } from './CardUploadModal';
import type { Workspace, BusinessCard } from '../../types';

interface OutletContext {
  selectedWorkspace: Workspace | null;
  onUpgradeRequired: (message: string) => void;
}

export function CardsPage() {
  const { selectedWorkspace, onUpgradeRequired } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();

  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // 選択中のタブ: null = 未分類, axisId = 特定の事業軸
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', selectedWorkspace?.id],
    queryFn: () => cardsApi.getCards(selectedWorkspace?.id),
    enabled: !!selectedWorkspace,
    refetchInterval: (query) => {
      const data = query.state?.data;
      if (Array.isArray(data)) {
        return data.some(c => c.analysis_status === 'pending' || c.analysis_status === 'processing') ? 3000 : false;
      }
      return false;
    }
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
        <p className="text-sm text-gray-400">左サイドバーからワークスペースを選択してください</p>
      </div>
    );
  }

  const axes = selectedWorkspace.axes ?? [];

  // カードを事業軸ごとに集計（タブのバッジ用）
  const uncategorizedCards = cards.filter(c => !c.axis);
  const cardsByAxisId: Record<string, BusinessCard[]> = {};
  for (const ax of axes) {
    cardsByAxisId[ax.id] = cards.filter(c => c.axis === ax.id);
  }

  // 表示中のカード（選択タブに応じてフィルタ）
  const displayedCards = useMemo(() => {
    if (activeTabId === null) return uncategorizedCards;
    return cardsByAxisId[activeTabId] ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, cards]);

  // タブ一覧: 未分類 + 各事業軸
  const tabs: { id: string | null; label: string; count: number }[] = [
    { id: null, label: '未分類', count: uncategorizedCards.length },
    ...axes.map(ax => ({ id: ax.id, label: ax.axis_display, count: cardsByAxisId[ax.id]?.length ?? 0 })),
  ];

  const activeTabLabel = tabs.find(t => t.id === activeTabId)?.label ?? '未分類';

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#eeeeee] overflow-hidden">

      {/* ===== タブバー ===== */}
      <div className="flex items-center gap-0 border-b border-[#eeeeee] px-4 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.id ?? '__uncategorized__'}
            onClick={() => setActiveTabId(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap
              ${activeTabId === tab.id
                ? 'text-[#6366f1] border-b-2 border-[#6366f1] -mb-px'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold
              ${activeTabId === tab.id ? 'bg-[#eef2ff] text-[#6366f1]' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}

        {/* スペーサー + 追加ボタン */}
        <div className="flex-1" />
        <button
          id="add-card-btn"
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 my-2 text-[12px] font-medium text-white bg-[#6366f1]
                     rounded-md hover:bg-[#5254cc] transition-colors
                     focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1"
        >
          <span className="text-sm leading-none">+</span>
          <span>名刺を追加</span>
        </button>
      </div>

      {/* ===== テーブル ===== */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <span className="text-sm text-gray-400">読み込み中...</span>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-[14px] font-medium text-gray-900">
              {activeTabId === null ? '未分類の名刺がありません' : `「${activeTabLabel}」の名刺がありません`}
            </h3>
            <p className="text-[13px] text-gray-500 mt-1">
              {activeTabId === null
                ? '「名刺を追加」から新しい名刺を登録してください。'
                : '未分類タブから名刺を移動してください。'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-[#f7f7f8] sticky top-0 z-10 border-b border-[#eeeeee]">
              <tr>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-16">画像</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">会社名</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">氏名</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">役職</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">電話番号</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500">メールアドレス</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-24">状態</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500 w-28 text-right">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeeee]">
              {displayedCards.map((card) => (
                <tr
                  key={card.id}
                  onClick={() => { setSelectedCard(card); setDrawerOpen(true); }}
                  className="group hover:bg-[#fcfcff] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    {card.thumbnail ? (
                      <div className="relative group/thumb w-12 h-8">
                        <img src={card.thumbnail} alt="thumbnail" className="w-full h-full object-cover rounded shadow-sm border border-gray-200" />
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
                  <td className="px-4 py-3 text-[13px] text-gray-900 truncate max-w-[150px]">
                    <EditableCell value={card.parsed_data?.company_name}
                      onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, company_name: val } } })} />
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900 truncate max-w-[120px]">
                    <EditableCell value={card.parsed_data?.full_name}
                      onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, full_name: val } } })} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                    <EditableCell value={card.parsed_data?.title}
                      onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, title: val } } })} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                    <EditableCell value={card.parsed_data?.phone || card.parsed_data?.mobile}
                      onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, phone: val } } })} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[150px]">
                    <EditableCell value={card.parsed_data?.email}
                      onSave={(val) => updateMutation.mutate({ id: card.id, data: { parsed_data: { ...card.parsed_data, email: val } } })} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={card.analysis_status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-400 text-right whitespace-nowrap">
                    {new Date(card.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CardDetailDrawer
        isOpen={drawerOpen}
        card={selectedCard}
        workspace={selectedWorkspace}
        onClose={() => { setDrawerOpen(false); setSelectedCard(null); }}
      />

      {uploadModalOpen && (
        <CardUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          workspace={selectedWorkspace}
          onUpgradeRequired={(message) => {
            setUploadModalOpen(false);
            onUpgradeRequired(message);
          }}
        />
      )}
    </div>
  );
}

// ===== Badge =====
function StatusBadge({ status }: { status: BusinessCard['analysis_status'] }) {
  const styles = { pending: 'bg-gray-100 text-gray-600 border-gray-200', processing: 'bg-blue-50 text-blue-600 border-blue-200', done: 'bg-green-50 text-green-600 border-green-200', failed: 'bg-red-50 text-red-600 border-red-200' };
  const labels = { pending: '解析待ち', processing: '解析中', done: '完了', failed: '失敗' };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${styles[status]}`}>{labels[status]}</span>;
}

// ===== Editable Cell =====
function EditableCell({ value, onSave }: { value?: string; onSave: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const commit = () => { setIsEditing(false); if (localValue !== value) onSave(localValue); };
  if (isEditing) {
    return <input autoFocus value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} onClick={(e) => e.stopPropagation()} className="w-full px-1 py-0.5 text-[13px] border-b border-[#6366f1] focus:outline-none bg-white -mx-1" />;
  }
  return (
    <div onDoubleClick={(e) => { e.stopPropagation(); setLocalValue(value || ''); setIsEditing(true); }} className="min-h-[20px] w-full">
      {value || <span className="text-transparent group-hover:text-gray-300">-</span>}
    </div>
  );
}
