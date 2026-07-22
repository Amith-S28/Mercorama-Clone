// lib/profile-store.ts
// Extended user profile stored in localStorage alongside AuthUser.

const KEY_PROFILE = 'mercorama_user_profile';

export interface UserProfile {
  name?: string;       // persists across logout
  company?: string;
  jobTitle?: string;
  phone?: string;
  country?: string;
  avatarUrl?: string; // base64 data URL
}

export function getProfile(): UserProfile {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(KEY_PROFILE);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return {};
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}
