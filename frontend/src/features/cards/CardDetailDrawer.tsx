import { useState, useEffect } from 'react';
import { X, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../../api/cards';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { BusinessCardView } from '../../components/BusinessCardView';
import type { BusinessCard, ParsedData, Workspace } from '../../types';

interface CardDetailDrawerProps {
  card: BusinessCard | null;
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}

export function CardDetailDrawer({ card, isOpen, onClose, workspace }: CardDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { workspaces } = useWorkspaceStore();
  const [formData, setFormData] = useState<ParsedData>({});
  const [memo, setMemo] = useState('');
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData(card.parsed_data || {});
      setMemo(card.memo || '');
    }
  }, [card]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BusinessCard>) => cardsApi.updateCard(card!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => cardsApi.deleteCard(card!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      onClose();
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => cardsApi.triggerAnalyze(card!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  if (!isOpen || !card) return null;

  const axes = workspace?.axes ?? [];

  const handleUpdateField = (field: keyof ParsedData, value: string) => {
    if (value === formData[field]) return;
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateMutation.mutate({ parsed_data: newData });
  };

  const handleUpdateMemo = (value: string) => {
    if (value === card.memo) return;
    setMemo(value);
    updateMutation.mutate({ memo: value });
  };

  const handleAxisChange = (axisId: string) => {
    const newAxis = axisId === '' ? null : axisId;
    updateMutation.mutate({ axis: newAxis } as any);
  };

  const handleWorkspaceChange = (newWorkspaceId: string) => {
    if (newWorkspaceId === card.workspace) return;
    if (confirm('名刺を別のワークスペースに移動しますか？\n（現在設定されている事業軸は解除されます）')) {
      updateMutation.mutate({ workspace: newWorkspaceId, axis: null } as any);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('名刺をゴミ箱に移動しますか？')) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[400px] max-w-full bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#eeeeee]">
          <h2 className="text-[16px] font-semibold text-gray-900">名刺詳細</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* BusinessCardView （名刺風HTML再現） */}
          <div>
            <BusinessCardView card={card} accentColor={workspace?.color} size="full" />
          </div>

          {/* 元の名刺画像を見る（折りたたみ） */}
          {card.image && (
            <div className="border border-[#eeeeee] rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setImageOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-[12px] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span>元の名刺画像を見る</span>
                {imageOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {imageOpen && (
                <div className="border-t border-[#eeeeee] flex items-center justify-center bg-gray-50 p-3">
                  <img src={card.image} alt="元名刺画像" className="max-w-full object-contain rounded" />
                </div>
              )}
            </div>
          )}

          {/* ワークスペース移動 */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-gray-500">ワークスペース</label>
            <select
              value={card.workspace}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md
                         focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-transparent
                         bg-white text-gray-700"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          {/* 事業軸の仕分け（事業軸が1つ以上ある場合） */}
          {axes.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-500">事業軸</label>
              <select
                value={card.axis ?? ''}
                onChange={(e) => handleAxisChange(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md
                           focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-transparent
                           bg-white text-gray-700"
              >
                <option value="">未分類</option>
                {axes.map(ax => (
                  <option key={ax.id} value={ax.id}>{ax.axis_display}</option>
                ))}
              </select>
              {updateMutation.isPending && (
                <p className="text-[11px] text-gray-400">保存中...</p>
              )}
            </div>
          )}

          {/* AI Analysis trigger */}
          {card.analysis_status !== 'done' && (
            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-700">状態:
                  {card.analysis_status === 'pending' && <span className="text-gray-500 font-semibold ml-1">解析待ち</span>}
                  {card.analysis_status === 'processing' && <span className="text-blue-500 font-semibold ml-1">解析中</span>}
                  {card.analysis_status === 'failed' && <span className="text-red-500 font-semibold ml-1">解析失敗</span>}
                </span>
                <button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending || card.analysis_status === 'processing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-[12px] font-medium rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
                  {analyzeMutation.isPending ? 'リクエスト中...' : '再解析する'}
                </button>
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            <FieldInput label="会社名" value={formData.company_name} onBlur={(v) => handleUpdateField('company_name', v)} />
            <FieldInput label="氏名" value={formData.full_name} onBlur={(v) => handleUpdateField('full_name', v)} />
            <FieldInput label="役職" value={formData.title} onBlur={(v) => handleUpdateField('title', v)} />
            <FieldInput label="メールアドレス" value={formData.email} onBlur={(v) => handleUpdateField('email', v)} type="email" />
            <FieldInput label="電話番号" value={formData.phone} onBlur={(v) => handleUpdateField('phone', v)} type="tel" />
            <FieldInput label="携帯電話" value={formData.mobile} onBlur={(v) => handleUpdateField('mobile', v)} type="tel" />
            <FieldInput label="住所" value={formData.address} onBlur={(v) => handleUpdateField('address', v)} />
            <FieldInput label="Webサイト" value={formData.website} onBlur={(v) => handleUpdateField('website', v)} />
            <FieldInput label="部署" value={formData.department} onBlur={(v) => handleUpdateField('department', v)} />
            <FieldInput label="補足情報" value={formData.notes} onBlur={(v) => handleUpdateField('notes', v)} />

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-gray-500">メモ</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onBlur={() => handleUpdateMemo(memo)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[transparent] min-h-[80px]"
                placeholder="ユーザーメモを追加..."
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#eeeeee] flex justify-end">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            削除する
          </button>
        </div>
      </div>
    </>
  );
}

function FieldInput({
  label, value, onBlur, type = 'text'
}: {
  label: string; value?: string; onBlur: (val: string) => void; type?: string;
}) {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);

  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-gray-500">{label}</label>
      <input
        type={type}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={() => onBlur(localVal)}
        onKeyDown={(e) => e.key === 'Enter' && onBlur(localVal)}
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[transparent] transition-shadow"
      />
    </div>
  );
}
