import React, { useRef, useState, useEffect } from 'react';
import { Item } from '../types';
import { Icons } from './ui/Icons';

interface ItemsListProps {
  categoryName: string | undefined;
  items: Item[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
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
  onReorder,
  loading,
  onBack
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [localItems, setLocalItems] = useState<Item[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

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
                 className={`group px-3 py-4 md:py-3 cursor-pointer hover:bg-zinc-900 transition-colors relative flex items-center gap-2 ${
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

                 {/* Mobile Arrow */}
                 <Icons.ChevronRight className="w-4 h-4 text-zinc-600 md:hidden absolute right-3 top-1/2 -translate-y-1/2" />

                 <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if(window.confirm('삭제하시겠습니까?')) onDeleteItem(item.id);
                     }}
                     className="hidden md:block opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-danger hover:bg-zinc-800 rounded transition-all absolute right-2 top-1/2 -translate-y-1/2"
                   >
                     <Icons.Trash className="w-4 h-4" />
                   </button>
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
    </div>
  );
};

export default ItemsList;