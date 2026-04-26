import { useState } from 'react';
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
  const [uploadAxisId, setUploadAxisId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  const handleAddCard = (axisId: string | null) => {
    setUploadAxisId(axisId);
    setUploadModalOpen(true);
  };

  // 事業軸ごとに名刺を仕分け
  const axes = selectedWorkspace.axes ?? [];
  const cardsByAxis: Record<string, BusinessCard[]> = {};
  const uncategorized: BusinessCard[] = [];

  for (const ax of axes) {
    cardsByAxis[ax.id] = [];
  }

  for (const card of cards) {
    if (card.axis && cardsByAxis[card.axis] !== undefined) {
      cardsByAxis[card.axis].push(card);
    } else {
      uncategorized.push(card);
    }
  }

  // 事業軸がひとつも設定されていない場合は従来の単一テーブル表示
  const hasSingleTable = axes.length === 0;
  const tableGroups: { id: string | null; label: string | null; cards: BusinessCard[] }[] = hasSingleTable
    ? [{ id: null, label: null, cards }]
    : [
        ...axes.map(ax => ({ id: ax.id, label: ax.axis_display, cards: cardsByAxis[ax.id] })),
        ...(uncategorized.length > 0 ? [{ id: null, label: '未分類', cards: uncategorized }] : []),
      ];

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-sm text-gray-400">読み込み中...</span>
        </div>
      ) : (
        tableGroups.map((group) => (
          <AxisSection
            key={group.id ?? '__uncategorized__'}
            label={group.label}
            cards={group.cards}
            workspace={selectedWorkspace}
            onRowClick={handleRowClick}
            onAddCard={() => handleAddCard(group.id)}
            onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          />
        ))
      )}

      {/* 事業軸が0件の場合の空状態 */}
      {!isLoading && hasSingleTable && cards.length === 0 && (
        <EmptyState onAddCard={() => handleAddCard(null)} />
      )}

      <CardDetailDrawer
        isOpen={drawerOpen}
        card={selectedCard}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCard(null);
        }}
      />

      {selectedWorkspace && uploadModalOpen && (
        <CardUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          workspace={selectedWorkspace}
          axisId={uploadAxisId}
          onUpgradeRequired={(message) => {
            setUploadModalOpen(false);
            onUpgradeRequired(message);
          }}
        />
      )}
    </div>
  );
}

// ===== 事業軸ごとのセクション =====
function AxisSection({
  label,
  cards,
  workspace,
  onRowClick,
  onAddCard,
  onUpdate,
}: {
  label: string | null;
  cards: BusinessCard[];
  workspace: Workspace;
  onRowClick: (card: BusinessCard) => void;
  onAddCard: () => void;
  onUpdate: (id: string, data: Partial<BusinessCard>) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#eeeeee] overflow-hidden">
      {/* セクションヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eeeeee] bg-[#f7f7f8]">
        <div className="flex items-center gap-2">
          {label && (
            <>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: workspace.color }}
              />
              <h2 className="text-[13px] font-semibold text-gray-700">{label}</h2>
              <span className="text-[11px] text-gray-400 ml-1">{cards.length} 枚</span>
            </>
          )}
        </div>
        <button
          id={`add-card-btn-${label ?? 'default'}`}
          onClick={onAddCard}
          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-white bg-[#6366f1]
                     rounded-md hover:bg-[#5254cc] active:bg-[#4748b8] transition-colors
                     focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1"
        >
          <span className="text-sm leading-none">+</span>
          <span>名刺を追加</span>
        </button>
      </div>

      {/* テーブル */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-[13px] text-gray-400">名刺がありません。「名刺を追加」から登録してください。</p>
        </div>
      ) : (
        <div className="overflow-auto">
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
              {cards.map((card) => (
                <tr
                  key={card.id}
                  onClick={() => onRowClick(card)}
                  className="group hover:bg-[#fcfcff] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    {card.thumbnail ? (
                      <div className="relative group/thumb w-12 h-8">
                        <img
                          src={card.thumbnail}
                          alt="thumbnail"
                          className="w-full h-full object-cover rounded shadow-sm border border-gray-200"
                        />
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
                    <EditableCell
                      value={card.parsed_data?.company_name}
                      onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, company_name: val } })}
                    />
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900 truncate max-w-[120px]">
                    <EditableCell
                      value={card.parsed_data?.full_name}
                      onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, full_name: val } })}
                    />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                    <EditableCell
                      value={card.parsed_data?.title}
                      onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, title: val } })}
                    />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                    <EditableCell
                      value={card.parsed_data?.phone || card.parsed_data?.mobile}
                      onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, phone: val } })}
                    />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[150px]">
                    <EditableCell
                      value={card.parsed_data?.email}
                      onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, email: val } })}
                    />
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
        </div>
      )}
    </div>
  );
}

// ===== 空状態（事業軸なしの場合） =====
function EmptyState({ onAddCard }: { onAddCard: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-[#eeeeee] flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-[14px] font-medium text-gray-900">名刺がありません</h3>
      <p className="text-[13px] text-gray-500 mt-1 mb-5">「名刺を追加」から新しい名刺を登録してください。</p>
      <button
        onClick={onAddCard}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6366f1] text-white
                   text-[13px] font-medium rounded-md hover:bg-[#5254cc] transition-colors"
      >
        <span className="text-base leading-none">+</span>
        <span>名刺を追加</span>
      </button>
    </div>
  );
}

// ===== Badge =====
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

// ===== Editable Cell =====
function EditableCell({ value, onSave }: { value?: string; onSave: (val: string) => void }) {
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
        onClick={(e) => e.stopPropagation()}
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
