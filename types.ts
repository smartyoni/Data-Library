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
  order: number;
  is_hidden: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  category_id: string;
  title: string;
  description: string; // The text area content
  order: number;
  status_color?: 'green' | 'pink' | 'gray';
  created_at: string;
}

// Base interface for checklist items and dividers
interface ChecklistItemBase {
  id: string;
  item_id: string;
  order: number;
  created_at: string;
}

// Regular checklist item
export interface ChecklistItemData extends ChecklistItemBase {
  type: 'item';
  text: string;
  is_checked: boolean;
  memo: string;
  status_color?: 'green' | 'pink' | 'gray';
}

// Section divider
export interface ChecklistDivider extends ChecklistItemBase {
  type: 'divider';
  label: string;
}

// Union type for type safety
export type ChecklistItem = ChecklistItemData | ChecklistDivider;

// Type guard functions
export function isChecklistItem(item: ChecklistItem): item is ChecklistItemData {
  return item.type === 'item';
}

export function isChecklistDivider(item: ChecklistItem): item is ChecklistDivider {
  return item.type === 'divider';
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