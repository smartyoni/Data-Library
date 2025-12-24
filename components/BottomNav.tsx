import React, { useState } from 'react';
import { Workspace } from '../types';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';
import { Lock } from 'lucide-react';

interface BottomNavProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (id: string) => void;
  onUpdate: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ workspaces, activeWorkspaceId, onSwitch, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    const newWs = await firestoreDb.workspaces.create(`새 작업공간 ${workspaces.length + 1}`);
    onUpdate();
    onSwitch(newWs.id);
  };

  const startEdit = (ws: Workspace) => {
    if (ws.is_locked) return;
    setEditingId(ws.id);
    setEditName(ws.name);
  };

  const saveEdit = async () => {
    if (editingId && editName.trim()) {
      await firestoreDb.workspaces.update(editingId, { name: editName });
      onUpdate();
    }
    setEditingId(null);
  };

  const handleMoveLeft = async (id: string) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index > 0) {
      const newOrder = [...workspaces];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      await firestoreDb.workspaces.reorder(newOrder.map(w => w.id));
      onUpdate();
    }
  };

  const handleMoveRight = async (id: string) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index < workspaces.length - 1) {
      const newOrder = [...workspaces];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      await firestoreDb.workspaces.reorder(newOrder.map(w => w.id));
      onUpdate();
    }
  };

  return (
    <div className="h-12 bg-zinc-950 border-t border-border flex items-center flex-shrink-0 z-50 relative">
      {/* Scrollable Tab Area */}
      <div className="flex-1 flex items-center gap-2 px-4 overflow-x-auto h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {workspaces.map((ws, idx) => (
          <div
            key={ws.id}
            className={`group flex-shrink-0 relative flex items-center rounded-md transition-all min-w-max border select-none ${
              activeWorkspaceId === ws.id
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveLeft(ws.id);
              }}
              className={`p-1 transition-opacity ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:text-accent'}`}
              disabled={idx === 0}
              title="왼쪽으로 이동"
            >
              <Icons.ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Tab Content */}
            <div
              onClick={() => onSwitch(ws.id)}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer flex-1"
              onDoubleClick={() => startEdit(ws)}
            >
              {editingId === ws.id ? (
                <input
                  autoFocus
                  className="bg-zinc-950 text-white text-xs px-1 py-0.5 rounded border border-accent w-full focus:outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  {ws.is_locked ? <Lock className="w-3 h-3 text-amber-500/70" /> : <Icons.Dashboard className={`w-3.5 h-3.5 ${activeWorkspaceId === ws.id ? 'text-accent' : 'opacity-70'}`} />}
                  <span className="text-xs font-medium truncate">{ws.name}</span>
                </>
              )}
            </div>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveRight(ws.id);
              }}
              className={`p-1 transition-opacity ${idx === workspaces.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:text-accent'}`}
              disabled={idx === workspaces.length - 1}
              title="오른쪽으로 이동"
            >
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {/* Spacer for right padding ensuring last item isn't covered by fade or edge */}
        <div className="w-2 flex-shrink-0" />
      </div>

      {/* Fixed Add Button Area with Gradient Fade */}
      <div className="flex-shrink-0 flex items-center pl-2 pr-2 h-full bg-zinc-950 border-l border-border relative z-10 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.8)]">
        <button 
          onClick={handleCreate}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="새 작업공간 추가"
        >
          <Icons.Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BottomNav;