import React, { useState, useEffect } from 'react';
import { Item, Category, Workspace } from '../types';
import firestoreDb from '../services/firestoreDb';
import { Icons } from './ui/Icons';

interface MoveItemModalProps {
  isOpen: boolean;
  item: Item | null;
  currentWorkspaceId: string;
  currentCategoryId: string;
  allWorkspaces: Workspace[];
  onMove: (targetCategoryId: string, targetWorkspaceId: string) => Promise<void>;
  onClose: () => void;
}

const MoveItemModal: React.FC<MoveItemModalProps> = ({
  isOpen,
  item,
  currentWorkspaceId,
  currentCategoryId,
  allWorkspaces,
  onMove,
  onClose,
}) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(currentWorkspaceId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load categories when workspace changes
  useEffect(() => {
    if (isOpen && selectedWorkspaceId) {
      loadCategories(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, isOpen]);

  const loadCategories = async (workspaceId: string) => {
    setLoading(true);
    try {
      // Get all categories including hidden ones
      const allCategories = await firestoreDb.categories.listByWorkspace(workspaceId, true);
      setCategories(allCategories);
      setSelectedCategoryId(null);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    if (!selectedCategoryId) return;

    try {
      await onMove(selectedCategoryId, selectedWorkspaceId);
    } catch (error) {
      console.error('항목 이동 중 오류:', error);
      alert('항목 이동에 실패했습니다.');
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

  if (!isOpen || !item) return null;

  const isSameCategory = selectedCategoryId === currentCategoryId;
  const selectedWorkspace = allWorkspaces.find(w => w.id === selectedWorkspaceId);

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
          <h2 className="text-base font-semibold text-white">항목 이동</h2>
          <p className="text-xs text-zinc-400 mt-1 truncate">"{item.title || '제목 없음'}"</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Workspace Selection */}
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              작업공간 선택
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedWorkspaceId === workspace.id
                      ? 'bg-accent text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              카테고리 선택
            </label>
            {loading ? (
              <div className="mt-2 p-4 text-center text-sm text-zinc-500">
                <div className="inline-block animate-spin">
                  <Icons.Plus className="w-4 h-4" />
                </div>
                <p className="mt-2">카테고리 로드 중...</p>
              </div>
            ) : categories.length > 0 ? (
              <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                {categories.map((category) => {
                  const isCurrentCategory =
                    category.id === currentCategoryId && selectedWorkspaceId === currentWorkspaceId;
                  const isSelected = category.id === selectedCategoryId;

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (!isCurrentCategory) {
                          setSelectedCategoryId(category.id);
                        }
                      }}
                      disabled={isCurrentCategory}
                      className={`w-full px-3 py-2 rounded-md text-sm text-left transition-colors flex items-center justify-between ${
                        isCurrentCategory
                          ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                          : isSelected
                          ? 'bg-accent/20 text-white border border-accent'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icons.Folder className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{category.name}</span>
                        {category.is_hidden && (
                          <span className="text-xs text-zinc-500 flex-shrink-0">(숨김)</span>
                        )}
                      </div>
                      {isCurrentCategory && (
                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">현재</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 p-4 text-center text-sm text-zinc-500">
                카테고리가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-sm"
          >
            취소
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedCategoryId || isSameCategory || loading}
            className={`px-4 py-2 rounded text-white transition-colors text-sm font-medium flex items-center gap-2 ${
              !selectedCategoryId || isSameCategory || loading
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-accent hover:bg-accent/90'
            }`}
          >
            <Icons.ArrowRight className="w-4 h-4" />
            이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemModal;
