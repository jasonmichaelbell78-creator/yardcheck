import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import type { Inspection, ChecklistItemData, DefectPhoto } from '@/types';
import { CHECKLIST_CONFIG } from '@/config/checklist';
import { cn } from '@/utils/cn';

interface CapturedPhotosProps {
  inspection: Inspection;
}

interface PhotoItem {
  url: string;
  label: string;
}

export function CapturedPhotos({ inspection }: CapturedPhotosProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Collect all exterior item photos with labels
  const exteriorSection = CHECKLIST_CONFIG.find((s) => s.id === 'exterior');
  const itemPhotos: PhotoItem[] = [];
  
  if (exteriorSection) {
    for (const item of exteriorSection.items) {
      const itemData = inspection.exterior[item.id as keyof typeof inspection.exterior] as ChecklistItemData | undefined;
      if (itemData?.photoUrl) {
        itemPhotos.push({
          url: itemData.photoUrl,
          label: item.label,
        });
      }
    }
  }

  // Collect all defect photos with captions
  const defectPhotos: PhotoItem[] = (inspection.defectPhotos || []).map((photo: DefectPhoto) => ({
    url: photo.url,
    label: photo.caption || 'Defect Photo',
  }));

  // Combine all photos
  const allPhotos = [...itemPhotos, ...defectPhotos];

  // If no photos, don't render the section
  if (allPhotos.length === 0) {
    return null;
  }

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="w-5 h-5" />
          <span>Captured Photos</span>
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {allPhotos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => handlePhotoClick(index)}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border border-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                'cursor-pointer hover:opacity-90 transition-opacity'
              )}
            >
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                {photo.label}
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      {/* Lightbox */}
      <PhotoLightbox
        photos={allPhotos.map((p) => p.url)}
        captions={allPhotos.map((p) => p.label)}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
}
