import { api } from "./api-client";

export interface Overview {
  totals: { users: number; profiles: number; movies: number; shows: number; subscriptions: number };
  revenue: number;
  trending: { title: string; views: number }[];
  topRated: { title: string; rating: number }[];
  genres: { name: string; count: number }[];
}

export async function fetchOverview(): Promise<Overview> {
  const r = await api.get<Overview>("/api/admin/overview");
  return r.data;
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 ? true : list.includes(email);
}
