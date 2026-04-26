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
  is_trial_active: boolean;
  pro_cancel_at_period_end?: boolean;
}

// ==================== Constants ====================
export const RELATION_CHOICES = [
  { value: "customer",    label: "顧客・クライアント" },
  { value: "outsource",   label: "委託先・外注先" },
  { value: "supplier",    label: "仕入先・パートナー" },
  { value: "agency",      label: "代理店・販売店" },
  { value: "internal",    label: "社内・同僚" },
  { value: "group",       label: "グループ会社・関連会社" },
  { value: "referral",    label: "紹介者・仲介者" },
  { value: "community",   label: "勉強会・コミュニティ" },
  { value: "event",       label: "展示会・イベント" },
  { value: "investor",    label: "投資家・出資者" },
  { value: "media",       label: "メディア・プレス" },
  { value: "other",       label: "その他" },
];

export const BUSINESS_AXIS_CHOICES = [
  { value: "it_engineering",  label: "ITエンジニアリング" },
  { value: "hr_recruitment",  label: "人材紹介・採用支援" },
  { value: "marketing",       label: "マーケティング・広告" },
  { value: "design",          label: "デザイン・クリエイティブ" },
  { value: "consulting",      label: "コンサルティング" },
  { value: "sales",           label: "営業・セールス" },
  { value: "education",       label: "教育・研修・コーチング" },
  { value: "writing",         label: "ライティング・メディア" },
  { value: "event_community", label: "イベント・コミュニティ" },
  { value: "other",           label: "その他" },
];

// ==================== Axes ====================
export interface UserBusinessAxis {
  id: string;
  axis: string;
  axis_display: string;
  sort_order: number;
  created_at: string;
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
  name?: string;
  company_name?: string;
  relation_type?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  company_name?: string;
  relation_type?: string;
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
