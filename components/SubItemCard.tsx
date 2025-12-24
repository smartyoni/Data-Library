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
  const [description, setDescription] = useState(item.description);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTitle = async () => {
    if (title !== item.title) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, title });
        setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (description !== item.description) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, description });
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
          <div className="p-6 grid gap-8">
            {/* Top: Text Area */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Icons.File className="w-4 h-4 text-zinc-400" />
                상세 내용
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDescription}
                className="w-full h-32 bg-zinc-950 border border-border rounded-lg p-4 text-sm text-zinc-300 resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-zinc-700 leading-relaxed"
                placeholder="자유로운 내용을 입력하세요..."
              />
            </div>

            {/* Bottom: Checklist */}
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-border/50">
                <Checklist itemId={item.id} onOpenMemo={onOpenMemo} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemCard;