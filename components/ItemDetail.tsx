import React, { useState, useEffect } from 'react';
import { Item, ChecklistItem } from '../types';
import Checklist from './Checklist';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';

interface ItemDetailProps {
  item: Item;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onOpenMemo: (checklistItem: ChecklistItem) => void;
  onBack: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ item, onUpdateItem, onOpenMemo, onBack }) => {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditingInPreview, setIsEditingInPreview] = useState(false);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync state when item changes
  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description);
    setIsEditingDesc(false);
  }, [item.id, item.title, item.description]);

  const handleSaveTitle = async () => {
    if (title !== item.title) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, title });
        onUpdateItem(item.id, { title });
        setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setIsEditingDesc(false);
    if (description !== item.description) {
        setIsSaving(true);
        await firestoreDb.items.update({ id: item.id, description });
        onUpdateItem(item.id, { description });
        setIsSaving(false);
    }
  };

  // Double-click to edit
  const handleDescriptionDoubleClick = () => {
    setIsEditingDesc(true);
  };

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setIsEditingDesc(true);
    }, 300);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Helper to parse text and convert URLs to links
  const renderContentWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline break-all relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
        
        {isSaving && (
           <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full animate-pulse">
             <Icons.Save className="w-3.5 h-3.5" />
             <span className="hidden sm:inline">저장 중...</span>
           </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-5 min-h-0">
          
          {/* Split Content Container (Fills remaining height) */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {/* Top: Description (Allocated ~40% of space or min 200px) */}
            <div className="h-[40%] min-h-[200px] flex flex-col bg-surface/40 rounded-xl border border-border shadow-sm overflow-hidden group focus-within:border-zinc-600 transition-colors">
               <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/50 bg-zinc-900/30">
                 <div className="flex items-center gap-2">
                   <Icons.File className="w-4 h-4 text-zinc-400" />
                   <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">상세 내용</span>
                 </div>
                 <button
                   onClick={() => setIsPreviewOpen(true)}
                   className="text-xs px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                   title="전체 내용 보기"
                 >
                   미리보기
                 </button>
               </div>
               
               {isEditingDesc ? (
                 <textarea
                   autoFocus
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   onBlur={handleSaveDescription}
                   className="flex-1 w-full bg-transparent border-none p-4 text-sm text-zinc-300 resize-none focus:ring-0 placeholder-zinc-700 leading-relaxed custom-scrollbar"
                   placeholder="이 항목에 대한 상세한 내용을 자유롭게 작성하세요..."
                 />
               ) : (
                 <div
                   onDoubleClick={handleDescriptionDoubleClick}
                   onTouchStart={handleTouchStart}
                   onTouchEnd={handleTouchEnd}
                   className="flex-1 w-full p-4 text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar cursor-text select-none hover:bg-white/5 transition-colors"
                   title="더블클릭하거나 길게눌러 수정"
                 >
                   {description ? (
                     renderContentWithLinks(description)
                   ) : (
                     <span className="text-zinc-700">이 항목에 대한 상세한 내용을 자유롭게 작성하세요...</span>
                   )}
                 </div>
               )}
            </div>

            {/* Bottom: Checklist (Fills remaining space) */}
            <div className="flex-1 flex flex-col bg-surface/40 rounded-xl border border-border shadow-sm overflow-hidden min-h-0 group focus-within:border-zinc-600 transition-colors">
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <Checklist itemId={item.id} onOpenMemo={onOpenMemo} />
               </div>
            </div>

          </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-lg flex flex-col h-[90vh] max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-zinc-900/30">
              <span className="text-lg font-semibold text-white">상세 내용</span>
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsEditingInPreview(false);
                }}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            {isEditingInPreview ? (
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 w-full bg-transparent border-none p-6 text-sm text-zinc-300 resize-none focus:ring-0 placeholder-zinc-700 leading-relaxed custom-scrollbar"
                placeholder="이 항목에 대한 상세한 내용을 자유롭게 작성하세요..."
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                {description ? (
                  renderContentWithLinks(description)
                ) : (
                  <span className="text-zinc-700">내용이 없습니다.</span>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-zinc-900/30">
              {isEditingInPreview ? (
                <>
                  <button
                    onClick={() => {
                      setDescription(item.description);
                      setIsEditingInPreview(false);
                    }}
                    className="px-4 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      if (description !== item.description) {
                        setIsSaving(true);
                        await firestoreDb.items.update({ id: item.id, description });
                        onUpdateItem(item.id, { description });
                        setIsSaving(false);
                      }
                      setIsEditingInPreview(false);
                    }}
                    className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors text-sm"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors text-sm"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => setIsEditingInPreview(true)}
                    className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors text-sm"
                  >
                    수정
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;