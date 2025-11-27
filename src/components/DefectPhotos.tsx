import { useRef, useState } from 'react';
import { Plus, X, Loader2, CheckCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import type { DefectPhoto } from '@/types';
import { cn } from '@/utils/cn';

interface DefectPhotosProps {
  photos: DefectPhoto[];
  onAddPhoto: (file: File, caption?: string) => Promise<void>;
  onDeletePhoto: (photoUrl: string) => Promise<void>;
  disabled?: boolean;
}

export function DefectPhotos({
  photos = [],
  onAddPhoto,
  onDeletePhoto,
  disabled = false,
}: DefectPhotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCaption, setShowCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleAddClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show caption input
    setPendingFile(file);
    setShowCaption(true);
    setCaptionText('');

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadWithCaption = async () => {
    if (!pendingFile) return;

    setError(null);
    setIsUploading(true);
    setShowCaption(false);

    try {
      await onAddPhoto(pendingFile, captionText.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      setPendingFile(null);
      setCaptionText('');
    }
  };

  const handleCancelCaption = () => {
    setShowCaption(false);
    setPendingFile(null);
    setCaptionText('');
  };

  const handleDelete = async (photoUrl: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    setError(null);
    setDeletingUrl(photoUrl);

    try {
      await onDeletePhoto(photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeletingUrl(null);
    }
  };

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const photoUrls = photos.map((p) => p.url);
  const photoCaptions = photos.map((p) => p.caption || '');

  return (
    <div className="space-y-3">
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

      {/* Caption input dialog */}
      {showCaption && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
          <Input
            placeholder="Add a caption (optional)"
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelCaption}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleUploadWithCaption}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      )}

      {/* Photo count indicator */}
      {photos.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{photos.length} photo{photos.length !== 1 ? 's' : ''} captured</span>
        </div>
      )}

      {/* Photo grid - uses simple placeholders for performance, click to view */}
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div key={photo.url} className="relative group">
            <button
              type="button"
              onClick={() => handlePhotoClick(index)}
              className={cn(
                'w-[60px] h-[60px] rounded-md overflow-hidden border border-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                'cursor-pointer hover:opacity-90 bg-gray-100 flex items-center justify-center'
              )}
              title={photo.caption || `View defect photo ${index + 1}`}
            >
              <Image className="w-6 h-6 text-gray-400" />
            </button>

            {/* Delete button overlay */}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleDelete(photo.url)}
                disabled={deletingUrl === photo.url}
                className={cn(
                  'absolute -top-2 -right-2 w-6 h-6 rounded-full',
                  'bg-destructive text-white flex items-center justify-center',
                  'hover:bg-destructive/90 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1',
                  deletingUrl === photo.url && 'opacity-50 cursor-not-allowed'
                )}
              >
                {deletingUrl === photo.url ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            )}

            {/* Caption indicator */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 truncate">
                {photo.caption}
              </div>
            )}
          </div>
        ))}

        {/* Add photo button */}
        {!disabled && !showCaption && (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={isUploading}
            className={cn(
              'w-[60px] h-[60px] rounded-md border-2 border-dashed border-gray-300',
              'flex items-center justify-center',
              'hover:border-primary hover:bg-gray-50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photos={photoUrls}
        captions={photoCaptions}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
