import { useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Loader2 } from 'lucide-react';

export function UpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  
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

  const handleUpdate = useCallback(async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Update the service worker - passing true tells it to reload immediately
      await updateServiceWorker(true);
      // The updateServiceWorker(true) should reload the page automatically
      // But if it doesn't reload within 2 seconds, force a reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setIsUpdating(false);
      // Try to reload anyway to get the new version
      window.location.reload();
    }
  }, [isUpdating, updateServiceWorker]);

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
