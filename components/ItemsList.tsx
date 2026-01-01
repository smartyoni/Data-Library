import React, { useRef, useState, useEffect } from 'react';
import { Item } from '../types';
import { Icons } from './ui/Icons';
import ConfirmModal from './ConfirmModal';

interface ItemsListProps {
  categoryName: string | undefined;
  items: Item[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (item: Item) => void;
  onReorder: (newOrder: Item[]) => void;
  loading: boolean;
  onBack: () => void;
}

const ItemsList: React.FC<ItemsListProps> = ({
  categoryName,
  items,
  selectedItemId,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  onMoveItem,
  onReorder,
  loading,
  onBack
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [localItems, setLocalItems] = useState<Item[]>(items);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [contextMenuItemId, setContextMenuItemId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuItemId(null);
      setContextMenuItemId(null);
    };
    if (menuItemId || contextMenuItemId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuItemId, contextMenuItemId]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const start = dragItem.current;
    const end = dragOverItem.current;

    if (start !== null && end !== null && start !== end) {
      const _items = [...localItems];
      const draggedItemContent = _items[start];
      _items.splice(start, 1);
      _items.splice(end, 0, draggedItemContent);

      setLocalItems(_items);
      onReorder(_items);
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMobileDeleteClick = (id: string) => {
    setMenuItemId(null);
    setDeletingItemId(id);
    setDeleteConfirmOpen(true);
  };

  const handleMobileMoveClick = (item: Item) => {
    setMenuItemId(null);
    onMoveItem(item);
  };

  const handleContextMenu = (e: React.MouseEvent, item: Item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuItemId(item.id);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleContextMenuMove = (item: Item) => {
    setContextMenuItemId(null);
    onMoveItem(item);
  };

  const confirmDelete = () => {
    if (deletingItemId) {
      onDeleteItem(deletingItemId);
    }
    setDeleteConfirmOpen(false);
    setDeletingItemId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeletingItemId(null);
  };

  return (
    <div className="flex flex-col h-full w-full">
       {/* Header */}
       <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/50 flex-shrink-0">
         <div className="flex items-center gap-3 overflow-hidden">
            <button
                onClick={onBack}
                className="md:hidden p-1 -ml-1 text-zinc-400 hover:text-white"
            >
                <Icons.Back className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-zinc-200 truncate pr-2 text-base md:text-sm" title={categoryName}>
            {categoryName || '카테고리'}
            </h2>
         </div>
         <button
           onClick={onAddItem}
           className="p-1.5 text-zinc-400 hover:text-accent hover:bg-zinc-800 rounded-md transition-colors"
           title="새 항목 추가"
         >
           <Icons.Plus className="w-5 h-5" />
         </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto">
         {loading ? (
           <div className="p-4 space-y-3 opacity-50">
             {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-800/50 rounded animate-pulse" />)}
           </div>
         ) : localItems.length > 0 ? (
           <div className="divide-y divide-border/50">
             {localItems.map((item, index) => (
               <div
                 key={item.id}
                 draggable
                 onDragStart={(e) => handleDragStart(e, index)}
                 onDragEnter={(e) => handleDragEnter(e, index)}
                 onDragOver={handleDragOver}
                 onDrop={handleDrop}
                 onClick={() => onSelectItem(item.id)}
                 onContextMenu={(e) => handleContextMenu(e, item)}
                 className={`group px-3 py-4 md:py-3 cursor-pointer hover:bg-emerald-500/15 transition-colors relative flex items-center gap-2 ${
                   selectedItemId === item.id ? 'bg-zinc-900 border-l-2 border-accent' : 'border-l-2 border-transparent'
                 }`}
               >
                 <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 hidden md:block">
                    <Icons.DragHandle className="w-4 h-4" />
                 </div>

                 <div className="flex-1 min-w-0 pr-6">
                   <h3 className={`text-base md:text-sm font-medium leading-tight truncate ${selectedItemId === item.id ? 'text-white' : 'text-zinc-300'}`}>
                     {item.title || '제목 없음'}
                   </h3>
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2">
                   {/* Mobile Chevron */}
                   <Icons.ChevronRight className="w-4 h-4 text-zinc-600 md:hidden" />

                   {/* Mobile 3-point Menu */}
                   <div className="relative md:hidden">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setMenuItemId(menuItemId === item.id ? null : item.id);
                       }}
                       className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                       title="옵션"
                     >
                       <Icons.More className="w-4 h-4" />
                     </button>

                     {/* Dropdown Menu */}
                     {menuItemId === item.id && (
                       <div
                         className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                         onClick={(e) => e.stopPropagation()}
                       >
                         <button
                           onClick={() => handleMobileMoveClick(item)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-yellow-500/15 transition-colors border-b border-zinc-700"
                         >
                           <Icons.ArrowRight className="w-4 h-4" />
                           이동
                         </button>
                         <button
                           onClick={() => handleMobileDeleteClick(item.id)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                         >
                           <Icons.Trash className="w-4 h-4" />
                           삭제
                         </button>
                       </div>
                     )}
                   </div>

                   {/* Desktop Delete Button - Hover */}
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if(window.confirm('삭제하시겠습니까?')) onDeleteItem(item.id);
                     }}
                     className="hidden md:block opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-danger hover:bg-zinc-800 rounded transition-all"
                   >
                     <Icons.Trash className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="p-8 text-center text-zinc-500">
             <p className="text-sm">항목이 없습니다.</p>
             <button onClick={onAddItem} className="text-xs text-accent mt-2 hover:underline">
               + 새 항목 만들기
             </button>
           </div>
         )}
       </div>

       {/* Desktop Context Menu */}
       {contextMenuItemId && contextMenuPosition && (
         <div
           className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 min-w-[120px]"
           style={{
             left: `${contextMenuPosition.x}px`,
             top: `${contextMenuPosition.y}px`,
           }}
           onClick={(e) => e.stopPropagation()}
         >
           {localItems.find(item => item.id === contextMenuItemId) && (
             <>
               <button
                 onClick={() => handleContextMenuMove(localItems.find(item => item.id === contextMenuItemId)!)}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-yellow-500/15 transition-colors border-b border-zinc-700"
               >
                 <Icons.ArrowRight className="w-4 h-4" />
                 이동
               </button>
               <button
                 onClick={() => {
                   setContextMenuItemId(null);
                   setDeletingItemId(contextMenuItemId);
                   setDeleteConfirmOpen(true);
                 }}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
               >
                 <Icons.Trash className="w-4 h-4" />
                 삭제
               </button>
             </>
           )}
         </div>
       )}

       {/* Delete Confirm Modal */}
       <ConfirmModal
         isOpen={deleteConfirmOpen}
         title="항목 삭제"
         message="이 항목을 삭제하시겠습니까?"
         confirmText="삭제"
         cancelText="취소"
         onConfirm={confirmDelete}
         onCancel={cancelDelete}
         danger={true}
       />
    </div>
  );
};

export default ItemsList;
