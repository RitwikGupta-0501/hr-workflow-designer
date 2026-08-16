/**
 * Base HTTP client for all API requests.
 * Handles:
 * - Base URL configuration
 * - Headers (Content-Type, auth tokens)
 * - JSON parsing
 * - Error normalization
 * - Request cancellation
 */

export interface ApiError extends Error {
    status: number;
    data?: unknown;
}

class ApiErrorImpl extends Error implements ApiError {
    status: number;
    data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class HttpClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    private getAuthToken(): string | null {
        // TODO: Replace with actual token retrieval from auth store
        return localStorage.getItem('authToken');
    }

    private buildUrl(path: string): string {
        if (path.startsWith('http')) {
            return path;
        }
        return `${this.baseUrl}${path}`;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        let data: unknown;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new ApiErrorImpl(
                typeof data === 'object' && data !== null && 'message' in data
                    ? String((data as Record<string, unknown>).message)
                    : `HTTP ${response.status}`,
                response.status,
                data
            );
        }

        return data as T;
    }

    async get<T>(path: string, options?: RequestInit): Promise<T> {
        const headers: Record<string, string> = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(path), {
            method: 'GET',
            ...options,
            headers: { ...headers, ...options?.headers },
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
        const headers: Record<string, string> = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(path), {
            method: 'POST',
            ...options,
            headers: { ...headers, ...options?.headers },
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
        const headers: Record<string, string> = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(path), {
            method: 'PUT',
            ...options,
            headers: { ...headers, ...options?.headers },
            body: body ? JSON.stringify(body) : undefined,
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(path: string, options?: RequestInit): Promise<T> {
        const headers: Record<string, string> = { ...this.defaultHeaders };
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.buildUrl(path), {
            method: 'DELETE',
            ...options,
            headers: { ...headers, ...options?.headers },
        });

        return this.handleResponse<T>(response);
    }
}

// Export a singleton instance for use throughout the app
export const httpClient = new HttpClient();
