import type { DashboardResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function fetchDashboard() {
  return request<DashboardResponse>("/v1/dashboard");
}

export async function connectBank() {
  await request<{ provider: string; link_token: string; expiration: string }>("/v1/plaid/link-token", { method: "POST" });
  return request<{ item_id: string; institution_name: string; status: string }>("/v1/plaid/exchange-public-token", {
    method: "POST",
    body: JSON.stringify({ public_token: "public-sandbox-demo-token" })
  });
}

export function syncTransactions() {
  return request<{ synced_at: string; imported_transactions: number; account_count: number; status: string }>("/v1/sync", {
    method: "POST"
  });
}
