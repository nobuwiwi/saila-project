import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axesApi } from '../../api/axes';
import type { Workspace, WorkspaceCreateInput } from '../../types';
import { RELATION_CHOICES, BUSINESS_AXIS_CHOICES } from '../../types';

const PRESET_COLORS = [
  { value: '#6366f1', label: 'インディゴ' },
  { value: '#0ea5e9', label: 'スカイ' },
  { value: '#10b981', label: 'エメラルド' },
  { value: '#f59e0b', label: 'アンバー' },
  { value: '#ef4444', label: 'レッド' },
  { value: '#8b5cf6', label: 'バイオレット' },
];

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkspaceCreateInput) => Promise<void>;
  workspace?: Workspace | null;
  isLoading?: boolean;
}

// ===== 編集用シンプルフォーム =====
function EditForm({
  workspace,
  onClose,
  onSubmit,
  isLoading,
}: {
  workspace: Workspace;
  onClose: () => void;
  onSubmit: (data: WorkspaceCreateInput) => Promise<void>;
  isLoading: boolean;
}) {
  const [description, setDescription] = useState(workspace.description);
  const [color, setColor] = useState(workspace.color);
  const [selectedAxisIds, setSelectedAxisIds] = useState<string[]>(
    workspace.axes?.map(a => a.id) ?? []
  );
  const [error, setError] = useState('');

  // 全事業軸の選択肢を取得
  const { data: existingAxes = [] } = useQuery({
    queryKey: ['user-axes'],
    queryFn: axesApi.getUserAxes,
  });

  const toggleAxis = (id: string) => {
    setSelectedAxisIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({ description: description.trim(), color, axis_ids: selectedAxisIds });
      onClose();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">ワークスペース名</p>
        <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md border border-gray-100">
          {workspace.name}
        </p>
      </div>

      <div>
        <label htmlFor="ws-description" className="block text-sm font-medium text-gray-700 mb-1.5">
          説明
        </label>
        <textarea
          id="ws-description"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none
                     focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
                     placeholder:text-gray-300"
          placeholder="任意の説明を入力..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* 事業軸 */}
      {existingAxes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">事業軸</label>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
            {existingAxes.map((ax) => {
              const checked = selectedAxisIds.includes(ax.id);
              return (
                <label
                  key={ax.id}
                  className={`flex items-center gap-3 px-3 py-2.5 border rounded-md cursor-pointer transition-colors ${
                    checked ? 'border-[#6366f1] bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 text-[#6366f1] border-gray-300 rounded focus:ring-[#6366f1]"
                    checked={checked}
                    onChange={() => toggleAxis(ax.id)}
                  />
                  <span className="text-sm text-gray-900">{ax.axis_display}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`w-7 h-7 rounded-full transition-all focus:outline-none ${
                color === c.value ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              aria-label={c.label}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-400">{color}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                     rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-md
                     hover:bg-[#5254cc] transition-colors disabled:opacity-50
                     focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2"
        >
          {isLoading ? '保存中...' : '更新'}
        </button>
      </div>
    </form>
  );
}

// ===== 新規作成ウィザード =====
function CreateWizard({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: WorkspaceCreateInput) => Promise<void>;
  isLoading: boolean;
}) {
  const TOTAL_STEPS = 4;
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [relationType, setRelationType] = useState('customer');
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [error, setError] = useState('');

  // 登録済み事業軸を取得
  const { data: existingAxes = [] } = useQuery({
    queryKey: ['user-axes'],
    queryFn: axesApi.getUserAxes,
  });
  const existingAxisValues = existingAxes.map((a) => a.axis);

  const previewName = companyName
    ? `${companyName}｜${RELATION_CHOICES.find((r) => r.value === relationType)?.label ?? ''}`
    : '';

  const toggleAxis = (val: string) => {
    setSelectedAxes((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const handlePrev = () => { setError(''); setStep((s) => Math.max(s - 1, 1)); };

  const handleFinish = async () => {
    setError('');
    try {
      // 新規事業軸（未登録のもの）を保存し、IDを収集
      const newAxes = selectedAxes.filter((a) => !existingAxisValues.includes(a));
      const newAxisRecords: { id: string }[] = [];
      for (const axis of newAxes) {
        const record = await axesApi.addAxis(axis);
        newAxisRecords.push(record);
      }

      // 選択済みの既存事業軸のIDも含める
      const existingSelected = existingAxes.filter(a => selectedAxes.includes(a.axis) || existingAxisValues.includes(a.axis));
      const axisIds = [
        ...existingSelected.map(a => a.id),
        ...newAxisRecords.map(a => a.id),
      ];

      await onSubmit({
        company_name: companyName.trim(),
        relation_type: relationType,
        color,
        axis_ids: axisIds,
      });
      onClose();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="px-6 py-5">
      {/* プログレスバー */}
      <div className="flex items-center gap-1.5 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-[#6366f1]' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      {/* STEP 1: 会社名 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">会社名 / 組織名</h3>
            <p className="mt-1 text-sm text-gray-500">名刺を受け取った相手の会社名や組織名を入力してください。</p>
          </div>
          <div>
            <label htmlFor="ws-company" className="block text-sm font-medium text-gray-700 mb-1.5">
              会社名 / 組織名 <span className="text-red-500">*</span>
            </label>
            <input
              id="ws-company"
              type="text"
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && companyName.trim()) handleNext(); }}
              placeholder="例: 株式会社A、副業プロジェクト"
              maxLength={100}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
                         placeholder:text-gray-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                         rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!companyName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-md
                         hover:bg-[#5254cc] transition-colors disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 関係性 */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">関係性</h3>
            <p className="mt-1 text-sm text-gray-500">この相手との関係性を選んでください。</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {RELATION_CHOICES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRelationType(r.value)}
                className={`px-3 py-2.5 text-sm rounded-md border text-left transition-colors ${
                  relationType === r.value
                    ? 'border-[#6366f1] bg-indigo-50/60 text-[#4f46e5] font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {previewName && (
            <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
              <p className="text-[11px] text-gray-400 mb-0.5">プレビュー</p>
              <p className="text-sm font-medium text-gray-900">{previewName}</p>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                         rounded-md hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-md
                         hover:bg-[#5254cc] transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 事業軸 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">事業軸（任意）</h3>
            <p className="mt-1 text-sm text-gray-500">
              このワークスペースに関連する事業領域を選んでください。複数選択可。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {BUSINESS_AXIS_CHOICES.map((choice) => {
              const alreadyRegistered = existingAxisValues.includes(choice.value);
              const checked = selectedAxes.includes(choice.value) || alreadyRegistered;
              return (
                <label
                  key={choice.value}
                  className={`flex items-center gap-3 px-3 py-2.5 border rounded-md cursor-pointer transition-colors ${
                    checked
                      ? 'border-[#6366f1] bg-indigo-50/50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 text-[#6366f1] border-gray-300 rounded focus:ring-[#6366f1]"
                    checked={checked}
                    disabled={alreadyRegistered}
                    onChange={() => toggleAxis(choice.value)}
                  />
                  <span className="text-sm text-gray-900">{choice.label}</span>
                  {alreadyRegistered && (
                    <span className="ml-auto text-[11px] text-gray-400">登録済み</span>
                  )}
                </label>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                         rounded-md hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                           rounded-md hover:bg-gray-50 transition-colors"
              >
                スキップ
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-md
                           hover:bg-[#5254cc] transition-colors"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: カラー */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">カラー</h3>
            <p className="mt-1 text-sm text-gray-500">サイドバーで識別するためのカラーを選んでください。</p>
          </div>

          {/* プレビューカード */}
          <div className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: color }} />
            <div>
              <p className="text-sm font-medium text-gray-900">{previewName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">0 枚</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カラーを選択</label>
            <div className="flex gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all focus:outline-none ${
                    color === c.value ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200
                         rounded-md hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-md
                         hover:bg-[#5254cc] transition-colors disabled:opacity-50
                         focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2"
            >
              {isLoading ? '作成中...' : '作成する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== メインモーダル =====
export function WorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  workspace = null,
  isLoading = false,
}: WorkspaceModalProps) {
  // 閉じるたびにウィザードをリセットするためにkeyを使用
  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    if (isOpen && !workspace) {
      setWizardKey((k) => k + 1);
    }
  }, [isOpen, workspace]);

  if (!isOpen) return null;

  const title = workspace ? 'ワークスペースを編集' : '新しいワークスペース';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400
                       hover:text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {workspace ? (
          <EditForm
            workspace={workspace}
            onClose={onClose}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        ) : (
          <CreateWizard
            key={wizardKey}
            onClose={onClose}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
