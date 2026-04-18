import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';
import { cardsApi } from '../../api/cards';

export function TrashPage() {
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards', 'trash'],
    queryFn: () => cardsApi.getTrash(),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => cardsApi.restoreCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', 'trash'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] }); // also invalidate workspace cards
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => cardsApi.hardDeleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', 'trash'] });
    },
  });

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const handleHardDelete = (id: string) => {
    if (confirm('完全に削除しますか？この操作は取り消せません。')) {
      hardDeleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[#eeeeee] overflow-hidden">
      {/* 警告メッセージ */}
      <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[14px] font-medium text-orange-800">ゴミ箱</h3>
          <p className="text-[13px] text-orange-600 mt-1">
            ゴミ箱に移動した名刺は、削除から7日後（168時間後）に自動的に完全削除されます。
          </p>
        </div>
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <span className="text-sm text-gray-400">読み込み中...</span>
          </div>
        ) : !cards || cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[14px] font-medium text-gray-900">ゴミ箱は空です</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className="flex items-center gap-4 p-4 border border-[#eeeeee] rounded-lg hover:border-gray-300 transition-colors bg-white shadow-sm"
              >
                 {card.thumbnail ? (
                   <img 
                     src={card.thumbnail} 
                     alt="thumbnail" 
                     className="w-16 h-10 object-cover rounded shadow-sm shrink-0 border border-gray-200"
                   />
                 ) : (
                   <div className="w-16 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center shrink-0">
                     <span className="text-[10px] text-gray-400">No Img</span>
                   </div>
                 )}

                 <div className="flex-1 min-w-0">
                   <h4 className="text-[14px] font-medium text-gray-900 truncate">
                     {card.parsed_data?.company_name || '会社名なし'}
                   </h4>
                   <p className="text-[13px] text-gray-500 truncate mt-0.5">
                     {card.parsed_data?.full_name || '氏名なし'}
                   </p>
                   <p className="text-[11px] text-gray-400 mt-1">
                     削除日時: {card.deleted_at ? new Date(card.deleted_at).toLocaleString() : '-'}
                   </p>
                 </div>

                 <div className="flex items-center gap-2 shrink-0">
                   <button
                     onClick={() => handleRestore(card.id)}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6366f1] bg-[#f0f0fe] hover:bg-[#e4e5fd] rounded transition-colors"
                   >
                     <RefreshCcw className="w-3.5 h-3.5" />
                     復元
                   </button>
                   <button
                     onClick={() => handleHardDelete(card.id)}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     完全削除
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
