import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ItemsList from './ItemsList';
import ItemDetail from './ItemDetail';
import BookmarkManager from './BookmarkManager';
import MemoModal from './MemoModal';
import { Category, Item, ChecklistItem, Workspace } from '../types';
import firestoreDb from '../services/firestoreDb';
import { Icons } from './ui/Icons';

interface WorkspaceViewProps {
  workspace: Workspace;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Workspace>) => void;
  onShowBookmarks: () => void;
  showBookmarks?: boolean;
  onCloseBookmarks?: () => void;
  registerHandlers?: (handlers: {
    selectedCategoryId: string | null;
    selectedItemId: string | null;
    handleBackToCategories: () => void;
    handleBackToItems: () => void;
  }) => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  onDelete,
  onUpdate,
  onShowBookmarks,
  showBookmarks = false,
  onCloseBookmarks,
  registerHandlers,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Modal State
  const [isMemoModalOpen, setMemoModalOpen] = useState(false);
  const [currentMemoItem, setCurrentMemoItem] = useState<ChecklistItem | null>(null);

  // Load categories when workspace changes
  useEffect(() => {
    loadCategories();
    setSelectedCategoryId(null);
    setItems([]);
    setSelectedItemId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  // Load items when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      loadItems(selectedCategoryId);
      setSelectedItemId(null);
    } else {
      setItems([]);
      setSelectedItemId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  // Close bookmark manager when category is selected
  useEffect(() => {
    if (selectedCategoryId && showBookmarks && onCloseBookmarks) {
      onCloseBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    const data = await firestoreDb.categories.listByWorkspace(workspace.id);
    setCategories(data);
    // On mobile, we don't auto-select. On desktop, we could, but let's keep it consistent or simple.
    // If we want desktop to auto-select, we need to check screen size or just default to null for a cleaner "empty state".
    // Let's default to first category only if on desktop? For now, keep null to show sidebar only on mobile.
  };

  const loadItems = async (catId: string) => {
    setLoadingItems(true);
    const data = await firestoreDb.items.listByCategory(catId);
    setItems(data);
    setLoadingItems(false);
  };

  const handleAddCategory = async (name: string) => {
    const newCat = await firestoreDb.categories.create(workspace.id, name);
    await loadCategories();
    setSelectedCategoryId(newCat.id);
  }

  const handleAddItem = async () => {
    if (!selectedCategoryId) return;
    const newItem = await firestoreDb.items.create(selectedCategoryId);
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleDeleteItem = async (id: string) => {
    await firestoreDb.items.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleReorderItems = async (newOrder: Item[]) => {
     // Optimistically update local state
     setItems(newOrder);
     if (selectedCategoryId) {
         await firestoreDb.items.reorder(selectedCategoryId, newOrder.map(i => i.id));
     }
  };

  const handleUpdateItemLocal = (id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const openMemo = (item: ChecklistItem) => {
    setCurrentMemoItem(item);
    setMemoModalOpen(true);
  };

  const saveMemo = async (id: string, text: string) => {
    await firestoreDb.checklist.update({ id, memo: text });
    if(selectedItem) setSelectedItemId(selectedItem.id);
  };

  const handleDeleteWorkspace = () => {
    onDelete(workspace.id);
  };

  const handleToggleLock = () => {
    onUpdate(workspace.id, { is_locked: !workspace.is_locked });
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
  };

  const handleBackToItems = () => {
    setSelectedItemId(null);
  };

  // 하드웨어 뒤로가기 처리를 위해 App.tsx에 현재 상태 전달
  useEffect(() => {
    if (registerHandlers) {
      registerHandlers({
        selectedCategoryId,
        selectedItemId,
        handleBackToCategories,
        handleBackToItems,
      });
    }
  }, [selectedCategoryId, selectedItemId, registerHandlers]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedItem = items.find(i => i.id === selectedItemId);

  // CSS Logic for Responsive Views
  // Mobile: Show only one view at a time based on depth (Category -> Item -> Detail)
  // Desktop (md): Show all views in columns
  
  const showSidebar = !selectedCategoryId; // Mobile: Show if no category selected
  const showItemsList = selectedCategoryId && !selectedItemId; // Mobile: Show if category selected but no item
  const showItemDetail = !!selectedItemId; // Mobile: Show if item selected

  return (
    <div className="flex h-full w-full bg-background text-zinc-100 font-sans selection:bg-accent/30 overflow-hidden relative">
      {/* Column 1: Categories */}
      {/* Mobile: Hidden if category selected or bookmarks shown. Desktop: Always visible (w-64) */}
      <div className={`${selectedCategoryId || showBookmarks ? 'hidden md:flex' : 'flex'} w-full md:w-64 flex-col border-r border-border bg-surface`}>
        <Sidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onRefresh={loadCategories}
          workspaceName={workspace.name}
          isLocked={workspace.is_locked}
          onAddCategory={handleAddCategory}
          onDeleteWorkspace={handleDeleteWorkspace}
          onToggleLock={handleToggleLock}
          onShowBookmarks={onShowBookmarks}
        />
      </div>

      {/* Column 2: Items List */}
      {/* Mobile: Visible if category selected & no item selected & bookmarks not shown. Desktop: Visible if category selected (w-80) or placeholder */}
      <div className={`${selectedCategoryId && !selectedItemId && !showBookmarks ? 'flex' : 'hidden md:flex'} ${selectedCategoryId ? 'w-full md:w-80' : 'hidden md:flex md:w-80'} flex-col border-r border-border bg-background`}>
        {selectedCategoryId ? (
          <ItemsList 
            categoryName={selectedCategory?.name}
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onReorder={handleReorderItems}
            loading={loadingItems}
            onBack={handleBackToCategories}
          />
        ) : (
           /* Desktop Placeholder for Column 2 */
          <div className="hidden md:flex flex-col items-center justify-center h-full text-zinc-600">
             <Icons.Folder className="w-12 h-12 mb-2 opacity-20" />
             <p className="text-sm">카테고리를 선택하세요</p>
          </div>
        )}
      </div>

      {/* Column 3: Item Detail or Bookmark Manager */}
      {/* Mobile: Visible if item selected. Desktop: Always visible (flex-1) */}
      <div className={`${selectedItemId || showBookmarks ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-background relative min-w-0`}>
        {showBookmarks ? (
          <BookmarkManager onBack={onCloseBookmarks || (() => {})} />
        ) : selectedItem ? (
          <ItemDetail
            key={selectedItem.id}
            item={selectedItem}
            onUpdateItem={handleUpdateItemLocal}
            onOpenMemo={openMemo}
            onBack={handleBackToItems}
          />
        ) : (
          /* Desktop Placeholder for Column 3 */
          <div className="hidden md:flex flex-col items-center justify-center h-full text-zinc-600">
             <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800">
                <Icons.File className="w-8 h-8 text-zinc-700" />
             </div>
             <p className="text-zinc-500">항목을 선택하여 내용을 확인하세요.</p>
          </div>
        )}
      </div>

      {/* Global Memo Modal */}
      <MemoModal
        isOpen={isMemoModalOpen}
        onClose={() => setMemoModalOpen(false)}
        checklistItem={currentMemoItem}
        onSave={saveMemo}
      />
    </div>
  );
};

export default WorkspaceView;