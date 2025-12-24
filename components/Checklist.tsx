import React, { useState, useEffect } from 'react';
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
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800/50"
          >
            <div className="pt-1">
              <input 
                type="checkbox"
                checked={item.is_checked}
                onChange={(e) => handleUpdate(item.id, { is_checked: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <input 
                type="text"
                value={item.text}
                onChange={(e) => handleUpdate(item.id, { text: e.target.value })}
                placeholder="할 일을 입력하세요..."
                className={`w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder-zinc-600 ${
                  item.is_checked ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200'
                }`}
              />
              
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
                      className="mt-1.5 text-xs text-zinc-500/80 flex items-center gap-1.5 cursor-pointer w-fit py-0.5 rounded transition-colors hover:text-zinc-300 select-none group/memo"
                      onDoubleClick={() => setEditingMemoId(item.id)}
                      title="더블클릭하여 메모 수정"
                  >
                      <Icons.Memo className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{item.memo}</span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onOpenMemo(item)}
                className={`p-1.5 rounded transition-colors ${item.memo ? 'text-accent bg-accent/10' : 'text-zinc-500 hover:text-accent hover:bg-zinc-700'}`}
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