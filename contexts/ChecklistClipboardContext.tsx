import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChecklistItem } from '../types';
import firestoreDb from '../services/firestoreDb';
import Toast, { ToastType } from '../components/Toast';

interface ChecklistClipboardData {
  text: string;
  memo: string;
  sourceItemId: string;
  copiedAt: number;
}

interface ChecklistClipboardContextType {
  clipboard: ChecklistClipboardData | null;
  hasClipboard: boolean;
  copyChecklistItem: (item: ChecklistItem) => void;
  pasteChecklistItem: (targetItemId: string) => Promise<void>;
  clearClipboard: () => void;
}

const ChecklistClipboardContext = createContext<ChecklistClipboardContextType | undefined>(undefined);

interface ChecklistClipboardProviderProps {
  children: React.ReactNode;
  itemId: string;
}

export const ChecklistClipboardProvider: React.FC<ChecklistClipboardProviderProps> = ({
  children,
  itemId,
}) => {
  const [clipboard, setClipboard] = useState<ChecklistClipboardData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Clear clipboard after 5 minutes
  useEffect(() => {
    if (clipboard) {
      const timer = setTimeout(() => {
        setClipboard(null);
        setToast({
          message: '복사된 항목이 만료되었습니다 (5분 경과)',
          type: 'info',
        });
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [clipboard]);

  const copyChecklistItem = useCallback((item: ChecklistItem) => {
    setClipboard({
      text: item.text,
      memo: item.memo,
      sourceItemId: item.item_id,
      copiedAt: Date.now(),
    });
    setToast({
      message: '체크리스트 항목이 복사되었습니다',
      type: 'success',
    });
  }, []);

  const pasteChecklistItem = useCallback(
    async (targetItemId: string) => {
      if (!clipboard) {
        setToast({
          message: '복사된 항목이 없습니다',
          type: 'error',
        });
        return;
      }

      try {
        // Create new checklist item
        const newItem = await firestoreDb.checklist.create(targetItemId);

        // Update with copied data
        await firestoreDb.checklist.update({
          id: newItem.id,
          text: clipboard.text,
          memo: clipboard.memo,
          is_checked: false, // Always reset to unchecked
        });

        setToast({
          message: '체크리스트 항목이 붙여넣기되었습니다',
          type: 'success',
        });
      } catch (error) {
        console.error('Paste failed:', error);
        setToast({
          message: '붙여넣기 실패: 네트워크 오류',
          type: 'error',
        });
      }
    },
    [clipboard]
  );

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  const value: ChecklistClipboardContextType = {
    clipboard,
    hasClipboard: clipboard !== null,
    copyChecklistItem,
    pasteChecklistItem,
    clearClipboard,
  };

  return (
    <ChecklistClipboardContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ChecklistClipboardContext.Provider>
  );
};

export const useChecklistClipboard = () => {
  const context = useContext(ChecklistClipboardContext);
  if (!context) {
    throw new Error('useChecklistClipboard must be used within ChecklistClipboardProvider');
  }
  return context;
};
