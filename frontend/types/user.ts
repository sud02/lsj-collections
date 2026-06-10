export interface User {
  id: number;
  name: string;
  email?: string;
  mobile: string;
  address?: string;
  avatar?: string;
  role?: "user" | "admin";
  is_active?: number;
  is_new?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  is_new: boolean;
}
