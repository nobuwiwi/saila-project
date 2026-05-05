import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../../api/cards';
import { CardDetailDrawer } from './CardDetailDrawer';
import { CardUploadModal } from './CardUploadModal';
import { BusinessCardView } from '../../components/BusinessCardView';
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

  // 事業軸ごとにカードを仕分け
  const uncategorizedCards = cards.filter(c => !c.axis);
  const cardsByAxisId: Record<string, BusinessCard[]> = {};
  for (const ax of axes) {
    cardsByAxisId[ax.id] = cards.filter(c => c.axis === ax.id);
  }

  // セクション一覧: 未分類 → 各事業軸（事業軸が0件の場合は未分類のみ）
  const sections: { id: string | null; label: string | null; cards: BusinessCard[] }[] = [
    ...(axes.length > 0 ? [{ id: null, label: '未分類', cards: uncategorizedCards }] : [{ id: null, label: null, cards }]),
    ...axes.map(ax => ({ id: ax.id, label: ax.axis_display, cards: cardsByAxisId[ax.id] ?? [] })),
  ];

  const handleRowClick = (card: BusinessCard) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ページ上部：追加ボタン */}
      <div className="flex justify-end">
        <button
          id="add-card-btn"
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6366f1] text-white
                     text-[13px] font-medium rounded-md hover:bg-[#5254cc] active:bg-[#4748b8]
                     transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2"
        >
          <span className="text-base leading-none">+</span>
          <span>名刺を追加</span>
        </button>
      </div>

      {/* ローディング */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-lg border border-[#eeeeee]">
          <span className="text-sm text-gray-400">読み込み中...</span>
        </div>
      ) : (
        sections.map(section => (
          <AxisSection
            key={section.id ?? '__uncategorized__'}
            label={section.label}
            cards={section.cards}
            workspace={selectedWorkspace}
            onRowClick={handleRowClick}
            onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          />
        ))
      )}

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

// ===== 事業軸セクション =====
function AxisSection({
  label,
  cards,
  workspace,
  onRowClick,
  onUpdate,
}: {
  label: string | null;
  cards: BusinessCard[];
  workspace: Workspace;
  onRowClick: (card: BusinessCard) => void;
  onUpdate: (id: string, data: Partial<BusinessCard>) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#eeeeee] overflow-hidden">
      {/* セクションヘッダー（事業軸がある場合のみ表示） */}
      {label !== null && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#eeeeee] bg-[#f7f7f8]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: workspace.color }} />
          <h2 className="text-[13px] font-semibold text-gray-700">{label}</h2>
          <span className="text-[11px] text-gray-400">{cards.length} 枚</span>
        </div>
      )}

      {/* 空状態 */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-[13px] text-gray-400">
            {label === '未分類'
              ? '名刺がありません。「名刺を追加」から登録してください。'
              : `「${label}」に仕分けされた名刺はありません。`}
          </p>
        </div>
      ) : (
        <>
          {/* モバイル用カードリスト表示 */}
          <div className="md:hidden divide-y divide-[#eeeeee]">
            {cards.map(card => (
              <div 
                key={card.id} 
                onClick={() => onRowClick(card)} 
                className="p-4 flex gap-3 cursor-pointer hover:bg-[#fcfcff] transition-colors"
              >
                {/* 名刺カード（mini） */}
                <div className="shrink-0 pt-1">
                  <BusinessCardView card={card} accentColor={workspace.color} size="mini" />
                </div>
                {/* 情報 */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-gray-500 truncate mb-0.5">
                        {card.parsed_data?.company_name || <span className="text-gray-300">会社名未設定</span>}
                      </div>
                      <div className="text-[14px] font-semibold text-gray-900 truncate">
                        {card.parsed_data?.full_name || <span className="text-gray-300">氏名未設定</span>}
                      </div>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      <StatusBadge status={card.analysis_status} />
                    </div>
                  </div>
                  <div className="text-[12px] text-gray-500 flex flex-col gap-0.5">
                    <span className="truncate">{card.parsed_data?.title || <span className="text-transparent">-</span>}</span>
                    <span className="truncate">{card.parsed_data?.email || <span className="text-transparent">-</span>}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* デスクトップ用テーブル表示 */}
          <div className="hidden md:block overflow-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="bg-[#f7f7f8] sticky top-0 z-10 border-b border-[#eeeeee]">
                <tr>
                  <th className="px-4 py-2.5 text-[12px] font-medium text-gray-500" style={{ width: 140 }}>名刺</th>
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
                      <div className="relative group/thumb" style={{ width: 120 }}>
                        <BusinessCardView card={card} accentColor={workspace.color} size="mini" />
                        {/* ホバーポップオーバー：フルサイズプレビュー */}
                        <div
                          className="hidden group-hover/thumb:block absolute z-50 pointer-events-none"
                          style={{ top: '110%', left: 0, width: 320, padding: 8, backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                        >
                          <BusinessCardView card={card} accentColor={workspace.color} size="full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-900 truncate max-w-[150px]">
                      <EditableCell value={card.parsed_data?.company_name}
                        onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, company_name: val } })} />
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-gray-900 truncate max-w-[120px]">
                      <EditableCell value={card.parsed_data?.full_name}
                        onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, full_name: val } })} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                      <EditableCell value={card.parsed_data?.title}
                        onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, title: val } })} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[120px]">
                      <EditableCell value={card.parsed_data?.phone || card.parsed_data?.mobile}
                        onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, phone: val } })} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 truncate max-w-[150px]">
                      <EditableCell value={card.parsed_data?.email}
                        onSave={(val) => onUpdate(card.id, { parsed_data: { ...card.parsed_data, email: val } })} />
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
        </>
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
