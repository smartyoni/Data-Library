import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';
import { Lock, Unlock, Home } from 'lucide-react';

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
  onToggleLock
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Initialize theme based on current DOM state
  useEffect(() => {
    if (document.documentElement.classList.contains('light-mode')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
  }, []);

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
            onClick={() => onSelectCategory('')}
            className="p-1.5 text-green-500 border border-green-500/50 hover:text-white hover:bg-green-500/20 hover:border-green-500 rounded transition-colors"
            title="홈"
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

        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            onDoubleClick={(e) => handleEditCategory(e, cat.id, cat.name)}
            className={`group flex items-center justify-between px-4 py-3 md:py-2.5 rounded-lg cursor-pointer transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
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
              <div className="flex items-center">
                <Icons.ChevronRight className="w-4 h-4 text-zinc-600 md:hidden" />
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
      </div>

      {/* Workspace Footer Controls */}
      <div className="p-4 border-t border-border bg-zinc-950/50 mt-auto">
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
    </div>
  );
};

export default Sidebar;