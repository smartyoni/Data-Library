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

// Color palette options - Notion style (30 colors)
const COLOR_PALETTE = [
  '#C0C0BD', // Gray
  '#D9A891', // Brown
  '#D99B71', // Orange
  '#D9C659', // Yellow
  '#C5E6A5', // Green
  '#A8D5B8', // Sage
  '#9CBFF5', // Blue
  '#C9B3E6', // Purple
  '#E6B3D9', // Pink
  '#E67A7A', // Red
  '#B8B8B3', // Warm Gray
  '#C9B8A3', // Taupe
  '#D9C9A3', // Cream
  '#A3D9D1', // Teal
  '#B3C9FF', // Lavender
  '#FF8080', // Light Red
  '#E8B8A3', // Light Orange
  '#FFDE71', // Light Yellow
  '#C9FF99', // Light Mint
  '#99D9D1', // Light Cyan
  '#B3D9FF', // Light Periwinkle
  '#E6B3D9', // Light Magenta
  '#FF9999', // Light Coral
  '#99CCFF', // Light Sky Blue
  '#D9B3FF', // Light Iris
  '#FFCC99', // Light Sand
  '#99FFD9', // Light Aqua
  '#D9B3FF', // Light Grape
  '#FFB3D9', // Light Rose
  '#99E6FF', // Light Ice
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
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all transform hover:scale-110 ${
                      color === zone.default_color
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent hover:border-zinc-600'
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
