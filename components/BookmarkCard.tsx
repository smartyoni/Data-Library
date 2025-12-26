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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(bookmark);
  };

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center gap-0 p-0 rounded-none border-0 transition-all hover:opacity-90 aspect-[4/2.4] cursor-pointer relative"
      style={{
        backgroundColor: bookmark.color,
      }}
      onContextMenu={handleContextMenu}
      title={`${bookmark.name}\n${bookmark.url}`}
    >
      {/* 버튼 내용 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0 min-w-0 px-1 py-1">
        <span className="text-[14px] font-bold text-white text-center line-clamp-2 w-full">
          {bookmark.name}
        </span>
      </div>
    </a>
  );
};

export default BookmarkCard;
