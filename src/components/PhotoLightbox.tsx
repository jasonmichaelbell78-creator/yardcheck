import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface PhotoLightboxProps {
  photos: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  captions?: string[];
}

export function PhotoLightbox({
  photos,
  initialIndex = 0,
  open,
  onClose,
  captions = [],
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchPosition = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    resetView();
  }, [photos.length, resetView]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    resetView();
  }, [photos.length, resetView]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose, goToPrevious, goToNext]);

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch to zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / lastTouchDistance.current;
      setScale((prev) => Math.max(0.5, Math.min(4, prev * delta)));
      lastTouchDistance.current = distance;
    } else if (
      e.touches.length === 1 &&
      isDragging &&
      lastTouchPosition.current &&
      scale > 1
    ) {
      // Pan when zoomed in
      const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    lastTouchPosition.current = null;
    setIsDragging(false);
  };

  // Swipe detection for navigation
  const touchStartX = useRef<number | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null && scale === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
      touchStartX.current = null;
    }
  };

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const currentCaption = captions[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleSwipeStart(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        handleTouchEnd();
        handleSwipeEnd(e);
      }}
    >
      {/* Header with close button */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <span className="text-white/80 text-sm">
          {photos.length > 1 && `${currentIndex + 1} / ${photos.length}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img
          src={currentPhoto}
          alt={currentCaption || `Photo ${currentIndex + 1}`}
          className={cn(
            'max-w-full max-h-full object-contain select-none',
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows (desktop) */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hidden sm:flex"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 hidden sm:flex"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      {/* Caption */}
      {currentCaption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-center text-sm">{currentCaption}</p>
        </div>
      )}

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}
