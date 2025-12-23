import { Category, Item, ChecklistItem, Workspace } from '../types';

// Helper to generate IDs
const generateId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Keys for LocalStorage
const KEY_WORKSPACES = 'estateflow_workspaces';
const KEY_CATEGORIES = 'estateflow_categories';
const KEY_ITEMS = 'estateflow_items';
const KEY_CHECKLIST = 'estateflow_checklist';

// Initial Seed Data
const seedData = () => {
  if (!localStorage.getItem(KEY_WORKSPACES)) {
    const wsId1 = generateId();
    const workspaces: Workspace[] = [
      { id: wsId1, name: '기본 작업공간', is_locked: false, created_at: now() }
    ];

    const catId1 = generateId();
    const catId2 = generateId();
    
    // Assign categories to the default workspace
    const cats: Category[] = [
      { id: catId1, workspace_id: wsId1, name: '계약서 작성', created_at: now() },
      { id: catId2, workspace_id: wsId1, name: '매물 관리', created_at: now() },
    ];
    
    const itemId1 = generateId();
    const items: Item[] = [
      { id: itemId1, category_id: catId1, title: '아파트 매매 계약 필수 서류', description: '매도인 인감증명서 확인 필수.\n등기권리증 분실 시 확인서면 준비.', order: 0, created_at: now() }
    ];

    const checklists: ChecklistItem[] = [
      { id: generateId(), item_id: itemId1, text: '등기부등본 확인 (말소사항 포함)', is_checked: true, memo: '을구 근저당 설정 확인 완료', created_at: now() },
      { id: generateId(), item_id: itemId1, text: '신분증 진위여부 확인', is_checked: false, memo: 'ARS 1382 이용', created_at: now() },
    ];

    localStorage.setItem(KEY_WORKSPACES, JSON.stringify(workspaces));
    localStorage.setItem(KEY_CATEGORIES, JSON.stringify(cats));
    localStorage.setItem(KEY_ITEMS, JSON.stringify(items));
    localStorage.setItem(KEY_CHECKLIST, JSON.stringify(checklists));
  }
};

seedData();

// --- Generic Helpers ---
const get = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const set = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

// --- API ---

