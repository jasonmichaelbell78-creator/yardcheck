import { useRef, useState } from 'react';
import { Plus, Loader2, CheckCircle, Eye, Trash2 } from 'lucide-react';
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

  const handleViewPhotos = () => {
    setLightboxIndex(0);
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

      {/* Photo count indicator with view/delete actions */}
      {photos.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>{photos.length} photo{photos.length !== 1 ? 's' : ''} captured</span>
          </div>
          <button
            type="button"
            onClick={handleViewPhotos}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          {!disabled && (
            <button
              type="button"
              onClick={() => handleDelete(photos[photos.length - 1].url)}
              disabled={deletingUrl !== null}
              className={cn(
                "flex items-center gap-1 text-sm text-destructive hover:underline",
                deletingUrl !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              {deletingUrl !== null ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete last
            </button>
          )}
        </div>
      )}

      {/* Add photo button */}
      {!disabled && !showCaption && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add photo
        </Button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Lightbox - only loads images when opened */}
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
