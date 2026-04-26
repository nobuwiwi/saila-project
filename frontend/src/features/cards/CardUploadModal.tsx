import { useState, useRef, useCallback } from 'react';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import heic2any from 'heic2any';
import { cardsApi } from '../../api/cards';
import { useAuthStore } from '../../store/authStore';
import type { Workspace } from '../../types';

interface CardUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onUpgradeRequired?: (message: string) => void;
}

const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

export function CardUploadModal({ isOpen, onClose, workspace, onUpgradeRequired }: CardUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = (selectedFiles: File[]) => {
    setError(null);
    let validFiles = selectedFiles.filter(
      file => ALLOWED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.heic')
    );

    if (validFiles.length === 0) {
      setError('JPG, PNG, HEIC のみ対応しています。');
      return;
    }

    if (files.length + validFiles.length > MAX_FILES) {
      validFiles = validFiles.slice(0, MAX_FILES - files.length);
      setError(`最大 ${MAX_FILES} 枚までです。超過分は無視されます。`);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFiles(Array.from(e.dataTransfer.files));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async (uploadFiles: File[]) => {
      setIsUploading(true);
      setProgress(0);
      
      const total = uploadFiles.length;
      let completed = 0;

      for (const file of uploadFiles) {
        try {
          let fileToUpload = file;
          // HEIC to JPG 変換
          if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
            const blob = Array.isArray(converted) ? converted[0] : converted;
            fileToUpload = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
          }

          const formData = new FormData();
          formData.append('workspace', workspace.id);
          formData.append('image', fileToUpload);

          await cardsApi.createCard(formData);
        } catch (err: any) {
          console.error("Upload error for file", file.name, err);
          if (err?.response?.status === 403) {
            onUpgradeRequired?.(err.response.data.detail || '名刺の登録上限に達しています。');
            return; // キャンセルして終了
          }
          // エラーが発生しても他のファイルのアップロードは継続する
        } finally {
          completed++;
          setProgress(Math.round((completed / total) * 100));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', workspace.id] });
      setFiles([]);
      onClose();
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  if (!isOpen) return null;

  const canUpload = user?.can_add_card !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/20 transition-opacity" onClick={!isUploading ? onClose : undefined} />
      <div className="relative w-full max-w-[500px] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden max-h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee]">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">名刺を追加</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">{workspace.name}</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {!canUpload && (
             <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md text-[13px] flex items-start gap-2">
               <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
               <p>登録枚数の上限に達しています。新しい名刺を追加するには不要な名刺を削除するか、プランをアップグレードしてください。</p>
             </div>
          )}

          {error && (
            <div className="mb-4 text-red-600 text-[12px] bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => canUpload && !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors
              ${isDragging ? 'border-[#6366f1] bg-[#f0f0fe]' : 'border-gray-300 hover:bg-gray-50 bg-white'}
              ${(!canUpload || isUploading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
            `}
          >
            <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-[#6366f1]' : 'text-gray-400'}`} />
            <p className="text-[14px] font-medium text-gray-700">ファイルを選択 または ドラッグ&ドロップ</p>
            <p className="text-[12px] text-gray-400 mt-1">JPG, PNG, HEIC 対応（最大10枚）</p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              accept=".jpg,.jpeg,.png,.heic" 
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-5 space-y-2">
              <h3 className="text-[13px] font-medium text-gray-700">選択されたファイル ({files.length}枚)</h3>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-[13px]">
                    <span className="truncate text-gray-700 max-w-[300px]">{f.name}</span>
                    <button 
                      onClick={() => removeFile(i)}
                      disabled={isUploading}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-[12px] text-gray-600 font-medium">
                <span>アップロード中...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#6366f1] transition-all duration-300 ease-out rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#eeeeee] flex justify-end gap-2 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            disabled={!canUpload || files.length === 0 || isUploading}
            onClick={() => uploadMutation.mutate(files)}
            className="px-4 py-2 text-[13px] font-medium text-white bg-[#6366f1] hover:bg-[#5254cc] active:bg-[#4748b8] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isUploading ? '処理中...' : 'アップロード'}
          </button>
        </div>
      </div>
    </div>
  );
}
