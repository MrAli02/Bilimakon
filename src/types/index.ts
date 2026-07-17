export type UserRole = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  telegram_id?: string;
  telegram_username?: string;
  is_blocked: boolean;
  access_key_id?: string;
  device_count?: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  modules?: Module[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  passing_score: number;
  is_published: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  youtube_video_id?: string;
  duration_seconds?: number;
  order_index: number;
  is_published: boolean;
}

export interface Question {
  id: string;
  subject: string;
  text: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface AccessKey {
  id: string;
  key: string;
  note?: string;
  max_devices: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  used_by?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  confirmed_at?: string;
}
