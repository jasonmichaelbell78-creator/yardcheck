import { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface PhotoCaptureProps {
  onCapture: (file: File) => Promise<void>;
  existingPhotoUrl?: string | null;
  onDelete?: () => Promise<void>;
  onPhotoClick?: () => void;
  disabled?: boolean;
}

export function PhotoCapture({
  onCapture,
  existingPhotoUrl,
  onDelete,
  onPhotoClick,
  disabled = false,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCameraClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      await onCapture(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    const confirmed = window.confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);

    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleThumbnailClick = () => {
    if (onPhotoClick) {
      onPhotoClick();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Show thumbnail if photo exists */}
      {existingPhotoUrl && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleThumbnailClick}
            className={cn(
              'w-[60px] h-[60px] rounded-md overflow-hidden border border-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              onPhotoClick && 'cursor-pointer hover:opacity-90'
            )}
          >
            <img
              src={existingPhotoUrl}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
          </button>
          
          {/* Delete button overlay */}
          {onDelete && !disabled && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                'absolute -top-2 -right-2 w-6 h-6 rounded-full',
                'bg-destructive text-white flex items-center justify-center',
                'hover:bg-destructive/90 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1',
                isDeleting && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Camera button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCameraClick}
        disabled={disabled || isUploading}
        className={cn(
          'h-8 w-8 flex-shrink-0',
          existingPhotoUrl && 'text-primary'
        )}
        title={existingPhotoUrl ? 'Replace photo' : 'Take photo'}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      {/* Error message */}
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
