import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { axesApi } from '../../api/axes';
import { workspacesApi } from '../../api/workspaces';
import { BUSINESS_AXIS_CHOICES, RELATION_CHOICES } from '../../types';

const POSITIONS = [
  '会社員・正社員',
  '副業・複業',
  'フリーランス',
  '個人開発・OSS',
  'NPO・ボランティア',
];

interface WorkspaceDraft {
  id: number;
  company_name: string;
  relation_type: string;
}

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedAxes, setSelectedAxes] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceDraft[]>([
    { id: Date.now(), company_name: '', relation_type: 'customer' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const toggleAxis = (val: string) => {
    setSelectedAxes(prev => 
      prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val]
    );
  };

  const togglePosition = (val: string) => {
    setSelectedPositions(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]
    );
  };

  const updateWorkspace = (id: number, field: keyof WorkspaceDraft, value: string) => {
    setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, [field]: value } : ws));
  };

  const addWorkspace = () => {
    setWorkspaces(prev => [...prev, { id: Date.now(), company_name: '', relation_type: 'customer' }]);
  };

  const removeWorkspace = (id: number) => {
    if (workspaces.length > 1) {
      setWorkspaces(prev => prev.filter(ws => ws.id !== id));
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Save axes
      for (const axis of selectedAxes) {
        await axesApi.addAxis(axis);
      }

      // Save workspaces
      for (const ws of workspaces) {
        await workspacesApi.createWorkspace({
          company_name: ws.company_name,
          relation_type: ws.relation_type
        });
      }

      // Update user profile
      let newDisplayName = user.display_name;
      if (selectedPositions.length > 0) {
        const positionsStr = selectedPositions.join(' / ');
        newDisplayName = newDisplayName ? `${newDisplayName} (${positionsStr})` : positionsStr;
      }

      const updatedUser = await authApi.updateProfile({
        display_name: newDisplayName,
        onboarding_done: true
      });

      setUser(updatedUser);
      navigate('/cards');
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            ステップ {step} / 4
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-2 w-12 rounded-full ${s <= step ? 'bg-[#6366f1]' : 'bg-gray-200'}`} 
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">事業軸を教えてください</h2>
                <p className="mt-2 text-gray-600">あなたが関わっている事業や活動の領域を選択してください。（複数選択可）</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_AXIS_CHOICES.map(choice => (
                  <label 
                    key={choice.value} 
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedAxes.includes(choice.value) ? 'border-[#6366f1] bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-[#6366f1] focus:ring-[#6366f1] border-gray-300 rounded"
                      checked={selectedAxes.includes(choice.value)}
                      onChange={() => toggleAxis(choice.value)}
                    />
                    <span className="ml-3 text-gray-900 font-medium">{choice.label}</span>
                  </label>
                ))}
              </div>
              <div className="pt-6 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={selectedAxes.length === 0}
                  className="px-6 py-2.5 bg-[#6366f1] text-white rounded-md font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  次へ進む
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">現在の立場を教えてください</h2>
                <p className="mt-2 text-gray-600">あなたの現在の働き方や活動の形態を選択してください。（任意・複数選択可）</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POSITIONS.map(pos => (
                  <label 
                    key={pos} 
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedPositions.includes(pos) ? 'border-[#6366f1] bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-[#6366f1] focus:ring-[#6366f1] border-gray-300 rounded"
                      checked={selectedPositions.includes(pos)}
                      onChange={() => togglePosition(pos)}
                    />
                    <span className="ml-3 text-gray-900 font-medium">{pos}</span>
                  </label>
                ))}
              </div>
              <div className="pt-6 flex justify-between">
                <button 
                  onClick={handlePrev}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <div className="space-x-3">
                  <button 
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                  >
                    スキップ
                  </button>
                  <button 
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-[#6366f1] text-white rounded-md font-medium hover:bg-[#4f46e5] transition-colors"
                  >
                    次へ進む
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">最初のワークスペースを作成</h2>
                <p className="mt-2 text-gray-600">
                  名刺を管理するためのワークスペース（箱）を作成します。
                  取引先や関わっているプロジェクトなどを入力してください。
                </p>
              </div>
              
              <div className="space-y-6">
                {workspaces.map((ws, index) => {
                  const relationLabel = RELATION_CHOICES.find(r => r.value === ws.relation_type)?.label || '';
                  const previewName = ws.company_name ? `${ws.company_name}｜${relationLabel}` : '';

                  return (
                    <div key={ws.id} className="p-5 border border-gray-200 rounded-lg bg-gray-50 relative">
                      {workspaces.length > 1 && (
                        <button 
                          onClick={() => removeWorkspace(ws.id)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      )}
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">ワークスペース {index + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">会社名 / 組織名 <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            value={ws.company_name}
                            onChange={(e) => updateWorkspace(ws.id, 'company_name', e.target.value)}
                            placeholder="例: 株式会社A"
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-[#6366f1] focus:border-[#6366f1] sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">関係性 <span className="text-red-500">*</span></label>
                          <select
                            value={ws.relation_type}
                            onChange={(e) => updateWorkspace(ws.id, 'relation_type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-[#6366f1] focus:border-[#6366f1] sm:text-sm bg-white"
                          >
                            {RELATION_CHOICES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {previewName && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500">ワークスペース名（プレビュー）</p>
                          <p className="mt-1 font-medium text-gray-900">{previewName}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button 
                onClick={addWorkspace}
                className="text-sm font-medium text-[#6366f1] hover:text-[#4f46e5] flex items-center"
              >
                ＋ 別のつながりを追加する
              </button>

              <div className="pt-6 flex justify-between">
                <button 
                  onClick={handlePrev}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
                >
                  戻る
                </button>
                <button 
                  onClick={handleNext}
                  disabled={workspaces.some(ws => !ws.company_name)}
                  className="px-6 py-2.5 bg-[#6366f1] text-white rounded-md font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  次へ進む
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
                <svg className="h-8 w-8 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">準備完了です！</h2>
              <p className="text-gray-600 text-lg">さあ、名刺を登録しましょう。</p>
              
              <div className="pt-8">
                <button 
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#6366f1] text-white rounded-md font-bold text-lg hover:bg-[#4f46e5] shadow-sm disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? '設定を保存中...' : '名刺を登録する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
