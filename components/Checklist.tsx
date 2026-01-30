import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './ui/Icons';
import { ChecklistItem, ChecklistItemData, isChecklistItem, isChecklistDivider } from '../types';
import firestoreDb from '../services/firestoreDb';
import { useChecklistClipboard } from '../contexts/ChecklistClipboardContext';
import ChecklistDivider from './ChecklistDivider';

interface ChecklistProps {
  itemId: string;
  onOpenMemo: (item: ChecklistItem) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ itemId, onOpenMemo }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newDividerLabel, setNewDividerLabel] = useState('');
  const [showDividerInput, setShowDividerInput] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // Context menu state for clipboard
  const [menuChecklistId, setMenuChecklistId] = useState<string | null>(null);
  const [contextMenuChecklistId, setContextMenuChecklistId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Clipboard context
  const { copyChecklistItem, pasteChecklistItem, hasClipboard } = useChecklistClipboard();

  // Drag and drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const editingTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuChecklistId(null);
      setContextMenuChecklistId(null);
    };
    if (menuChecklistId || contextMenuChecklistId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuChecklistId, contextMenuChecklistId]);

  const handleContextMenu = (e: React.MouseEvent, item: ChecklistItem) => {
    // Only show context menu for items, not dividers
    if (!isChecklistItem(item)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setContextMenuChecklistId(item.id);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCopyClick = (item: ChecklistItem) => {
    copyChecklistItem(item);
    setMenuChecklistId(null);
    setContextMenuChecklistId(null);
  };

  const handlePasteClick = async () => {
    await pasteChecklistItem(itemId);
    await fetchItems();
  };

  const fetchItems = async () => {
    const data = await firestoreDb.checklist.listByItem(itemId);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Auto-height adjustment for editing textarea
  useEffect(() => {
    if (editingTextareaRef.current) {
      editingTextareaRef.current.style.height = 'auto';
      editingTextareaRef.current.style.height = editingTextareaRef.current.scrollHeight + 'px';
    }
  }, [editingItemText, editingItemId]);

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
    // Ctrl+Enter to add item
    if (e.key === 'Enter' && e.ctrlKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAddItem();
    }
    // Enter alone allows newline (textarea default behavior)
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

  const handleAddDivider = async () => {
    if (!newDividerLabel.trim()) return;
    const newDivider = await firestoreDb.checklist.createDivider(itemId, newDividerLabel);
    setItems(prev => [...prev, newDivider]);
    setNewDividerLabel('');
    setShowDividerInput(false);
  };

  const handleDeleteDivider = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await firestoreDb.checklist.delete(id);
  };

  const handleUpdateDivider = async (id: string, updates: { label?: string }) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await firestoreDb.checklist.updateDivider(id, updates);
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
      <div className="mb-4 flex-shrink-0">
        {showDividerInput ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              type="text"
              value={newDividerLabel}
              onChange={(e) => setNewDividerLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddDivider();
                }
              }}
              placeholder="섹션 이름 (예: 조망형)"
              className="flex-1 bg-zinc-900/50 border border-blue-600 text-sm text-blue-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all placeholder-zinc-600 shadow-sm"
            />
            <button
              onClick={handleAddDivider}
              disabled={!newDividerLabel.trim()}
              className="flex-shrink-0 p-2.5 bg-blue-500/10 border border-blue-600 text-blue-400 rounded-lg hover:bg-blue-500/20 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="섹션 추가"
            >
              <Icons.Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowDividerInput(false);
                setNewDividerLabel('');
              }}
              className="flex-shrink-0 p-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-300 rounded-lg transition-all"
              title="취소"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <textarea
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="새로운 할 일을 입력하세요 (Ctrl+Enter로 추가)"
              rows={1}
              className="flex-1 bg-zinc-900/50 border border-zinc-700 text-sm text-zinc-200 rounded-lg py-2.5 px-3 focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-all placeholder-zinc-600 shadow-sm resize-none overflow-y-auto"
              style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemText.trim()}
            className="flex-shrink-0 p-2.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="항목 추가 (Ctrl+Enter)"
          >
            <Icons.Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDividerInput(!showDividerInput)}
            className="flex-shrink-0 p-2.5 bg-blue-500/10 border border-blue-600 text-blue-400 rounded-lg hover:bg-blue-500/20 hover:border-blue-500 transition-all"
            title="섹션 추가"
          >
            <Icons.Minus className="w-5 h-5" />
          </button>
          {hasClipboard && (
            <button
              onClick={handlePasteClick}
              className="flex-shrink-0 p-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 hover:border-green-500/50 transition-all flex items-center gap-1.5"
              title="복사된 항목 붙여넣기"
            >
              <Icons.Clipboard className="w-5 h-5" />
              <span className="text-xs">붙여넣기</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-0.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item, index) => {
          // Render divider
          if (isChecklistDivider(item)) {
            return (
              <ChecklistDivider
                key={item.id}
                divider={item}
                index={index}
                totalCount={items.length}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                onDelete={handleDeleteDivider}
                onUpdate={handleUpdateDivider}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            );
          }

          // Render regular item
          return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onContextMenu={(e) => handleContextMenu(e, item)}
            className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-green-500/20 transition-colors border border-transparent hover:border-green-500/30"
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
              {editingItemId === item.id ? (
                <textarea
                  ref={editingTextareaRef}
                  autoFocus
                  value={editingItemText}
                  onChange={(e) => setEditingItemText(e.target.value)}
                  onBlur={() => handleSaveItemText(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingItemId(null);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-accent rounded px-2 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent resize-none overflow-y-auto"
                  style={{ minHeight: '6rem', maxHeight: '40rem', lineHeight: '1.25rem' }}
                />
              ) : (
                <div
                  onDoubleClick={(e) => {
                    // Desktop only (768px 이상)
                    if (window.innerWidth >= 768) {
                      handleTextDoubleClick(item.id, item.text);
                    }
                  }}
                  className={`w-full p-0 text-sm cursor-text whitespace-pre-wrap ${
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
                      onClick={() => onOpenMemo(item)}
                      title="클릭하여 메모 미리보기"
                  >
                      <Icons.Memo className="w-3 h-3 flex-shrink-0 text-green-500" />
                      <span className="truncate max-w-[400px]">{item.memo}</span>
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

              {/* Mobile 3-point Menu */}
              <div className="relative md:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuChecklistId(menuChecklistId === item.id ? null : item.id);
                  }}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                  title="옵션"
                >
                  <Icons.More className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {menuChecklistId === item.id && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        handleStartEdit(item.id, item.text);
                        setMenuChecklistId(null);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors border-b border-gray-200"
                    >
                      <Icons.Edit className="w-4 h-4" />
                      수정
                    </button>
                    <button
                      onClick={() => handleCopyClick(item)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 transition-colors border-b border-gray-200"
                    >
                      <Icons.Copy className="w-4 h-4" />
                      복사
                    </button>
                    {hasClipboard && (
                      <button
                        onClick={handlePasteClick}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition-colors border-b border-gray-200"
                      >
                        <Icons.Clipboard className="w-4 h-4" />
                        붙여넣기
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Icons.Trash className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Delete Button */}
              <button
                onClick={() => handleDelete(item.id)}
                className="hidden md:block p-1.5 text-zinc-500 hover:text-danger hover:bg-zinc-700 rounded transition-colors"
                title="삭제"
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-600 text-sm bg-zinc-900/20">
            등록된 항목이 없습니다.
            <br />
            <span className="text-xs text-zinc-700 mt-1 block">위 입력창에서 할 일을 추가해보세요.</span>
          </div>
        )}

        {/* Desktop Context Menu */}
        {contextMenuChecklistId && contextMenuPosition && (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.find(item => item.id === contextMenuChecklistId) && (
              <>
                <button
                  onClick={() => {
                    const item = items.find(i => i.id === contextMenuChecklistId);
                    if (item) {
                      handleStartEdit(item.id, item.text);
                      setContextMenuChecklistId(null);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors border-b border-gray-200"
                >
                  <Icons.Edit className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => handleCopyClick(items.find(item => item.id === contextMenuChecklistId)!)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 transition-colors border-b border-gray-200"
                >
                  <Icons.Copy className="w-4 h-4" />
                  복사
                </button>
                {hasClipboard && (
                  <button
                    onClick={handlePasteClick}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-green-50 transition-colors border-b border-gray-200"
                  >
                    <Icons.Clipboard className="w-4 h-4" />
                    붙여넣기
                  </button>
                )}
                <button
                  onClick={() => {
                    setContextMenuChecklistId(null);
                    handleDelete(contextMenuChecklistId);
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
      </div>
    </div>
  );
};

export default Checklist;