import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;

  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  selectWorkspace: (id: string) => void;

  selectedWorkspace: () => Workspace | null;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      selectedWorkspaceId: null,

      setWorkspaces: (workspaces) => {
        const current = get().selectedWorkspaceId;
        const exists = workspaces.find((w) => w.id === current);
        // 前回選択が消えていたらデフォルト or 先頭を選ぶ
        const nextId = exists
          ? current
          : (workspaces.find((w) => w.is_default)?.id ?? workspaces[0]?.id ?? null);
        set({ workspaces, selectedWorkspaceId: nextId });
      },

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          selectedWorkspaceId: state.selectedWorkspaceId ?? workspace.id,
        })),

      updateWorkspace: (workspace) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) => (w.id === workspace.id ? workspace : w)),
        })),

      removeWorkspace: (id) =>
        set((state) => {
          const remaining = state.workspaces.filter((w) => w.id !== id);
          const nextId =
            state.selectedWorkspaceId === id
              ? (remaining.find((w) => w.is_default)?.id ?? remaining[0]?.id ?? null)
              : state.selectedWorkspaceId;
          return { workspaces: remaining, selectedWorkspaceId: nextId };
        }),

      selectWorkspace: (id) => set({ selectedWorkspaceId: id }),

      selectedWorkspace: () => {
        const { workspaces, selectedWorkspaceId } = get();
        return workspaces.find((w) => w.id === selectedWorkspaceId) ?? null;
      },
    }),
    {
      name: 'saila-workspace-storage',
      // workspacesはAPIから毎回取得するのでリストは永続化しない
      // selectedWorkspaceId だけ保存して復元する
      partialize: (state) => ({ selectedWorkspaceId: state.selectedWorkspaceId }),
    }
  )
);
