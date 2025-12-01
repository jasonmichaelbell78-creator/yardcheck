import { useState, useCallback, useRef, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

export function UpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const isUpdatingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
      console.log('SW registered: ' + swUrl);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Reset updating state on unmount
      isUpdatingRef.current = false;
    };
  }, []);

  const handleUpdate = useCallback(async () => {
    if (isUpdatingRef.current) {
      console.debug('[UpdatePrompt] update already in progress, ignoring click');
      return;
    }
    
    isUpdatingRef.current = true;
    setIsUpdating(true);
    console.debug('[UpdatePrompt] starting updateServiceWorker(true)');
    
    try {
      // Try to directly message the waiting SW as a backup mechanism
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          console.debug('[UpdatePrompt] posting skipWaiting to waiting SW');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      // Update the service worker - passing true tells it to reload immediately
      await updateServiceWorker(true);
      console.debug('[UpdatePrompt] updateServiceWorker resolved');
      
      // The updateServiceWorker(true) should reload the page automatically
      // But if it doesn't reload within 3 seconds, force a reload
      timeoutRef.current = setTimeout(() => {
        console.debug('[UpdatePrompt] fallback reload triggered after timeout');
        isUpdatingRef.current = false;
        setIsUpdating(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('[UpdatePrompt] updateServiceWorker error:', error);
      isUpdatingRef.current = false;
      setIsUpdating(false);
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Try to reload anyway to get the new version
      window.location.reload();
    }
  }, [updateServiceWorker]);

  const close = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-800 px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className={`h-5 w-5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">
            {isUpdating ? 'Updating...' : 'New version available!'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={isUpdating}
            className="rounded-md p-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
