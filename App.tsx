import React, { useState, useEffect, useCallback, useRef } from 'react';
import WorkspaceView from './components/WorkspaceView';
import BookmarkManager from './components/BookmarkManager';
import BottomNav from './components/BottomNav';
import { Workspace } from './types';
import firestoreDb from './services/firestoreDb';
import { Icons } from './components/ui/Icons';

// 모바일 및 태블릿 기기 감지
const isMobileDevice = (): boolean => {
  // 1. User Agent 기반 감지 (Android, iOS 태블릿 포함)
  const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // 2. 터치 인터페이스 및 화면 너비 기반 감지 (태블릿 대응을 위해 1024px로 확대)
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const screenWidthCheck = window.matchMedia('(max-width: 1024px)').matches;

  return userAgentCheck || (isTouchDevice && screenWidthCheck);
};

const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isWorkspacesLoaded, setIsWorkspacesLoaded] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('activeWorkspaceId') || null;
  });
  const [isBookmarkViewActive, setIsBookmarkViewActive] = useState(() => {
    return localStorage.getItem('isBookmarkViewActive') === 'true';
  });

  // WorkspaceView 상태 추적 (하드웨어 뒤로가기 처리용)
  const workspaceStateRef = useRef<{
    selectedCategoryId: string | null;
    selectedItemId: string | null;
    handleBackToCategories: () => void;
    handleBackToItems: () => void;
  }>({
    selectedCategoryId: null,
    selectedItemId: null,
    handleBackToCategories: () => { },
    handleBackToItems: () => { },
  });

  // WorkspaceView에서 상태를 받기 위한 콜백
  const registerWorkspaceHandlers = useCallback((handlers: {
    selectedCategoryId: string | null;
    selectedItemId: string | null;
    handleBackToCategories: () => void;
    handleBackToItems: () => void;
  }) => {
    workspaceStateRef.current = handlers;
  }, []);

  // Load workspaces with useCallback so it can be called externally
  const loadWorkspaces = useCallback(async () => {
    const data = await firestoreDb.workspaces.list();
    setWorkspaces(data);
    setIsWorkspacesLoaded(true);
  }, []);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Save activeWorkspaceId to localStorage
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('activeWorkspaceId', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  // Save isBookmarkViewActive to localStorage
  useEffect(() => {
    localStorage.setItem('isBookmarkViewActive', isBookmarkViewActive.toString());
  }, [isBookmarkViewActive]);

  // Set default active workspace when workspaces are loaded
  useEffect(() => {
    // workspaces가 아직 로드되지 않았으면 아무것도 하지 않음
    if (!isWorkspacesLoaded) {
      return;
    }

    // 이제 workspaces 로드가 완료됨
    if (workspaces.length > 0) {
      // If no active ID is set, use the first workspace
      if (!activeWorkspaceId) {
        setActiveWorkspaceId(workspaces[0].id);
      }
      // If active ID is no longer valid (deleted), switch to first
      else if (!workspaces.find(w => w.id === activeWorkspaceId)) {
        setActiveWorkspaceId(workspaces[0].id);
      }
    }
  }, [workspaces, isWorkspacesLoaded]);

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

  // 하드웨어 뒤로가기 버튼 처리 (모바일 전용)
  useEffect(() => {
    if (!isMobileDevice()) return;

    let isNavigating = false;

    const handlePopState = () => {
      if (isNavigating) return;
      isNavigating = true;

      const state = workspaceStateRef.current;

      if (isBookmarkViewActive) {
        setIsBookmarkViewActive(false);
      } else if (state.selectedItemId) {
        state.handleBackToItems();
      } else if (state.selectedCategoryId) {
        state.handleBackToCategories();
      } else {
        // 최상위 - 기본 동작 허용 (앱 종료)
        isNavigating = false;
        return;
      }

      // 뒤로가기 후 히스토리 재추가
      setTimeout(() => {
        history.pushState(null, '');
        isNavigating = false;
      }, 0);
    };

    // 초기 히스토리 엔트리
    history.pushState(null, '');

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isBookmarkViewActive]);

  // activeWorkspace를 찾되, 로딩 중이라도 activeWorkspaceId가 있으면 placeholder로 WorkspaceView를 유지
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ||
    (activeWorkspaceId && workspaces.length === 0
      ? { id: activeWorkspaceId, name: 'Loading...', created_at: new Date(), is_locked: false }
      : null);

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 font-sans overflow-hidden">

      {/* Main Workspace Area (Flex Grow) */}
      <div className="flex-1 overflow-hidden relative">
        {activeWorkspace ? (
          <WorkspaceView
            workspace={activeWorkspace}
            allWorkspaces={workspaces}
            onDelete={handleDeleteWorkspace}
            onUpdate={handleUpdateWorkspace}
            onShowBookmarks={() => setIsBookmarkViewActive(true)}
            showBookmarks={isBookmarkViewActive}
            onCloseBookmarks={() => setIsBookmarkViewActive(false)}
            registerHandlers={registerWorkspaceHandlers}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            작업공간을 생성해주세요.
          </div>
        )}
      </div>

      {/* Mobile-only Floating Action Button for Bookmarks */}
      {activeWorkspace && !isBookmarkViewActive && (
        <button
          onClick={() => setIsBookmarkViewActive(true)}
          className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-all z-50 border-2 border-white/10"
          title="북마크 관리자"
        >
          <Icons.Home className="w-6 h-6 text-white" />
        </button>
      )}

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