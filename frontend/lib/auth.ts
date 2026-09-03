import api from "./api";
import { AuthResponse, RequestOtpResponse, User } from "@/types/user";

// ──────────────────────────────────────────────
// Customer sign-in — email one-time password
// ──────────────────────────────────────────────

/** Step 1: ask the API to email a 6-digit code. Returns the token that carries it. */
export const requestEmailOtp = async (email: string): Promise<RequestOtpResponse> => {
  const { data } = await api.post<RequestOtpResponse>("/auth/email/request-otp", {
    email: email.trim().toLowerCase(),
  });
  return data;
};

/** Step 2: exchange the token + code for a JWT. Creates the account on first sign-in. */
export const verifyEmailOtp = async (
  otpToken: string,
  code: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/auth/email/verify-otp", {
    otp_token: otpToken,
    code,
  });
  return data;
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

// ──────────────────────────────────────────────
// FALLBACK — Firebase phone OTP sign-in.
// Superseded by the email OTP flow above. To switch back, uncomment this, the
// body of lib/firebase.ts, and the phone-login route on the backend.
// ──────────────────────────────────────────────

// export const phoneLogin = async (
//   firebaseToken: string,
//   phone: string
// ): Promise<AuthResponse> => {
//   const { data } = await api.post<AuthResponse>("/auth/phone-login", {
//     firebase_token: firebaseToken,
//     phone,
//   });
//   return data;
// };

// export const formatPhoneE164 = (phone10: string): string => {
//   const digits = phone10.replace(/\D/g, "").slice(-10);
//   return `+91${digits}`;
// };

export const devLogin = async (
  phone: string,
  code: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/auth/dev-login", { phone, code });
  return data;
};

export const adminLogin = async (
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const { data } = await api.post<{ token: string; user: User }>("/auth/admin-login", {
    email,
    password,
  });
  return data;
};

export const isBypassMode = (): boolean =>
  process.env.NEXT_PUBLIC_AUTH_BYPASS_OTP === "true";

export const fetchMe = async (): Promise<User> => {
  const { data } = await api.get<User>("/auth/me");
  return data;
};

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch {
    // no-op: local token cleanup happens regardless
  }
};

export const isValidIndianMobile = (phone: string): boolean =>
  /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
