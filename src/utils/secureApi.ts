import { createSecureHeaders, logSecurityEvent } from './security';
import { validateCSRFToken } from './security';

// API request configuration with security defaults
interface SecureRequestConfig extends RequestInit {
  timeout?: number;
  includeCSRF?: boolean;
  validateResponse?: boolean;
}

// Security-focused API wrapper
export class SecureApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = '', defaultTimeout: number = 30000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    config: SecureRequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      includeCSRF = true,
      validateResponse = true,
      ...requestConfig
    } = config;

    // Security validations
    if (!this.isValidEndpoint(endpoint)) {
      logSecurityEvent('INVALID_API_ENDPOINT', { endpoint });
      throw new Error('Invalid API endpoint');
    }

    // Create secure headers
    const secureHeaders = createSecureHeaders(includeCSRF);
    const headers = {
      ...secureHeaders,
      ...requestConfig.headers
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = this.baseUrl + endpoint;
      
      // Log request (in development only)
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Request: ${requestConfig.method || 'GET'} ${url}`);
      }

      const response = await fetch(url, {
        ...requestConfig,
        headers,
        signal: controller.signal,
        // Security: Prevent credentials from being sent to untrusted origins
        credentials: this.isTrustedOrigin(url) ? 'include' : 'omit'
      });

      clearTimeout(timeoutId);

      // Validate response
      if (validateResponse && !response.ok) {
        const errorData = await this.safeJsonParse(response);
        logSecurityEvent('API_ERROR_RESPONSE', { 
          status: response.status, 
          endpoint,
          error: errorData 
        });
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // CSRF token validation for state-changing operations
      if (includeCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(requestConfig.method || '')) {
        const responseCSRF = response.headers.get('X-CSRF-Token');
        if (responseCSRF && !validateCSRFToken(responseCSRF)) {
          logSecurityEvent('CSRF_TOKEN_MISMATCH', { endpoint });
          throw new Error('CSRF token validation failed');
        }
      }

      return await this.safeJsonParse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        logSecurityEvent('API_REQUEST_TIMEOUT', { endpoint, timeout });
        throw new Error('Request timeout');
      }

      logSecurityEvent('API_REQUEST_ERROR', { 
        endpoint, 
        error: String(error),
        method: requestConfig.method || 'GET'
      });
      throw error;
    }
  }

  private async safeJsonParse<T>(response: Response): Promise<T> {
    const text = await response.text();
    
    if (!text.trim()) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      logSecurityEvent('JSON_PARSE_ERROR', { 
        responseText: text.substring(0, 100),
        error: String(error)
      });
      throw new Error('Invalid JSON response');
    }
  }

  private isValidEndpoint(endpoint: string): boolean {
    // Validate endpoint format
    if (!endpoint || typeof endpoint !== 'string') return false;
    
    // Prevent path traversal attacks
    if (endpoint.includes('..') || endpoint.includes('//')) return false;
    
    // Must start with / or be a valid URL
    if (!endpoint.startsWith('/') && !endpoint.match(/^https?:\/\//)) return false;
    
    return true;
  }

  private isTrustedOrigin(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      const trustedOrigins = [
        window.location.origin,
        process.env.VITE_SUPABASE_URL
      ].filter(Boolean);

      return trustedOrigins.some(origin => 
        urlObj.origin === origin
      );
    } catch {
      return false;
    }
  }

  // HTTP method wrappers with security defaults
  async get<T>(endpoint: string, config?: SecureRequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'GET',
      includeCSRF: false // GET requests don't need CSRF tokens
    });
  }

  async post<T>(endpoint: string, data?: any, config?: SecureRequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, config?: SecureRequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: SecureRequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, config?: SecureRequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...config,
      method: 'DELETE'
    });
  }

  // Upload method with additional security for file uploads
  async upload<T>(
    endpoint: string, 
    formData: FormData, 
    config?: SecureRequestConfig
  ): Promise<T> {
    // Remove Content-Type header to let browser set it with boundary
    const { headers, ...restConfig } = config || {};
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];

    return this.makeRequest<T>(endpoint, {
      ...restConfig,
      method: 'POST',
      body: formData,
      headers: uploadHeaders
    });
  }
}

// Default API client instance
export const apiClient = new SecureApiClient();

// Helper for Supabase API calls
export const supabaseApi = new SecureApiClient(
  process.env.VITE_SUPABASE_URL || '',
  45000 // Longer timeout for Supabase
);