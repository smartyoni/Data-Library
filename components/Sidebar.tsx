import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../types';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';
import { Lock, Unlock, Home } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import HiddenCategoriesModal from './HiddenCategoriesModal';

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onRefresh: () => void;
  workspaceName?: string;
  isLocked?: boolean;
  onAddCategory: (name: string) => void;
  onDeleteWorkspace: () => void;
  onToggleLock: () => void;
  onShowBookmarks?: () => void;
  hiddenCategoriesCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onRefresh,
  workspaceName,
  isLocked,
  onAddCategory,
  onDeleteWorkspace,
  onToggleLock,
  onShowBookmarks,
  hiddenCategoriesCount = 0
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [menuCategoryId, setMenuCategoryId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [contextMenuCategoryId, setContextMenuCategoryId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Category[]>([]);

  // Drag and drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  // Update local categories when props change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Initialize theme based on current DOM state
  useEffect(() => {
    if (document.documentElement.classList.contains('light-mode')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuCategoryId(null);
    if (menuCategoryId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuCategoryId]);

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    if (newTheme === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
        setIsAdding(false);
        return;
    }
    onAddCategory(newCatName);
    setNewCatName('');
    setIsAdding(false);
  };

  const handleEditCategory = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingCategoryId(id);
    setEditingCategoryName(currentName);
  };

  const handleSaveCategory = async (id: string) => {
    if (!editingCategoryName.trim()) {
        setEditingCategoryId(null);
        return;
    }
    await firestoreDb.categories.update(id, editingCategoryName);
    onRefresh();
    setEditingCategoryId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('카테고리와 하위 항목이 모두 삭제됩니다. 계속하시겠습니까?')) {
        await firestoreDb.categories.delete(id);
        onRefresh();
        if (selectedCategoryId === id) onSelectCategory('');
    }
  };

  const handleMobileDeleteClick = (id: string) => {
    setMenuCategoryId(null);
    setDeletingCategoryId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingCategoryId) {
      await firestoreDb.categories.delete(deletingCategoryId);
      onRefresh();
      if (selectedCategoryId === deletingCategoryId) onSelectCategory('');
    }
    setDeleteConfirmOpen(false);
    setDeletingCategoryId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeletingCategoryId(null);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuCategoryId(categoryId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCancelContextMenu = () => {
    setContextMenuCategoryId(null);
  };

  const handleHideCategory = async (categoryId: string) => {
    try {
      await firestoreDb.categories.hide(categoryId);
      setContextMenuCategoryId(null);
      // Clear selection if the hidden category was selected
      if (selectedCategoryId === categoryId) {
        onSelectCategory('');
      }
      onRefresh();
    } catch (error) {
      console.error('카테고리 숨기기 실패:', error);
    }
  };

  // Hidden categories modal handlers
  const loadHiddenCategories = async () => {
    try {
      if (categories.length === 0) return;
      const workspaceId = categories[0].workspace_id;
      const allCategories = await firestoreDb.categories.listByWorkspace(workspaceId, true);
      setHiddenCategories(allCategories.filter(cat => cat.is_hidden));
    } catch (error) {
      console.error('숨긴 카테고리 로드 실패:', error);
    }
  };

  const handleShowHiddenModal = async () => {
    await loadHiddenCategories();
    setShowHiddenModal(true);
  };

  const handleUnhideCategory = async (categoryId: string) => {
    try {
      await firestoreDb.categories.unhide(categoryId);
      await loadHiddenCategories();
      onRefresh();
    } catch (error) {
      console.error('카테고리 복원 실패:', error);
    }
  };

  const handlePermanentlyDeleteCategory = async (categoryId: string) => {
    if (window.confirm('카테고리를 영구적으로 삭제하시겠습니까? 하위 항목도 모두 삭제됩니다.')) {
      try {
        await firestoreDb.categories.delete(categoryId);
        await loadHiddenCategories();
        onRefresh();
      } catch (error) {
        console.error('카테고리 삭제 실패:', error);
      }
    }
  };

  const handleDeleteWorkspaceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLocked) {
        alert("잠금 상태인 탭은 삭제할 수 없습니다.");
        return;
    }

    if (window.confirm(`'${workspaceName}' 탭을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 포함된 모든 카테고리와 항목이 영구적으로 삭제됩니다.`)) {
        onDeleteWorkspace();
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
      const _categories = [...localCategories];
      const draggedCategory = _categories[start];
      _categories.splice(start, 1);
      _categories.splice(end, 0, draggedCategory);

      // Optimistic update
      setLocalCategories(_categories);

      // Update database
      await firestoreDb.categories.reorder(
        _categories[0].workspace_id,
        _categories.map(cat => cat.id)
      );
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Mobile arrow button handlers
  const handleMoveUp = async (id: string) => {
    const index = localCategories.findIndex(cat => cat.id === id);
    if (index > 0) {
      const newOrder = [...localCategories];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

      // Optimistic update
      setLocalCategories(newOrder);

      // Update database
      await firestoreDb.categories.reorder(
        newOrder[0].workspace_id,
        newOrder.map(cat => cat.id)
      );
    }
  };

  const handleMoveDown = async (id: string) => {
    const index = localCategories.findIndex(cat => cat.id === id);
    if (index < localCategories.length - 1) {
      const newOrder = [...localCategories];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

      // Optimistic update
      setLocalCategories(newOrder);

      // Update database
      await firestoreDb.categories.reorder(
        newOrder[0].workspace_id,
        newOrder.map(cat => cat.id)
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Brand & Theme Toggle */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-zinc-950/50 flex-shrink-0">
        {/* Title Area (Logo Removed) */}
        <div className="flex items-center gap-2">
             <span className="font-bold text-lg tracking-tight text-white leading-none">
                자료<span className="text-accent">실</span>
             </span>
             {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500/80" />}
        </div>

        {/* Home Icon and Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShowBookmarks?.()}
            className="p-1.5 text-green-500 border border-green-500/50 hover:text-white hover:bg-green-500/20 hover:border-green-500 rounded transition-colors"
            title="북마크 관리자"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Compact Theme Toggle Button Group (D/L) */}
          <div className="flex bg-zinc-900 p-0.5 rounded-md border border-zinc-800/50">
             <button 
               onClick={() => toggleTheme('dark')}
               className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded transition-all ${theme === 'dark' ? 'bg-zinc-700 text-white shadow ring-1 ring-black/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
               title="Dark Mode"
             >
               D
             </button>
             <button 
               onClick={() => toggleTheme('light')}
               className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded transition-all ${theme === 'light' ? 'bg-white text-zinc-900 shadow ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
               title="Light Mode"
             >
               L
             </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
            업무 카테고리
        </div>

        {localCategories.map((cat, index) => (
          <div
            key={cat.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => onSelectCategory(cat.id)}
            onDoubleClick={(e) => handleEditCategory(e, cat.id, cat.name)}
            onContextMenu={(e) => handleContextMenu(e, cat.id)}
            className={`group flex items-center justify-between px-4 py-3 md:py-2.5 rounded-lg cursor-pointer transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Desktop drag handle (hidden on mobile) */}
              <div className="hidden md:block cursor-grab active:cursor-grabbing pt-1 text-zinc-600 hover:text-zinc-400">
                <Icons.DragHandle className="w-4 h-4" />
              </div>

              {/* Mobile up/down arrows (hidden on desktop) */}
              <div className="flex md:hidden flex-col gap-0.5 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveUp(cat.id);
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
                    handleMoveDown(cat.id);
                  }}
                  disabled={index === localCategories.length - 1}
                  className={`p-0.5 transition-colors ${
                    index === localCategories.length - 1
                      ? 'opacity-20 cursor-not-allowed text-zinc-700'
                      : 'text-zinc-500 hover:text-accent'
                  }`}
                  title="아래로 이동"
                >
                  <Icons.ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <Icons.Folder className={`w-5 h-5 md:w-4 md:h-4 flex-shrink-0 ${selectedCategoryId === cat.id ? 'fill-accent/20' : ''}`} />
              {editingCategoryId === cat.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  onBlur={() => handleSaveCategory(cat.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleSaveCategory(cat.id);
                    if (e.key === 'Escape') setEditingCategoryId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-zinc-950 border border-accent rounded px-1 py-0 text-sm text-white focus:outline-none"
                />
              ) : (
                <span className="text-base md:text-sm font-medium truncate">{cat.name}</span>
              )}
            </div>

            {/* Show arrow on mobile to indicate navigation */}
            {editingCategoryId !== cat.id && (
              <div className="flex items-center gap-1">
                <Icons.ChevronRight className="w-4 h-4 text-zinc-600 md:hidden" />

                {/* Mobile 3-point Menu */}
                <div className="relative md:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuCategoryId(menuCategoryId === cat.id ? null : cat.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                    title="옵션"
                  >
                    <Icons.More className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {menuCategoryId === cat.id && (
                    <div
                      className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          handleHideCategory(cat.id);
                          setMenuCategoryId(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <Icons.EyeOff className="w-4 h-4" />
                        숨기기
                      </button>
                      <button
                        onClick={() => handleMobileDeleteClick(cat.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-zinc-800"
                      >
                        <Icons.Trash className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Delete Button - Hover */}
                <button
                    type="button"
                    onClick={(e) => handleDelete(e, cat.id)}
                    className="hidden md:block opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                >
                    <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add New Input */}
        {isAdding ? (
            <div className="px-3 py-2">
                <input
                    autoFocus
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onBlur={handleAddCategory}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="카테고리명..."
                    className="w-full bg-zinc-950 border border-accent rounded px-2 py-1 text-sm text-white focus:outline-none"
                />
            </div>
        ) : (
            <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-3 md:py-2.5 text-sm text-zinc-500 hover:text-accent hover:bg-zinc-800/50 rounded-lg transition-colors border border-dashed border-zinc-800 hover:border-zinc-700 mt-2"
            >
                <Icons.Plus className="w-4 h-4" />
                새 카테고리 추가
            </button>
        )}

        {/* Context Menu (Desktop Right-Click) */}
        {contextMenuCategoryId && (
          <>
            {/* Background overlay to close menu on click */}
            <div
              className="fixed inset-0 z-40"
              onClick={handleCancelContextMenu}
            />

            {/* Context Menu */}
            <div
              className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[140px]"
              style={{
                left: `${Math.min(contextMenuPosition.x, window.innerWidth - 160)}px`,
                top: `${Math.min(contextMenuPosition.y, window.innerHeight - 100)}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleHideCategory(contextMenuCategoryId)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors first:rounded-t-lg"
              >
                <Icons.EyeOff className="w-4 h-4" />
                숨기기
              </button>
              <button
                onClick={handleCancelContextMenu}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors border-t border-zinc-700 last:rounded-b-lg"
              >
                <Icons.Close className="w-4 h-4" />
                취소
              </button>
            </div>
          </>
        )}
      </div>

      {/* Workspace Footer Controls */}
      <div className="p-4 border-t border-border bg-zinc-950/50 mt-auto">
        {/* Hidden Categories Button */}
        {hiddenCategoriesCount > 0 && (
          <button
            type="button"
            onClick={handleShowHiddenModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-2 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-all text-xs font-medium"
            title="숨김 카테고리 관리"
          >
            <Icons.EyeOff className="w-3.5 h-3.5" />
            숨김 ({hiddenCategoriesCount})
          </button>
        )}

        <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={onToggleLock}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border transition-all text-xs font-medium ${isLocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
             title={isLocked ? "잠금 해제" : "잠금 설정"}
           >
             {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
             {isLocked ? '잠금 됨' : '잠금 해제'}
           </button>

           <button
             type="button"
             onClick={handleDeleteWorkspaceClick}
             className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border transition-all text-xs font-medium ${
                isLocked
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                  : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/40'
             }`}
           >
             <Icons.Trash className="w-3.5 h-3.5" />
             탭 삭제
           </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="카테고리 삭제"
        message="카테고리와 하위 항목이 모두 삭제됩니다. 계속하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        danger={true}
      />

      {/* Hidden Categories Modal */}
      <HiddenCategoriesModal
        isOpen={showHiddenModal}
        hiddenCategories={hiddenCategories}
        onUnhide={handleUnhideCategory}
        onDelete={handlePermanentlyDeleteCategory}
        onClose={() => setShowHiddenModal(false)}
      />
    </div>
  );
};

export default Sidebar;