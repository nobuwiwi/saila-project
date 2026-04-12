// ==================== User ====================
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  trial_started_at: string;
  created_at: string;
  updated_at: string;
}

// ==================== Workspace ====================
export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreateInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}
