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

// Color palette options - Notion style
const COLOR_PALETTE = [
  '#F3F3F1', // Gray
  '#FCEAE3', // Brown
  '#FADCC4', // Orange
  '#FDF7DE', // Yellow
  '#F0F7E4', // Green
  '#DDEDDA', // Sage
  '#DFEAFF', // Blue
  '#EBE5FA', // Purple
  '#F5DEEF', // Pink
  '#FDECED', // Red
  '#F2F2F0', // Warm Gray
  '#E8E0D5', // Taupe
  '#F4EDDE', // Cream
  '#E7F2EE', // Teal
  '#E3E8FF', // Lavender
  '#FFF0F0', // Light Red
];

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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

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

  const handleColorChange = async (color: string) => {
    await onEditZone(zone.id, { default_color: color });
    setIsColorPickerOpen(false);
  };

  const handleColorContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsColorPickerOpen(!isColorPickerOpen);
  };

  return (
    <div className="flex flex-col bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header with Zone Name and Color */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-zinc-900/30 flex-shrink-0">
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

        {/* Add Button + Color Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0 relative">
          <button
            onClick={onAddBookmark}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="북마크 추가"
          >
            <Icons.Plus className="w-4 h-4 text-zinc-400 hover:text-zinc-200 transition-colors" />
          </button>
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 border border-zinc-600 cursor-pointer hover:border-zinc-400 transition-colors"
            style={{ backgroundColor: zone.default_color }}
            title={`${zone.default_color}\n우클릭하여 색상 변경`}
            onContextMenu={handleColorContextMenu}
          />

          {/* Color Palette Popover */}
          {isColorPickerOpen && (
            <div className="absolute right-0 top-full mt-2 bg-zinc-950 border border-zinc-700 rounded-lg p-2 z-50 shadow-lg">
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                      color === zone.default_color ? 'border-white' : 'border-zinc-600'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks Grid (4 columns) */}
      <div className="overflow-y-auto p-0 custom-scrollbar max-h-[240px]">
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-4 gap-0">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={onEditBookmark}
                onDelete={onDeleteBookmark}
              />
            ))}
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
