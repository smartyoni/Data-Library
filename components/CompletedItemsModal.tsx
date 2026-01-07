import React from 'react';
import { Item } from '../types';
import { Icons } from './ui/Icons';

interface CompletedItemsModalProps {
  isOpen: boolean;
  completedItems: Item[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CompletedItemsModal: React.FC<CompletedItemsModalProps> = ({
  isOpen,
  completedItems,
  onRestore,
  onDelete,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    if (window.confirm('완료된 항목을 영구적으로 삭제하시겠습니까?')) {
      onDelete(id);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Icons.CheckCircle className="w-5 h-5" />
            완료된 항목 관리
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="닫기"
          >
            <Icons.Close className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {completedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icons.CheckCircle className="w-12 h-12 text-gray-400 mb-3 opacity-50" />
              <p className="text-sm text-gray-500">완료된 항목이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icons.File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => onRestore(item.id)}
                      className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 transition-colors text-xs font-medium whitespace-nowrap"
                      title="항목 복원"
                    >
                      복원
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-xs font-medium whitespace-nowrap"
                      title="항목 영구 삭제"
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
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedItemsModal;
