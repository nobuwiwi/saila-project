import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '../api/workspaces';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WorkspaceModal } from '../features/workspaces/WorkspaceModal';
import { UpgradeModal } from '../features/billing/UpgradeModal';
import { SettingsModal } from '../features/auth/SettingsModal';
import type { Workspace, WorkspaceCreateInput } from '../types';

// ========== サイドバー内の各ワークスペース項目 ==========
function WorkspaceItem({
  workspace,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  workspace: Workspace;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (ws: Workspace) => void;
  onDelete: (ws: Workspace) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-0 text-left transition-colors rounded-md overflow-hidden
                    ${isSelected ? 'bg-[#f5f5f5]' : 'hover:bg-[#f9f9f9]'}`}
      >
        {/* カラーアクセントライン */}
        <span
          className="shrink-0 w-[3px] self-stretch rounded-l-md"
          style={{ backgroundColor: workspace.color }}
        />
        <span className="flex-1 flex items-center justify-between px-3 py-2.5">
          <span className="flex flex-col min-w-0">
            <span
              className={`flex flex-col truncate leading-snug
                          ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}
            >
              <span className="text-[13px] font-medium truncate">
                {workspace.name.split('｜')[0]}
              </span>
              {workspace.name.split('｜').length > 1 && (
                <span className="text-[10px] font-normal text-gray-500 truncate mt-0.5">
                  {workspace.name.split('｜')[1]}
                </span>
              )}
            </span>
            <span className="text-[11px] text-gray-400 mt-0.5">{workspace.card_count} 枚</span>
          </span>
        </span>
      </button>

      {/* コンテキストメニュートリガー（ホバー時表示） */}
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
                   rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100
                   opacity-0 group-hover:opacity-100 transition-opacity z-10 text-base leading-none"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        aria-label="メニュー"
      >
        ···
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-0.5 z-30 bg-white border border-gray-100
                          rounded-lg shadow-lg py-1 min-w-[148px]">
            <button
              onClick={() => { setMenuOpen(false); onEdit(workspace); }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50"
            >
              編集
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(workspace); }}
              className="w-full text-left px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ========== メインLayout ==========
