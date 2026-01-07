import React, { useState, useEffect } from 'react';
import { Category, Workspace } from '../types';
import { Icons } from './ui/Icons';

interface MoveCategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  currentWorkspaceId: string;
  allWorkspaces: Workspace[];
  itemCount: number;
  onMove: (targetWorkspaceId: string) => Promise<void>;
  onClose: () => void;
}

const MoveCategoryModal: React.FC<MoveCategoryModalProps> = ({
  isOpen,
  category,
  currentWorkspaceId,
  allWorkspaces,
  itemCount,
  onMove,
  onClose,
}) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedWorkspaceId(null);
    }
  }, [isOpen]);

  const handleMove = async () => {
    if (!selectedWorkspaceId) return;

    setLoading(true);
    try {
      await onMove(selectedWorkspaceId);
      onClose();
    } catch (error) {
      console.error('카테고리 이동 중 오류:', error);
      alert('카테고리 이동에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !category) return null;

  const availableWorkspaces = allWorkspaces.filter(w => w.id !== currentWorkspaceId);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-white">카테고리 이동</h2>
          <p className="text-xs text-zinc-400 mt-1 truncate">
            "{category.name}" {itemCount > 0 && `(${itemCount}개 항목 포함)`}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Workspace Selection */}
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              대상 탭 선택
            </label>
            {availableWorkspaces.length > 0 ? (
              <div className="mt-2 space-y-2">
                {availableWorkspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => setSelectedWorkspaceId(workspace.id)}
                    className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-colors flex items-center justify-between ${
                      selectedWorkspaceId === workspace.id
                        ? 'bg-accent/20 text-white border border-accent'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icons.Folder className="w-4 h-4" />
                      <span>{workspace.name}</span>
                    </div>
                    {selectedWorkspaceId === workspace.id && (
                      <Icons.Check className="w-4 h-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 p-4 text-center text-sm text-zinc-500">
                이동할 수 있는 탭이 없습니다.
              </div>
            )}
          </div>

          {/* Warning Message */}
          {selectedWorkspaceId && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400">
                <strong>알림:</strong> 카테고리의 모든 항목({itemCount}개)과 체크리스트가 함께 이동됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-sm disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedWorkspaceId || loading}
            className={`px-4 py-2 rounded text-white transition-colors text-sm font-medium flex items-center gap-2 ${
              !selectedWorkspaceId || loading
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-accent hover:bg-accent/90'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin">
                  <Icons.Plus className="w-4 h-4" />
                </div>
                이동 중...
              </>
            ) : (
              <>
                <Icons.ArrowRight className="w-4 h-4" />
                이동
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveCategoryModal;
