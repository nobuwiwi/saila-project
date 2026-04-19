import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, setUser } = useAuthStore();
  
  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.display_name || '');
      setOldPassword('');
      setNewPassword('');
      setProfileSuccess(false);
      setPasswordSuccess(false);
      setPasswordError('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsProfileSubmitting(true);
    setProfileSuccess(false);
    try {
      const updatedUser = await authApi.updateProfile({ display_name: displayName });
      // setUser を呼び出して状態を更新
      setUser({ ...user, ...updatedUser });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('プロフィールの更新に失敗しました。');
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    
    if (newPassword.length < 8) {
      setPasswordError('新しいパスワードは8文字以上で入力してください。');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.old_password?.[0]
        || err.response?.data?.new_password?.[0]
        || 'パスワードの変更に失敗しました。';
      setPasswordError(msg);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">設定</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-8">
          
          {/* Profile Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">プロフィール</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <div className="px-3 py-2 bg-gray-50 text-gray-500 rounded-md text-[13px] border border-gray-100">
                  {user.email} (変更不可)
                </div>
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-[13px] font-medium text-gray-700 mb-1">
                  表示名
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[transparent]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[13px] text-green-600 flex items-center gap-1 min-h-[20px]">
                  {profileSuccess && <><Check className="w-4 h-4" /> 更新しました</>}
                </span>
                <button
                  type="submit"
                  disabled={isProfileSubmitting || !displayName.trim() || displayName === user.display_name}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-[#6366f1] rounded-md hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProfileSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </section>

          {/* Password Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">パスワードの変更</h3>
            
            {passwordError && (
              <div className="mb-4 p-3 text-[13px] text-red-600 bg-red-50 rounded-md border border-red-100">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-[13px] font-medium text-gray-700 mb-1">
                  現在のパスワード
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[transparent]"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-[13px] font-medium text-gray-700 mb-1">
                  新しいパスワード (8文字以上)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[transparent]"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[13px] text-green-600 flex items-center gap-1 min-h-[20px]">
                  {passwordSuccess && <><Check className="w-4 h-4" /> パスワードを変更しました</>}
                </span>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting || !oldPassword || newPassword.length < 8}
                  className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPasswordSubmitting ? '変更中...' : 'パスワード変更'}
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
