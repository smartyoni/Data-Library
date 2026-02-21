import React, { useState, useEffect } from 'react';
import { Item, ChecklistItem } from '../types';
import Checklist from './Checklist';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';

interface ItemDetailProps {
  item: Item;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onOpenMemo: (checklistItem: ChecklistItem) => void;
  onOpenNote: () => void;
  onBack: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ item, onUpdateItem, onOpenMemo, onOpenNote, onBack }) => {
  const [title, setTitle] = useState(item.title);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when item changes
  useEffect(() => {
    setTitle(item.title);
  }, [item.id, item.title]);

  const handleSaveTitle = async () => {
    if (title !== item.title) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, title });
        onUpdateItem(item.id, { title });
        setIsSaving(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden animate-in fade-in duration-300">
      {/* Detail Header with Title */}
      <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/50 flex-shrink-0 backdrop-blur-sm gap-2">
        <button 
            onClick={onBack}
            className="md:hidden p-1 -ml-2 text-zinc-400 hover:text-white"
        >
            <Icons.Back className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          className="flex-1 bg-transparent text-lg md:text-xl font-bold text-white placeholder-zinc-600 border-none p-0 focus:ring-0 focus:outline-none truncate"
          placeholder="항목 제목을 입력하세요"
        />

        <button
          onClick={onOpenNote}
          className="flex-shrink-0 p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          title="노트 열기"
        >
          <Icons.File className="w-5 h-5" />
        </button>

        {isSaving && (
           <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full animate-pulse">
             <Icons.Save className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">저장 중...</span>
           </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        {/* Checklist - Full Height */}
        <div className="flex-1 flex flex-col bg-surface/40 rounded-xl border border-border shadow-sm overflow-hidden min-h-0 group focus-within:border-zinc-600 transition-colors">
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <Checklist itemId={item.id} onOpenMemo={onOpenMemo} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;