export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { logout, user } = useAuthStore();
  const {
    workspaces,
    selectedWorkspaceId,
    setWorkspaces,
    addWorkspace,
    updateWorkspace,
    removeWorkspace,
    selectWorkspace,
    selectedWorkspace,
  } = useWorkspaceStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ワークスペース一覧を取得してStoreに同期
  const { isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await workspacesApi.getWorkspaces();
      setWorkspaces(data);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: workspacesApi.createWorkspace,
    onSuccess: (newWs) => {
      addWorkspace(newWs);
      selectWorkspace(newWs.id);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkspaceCreateInput }) =>
      workspacesApi.updateWorkspace(id, data),
    onSuccess: (updated) => {
      updateWorkspace(updated);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workspacesApi.deleteWorkspace,
    onSuccess: (_, id) => {
      removeWorkspace(id);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const handleSubmit = async (data: WorkspaceCreateInput) => {
    setIsSubmitting(true);
    try {
      if (editingWorkspace) {
        await updateMutation.mutateAsync({ id: editingWorkspace.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setUpgradeModalMessage(e.response.data.detail || 'ワークスペースの作成上限に達しています。');
        setUpgradeModalOpen(true);
        setModalOpen(false);
      } else {
        throw e;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ws: Workspace) => {
    if (!confirm(`「${ws.name}」を削除しますか？この操作は取り消せません。`)) return;
    await deleteMutation.mutateAsync(ws.id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTrash = location.pathname === '/trash';
  const currentWs = selectedWorkspace();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f8]">
      {/* モバイル用オーバーレイ */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===== サイドバー ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col shrink-0 bg-white border-r border-[#eeeeee]
                    transform transition-transform duration-200 ease-in-out w-[240px]
                    md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* ロゴ */}
        <div className="px-5 py-4 border-b border-[#eeeeee] flex items-center justify-between">
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Saila</span>
          <button 
            className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ワークスペース一覧 */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            ワークスペース
          </p>

          {isLoading && (
            <div className="px-2 py-3 text-[12px] text-gray-400">読み込み中...</div>
          )}

          {workspaces.map((ws) => (
            <WorkspaceItem
              key={ws.id}
              workspace={ws}
              isSelected={selectedWorkspaceId === ws.id && !isTrash}
              onSelect={() => {
                selectWorkspace(ws.id);
                setMobileMenuOpen(false);
                navigate('/cards');
              }}
              onEdit={(ws) => { setEditingWorkspace(ws); setModalOpen(true); setMobileMenuOpen(false); }}
              onDelete={handleDelete}
            />
          ))}

          {/* + ワークスペースを追加 */}
          <button
            id="add-workspace-btn"
            onClick={() => { setEditingWorkspace(null); setModalOpen(true); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 mt-1 text-[13px] text-gray-400
                       hover:text-gray-700 hover:bg-[#f9f9f9] rounded-md transition-colors"
          >
            + ワークスペースを追加
          </button>
        </div>

        {/* 下部エリア */}
        <div className="border-t border-[#eeeeee] px-3 py-3 space-y-0.5">
          {/* ゴミ箱 */}
          <button
            onClick={() => { navigate('/trash'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px]
                        transition-colors ${isTrash ? 'bg-[#f5f5f5] text-gray-900' : 'text-gray-500 hover:bg-[#f9f9f9] hover:text-gray-800'}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21a48.6 48.6 0 00-3.478-.397m-12 .562a48.6 48.6 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0H6.75" />
            </svg>
            ゴミ箱
          </button>

          {/* ユーザー・ログアウト */}
          <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => { setSettingsModalOpen(true); setMobileMenuOpen(false); }}>
            <div className="flex flex-col min-w-0 pr-2">
               <span className="text-[12px] font-medium text-gray-700 truncate max-w-[130px]">
                 {user?.display_name || user?.email}
               </span>
               <span className="text-[10px] text-gray-400 truncate max-w-[130px]">設定</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors shrink-0 p-1"
            >
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      {/* ===== 右エリア（ヘッダー + メイン） ===== */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* ヘッダー */}
        <header className="shrink-0 bg-white border-b border-[#eeeeee] h-14 flex items-center px-4 md:px-6 gap-3 md:gap-4">
          <button 
            className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          
          {/* カラーアクセント＋ワークスペース名 */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {currentWs && !isTrash && (
              <span
                className="shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentWs.color }}
              />
            )}
            <h1 className="flex flex-col leading-tight overflow-hidden">
              {isTrash ? (
                <span className="text-[15px] font-semibold text-gray-900 truncate">ゴミ箱</span>
              ) : currentWs ? (
                <>
                  <span className="text-[15px] font-semibold text-gray-900 truncate">
                    {currentWs.name.split('｜')[0]}
                  </span>
                  {currentWs.name.split('｜').length > 1 && (
                    <span className="text-[11px] font-normal text-gray-500 truncate">
                      {currentWs.name.split('｜')[1]}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[15px] font-semibold text-gray-900 truncate">—</span>
              )}
            </h1>
          </div>

        </header>

        {/* メインコンテンツ（Outlet） */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet context={{
            selectedWorkspace: currentWs,
            onUpgradeRequired: (message: string) => {
              setUpgradeModalMessage(message);
              setUpgradeModalOpen(true);
            },
          }} />
        </main>
      </div>

      {/* ワークスペースモーダル */}
      <WorkspaceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        workspace={editingWorkspace}
        isLoading={isSubmitting}
      />

      {/* アップグレードモーダル */}
      <UpgradeModal
         isOpen={upgradeModalOpen}
         onClose={() => setUpgradeModalOpen(false)}
         message={upgradeModalMessage}
      />

      {/* 設定モーダル */}
      <SettingsModal 
         isOpen={settingsModalOpen}
         onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
