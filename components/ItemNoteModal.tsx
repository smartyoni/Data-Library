import React, { useState, useEffect } from 'react';
import { Icons } from './ui/Icons';
import { Item } from '../types';

interface ItemNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onSave: (id: string, text: string) => void;
}

const ItemNoteModal: React.FC<ItemNoteModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [noteText, setNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (item) {
      setNoteText(item.description || '');
      // Always start in Preview mode when opening
      setIsEditing(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onSave(item.id, noteText);
    setIsEditing(false);
  };

  const handleBlur = () => {
    // Auto-save on blur
    handleSave();
  };

  // URL을 하이퍼링크로 변환하는 함수
  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-4" onClick={onClose}>
      <div className="bg-surface border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col shadow-black/50 h-[70vh]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-surface/80 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icons.File className="w-5 h-5" />
            노트
          </h2>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          {isEditing ? (
            <textarea
              className="flex-1 w-full bg-black border border-border rounded-lg p-3 text-base text-white resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent custom-scrollbar leading-relaxed"
              placeholder="노트를 입력하세요..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleBlur}
              autoFocus
            />
          ) : (
            <div
                className="flex-1 w-full bg-black rounded-lg p-3 text-base text-white overflow-y-auto custom-scrollbar whitespace-pre-wrap cursor-pointer hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
                onDoubleClick={() => setIsEditing(true)}
                title="더블클릭하여 수정"
            >
                {noteText ? renderTextWithLinks(noteText) : <span className="text-zinc-500 italic">노트 내용이 없습니다. 더블클릭하여 내용을 입력하세요.</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface/80 flex justify-end gap-3 flex-shrink-0">
          {isEditing && (
            <button
                onClick={handleSave}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
            >
                <Icons.Save className="w-4 h-4" />
                저장
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-white bg-zinc-600 hover:bg-zinc-700 rounded-md transition-colors font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemNoteModal;
