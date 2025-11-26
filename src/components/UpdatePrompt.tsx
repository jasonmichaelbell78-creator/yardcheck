import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
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

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-800 px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5" />
          <span className="text-sm font-medium">
            New version available!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            // Force immediate reload to apply the new service worker
            onClick={() => updateServiceWorker(true)}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-50 transition-colors"
          >
            Update
          </button>
          <button
            onClick={close}
            className="rounded-md p-1.5 hover:bg-blue-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
