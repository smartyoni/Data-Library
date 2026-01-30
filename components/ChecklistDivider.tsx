import React, { useState } from 'react';
import { ChecklistDivider as ChecklistDividerType } from '../types';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';

interface ChecklistDividerProps {
  divider: ChecklistDividerType;
  index: number;
  totalCount: number;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { label?: string }) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, position: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const ChecklistDivider: React.FC<ChecklistDividerProps> = ({
  divider,
  index,
  totalCount,
  isFirst,
  isLast,
  onDelete,
  onUpdate,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onMoveUp,
  onMoveDown,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(divider.label);
  const [menuDividerId, setMenuDividerId] = useState<string | null>(null);

  const handleSaveLabel = async () => {
    if (editingLabel !== divider.label && editingLabel.trim()) {
      await onUpdate(divider.id, { label: editingLabel });
    } else if (!editingLabel.trim()) {
      setEditingLabel(divider.label);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('이 섹션을 삭제하시겠습니까?')) {
      onDelete(divider.id);
    }
    setMenuDividerId(null);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative py-1.5 px-4"
    >
      {/* Divider with label */}
      <div className="flex items-center gap-3 px-4">
        {/* Space for checkbox alignment (matching checklist item layout) */}
        <div className="w-4 h-4 flex-shrink-0" />

        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editingLabel}
            onChange={(e) => setEditingLabel(e.target.value)}
            onBlur={handleSaveLabel}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') handleSaveLabel();
              if (e.key === 'Escape') {
                setEditingLabel(divider.label);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-blue-600 rounded px-2 py-1 text-sm text-black font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        ) : (
          <div className="flex items-center">
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth >= 768) {
                  setIsEditing(true);
                }
              }}
              className="text-sm font-bold text-black cursor-pointer hover:text-gray-700 transition-colors select-none"
            >
              ● {divider.label}
            </span>
          </div>
        )}
        <div className="flex-1 border-t border-blue-700" />
      </div>

      {/* Edit/Delete buttons */}
      <div className="flex items-center gap-1 absolute right-4 top-1/2 -translate-y-1/2">
        {/* Mobile 3-point Menu */}
        <div className="relative md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuDividerId(menuDividerId === divider.id ? null : divider.id);
            }}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="옵션"
          >
            <Icons.More className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuDividerId === divider.id && (
            <div
              className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMenuDividerId(null);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors border-b border-gray-200"
              >
                <Icons.Edit className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Icons.Trash className="w-4 h-4" />
                삭제
              </button>
            </div>
          )}
        </div>

        {/* Desktop Delete Button - Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="hidden md:block opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
          title="삭제"
        >
          <Icons.Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ChecklistDivider;
