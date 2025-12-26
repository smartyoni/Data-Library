import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { Category, Item, ChecklistItem, Workspace, BookmarkZone, Bookmark } from '../types';

// Helper to generate IDs
const generateId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Collection names
const COLLECTIONS = {
  WORKSPACES: 'workspaces',
  CATEGORIES: 'categories',
  ITEMS: 'items',
  CHECKLISTS: 'checklists',
  BOOKMARK_ZONES: 'bookmark_zones',
  BOOKMARKS: 'bookmarks',
};

// Default bookmark zones - Notion style
const DEFAULT_ZONES = [
  { name: '영역1', default_color: '#FADCC4', order: 0 }, // Orange
  { name: '영역2', default_color: '#FDF7DE', order: 1 }, // Yellow
  { name: '영역3', default_color: '#F0F7E4', order: 2 }, // Green
  { name: '영역4', default_color: '#DFEAFF', order: 3 }, // Blue
  { name: '영역5', default_color: '#EBE5FA', order: 4 }, // Purple
  { name: '영역6', default_color: '#F5DEEF', order: 5 }, // Pink
];

/**
 * Firestore 기반 데이터베이스 서비스
 * mockDb.ts와 동일한 API를 제공합니다.
 */
export const firestoreDb = {
  workspaces: {
    list: async (): Promise<Workspace[]> => {
      try {
        const q = query(collection(db, COLLECTIONS.WORKSPACES));
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Workspace))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        console.error('Workspaces 조회 실패:', error);
        return [];
      }
    },

    create: async (name: string): Promise<Workspace> => {
      try {
        // Get max order
        const q = query(collection(db, COLLECTIONS.WORKSPACES));
        const snapshot = await getDocs(q);
        const workspaces = snapshot.docs.map(doc => doc.data() as Workspace);
        const maxOrder = workspaces.reduce((max, ws) => Math.max(max, ws.order ?? 0), -1);

        const docRef = await addDoc(collection(db, COLLECTIONS.WORKSPACES), {
          name,
          is_locked: false,
          order: maxOrder + 1,
          created_at: now(),
        });
        return {
          id: docRef.id,
          name,
          is_locked: false,
          order: maxOrder + 1,
          created_at: now(),
        };
      } catch (error) {
        console.error('Workspace 생성 실패:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<Workspace>): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.WORKSPACES, id);
        await updateDoc(docRef, updates as any);
      } catch (error) {
        console.error('Workspace 업데이트 실패:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const batch = writeBatch(db);

        // 1. Get all categories for this workspace
        const catsQuery = query(
          collection(db, COLLECTIONS.CATEGORIES),
          where('workspace_id', '==', id)
        );
        const catsSnapshot = await getDocs(catsQuery);
        const catIds = catsSnapshot.docs.map(doc => doc.id);

        // 2. Get all items for these categories
        const itemsQuery = query(
          collection(db, COLLECTIONS.ITEMS),
          where('category_id', 'in', catIds.length > 0 ? catIds : ['__placeholder__'])
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemIds = itemsSnapshot.docs.map(doc => doc.id);

        // 3. Delete checklists for these items
        const checklistsQuery = query(
          collection(db, COLLECTIONS.CHECKLISTS),
          where('item_id', 'in', itemIds.length > 0 ? itemIds : ['__placeholder__'])
        );
        const checklistsSnapshot = await getDocs(checklistsQuery);
        checklistsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // 4. Delete items
        itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // 5. Delete categories
        catsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // 6. Delete workspace
        batch.delete(doc(db, COLLECTIONS.WORKSPACES, id));

        await batch.commit();
      } catch (error) {
        console.error('Workspace 삭제 실패:', error);
        throw error;
      }
    },

    reorder: async (orderedWorkspaceIds: string[]): Promise<void> => {
      try {
        const batch = writeBatch(db);
        const q = query(collection(db, COLLECTIONS.WORKSPACES));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((docSnap) => {
          const newIndex = orderedWorkspaceIds.indexOf(docSnap.id);
          if (newIndex !== -1) {
            batch.update(docSnap.ref, { order: newIndex });
          }
        });

        await batch.commit();
      } catch (error) {
        console.error('Workspace 순서 변경 실패:', error);
        throw error;
      }
    },
  },

  categories: {
    listByWorkspace: async (workspaceId: string): Promise<Category[]> => {
      try {
        const q = query(
          collection(db, COLLECTIONS.CATEGORIES),
          where('workspace_id', '==', workspaceId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Category))
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      } catch (error) {
        console.error('Categories 조회 실패:', error);
        return [];
      }
    },

    create: async (workspaceId: string, name: string): Promise<Category> => {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
          workspace_id: workspaceId,
          name,
          created_at: now(),
        });
        return {
          id: docRef.id,
          workspace_id: workspaceId,
          name,
          created_at: now(),
        };
      } catch (error) {
        console.error('Category 생성 실패:', error);
        throw error;
      }
    },

    update: async (id: string, name: string): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
        await updateDoc(docRef, { name });
      } catch (error) {
        console.error('Category 업데이트 실패:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const batch = writeBatch(db);

        // Get all items for this category
        const itemsQuery = query(
          collection(db, COLLECTIONS.ITEMS),
          where('category_id', '==', id)
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const itemIds = itemsSnapshot.docs.map(doc => doc.id);

        // Delete checklists for these items
        if (itemIds.length > 0) {
          const checklistsQuery = query(
            collection(db, COLLECTIONS.CHECKLISTS),
            where('item_id', 'in', itemIds)
          );
          const checklistsSnapshot = await getDocs(checklistsQuery);
          checklistsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        }

        // Delete items
        itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Delete category
        batch.delete(doc(db, COLLECTIONS.CATEGORIES, id));

        await batch.commit();
      } catch (error) {
        console.error('Category 삭제 실패:', error);
        throw error;
      }
    },
  },

  items: {
    listByCategory: async (categoryId: string): Promise<Item[]> => {
      try {
        const q = query(
          collection(db, COLLECTIONS.ITEMS),
          where('category_id', '==', categoryId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Item))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        console.error('Items 조회 실패:', error);
        return [];
      }
    },

    create: async (categoryId: string): Promise<Item> => {
      try {
        // Get siblings to determine order
        const q = query(
          collection(db, COLLECTIONS.ITEMS),
          where('category_id', '==', categoryId)
        );
        const snapshot = await getDocs(q);
        const siblings = snapshot.docs.map(doc => doc.data() as Item);
        const maxOrder = siblings.reduce((max, item) => Math.max(max, item.order ?? 0), -1);

        const docRef = await addDoc(collection(db, COLLECTIONS.ITEMS), {
          category_id: categoryId,
          title: '새 항목',
          description: '',
          order: maxOrder + 1,
          created_at: now(),
        });

        return {
          id: docRef.id,
          category_id: categoryId,
          title: '새 항목',
          description: '',
          order: maxOrder + 1,
          created_at: now(),
        };
      } catch (error) {
        console.error('Item 생성 실패:', error);
        throw error;
      }
    },

    update: async (item: Partial<Item> & { id: string }): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.ITEMS, item.id);
        const updateData = { ...item };
        delete updateData.id;
        await updateDoc(docRef, updateData as any);
      } catch (error) {
        console.error('Item 업데이트 실패:', error);
        throw error;
      }
    },

    reorder: async (categoryId: string, orderedItemIds: string[]): Promise<void> => {
      try {
        const batch = writeBatch(db);
        const q = query(
          collection(db, COLLECTIONS.ITEMS),
          where('category_id', '==', categoryId)
        );
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((docSnap) => {
          const newIndex = orderedItemIds.indexOf(docSnap.id);
          if (newIndex !== -1) {
            batch.update(docSnap.ref, { order: newIndex });
          }
        });

        await batch.commit();
      } catch (error) {
        console.error('Item 정렬 실패:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const batch = writeBatch(db);

        // Delete checklists for this item
        const checklistsQuery = query(
          collection(db, COLLECTIONS.CHECKLISTS),
          where('item_id', '==', id)
        );
        const checklistsSnapshot = await getDocs(checklistsQuery);
        checklistsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Delete item
        batch.delete(doc(db, COLLECTIONS.ITEMS, id));

        await batch.commit();
      } catch (error) {
        console.error('Item 삭제 실패:', error);
        throw error;
      }
    },
  },

  checklist: {
    listByItem: async (itemId: string): Promise<ChecklistItem[]> => {
      try {
        const q = query(
          collection(db, COLLECTIONS.CHECKLISTS),
          where('item_id', '==', itemId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as ChecklistItem));
      } catch (error) {
        console.error('Checklists 조회 실패:', error);
        return [];
      }
    },

    create: async (itemId: string): Promise<ChecklistItem> => {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.CHECKLISTS), {
          item_id: itemId,
          text: '',
          is_checked: false,
          memo: '',
          created_at: now(),
        });

        return {
          id: docRef.id,
          item_id: itemId,
          text: '',
          is_checked: false,
          memo: '',
          created_at: now(),
        };
      } catch (error) {
        console.error('Checklist 생성 실패:', error);
        throw error;
      }
    },

    update: async (check: Partial<ChecklistItem> & { id: string }): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.CHECKLISTS, check.id);
        const updateData = { ...check };
        delete updateData.id;
        await updateDoc(docRef, updateData as any);
      } catch (error) {
        console.error('Checklist 업데이트 실패:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await deleteDoc(doc(db, COLLECTIONS.CHECKLISTS, id));
      } catch (error) {
        console.error('Checklist 삭제 실패:', error);
        throw error;
      }
    },
  },

  bookmarkZones: {
    list: async (): Promise<BookmarkZone[]> => {
      try {
        const q = query(collection(db, COLLECTIONS.BOOKMARK_ZONES));
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as BookmarkZone))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        console.error('BookmarkZones 조회 실패:', error);
        return [];
      }
    },

    create: async (name: string, default_color: string, order: number): Promise<BookmarkZone> => {
      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.BOOKMARK_ZONES), {
          name,
          default_color,
          order,
          created_at: now(),
        });
        return {
          id: docRef.id,
          name,
          default_color,
          order,
          created_at: now(),
        };
      } catch (error) {
        console.error('BookmarkZone 생성 실패:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<BookmarkZone>): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.BOOKMARK_ZONES, id);
        await updateDoc(docRef, updates as any);
      } catch (error) {
        console.error('BookmarkZone 업데이트 실패:', error);
        throw error;
      }
    },

    initializeDefaults: async (): Promise<void> => {
      try {
        const existing = await firestoreDb.bookmarkZones.list();

        if (existing.length === 0) {
          // Create new zones if none exist
          const batch = writeBatch(db);
          DEFAULT_ZONES.forEach(zone => {
            const newDocRef = doc(collection(db, COLLECTIONS.BOOKMARK_ZONES));
            batch.set(newDocRef, {
              ...zone,
              created_at: now(),
            });
          });
          await batch.commit();
        } else if (existing.length === DEFAULT_ZONES.length) {
          // Update default colors while preserving user-changed zone names
          const batch = writeBatch(db);
          existing.forEach((zone, index) => {
            const defaultZone = DEFAULT_ZONES[index];
            const docRef = doc(db, COLLECTIONS.BOOKMARK_ZONES, zone.id);
            batch.update(docRef, {
              default_color: defaultZone.default_color,
              order: defaultZone.order,
            });
          });
          await batch.commit();
        }
      } catch (error) {
        console.error('Default zones 초기화 실패:', error);
      }
    },
  },

  bookmarks: {
    list: async (): Promise<Bookmark[]> => {
      try {
        const q = query(collection(db, COLLECTIONS.BOOKMARKS));
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Bookmark))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        console.error('Bookmarks 조회 실패:', error);
        return [];
      }
    },

    listByZone: async (zoneId: string): Promise<Bookmark[]> => {
      try {
        const q = query(
          collection(db, COLLECTIONS.BOOKMARKS),
          where('zone_id', '==', zoneId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Bookmark))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        console.error('Zone bookmarks 조회 실패:', error);
        return [];
      }
    },

    create: async (zoneId: string, name: string, url: string, color: string): Promise<Bookmark> => {
      try {
        const siblings = await firestoreDb.bookmarks.listByZone(zoneId);
        const maxOrder = siblings.reduce((max, b) => Math.max(max, b.order ?? 0), -1);

        const docRef = await addDoc(collection(db, COLLECTIONS.BOOKMARKS), {
          zone_id: zoneId,
          name,
          url,
          color,
          order: maxOrder + 1,
          created_at: now(),
        });

        return {
          id: docRef.id,
          zone_id: zoneId,
          name,
          url,
          color,
          order: maxOrder + 1,
          created_at: now(),
        };
      } catch (error) {
        console.error('Bookmark 생성 실패:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<Bookmark>): Promise<void> => {
      try {
        const docRef = doc(db, COLLECTIONS.BOOKMARKS, id);
        const updateData = { ...updates };
        await updateDoc(docRef, updateData as any);
      } catch (error) {
        console.error('Bookmark 업데이트 실패:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await deleteDoc(doc(db, COLLECTIONS.BOOKMARKS, id));
      } catch (error) {
        console.error('Bookmark 삭제 실패:', error);
        throw error;
      }
    },
  },
};

export default firestoreDb;
