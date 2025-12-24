import React, { useState, useEffect, useCallback } from 'react';
import WorkspaceView from './components/WorkspaceView';
import BookmarkManager from './components/BookmarkManager';
import BottomNav from './components/BottomNav';
import { Workspace } from './types';
import firestoreDb from './services/firestoreDb';

const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isBookmarkViewActive, setIsBookmarkViewActive] = useState(false);

  // Load workspaces with useCallback so it can be called externally
  const loadWorkspaces = useCallback(async () => {
    const data = await firestoreDb.workspaces.list();
    setWorkspaces(data);
  }, []);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Set default active workspace when workspaces are loaded
  useEffect(() => {
    if (workspaces.length > 0) {
      // If no active ID is set, use the first workspace
      if (!activeWorkspaceId) {
        setActiveWorkspaceId(workspaces[0].id);
      }
      // If active ID is no longer valid (deleted), switch to first
      else if (!workspaces.find(w => w.id === activeWorkspaceId)) {
        setActiveWorkspaceId(workspaces[0].id);
      }
    } else {
      setActiveWorkspaceId(null);
    }
  }, [workspaces, activeWorkspaceId]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    await firestoreDb.workspaces.delete(id);
    await loadWorkspaces();
  }, [loadWorkspaces]);

  const handleUpdateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    await firestoreDb.workspaces.update(id, updates);
    // Update local state directly for faster UX
    setWorkspaces(prev =>
      prev.map(ws => ws.id === id ? { ...ws, ...updates } : ws)
    );
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 font-sans overflow-hidden">
      
      {/* Main Workspace Area (Flex Grow) */}
      <div className="flex-1 overflow-hidden relative">
        {isBookmarkViewActive ? (
          <BookmarkManager
            onBack={() => setIsBookmarkViewActive(false)}
          />
        ) : activeWorkspace ? (
          <WorkspaceView
            workspace={activeWorkspace}
            onDelete={handleDeleteWorkspace}
            onUpdate={handleUpdateWorkspace}
            onShowBookmarks={() => setIsBookmarkViewActive(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            작업공간을 생성해주세요.
          </div>
        )}
      </div>

      {/* Bottom Navigation (Fixed Footer) */}
      <BottomNav 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSwitch={setActiveWorkspaceId}
        onUpdate={loadWorkspaces}
      />
    </div>
  );
};

export default App;