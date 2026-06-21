export async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (res.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error || 'Request failed' };
    }
  } catch (e) {
    return { success: false, error: 'Network error' };
  }
}
