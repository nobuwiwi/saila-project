import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { billingApi } from '../../api/billing';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function UpgradeModal({ isOpen, onClose, message }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      const data = await billingApi.createCheckoutSession();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session', error);
      alert('決済画面への移動に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Proプランへのアップグレード</h2>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {message}
            </div>
          )}
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">月額 ¥480</h3>
            <p className="text-sm text-gray-500">全ての制限を解除して機能をフル活用</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#6366f1] shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">ワークスペースの作成数<strong>無制限</strong>（無料プランは2つまで）</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#6366f1] shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">名刺の登録枚数<strong>無制限</strong>（無料プランは累計50枚まで）</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#6366f1] text-white text-sm font-medium rounded-lg hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '処理中...' : 'Proプランにアップグレード'}
          </button>
        </div>
      </div>
    </div>
  );
}
