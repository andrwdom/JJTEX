// API Health Check Utility
export async function checkApiHealth(): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    // Avoid AbortSignal.timeout() for older browser support (use AbortController instead)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('API health check failed:', error);
    }
    return false;
  }
}

// Safe fetch wrapper with better error handling
export async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    // Avoid AbortSignal.timeout() for broader browser support; add our own timeout.
    const controller = new AbortController();
    const hasExternalSignal = !!options?.signal;
    const timeoutId = hasExternalSignal ? null : setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Add timeout
      signal: options?.signal || controller.signal,
    });
    
    if (timeoutId) clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Fetch error:', error);
    }
    return null;
  }
}
