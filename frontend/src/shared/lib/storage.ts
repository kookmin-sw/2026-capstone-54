export type StorageKey = string;
export type StorageValue = string | number | boolean | object | null;

export function getLocalStorageItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.warn(`Failed to read localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorageItem(key: StorageKey, value: StorageValue): void {
  try {
    if (typeof window === 'undefined') return;
    
    const serialized = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
    
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to write localStorage key "${key}":`, error);
  }
}

export function removeLocalStorageItem(key: StorageKey): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage key "${key}":`, error);
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days?: number | null, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  
  let expires = '';
  if (days !== null && days !== undefined) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = `${name}=${value || ''}${expires}; path=${path}`;
}

export function removeCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  
  setCookie(name, '', -1, path);
}

export function shouldShowCoachMarks(key: string, expirationDays: number = 30): boolean {
  const lastShown = getLocalStorageItem<number | null>(`coachMarks:${key}:lastShown`, null);
  
  if (lastShown === null) return true;
  
  const now = Date.now();
  const expirationTime = lastShown + (expirationDays * 24 * 60 * 60 * 1000);
  
  return now > expirationTime;
}

export function markCoachMarksShown(key: string): void {
  setLocalStorageItem(`coachMarks:${key}:lastShown`, Date.now());
}

export function clearAllCoachMarks(): void {
  if (typeof window === 'undefined') return;
  
  Object.keys(window.localStorage).forEach(key => {
    if (key.startsWith('coachMarks:')) {
      removeLocalStorageItem(key);
    }
  });
}