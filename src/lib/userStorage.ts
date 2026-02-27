// User storage utilities - localStorage based
export const USER_STORAGE_KEY = "eco_companion_user";
export const USER_NAME_KEY = "eco_companion_user_name";
export const USER_PREFERENCES_KEY = "eco_companion_preferences";

export interface UserProfile {
  name: string;
  email?: string;
  initials: string;
  createdAt: string;
}

export interface UserPreferences {
  transport: string;
  meals: string;
  waste: string;
  water: string;
  shopping: string;
  homeSize: string;
  location: string;
  heating: string;
}

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * Generate initials from a full name
 * @param name Full name (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};

/**
 * Save user profile to localStorage
 */
export const saveUserProfile = (name: string, email?: string): UserProfile => {
  const initials = getInitials(name);
  const profile: UserProfile = {
    name,
    email,
    initials,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  localStorage.setItem(USER_NAME_KEY, name);
  return profile;
};

/**
 * Get user profile from localStorage
 */
export const getUserProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  const parsed = safeParse<UserProfile>(stored);
  if (!parsed && stored) {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  return parsed;
};

/**
 * Get user name from localStorage
 */
export const getUserName = (): string => {
  return localStorage.getItem(USER_NAME_KEY) || "Eco-Hero";
};

/**
 * Get user initials from localStorage
 */
export const getUserInitials = (): string => {
  const profile = getUserProfile();
  return profile?.initials || "EH";
};

/**
 * Save user questionnaire preferences
 */
export const saveUserPreferences = (preferences: Partial<UserPreferences>): void => {
  const existing = getUserPreferences();
  const updated = { ...existing, ...preferences };
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updated));
};

/**
 * Get user questionnaire preferences
 */
export const getUserPreferences = (): Partial<UserPreferences> => {
  const stored = localStorage.getItem(USER_PREFERENCES_KEY);
  const parsed = safeParse<Partial<UserPreferences>>(stored);
  if (!parsed && stored) {
    localStorage.removeItem(USER_PREFERENCES_KEY);
  }
  return parsed || {};
};

/**
 * Clear all user data (logout)
 */
export const clearUserData = (): void => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_PREFERENCES_KEY);
};