export const db = {
  workspaces: {
    list: async (): Promise<Workspace[]> => get(KEY_WORKSPACES),
    create: async (name: string): Promise<Workspace> => {
      const all = get<Workspace>(KEY_WORKSPACES);
      const newWs: Workspace = { id: generateId(), name, is_locked: false, created_at: now() };
      set(KEY_WORKSPACES, [...all, newWs]);
      return newWs;
    },
    update: async (id: string, updates: Partial<Workspace>): Promise<void> => {
      const all = get<Workspace>(KEY_WORKSPACES);
      set(KEY_WORKSPACES, all.map(w => w.id === id ? { ...w, ...updates } : w));
    },
    delete: async (id: string): Promise<void> => {
      // 1. Get all categories for this workspace
      const allCats = get<Category>(KEY_CATEGORIES);
      const workspaceCats = allCats.filter(c => c.workspace_id === id);
      const catIds = workspaceCats.map(c => c.id);

      // 2. Get all items for these categories
      const allItems = get<Item>(KEY_ITEMS);
      const workspaceItems = allItems.filter(i => catIds.includes(i.category_id));
      const itemIds = workspaceItems.map(i => i.id);

      // 3. Delete checklists for these items
      const allChecklists = get<ChecklistItem>(KEY_CHECKLIST);
      const remainingChecklists = allChecklists.filter(c => !itemIds.includes(c.item_id));
      set(KEY_CHECKLIST, remainingChecklists);

      // 4. Delete items
      const remainingItems = allItems.filter(i => !catIds.includes(i.category_id));
      set(KEY_ITEMS, remainingItems);

      // 5. Delete categories
      const remainingCats = allCats.filter(c => c.workspace_id !== id);
      set(KEY_CATEGORIES, remainingCats);

      // 6. Delete workspace
      const allWs = get<Workspace>(KEY_WORKSPACES).filter(w => w.id !== id);
      set(KEY_WORKSPACES, allWs);
    }
  },
  categories: {
    listByWorkspace: async (workspaceId: string): Promise<Category[]> => {
      return get<Category>(KEY_CATEGORIES)
        .filter(c => c.workspace_id === workspaceId)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    },
    create: async (workspaceId: string, name: string): Promise<Category> => {
      const all = get<Category>(KEY_CATEGORIES);
      const newCat = { id: generateId(), workspace_id: workspaceId, name, created_at: now() };
      set(KEY_CATEGORIES, [...all, newCat]);
      return newCat;
    },
    update: async (id: string, name: string): Promise<void> => {
      const all = get<Category>(KEY_CATEGORIES);
      set(KEY_CATEGORIES, all.map(c => c.id === id ? { ...c, name } : c));
    },
    delete: async (id: string): Promise<void> => {
      // Cascade delete items and checklists
      const allItems = get<Item>(KEY_ITEMS);
      const categoryItems = allItems.filter(i => i.category_id === id);
      const itemIds = categoryItems.map(i => i.id);

      const allChecklists = get<ChecklistItem>(KEY_CHECKLIST);
      const remainingChecklists = allChecklists.filter(c => !itemIds.includes(c.item_id));
      set(KEY_CHECKLIST, remainingChecklists);

      const remainingItems = allItems.filter(i => i.category_id !== id);
      set(KEY_ITEMS, remainingItems);

      const allCats = get<Category>(KEY_CATEGORIES).filter(c => c.id !== id);
      set(KEY_CATEGORIES, allCats);
    }
  },
  items: {
    listByCategory: async (categoryId: string): Promise<Item[]> => {
      return get<Item>(KEY_ITEMS)
        .filter(i => i.category_id === categoryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
    create: async (categoryId: string): Promise<Item> => {
      const all = get<Item>(KEY_ITEMS);
      // Find max order
      const siblings = all.filter(i => i.category_id === categoryId);
      const maxOrder = siblings.reduce((max, item) => Math.max(max, item.order ?? 0), -1);

      const newItem = { 
        id: generateId(), 
        category_id: categoryId, 
        title: '새 항목', 
        description: '', 
        order: maxOrder + 1,
        created_at: now() 
      };
      set(KEY_ITEMS, [...all, newItem]);
      return newItem;
    },
    update: async (item: Partial<Item> & { id: string }): Promise<void> => {
      const all = get<Item>(KEY_ITEMS);
      set(KEY_ITEMS, all.map(i => i.id === item.id ? { ...i, ...item } : i));
    },
    reorder: async (categoryId: string, orderedItemIds: string[]): Promise<void> => {
      const all = get<Item>(KEY_ITEMS);
      const updates = all.map(item => {
        if (item.category_id === categoryId) {
          const newIndex = orderedItemIds.indexOf(item.id);
          if (newIndex !== -1) {
            return { ...item, order: newIndex };
          }
        }
        return item;
      });
      set(KEY_ITEMS, updates);
    },
    delete: async (id: string): Promise<void> => {
      set(KEY_ITEMS, get<Item>(KEY_ITEMS).filter(i => i.id !== id));
      set(KEY_CHECKLIST, get<ChecklistItem>(KEY_CHECKLIST).filter(c => c.item_id !== id));
    }
  },
  checklist: {
    listByItem: async (itemId: string): Promise<ChecklistItem[]> => {
      return get<ChecklistItem>(KEY_CHECKLIST).filter(c => c.item_id === itemId);
    },
    create: async (itemId: string): Promise<ChecklistItem> => {
      const all = get<ChecklistItem>(KEY_CHECKLIST);
      const newCheck = { id: generateId(), item_id: itemId, text: '', is_checked: false, memo: '', created_at: now() };
      set(KEY_CHECKLIST, [...all, newCheck]);
      return newCheck;
    },
    update: async (check: Partial<ChecklistItem> & { id: string }): Promise<void> => {
      const all = get<ChecklistItem>(KEY_CHECKLIST);
      set(KEY_CHECKLIST, all.map(c => c.id === check.id ? { ...c, ...check } : c));
    },
    delete: async (id: string): Promise<void> => {
      set(KEY_CHECKLIST, get<ChecklistItem>(KEY_CHECKLIST).filter(c => c.id !== id));
    }
  }
};