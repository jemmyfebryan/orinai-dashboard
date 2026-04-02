import type { DashboardResponse } from "@/types/siorin";

export async function getSiorinDashboard(): Promise<DashboardResponse> {
  try {
    const res = await fetch('/siorin/dashboard', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Siorin dashboard: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching Siorin dashboard:', error);
    throw new Error(`Error fetching Siorin dashboard: ${(error as Error).message}`);
  }
}
