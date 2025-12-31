import React from 'react';
import { Category } from '../types';
import { Icons } from './ui/Icons';

interface HiddenCategoriesModalProps {
  isOpen: boolean;
  hiddenCategories: Category[];
  onUnhide: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const HiddenCategoriesModal: React.FC<HiddenCategoriesModalProps> = ({
  isOpen,
  hiddenCategories,
  onUnhide,
  onDelete,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Icons.EyeOff className="w-5 h-5" />
            숨김 카테고리 관리
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            title="닫기"
          >
            <Icons.Close className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hiddenCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.Folder className="w-12 h-12 text-zinc-700 mb-3 opacity-50" />
              <p className="text-sm text-zinc-500">숨겨진 카테고리가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hiddenCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icons.Folder className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-zinc-300 truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => onUnhide(cat.id)}
                      className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-medium whitespace-nowrap"
                      title="카테고리 복원"
                    >
                      복원
                    </button>
                    <button
                      onClick={() => onDelete(cat.id)}
                      className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium whitespace-nowrap"
                      title="카테고리 영구 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default HiddenCategoriesModal;
