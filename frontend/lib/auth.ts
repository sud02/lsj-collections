import api from "./api";
import { AuthResponse, User } from "@/types/user";

export const phoneLogin = async (
  firebaseToken: string,
  phone: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/auth/phone-login", {
    firebase_token: firebaseToken,
    phone,
  });
  return data;
};

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

export const formatPhoneE164 = (phone10: string): string => {
  const digits = phone10.replace(/\D/g, "").slice(-10);
  return `+91${digits}`;
};

export const isValidIndianMobile = (phone: string): boolean =>
  /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
