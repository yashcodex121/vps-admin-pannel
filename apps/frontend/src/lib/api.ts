const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('nexus_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          // Token expired or invalid
        }
        return {
          success: false,
          error: json.error || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to connect to NEXUS Backend',
      };
    }
  }

  public get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
