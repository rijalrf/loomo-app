import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/clientLogger';

interface ApiMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  context?: string;
}

interface ApiMutationResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface UseApiMutationReturn {
  mutate: (url: string, data?: any, method?: string) => Promise<ApiMutationResult>;
  loading: boolean;
  error: string | null;
}

export function useApiMutation(options: ApiMutationOptions = {}): UseApiMutationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    url: string,
    data?: any,
    method: string = 'POST'
  ): Promise<ApiMutationResult> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });

      const responseData = await res.json();

      if (res.ok) {
        if (options.onSuccess) options.onSuccess(responseData);
        if (options.successMessage) toast.success(options.successMessage);
        return { success: true, data: responseData };
      } else {
        const errorMsg = responseData.error || options.errorMessage || 'Request failed';
        if (options.onError) options.onError(errorMsg);
        toast.error(errorMsg);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (e) {
      const errorMsg = 'Network error';
      toast.error(errorMsg);
      if (options.context) {
        clientLogger.error(options.context, errorMsg, e);
      }
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
