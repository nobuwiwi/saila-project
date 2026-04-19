import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

export function BillingSuccessPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  // 決済完了後、ユーザー情報を再取得してis_proを反映させる
  useEffect(() => {
    authApi.getMe().then(user => {
      setUser(user);
    }).catch(console.error);
  }, [setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f7f8] p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-[#eeeeee] p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">アップグレード完了</h2>
        <p className="text-[14px] text-gray-600 mb-8">
          Proプランへのアップグレードが完了しました。<br/>
          Sailaの全ての機能を無制限にご利用いただけます。
        </p>
        <button
          onClick={() => navigate('/cards')}
          className="w-full py-2.5 px-4 bg-[#6366f1] text-white text-sm font-medium rounded-lg hover:bg-[#4f46e5] transition-colors"
        >
          ダッシュボードへ戻る
        </button>
      </div>
    </div>
  );
}
