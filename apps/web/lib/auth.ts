export interface StoredAuth {
  email: string;
  token: string;
}

export function loadAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("userData");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("userData", JSON.stringify(auth));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userData");
}
