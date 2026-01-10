import React, { useRef, useState, useEffect } from 'react';
import { Item } from '../types';
import { Icons } from './ui/Icons';
import ConfirmModal from './ConfirmModal';
import CompletedItemsModal from './CompletedItemsModal';
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
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);
  const [localItems, setLocalItems] = useState<Item[]>(items);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [contextMenuItemId, setContextMenuItemId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [completedItems, setCompletedItems] = useState<Item[]>([]);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    dragItem.current = itemId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
  };

  // Helper function to get active items (filter out completed items)
  const getActiveItems = (items: Item[]) => {
    return items.filter(item => item.status_color !== 'gray');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
    // Only prevent dragging to completed (gray) items
    const targetItem = localItems.find(item => item.id === targetItemId);
    if (targetItem && targetItem.status_color === 'gray') {
      e.dataTransfer.dropEffect = "none"; // Show "not allowed" cursor
      return;
    }

    dragOverItem.current = targetItemId;
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedItemId = dragItem.current;
    const targetItemId = dragOverItem.current;

    if (draggedItemId && targetItemId && draggedItemId !== targetItemId) {
      // Find items by ID
      const draggedItem = localItems.find(item => item.id === draggedItemId);
      const targetItem = localItems.find(item => item.id === targetItemId);

      // Don't allow dragging to completed items
      if (draggedItem && targetItem && targetItem.status_color !== 'gray') {
        // Get active items and find their positions
        const activeItems = getActiveItems(localItems);
        const startIndex = activeItems.findIndex(item => item.id === draggedItemId);
        const endIndex = activeItems.findIndex(item => item.id === targetItemId);

        if (startIndex !== -1 && endIndex !== -1 && startIndex !== endIndex) {
          // Reorder within active items
          const _items = [...activeItems];
          const draggedItemContent = _items[startIndex];
          _items.splice(startIndex, 1);
          _items.splice(endIndex, 0, draggedItemContent);

          // Update localItems with new order
          // Need to merge back with completed items (gray)
          const completedItems = localItems.filter(item => item.status_color === 'gray');
          const allItems = [..._items, ...completedItems];

          setLocalItems(allItems);
          onReorder(allItems);
        }
      }
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

  const handleMarkComplete = async (itemId: string) => {
    const item = localItems.find(i => i.id === itemId);
    if (item) {
      await firestoreDb.items.update({ id: item.id, status_color: 'gray' });
      setLocalItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, status_color: 'gray' } : i)
      );
    }
    setMenuItemId(null);
    setContextMenuItemId(null);
  };

  const handleColorSelect = async (itemId: string, color?: 'green' | 'pink' | 'gray') => {
    const item = localItems.find(i => i.id === itemId);
    if (item) {
      // undefined를 null로 변환 (Firebase에서 deleteField() 처리)
      const colorValue = color === undefined ? null : color;
      await firestoreDb.items.update({ id: item.id, status_color: colorValue });
      setLocalItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, status_color: colorValue } : i)
      );
    }
    setMenuItemId(null);
    setContextMenuItemId(null);
  };

  // Completed items logic
  const activeItems = localItems.filter(item => item.status_color !== 'gray');
  const completedCount = localItems.filter(item => item.status_color === 'gray').length;

  // Sort active items by order field only
  const sortedActiveItems = [...activeItems].sort((a, b) => {
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const loadCompletedItems = () => {
    const completed = localItems.filter(item => item.status_color === 'gray');
    setCompletedItems(completed);
  };

  const handleRestoreItem = async (itemId: string) => {
    try {
      // Restore to no status (undefined)
      await firestoreDb.items.update({ id: itemId, status_color: undefined });
      // Update local state
      setLocalItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, status_color: undefined } : i)
      );
      loadCompletedItems();
    } catch (error) {
      console.error('항목 복원 실패:', error);
    }
  };

  const handleDeleteCompletedItem = async (itemId: string) => {
    try {
      await firestoreDb.items.delete(itemId);
      setLocalItems(prev => prev.filter(i => i.id !== itemId));
      loadCompletedItems();
    } catch (error) {
      console.error('항목 삭제 실패:', error);
    }
  };

  const getStatusBackgroundClass = (item: Item, isSelected: boolean): string => {
    if (!item.status_color) return '';

    const colorMap = {
      green: isSelected
        ? 'bg-green-500/40 border-l-2 border-green-500'
        : 'bg-green-500/30',
      pink: isSelected
        ? 'bg-pink-500/40 border-l-2 border-pink-500'
        : 'bg-pink-500/30',
      gray: isSelected
        ? 'bg-gray-400/40 border-l-2 border-gray-400'
        : 'bg-gray-400/30'
    };

    return colorMap[item.status_color];
  };

  const getHoverClass = (item: Item): string => {
    if (!item.status_color) return 'hover:bg-emerald-500/15';

    const hoverMap = {
      green: 'hover:bg-green-500/50',
      pink: 'hover:bg-pink-500/50',
      gray: 'hover:bg-gray-400/50'
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
         ) : sortedActiveItems.length > 0 ? (
           <div className="divide-y divide-border/50">
             {sortedActiveItems.map((item) => (
               <div
                 key={item.id}
                 draggable
                 onDragStart={(e) => handleDragStart(e, item.id)}
                 onDragEnter={(e) => handleDragEnter(e, item.id)}
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
                         className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[140px]"
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
                           onClick={() => handleColorSelect(item.id, 'green')}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition-colors border-b border-gray-200"
                         >
                           <div className="w-3 h-3 rounded-full bg-green-500" />
                           녹색
                         </button>
                         <button
                           onClick={() => handleColorSelect(item.id, 'pink')}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-pink-50 transition-colors border-b border-gray-200"
                         >
                           <div className="w-3 h-3 rounded-full bg-pink-500" />
                           핑크색
                         </button>
                         <button
                           onClick={() => handleColorSelect(item.id)}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors border-b border-gray-200"
                         >
                           <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                           기본색상
                         </button>
                         <button
                           onClick={() => handleColorSelect(item.id, 'gray')}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition-colors border-b border-gray-200"
                         >
                           <div className="w-3 h-3 rounded-full bg-gray-400" />
                           완료
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

       {/* Completed Items Button - Always at bottom */}
       <div className="px-4 py-3 border-t border-border bg-background/50 flex-shrink-0">
         <button
           onClick={() => {
             if (completedCount > 0) {
               loadCompletedItems();
               setShowCompletedModal(true);
             }
           }}
           disabled={completedCount === 0}
           className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
             completedCount > 0
               ? 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 cursor-pointer'
               : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
           }`}
         >
           <Icons.CheckCircle className="w-4 h-4" />
           <span>완료 ({completedCount})</span>
         </button>
       </div>
       </div>

       {/* Desktop Context Menu */}
       {contextMenuItemId && contextMenuPosition && (
         <div
           className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[140px]"
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
                 onClick={() => handleColorSelect(contextMenuItemId, 'green')}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition-colors border-b border-gray-200"
               >
                 <div className="w-3 h-3 rounded-full bg-green-500" />
                 녹색
               </button>
               <button
                 onClick={() => handleColorSelect(contextMenuItemId, 'pink')}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-pink-50 transition-colors border-b border-gray-200"
               >
                 <div className="w-3 h-3 rounded-full bg-pink-500" />
                 핑크색
               </button>
               <button
                 onClick={() => handleColorSelect(contextMenuItemId)}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors border-b border-gray-200"
               >
                 <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                 기본색상
               </button>
               <button
                 onClick={() => handleColorSelect(contextMenuItemId, 'gray')}
                 className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition-colors border-b border-gray-200"
               >
                 <div className="w-3 h-3 rounded-full bg-gray-400" />
                 완료
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


       {/* Completed Items Modal */}
       <CompletedItemsModal
         isOpen={showCompletedModal}
         completedItems={completedItems}
         onRestore={handleRestoreItem}
         onDelete={handleDeleteCompletedItem}
         onClose={() => setShowCompletedModal(false)}
       />

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
