const API_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return body.data;
}

function getOAuthURL(provider: string) {
  const base = import.meta.env.VITE_API_URL || "";
  return `${base}/api/auth/${provider}`;
}

export const api = {
  auth: {
    googleURL: () => getOAuthURL("google"),
    requestMagicLink: (email: string, emailConsent?: boolean, preferredCurrency?: string) =>
      request<{ message: string }>("/api/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email, emailConsent, preferredCurrency }),
      }),
    me: () => request<any>("/api/auth/me"),
    logout: () => request<any>("/api/auth/logout", { method: "POST" }),
  },
  subscriptions: {
    list: (params?: { search?: string; status?: string; category?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      if (params?.category) query.set("category", params.category);
      if (params?.from) query.set("from", params.from);
      if (params?.to) query.set("to", params.to);
      const qs = query.toString();
      return request<any[]>(`/api/subscriptions${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<any>(`/api/subscriptions/${id}`),
    create: (data: any) =>
      request<any>("/api/subscriptions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/api/subscriptions/${id}`, { method: "DELETE" }),
  },
  notifications: {
    list: () => request<any[]>("/api/notifications"),
    markRead: (id: string) =>
      request<any>(`/api/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      request<any>("/api/notifications/read-all", { method: "PATCH" }),
  },
  user: {
    updateProfile: (data: { name?: string; email?: string; preferred_currency?: string; email_notifications_enabled?: boolean; budgetCaps?: Record<string, number>; budget_caps?: Record<string, number> }) =>
      request<any>("/api/user/profile", { method: "PATCH", body: JSON.stringify(data) }),
  },
  savings: {
    get: () => request<{ total: number; currency: string; entries: any[] }>("/api/savings"),
  },
  statements: {
    upload: async (file: File) => {
      const base = import.meta.env.VITE_API_URL || "";
      const formData = new FormData();
      formData.append("statement", file);
      const res = await fetch(`${base}/api/transactions/statements`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Upload failed");
      return body.data;
    },
    confirm: (detectionId: string, indices: number[]) =>
      request<{ added: string[]; updated: string[]; count: number }>("/api/transactions/statements/confirm", {
        method: "POST",
        body: JSON.stringify({ statementId: detectionId, indices }),
      }),
  },
};
