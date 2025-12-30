import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './ui/Icons';
import { ChecklistItem } from '../types';
import firestoreDb from '../services/firestoreDb';

interface ChecklistProps {
  itemId: string;
  onOpenMemo: (item: ChecklistItem) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ itemId, onOpenMemo }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Drag and drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchItems = async () => {
    const data = await firestoreDb.checklist.listByItem(itemId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    // 1. Create entry in DB (returns empty item)
    const newItem = await firestoreDb.checklist.create(itemId);

    // 2. Optimistically update local state with text
    const itemWithText = { ...newItem, text: newItemText };
    setItems(prev => [...prev, itemWithText]);

    // 3. Clear input
    setNewItemText('');

    // 4. Update DB with text
    await firestoreDb.checklist.update({ id: newItem.id, text: itemWithText.text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleAddItem();
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ChecklistItem>) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await firestoreDb.checklist.update({ id, ...updates });
  };

  const handleMemoSave = (id: string, text: string) => {
    setEditingMemoId(null);
    handleUpdate(id, { memo: text });
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('이 항목을 삭제하시겠습니까?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await firestoreDb.checklist.delete(id);
  };

  const handleStartEdit = (id: string, currentText: string) => {
    setEditingItemId(id);
    setEditingItemText(currentText);
  };

  const handleSaveItemText = async (id: string) => {
    if (editingItemText !== items.find(i => i.id === id)?.text) {
      await handleUpdate(id, { text: editingItemText });
    }
    setEditingItemId(null);
  };

  const handleTextDoubleClick = (id: string, currentText: string) => {
    handleStartEdit(id, currentText);
  };

  // Long press handlers for mobile
  const handleTouchStart = (id: string, currentText: string) => {
    longPressTimerRef.current = setTimeout(() => {
      handleStartEdit(id, currentText);
    }, 300);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Drag and drop handlers
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const start = dragItem.current;
    const end = dragOverItem.current;

    if (start !== null && end !== null && start !== end) {
      const _items = [...items];
      const draggedItemContent = _items[start];
      _items.splice(start, 1);
      _items.splice(end, 0, draggedItemContent);

      // Optimistic update
      setItems(_items);

      // Update database
      await firestoreDb.checklist.reorder(itemId, _items.map(i => i.id));
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Mobile arrow button handlers
  const handleMoveUp = async (id: string) => {
    const index = items.findIndex(i => i.id === id);
    if (index > 0) {
      const newOrder = [...items];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

      // Optimistic update
      setItems(newOrder);

      // Update database
      await firestoreDb.checklist.reorder(itemId, newOrder.map(i => i.id));
    }
  };

  const handleMoveDown = async (id: string) => {
    const index = items.findIndex(i => i.id === id);
    if (index < items.length - 1) {
      const newOrder = [...items];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

      // Optimistic update
      setItems(newOrder);

      // Update database
      await firestoreDb.checklist.reorder(itemId, newOrder.map(i => i.id));
    }
  };

  if (loading) return <div className="text-secondary text-sm">로딩 중...</div>;

  return (
    <div className="h-full flex flex-col pt-2">
      {/* Quick Input Field */}
      <div className="mb-4 flex-shrink-0 flex items-center gap-2">
        <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="새로운 할 일을 입력하세요"
            className="flex-1 bg-zinc-900/50 border border-zinc-700 text-sm text-zinc-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-all placeholder-zinc-600 shadow-sm"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="flex-shrink-0 p-2.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="항목 추가 (또는 Enter 입력)"
        >
          <Icons.Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-green-500/20 transition-colors border border-transparent hover:border-green-500/30"
          >
            {/* Desktop drag handle (hidden on mobile) */}
            <div className="hidden md:block cursor-grab active:cursor-grabbing pt-1 text-zinc-600 hover:text-zinc-400">
              <Icons.DragHandle className="w-4 h-4" />
            </div>

            {/* Mobile up/down arrows (hidden on desktop) */}
            <div className="flex md:hidden flex-col gap-0.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveUp(item.id);
                }}
                disabled={index === 0}
                className={`p-0.5 transition-colors ${
                  index === 0
                    ? 'opacity-20 cursor-not-allowed text-zinc-700'
                    : 'text-zinc-500 hover:text-accent'
                }`}
                title="위로 이동"
              >
                <Icons.ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveDown(item.id);
                }}
                disabled={index === items.length - 1}
                className={`p-0.5 transition-colors ${
                  index === items.length - 1
                    ? 'opacity-20 cursor-not-allowed text-zinc-700'
                    : 'text-zinc-500 hover:text-accent'
                }`}
                title="아래로 이동"
              >
                <Icons.ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-1">
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={(e) => handleUpdate(item.id, { is_checked: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {editingItemId === item.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editingItemText}
                  onChange={(e) => setEditingItemText(e.target.value)}
                  onBlur={() => handleSaveItemText(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveItemText(item.id);
                    if (e.key === 'Escape') setEditingItemId(null);
                  }}
                  className="w-full bg-zinc-950 border border-accent rounded px-1 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent min-h-10"
                />
              ) : (
                <div
                  onDoubleClick={() => handleTextDoubleClick(item.id, item.text)}
                  onTouchStart={() => handleTouchStart(item.id, item.text)}
                  onTouchEnd={handleTouchEnd}
                  className={`w-full p-0 text-sm cursor-text ${
                    item.is_checked ? 'text-black line-through decoration-black' : 'text-zinc-200'
                  }`}
                >
                  {item.text || '할 일을 입력하세요...'}
                </div>
              )}
              
              {item.memo && (
                editingMemoId === item.id ? (
                  <div className="mt-1.5 w-full">
                    <input
                      autoFocus
                      type="text"
                      defaultValue={item.memo}
                      onBlur={(e) => handleMemoSave(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingMemoId(null);
                        }
                      }}
                      className="w-full bg-zinc-950 border border-accent rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none placeholder-zinc-500 shadow-sm"
                    />
                  </div>
                ) : (
                  <div
                      className="mt-1.5 text-xs text-green-500/80 flex items-center gap-1.5 cursor-pointer w-fit py-0.5 rounded transition-colors hover:text-green-400 select-none group/memo"
                      onDoubleClick={() => setEditingMemoId(item.id)}
                      title="더블클릭하여 메모 수정"
                  >
                      <Icons.Memo className="w-3 h-3 flex-shrink-0 text-green-500" />
                      <span className="truncate max-w-[200px]">{item.memo}</span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onOpenMemo(item)}
                className={`p-1.5 rounded transition-colors ${item.memo ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-accent hover:bg-zinc-700'}`}
                title="메모 크게 보기"
              >
                <Icons.Memo className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-zinc-500 hover:text-danger hover:bg-zinc-700 rounded transition-colors"
                title="삭제"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-600 text-sm bg-zinc-900/20">
            등록된 항목이 없습니다.
            <br />
            <span className="text-xs text-zinc-700 mt-1 block">위 입력창에서 할 일을 추가해보세요.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checklist;