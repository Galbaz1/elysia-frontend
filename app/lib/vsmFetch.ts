const TENANT_KEY = "VSM_TENANT_ID";
const PROFILE_KEY = "VSM_PROFILE_ID";

export function getTenantId(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem(TENANT_KEY) || "default";
}

export function setTenantId(id: string): void {
  localStorage.setItem(TENANT_KEY, id);
}

export function getSelectedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PROFILE_KEY);
}

export function setSelectedProfileId(id: string | null): void {
  if (id) localStorage.setItem(PROFILE_KEY, id);
  else localStorage.removeItem(PROFILE_KEY);
}

export async function vsmFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("X-VSM-TENANT-ID", getTenantId());
  return fetch(input, { ...init, headers });
}


