// ==================== User ====================
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  trial_started_at: string;
  created_at: string;
  updated_at: string;
  can_add_card: boolean;
  can_add_workspace: boolean;
  is_pro: boolean;
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

// ==================== Business Card ====================
export interface ParsedData {
  company_name?: string;
  full_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  department?: string;
  notes?: string;
}

export interface BusinessCard {
  id: string;
  workspace: string; // workspace ID
  owner: string; // user ID
  image: string | null;
  thumbnail: string | null;
  analysis_status: 'pending' | 'processing' | 'done' | 'failed';
  parsed_data: ParsedData | null;
  raw_ocr_text: string;
  memo: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
