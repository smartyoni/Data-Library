import React, { useState } from 'react';
import { BookmarkZone as BookmarkZoneType, Bookmark } from '../types';
import { Icons } from './ui/Icons';
import BookmarkCard from './BookmarkCard';

interface BookmarkZoneProps {
  zone: BookmarkZoneType;
  bookmarks: Bookmark[];
  onEditZone: (id: string, updates: Partial<BookmarkZoneType>) => void;
  onAddBookmark: () => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

const BookmarkZone: React.FC<BookmarkZoneProps> = ({
  zone,
  bookmarks,
  onEditZone,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(zone.name);

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== zone.name) {
      await onEditZone(zone.id, { name: editedName });
    } else {
      setEditedName(zone.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditedName(zone.name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="flex flex-col bg-surface rounded-xl border border-border overflow-hidden h-[400px] shadow-sm">
      {/* Header with Zone Name and Color */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-zinc-900/30 flex-shrink-0">
        {isEditingName ? (
          <input
            autoFocus
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-zinc-950 border border-accent rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        ) : (
          <h3
            onDoubleClick={() => setIsEditingName(true)}
            className="flex-1 font-semibold text-sm text-white cursor-text hover:bg-white/5 px-2 py-1 rounded transition-colors"
          >
            {zone.name}
          </h3>
        )}

        {/* Color Indicator */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 ml-2 border border-zinc-600"
          style={{ backgroundColor: zone.default_color }}
          title={zone.default_color}
        />
      </div>

      {/* Bookmarks Grid (4 columns) */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEditBookmark}
                onDelete={onDeleteBookmark}
              />
            ))}

            {/* Add Button (if less than 9 bookmarks) */}
            {bookmarks.length < 9 && (
              <button
                onClick={onAddBookmark}
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all aspect-square h-12 group"
                title="북마크 추가"
              >
                <Icons.Plus className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </button>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Icons.Bookmark className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600 mb-3">북마크가 없습니다.</p>
            <button
              onClick={onAddBookmark}
              className="text-xs px-3 py-1.5 rounded-md bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            >
              첫 북마크 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkZone;
