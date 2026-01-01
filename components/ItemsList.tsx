import React, { useRef, useState, useEffect } from 'react';
import { Item } from '../types';
import { Icons } from './ui/Icons';
import ConfirmModal from './ConfirmModal';
import firestoreDb from '../services/firestoreDb';

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
  const [colorMenuItemId, setColorMenuItemId] = useState<string | null>(null);
  const [colorMenuPosition, setColorMenuPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuItemId(null);
      setContextMenuItemId(null);
      setColorMenuItemId(null);
    };
    if (menuItemId || contextMenuItemId || colorMenuItemId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuItemId, contextMenuItemId, colorMenuItemId]);

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

  const handleColorClick = (e: React.MouseEvent | MouseEvent, itemId: string) => {
    e.stopPropagation();
    setMenuItemId(null);
    setContextMenuItemId(null);
    setColorMenuItemId(itemId);
    setColorMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleColorSelect = async (color: 'green' | 'pink' | 'gray') => {
    if (colorMenuItemId) {
      const item = localItems.find(i => i.id === colorMenuItemId);
      if (item) {
        await firestoreDb.items.update({ id: item.id, status_color: color });
        setLocalItems(prev =>
          prev.map(i => i.id === colorMenuItemId ? { ...i, status_color: color } : i)
        );
      }
      setColorMenuItemId(null);
      setColorMenuPosition(null);
    }
  };

  const handleColorReset = async () => {
    if (colorMenuItemId) {
      const item = localItems.find(i => i.id === colorMenuItemId);
      if (item) {
        await firestoreDb.items.update({ id: item.id, status_color: undefined });
        setLocalItems(prev =>
          prev.map(i => i.id === colorMenuItemId ? { ...i, status_color: undefined } : i)
        );
      }
      setColorMenuItemId(null);
      setColorMenuPosition(null);
    }
  };

  const getStatusBackgroundClass = (item: Item, isSelected: boolean): string => {
    if (!item.status_color) return '';

    const colorMap = {
      green: isSelected
        ? 'bg-green-500/20 border-l-2 border-green-500'
        : 'bg-green-500/10',
      pink: isSelected
        ? 'bg-pink-500/20 border-l-2 border-pink-500'
        : 'bg-pink-500/10',
      gray: isSelected
        ? 'bg-gray-400/20 border-l-2 border-gray-400'
        : 'bg-gray-400/10'
    };

    return colorMap[item.status_color];
  };

  const getHoverClass = (item: Item): string => {
    if (!item.status_color) return 'hover:bg-emerald-500/15';

    const hoverMap = {
      green: 'hover:bg-green-500/25',
      pink: 'hover:bg-pink-500/25',
      gray: 'hover:bg-gray-400/25'
    };

    return hoverMap[item.status_color];
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
                 className={`
                   group px-3 py-4 md:py-3 cursor-pointer transition-colors relative flex items-center gap-2
                   ${getStatusBackgroundClass(item, selectedItemId === item.id)}
                   ${getHoverClass(item)}
                   ${selectedItemId === item.id && !item.status_color ? 'bg-zinc-900 border-l-2 border-accent' : ''}
                   ${!item.status_color && selectedItemId !== item.id ? 'border-l-2 border-transparent' : ''}
                 `.trim().replace(/\s+/g, ' ')}
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
                         className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]"
                         onClick={(e) => e.stopPropagation()}
                       >
                         <button
                           onClick={() => handleMobileMoveClick(item)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-yellow-100 transition-colors border-b border-gray-200"
                         >
                           <Icons.ArrowRight className="w-4 h-4" />
                           이동
                         </button>
                         <button
                           onClick={(e) => handleColorClick(e, item.id)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors border-b border-gray-200"
                         >
                           <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 via-pink-500 to-gray-400" />
                           진행색상
                         </button>
                         <button
                           onClick={() => handleMobileDeleteClick(item.id)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
           className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]"
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
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-yellow-100 transition-colors border-b border-gray-200"
               >
                 <Icons.ArrowRight className="w-4 h-4" />
                 이동
               </button>
               <button
                 onClick={(e) => handleColorClick(e, contextMenuItemId)}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors border-b border-gray-200"
               >
                 <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 via-pink-500 to-gray-400" />
                 진행색상
               </button>
               <button
                 onClick={() => {
                   setContextMenuItemId(null);
                   setDeletingItemId(contextMenuItemId);
                   setDeleteConfirmOpen(true);
                 }}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
               >
                 <Icons.Trash className="w-4 h-4" />
                 삭제
               </button>
             </>
           )}
         </div>
       )}

       {/* Color Palette Menu */}
       {colorMenuItemId && colorMenuPosition && (
         <div
           className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2"
           style={{
             left: `${colorMenuPosition.x}px`,
             top: `${colorMenuPosition.y}px`,
           }}
           onClick={(e) => e.stopPropagation()}
         >
           <div className="flex flex-col gap-1">
             <p className="text-xs text-gray-600 px-2 py-1 font-medium">진행 상태</p>

             <button
               onClick={() => handleColorSelect('green')}
               className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-800 hover:bg-green-50 transition-colors rounded"
             >
               <div className="w-4 h-4 rounded-full bg-green-500" />
               <span>착수전</span>
             </button>

             <button
               onClick={() => handleColorSelect('pink')}
               className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-800 hover:bg-pink-50 transition-colors rounded"
             >
               <div className="w-4 h-4 rounded-full bg-pink-500" />
               <span>진행중</span>
             </button>

             <button
               onClick={() => handleColorSelect('gray')}
               className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors rounded"
             >
               <div className="w-4 h-4 rounded-full bg-gray-300" />
               <span>완료</span>
             </button>

             <div className="border-t border-gray-200 my-1"></div>

             <button
               onClick={handleColorReset}
               className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded"
             >
               <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-dashed" />
               <span>색상초기화</span>
             </button>
           </div>
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
