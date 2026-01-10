import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ItemsList from './ItemsList';
import ItemDetail from './ItemDetail';
import BookmarkManager from './BookmarkManager';
import MemoModal from './MemoModal';
import MoveItemModal from './MoveItemModal';
import { ChecklistClipboardProvider } from '../contexts/ChecklistClipboardContext';
import { Category, Item, ChecklistItem, Workspace } from '../types';
import firestoreDb from '../services/firestoreDb';
import { Icons } from './ui/Icons';

interface WorkspaceViewProps {
  workspace: Workspace;
  allWorkspaces: Workspace[];
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
  allWorkspaces,
  onDelete,
  onUpdate,
  onShowBookmarks,
  showBookmarks = false,
  onCloseBookmarks,
  registerHandlers,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    return localStorage.getItem(`selectedCategoryId_${workspace.id}`) || null;
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    return localStorage.getItem(`selectedItemId_${workspace.id}`) || null;
  });
  const [loadingItems, setLoadingItems] = useState(false);
  const [hiddenCategoriesCount, setHiddenCategoriesCount] = useState(0);

  // 초기 마운트 vs 워크스페이스 변경 구분
  const isInitialMount = useRef(true);
  const [isRestoringState, setIsRestoringState] = useState(false);

  // Modal State
  const [isMemoModalOpen, setMemoModalOpen] = useState(false);
  const [currentMemoItem, setCurrentMemoItem] = useState<ChecklistItem | null>(null);
  const [moveItemModalOpen, setMoveItemModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<Item | null>(null);

  // Load categories when workspace changes
  useEffect(() => {
    if (isInitialMount.current) {
      // 초기 마운트 - localStorage에서 상태 복원
      isInitialMount.current = false;
      setIsRestoringState(true);

      loadCategories();

      const savedCategoryId = localStorage.getItem(`selectedCategoryId_${workspace.id}`);
      if (savedCategoryId) {
        setSelectedCategoryId(savedCategoryId);
        // selectedItemId는 아이템 로드 후 복원 (selectedCategoryId effect에서 처리)
      } else {
        setIsRestoringState(false);
      }
    } else {
      // 실제 워크스페이스 변경 - 모든 상태 초기화
      loadCategories();
      setSelectedCategoryId(null);
      setItems([]);
      setSelectedItemId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  // Save selectedCategoryId to localStorage
  useEffect(() => {
    if (selectedCategoryId) {
      localStorage.setItem(`selectedCategoryId_${workspace.id}`, selectedCategoryId);
    } else {
      localStorage.removeItem(`selectedCategoryId_${workspace.id}`);
    }
  }, [selectedCategoryId, workspace.id]);

  // Save selectedItemId to localStorage
  useEffect(() => {
    if (selectedItemId) {
      localStorage.setItem(`selectedItemId_${workspace.id}`, selectedItemId);
    } else {
      localStorage.removeItem(`selectedItemId_${workspace.id}`);
    }
  }, [selectedItemId, workspace.id]);

  // Load items when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const loadAndRestoreItems = async () => {
        setLoadingItems(true);
        const data = await firestoreDb.items.listByCategory(selectedCategoryId);
        setItems(data);
        setLoadingItems(false);

        // 상태 복원 중이면 savedItemId를 로드된 데이터와 검증 후 복원
        if (isRestoringState) {
          const savedItemId = localStorage.getItem(`selectedItemId_${workspace.id}`);
          if (savedItemId && data.some(item => item.id === savedItemId)) {
            // 아이템이 실제로 존재하면 복원
            setSelectedItemId(savedItemId);
          } else if (savedItemId) {
            // 아이템이 삭제되었으면 localStorage에서 제거
            localStorage.removeItem(`selectedItemId_${workspace.id}`);
          }
          setIsRestoringState(false);
        }
      };

      loadAndRestoreItems();
    } else {
      setItems([]);
      setSelectedItemId(null);
      setIsRestoringState(false);
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

  // Close bookmark manager when item is selected
  useEffect(() => {
    if (selectedItemId && showBookmarks && onCloseBookmarks) {
      onCloseBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  const loadCategories = async () => {
    // Get visible categories (숨김 제외)
    const visibleData = await firestoreDb.categories.listByWorkspace(workspace.id, false);
    setCategories(visibleData);

    // Calculate hidden categories count
    const allData = await firestoreDb.categories.listByWorkspace(workspace.id, true);
    const hiddenCount = allData.filter(cat => cat.is_hidden).length;
    setHiddenCategoriesCount(hiddenCount);

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

  const handleMoveItemRequest = (item: Item) => {
    setItemToMove(item);
    setMoveItemModalOpen(true);
  };

  const handleExecuteMove = async (targetCategoryId: string, targetWorkspaceId: string) => {
    if (!itemToMove) return;

    try {
      await firestoreDb.items.move(itemToMove.id, targetCategoryId);

      // Update local state
      if (targetCategoryId === selectedCategoryId) {
        // Moving within same category - reload items
        if (selectedCategoryId) {
          loadItems(selectedCategoryId);
        }
      } else {
        // Moving to different category - remove from current list
        setItems(prev => prev.filter(i => i.id !== itemToMove.id));
        if (selectedItemId === itemToMove.id) {
          setSelectedItemId(null);
        }
      }

      setMoveItemModalOpen(false);
      setItemToMove(null);
    } catch (error) {
      console.error('항목 이동 실패:', error);
      alert('항목 이동에 실패했습니다.');
    }
  };

  const handleExecuteMoveCategory = async (categoryId: string, targetWorkspaceId: string) => {
    try {
      await firestoreDb.categories.move(categoryId, targetWorkspaceId);

      // Refresh categories in current workspace
      await loadCategories();

      // Clear selection if moved category was selected
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
        setItems([]);
        setSelectedItemId(null);
      }

      alert('카테고리가 성공적으로 이동되었습니다.');
    } catch (error: any) {
      console.error('카테고리 이동 실패:', error);
      const errorMessage = error?.message || '카테고리 이동에 실패했습니다.';
      alert(errorMessage);
    }
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
    <ChecklistClipboardProvider itemId={selectedItemId || ''}>
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
          hiddenCategoriesCount={hiddenCategoriesCount}
          allWorkspaces={allWorkspaces}
          currentWorkspaceId={workspace.id}
          onMoveCategory={handleExecuteMoveCategory}
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
            onMoveItem={handleMoveItemRequest}
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

        {/* Global Move Item Modal */}
        <MoveItemModal
          isOpen={moveItemModalOpen}
          item={itemToMove}
          currentWorkspaceId={workspace.id}
          currentCategoryId={selectedCategoryId || ''}
          allWorkspaces={allWorkspaces}
          onMove={handleExecuteMove}
          onClose={() => {
            setMoveItemModalOpen(false);
            setItemToMove(null);
          }}
        />
      </div>
    </ChecklistClipboardProvider>
  );
};

export default WorkspaceView;