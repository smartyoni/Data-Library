import React from 'react';
import { Bookmark } from '../types';
import { Icons } from './ui/Icons';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`'${bookmark.name}' 북마크를 삭제하시겠습니까?`)) {
      onDelete(bookmark.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(bookmark);
  };

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center justify-center gap-1 p-1 rounded-lg border-2 transition-all hover:scale-105 aspect-square h-12 cursor-pointer relative"
      style={{
        backgroundColor: `${bookmark.color}15`,
        borderColor: bookmark.color,
      }}
      title={`${bookmark.name}\n${bookmark.url}`}
    >
      {/* 버튼 내용 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
        <span className="text-xs font-semibold text-white text-center truncate w-full">
          {bookmark.name}
        </span>
      </div>

      {/* 호버 시 편집/삭제 버튼 (모바일에서는 항상 표시) */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 md:opacity-100 flex gap-1 transition-opacity">
        <button
          onClick={handleEdit}
          className="p-1 rounded-md bg-zinc-700/80 text-zinc-200 hover:bg-blue-500/80 hover:text-white transition-colors"
          title="수정"
        >
          <Icons.Settings className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded-md bg-zinc-700/80 text-zinc-200 hover:bg-red-500/80 hover:text-white transition-colors"
          title="삭제"
        >
          <Icons.Trash className="w-3 h-3" />
        </button>
      </div>
    </a>
  );
};

export default BookmarkCard;
