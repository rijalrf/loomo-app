'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface LoadingAlertProps {
  isLoading: boolean;
  message?: string;
  id?: string;
}

export function showLoadingAlert(message: string = 'Loading...', id?: string) {
  const toastId = id || 'loading-alert';
  toast.loading(message, { id: toastId });
  return toastId;
}

export function hideLoadingAlert(id?: string) {
  const toastId = id || 'loading-alert';
  toast.dismiss(toastId);
}

export default function LoadingAlert({ isLoading, message = 'Loading...', id }: LoadingAlertProps) {
  const toastId = id || 'loading-alert';

  useEffect(() => {
    if (isLoading) {
      toast.loading(message, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }

    return () => {
      toast.dismiss(toastId);
    };
  }, [isLoading, message, toastId]);

  return null;
}
