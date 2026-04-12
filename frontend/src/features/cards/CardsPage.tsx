import { useOutletContext } from 'react-router-dom';
import type { Workspace } from '../../types';

interface OutletContext {
  selectedWorkspace: Workspace | null;
}

export function CardsPage() {
  const { selectedWorkspace } = useOutletContext<OutletContext>();

  if (!selectedWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400">
          左サイドバーからワークスペースを選択してください
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-gray-400">
        「{selectedWorkspace.name}」の名刺一覧（次のSTEPで実装）
      </p>
    </div>
  );
}
