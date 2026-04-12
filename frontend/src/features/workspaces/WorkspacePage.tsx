import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../../api/workspaces';
import { useAuthStore } from '../../store/authStore';
import { WorkspaceModal } from './WorkspaceModal';
import type { Workspace, WorkspaceCreateInput } from '../../types';

// ========== WorkspaceCard ==========
function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  workspace: Workspace;
  onEdit: (ws: Workspace) => void;
  onDelete: (ws: Workspace) => void;
  onSetDefault: (ws: Workspace) => void;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="relative bg-white border border-gray-100 rounded-lg overflow-hidden cursor-pointer
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => navigate(`/workspaces/${workspace.id}/cards`)}
    >
      {/* ブランドカラーアクセントライン（左端） */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: workspace.color }}
      />

      <div className="pl-5 pr-4 pt-5 pb-4">
        {/* ヘッダー行 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">
              {workspace.name}
            </h3>
            {workspace.is_default && (
              <span
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{
                  color: workspace.color,
                  borderColor: workspace.color,
                  backgroundColor: `${workspace.color}14`,
                }}
              >
                デフォルト
              </span>
            )}
          </div>

          {/* 3点メニュー */}
          <div className="relative shrink-0">
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400
                         hover:text-gray-700 hover:bg-gray-50 transition-colors text-lg leading-none"
              aria-label="メニュー"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            >
              ···
            </button>
            {menuOpen && (
              <>
                {/* オーバーレイ（クリックで閉じる） */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                />
                <div
                  className="absolute right-0 top-8 z-20 bg-white border border-gray-100
                             rounded-lg shadow-lg py-1 min-w-[140px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!workspace.is_default && (
                    <button
                      onClick={() => { setMenuOpen(false); onSetDefault(workspace); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      デフォルトに設定
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(workspace); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(workspace); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 説明 */}
        {workspace.description ? (
          <p className="mt-2 text-[13px] text-gray-500 line-clamp-2">
            {workspace.description}
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-gray-300 italic">説明なし</p>
        )}

        {/* フッター: 名刺枚数 */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-baseline gap-1">
          <span className="text-xl font-semibold text-gray-800">{workspace.card_count}</span>
          <span className="text-xs text-gray-400">枚の名刺</span>
        </div>
      </div>
    </div>
  );
}

// ========== WorkspacePage ==========
export function WorkspacePage() {
  const queryClient = useQueryClient();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: workspaces = [], isLoading, isError } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.getWorkspaces,
  });

  const createMutation = useMutation({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkspaceCreateInput }) =>
      workspacesApi.updateWorkspace(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: workspacesApi.deleteWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: workspacesApi.setDefaultWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const handleOpenCreate = () => {
    setEditingWorkspace(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setModalOpen(true);
  };

  const handleDelete = async (ws: Workspace) => {
    if (!confirm(`「${ws.name}」を削除しますか？この操作は取り消せません。`)) return;
    await deleteMutation.mutateAsync(ws.id);
  };

  const handleSubmit = async (data: WorkspaceCreateInput) => {
    setIsSubmitting(true);
    try {
      if (editingWorkspace) {
        await updateMutation.mutateAsync({ id: editingWorkspace.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Saila</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.display_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* ページヘッド */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              ワークスペース
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              活動ごとに受け取った名刺を分けて管理できます
            </p>
          </div>
          <button
            id="create-workspace-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#6366f1] text-white text-sm
                       font-medium rounded-md hover:bg-[#5254cc] active:bg-[#4748b8]
                       transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1]
                       focus:ring-offset-2"
          >
            <span className="text-base leading-none">+</span>
            <span>新しいワークスペース</span>
          </button>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#6366f1] rounded-full animate-spin mb-3" />
            <p className="text-sm">読み込み中...</p>
          </div>
        )}

        {/* エラー */}
        {isError && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
            データの取得に失敗しました。ページを再読み込みしてください。
          </div>
        )}

        {/* 空状態 */}
        {!isLoading && !isError && workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mb-4" />
            <p className="text-sm font-medium text-gray-700">ワークスペースがありません</p>
            <p className="mt-1 text-sm text-gray-400">
              「+ 新しいワークスペース」から最初のワークスペースを作成してください
            </p>
          </div>
        )}

        {/* カードグリッド */}
        {workspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onSetDefault={(ws) => setDefaultMutation.mutate(ws.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* モーダル */}
      <WorkspaceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        workspace={editingWorkspace}
        isLoading={isSubmitting}
      />
    </div>
  );
}
