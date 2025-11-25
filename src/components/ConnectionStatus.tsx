import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnection } from '@/contexts/ConnectionContext';
import { cn } from '@/utils/cn';

export function ConnectionStatus() {
  const { status } = useConnection();

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        status === 'online' && 'bg-green-100 text-green-800',
        status === 'offline' && 'bg-red-100 text-red-800',
        status === 'syncing' && 'bg-yellow-100 text-yellow-800'
      )}
    >
      {status === 'online' && (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
      {status === 'syncing' && (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing</span>
        </>
      )}
    </div>
  );
}
