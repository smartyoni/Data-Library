import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import { Item, ChecklistItem } from '../types';
import Checklist from './Checklist';
import firestoreDb from '../services/firestoreDb';

interface SubItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  onOpenMemo: (checklistItem: ChecklistItem) => void;
}

const SubItemCard: React.FC<SubItemCardProps> = ({ item, onDelete, onOpenMemo }) => {
  const [title, setTitle] = useState(item.title);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTitle = async () => {
    if (title !== item.title) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, title });
        setIsSaving(false);
    }
  };

  return (
    <div className={`bg-surface border border-border rounded-lg transition-all duration-200 ${isExpanded ? 'shadow-lg ring-1 ring-border' : 'hover:border-zinc-700'}`}>
      {/* Header Row (Always Visible) */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand Icon */}
        <button className="text-zinc-500 group-hover:text-accent transition-colors">
          {isExpanded ? <Icons.ChevronDown className="w-5 h-5" /> : <Icons.ChevronRight className="w-5 h-5" />}
        </button>

        {/* Title Input */}
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            className="w-full bg-transparent text-base font-medium text-zinc-200 placeholder-zinc-600 border-none p-0 focus:ring-0 focus:outline-none"
            placeholder="항목 제목 입력"
          />
        </div>

        {/* Meta & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-500 hidden sm:block">
            {isSaving ? (
                <span className="text-accent flex items-center gap-1">
                    <Icons.Save className="w-3 h-3 animate-pulse" /> 저장 중...
                </span>
            ) : (
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
            )}
          </div>
          
          <button
            onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('정말 이 항목을 삭제하시겠습니까?')) {
                    onDelete(item.id);
                }
            }}
            className="text-zinc-600 hover:text-danger hover:bg-zinc-800 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-border bg-zinc-950/30 animate-in slide-in-from-top-2 duration-200">
          <div className="p-6">
            <Checklist itemId={item.id} onOpenMemo={onOpenMemo} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemCard;