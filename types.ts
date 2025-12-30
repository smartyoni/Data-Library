export interface Workspace {
  id: string;
  name: string;
  is_locked: boolean;
  order: number;
  created_at: string;
}

export interface Category {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface Item {
  id: string;
  category_id: string;
  title: string;
  description: string; // The text area content
  order: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  item_id: string;
  order: number;
  text: string;
  is_checked: boolean;
  memo: string;
  created_at: string;
}

export interface BookmarkZone {
  id: string;
  name: string;
  default_color: string;
  order: number;
  created_at: string;
}

export interface Bookmark {
  id: string;
  zone_id: string;
  name: string;
  url: string;
  color: string;
  order: number;
  created_at: string;
}

// Helper types for UI state
export type ViewState = 'loading' | 'ready' | 'error';