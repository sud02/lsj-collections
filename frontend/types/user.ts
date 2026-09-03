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

export interface RequestOtpResponse {
  /** Opaque signed token that carries the emailed code — send it back to verify. */
  otp_token: string;
  email: string;
  /** Seconds until the code expires. */
  expires_in: number;
  /** True when the address already has an account (sign-in rather than sign-up). */
  is_registered: boolean;
  /** True when the server skipped the email and accepted the fixed dev code. */
  dev_bypass?: boolean;
}
