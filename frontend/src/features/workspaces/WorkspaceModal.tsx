import { useState, useEffect } from 'react';
import type { Workspace, WorkspaceCreateInput } from '../../types';

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

export function WorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  workspace = null,
  isLoading = false,
}: WorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspace) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(workspace.name);
       
      setDescription(workspace.description);
       
      setColor(workspace.color);
    } else {
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0].value);
    }
    setError('');
  }, [workspace, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('ワークスペース名を入力してください');
      return;
    }
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), color });
      onClose();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900">
            {workspace ? 'ワークスペースを編集' : '新しいワークスペース'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400
                       hover:text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 名前 */}
          <div>
            <label htmlFor="ws-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="ws-name"
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent
                         placeholder:text-gray-300"
              placeholder="例: 本業、副業A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* 説明 */}
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

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラー
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-7 h-7 rounded-full transition-all focus:outline-none ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c.value,
                    ...(color === c.value ? { ringColor: c.value } : {}),
                  }}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                />
              ))}
            </div>
            {/* カラープレビュー */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-400">{color}</span>
            </div>
          </div>

          {/* エラー */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* アクション */}
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
              {isLoading ? '保存中...' : workspace ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
