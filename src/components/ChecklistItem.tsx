import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhotoCapture } from '@/components/PhotoCapture';
import { PhotoLightbox } from '@/components/PhotoLightbox';
import { MessageSquare, X, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ChecklistItemConfig, ChecklistItemData } from '@/types';

interface ChecklistItemProps {
  config: ChecklistItemConfig;
  data: ChecklistItemData;
  onValueChange: (value: string) => void;
  onCommentChange: (comment: string) => void;
  allowPhoto?: boolean;
  onPhotoCapture?: (file: File) => Promise<void>;
  onPhotoDelete?: () => Promise<void>;
  disabled?: boolean;
}

export function ChecklistItem({
  config,
  data,
  onValueChange,
  onCommentChange,
  allowPhoto = false,
  onPhotoCapture,
  onPhotoDelete,
  disabled = false,
}: ChecklistItemProps) {
  const [showComment, setShowComment] = useState(!!data.comment);
  const [commentText, setCommentText] = useState(data.comment);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleCommentSave = () => {
    onCommentChange(commentText);
    if (!commentText) {
      setShowComment(false);
    }
  };

  const getOptionLabel = (option: string): string => {
    switch (option) {
      case 'yes':
        return 'Yes';
      case 'no':
        return 'No';
      case 'added':
        return 'Added';
      case 'in-date':
        return 'In-Date';
      case 'out-of-date':
        return 'Out';
      default:
        return option;
    }
  };

  const getOptionVariant = (option: string, isSelected: boolean): 'default' | 'outline' | 'destructive' | 'success' | 'warning' => {
    if (!isSelected) return 'outline';
    
    switch (option) {
      case 'yes':
      case 'in-date':
        return 'success';
      case 'no':
      case 'out-of-date':
        return 'destructive';
      case 'added':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <span className="font-medium text-gray-900">
          {config.label}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {config.options.map((option) => (
            <Button
              key={option}
              variant={getOptionVariant(option, data.value === option)}
              size="sm"
              onClick={() => onValueChange(option)}
              disabled={disabled}
              className={cn(
                'min-w-[50px] sm:min-w-[60px] text-xs px-2 sm:px-3',
                data.value === option && 'ring-2 ring-offset-1'
              )}
            >
              {getOptionLabel(option)}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowComment(!showComment)}
            className={cn(
              'h-8 w-8 flex-shrink-0',
              data.comment && 'text-primary'
            )}
            disabled={disabled}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {allowPhoto && onPhotoCapture && (
            <PhotoCapture
              onCapture={onPhotoCapture}
              existingPhotoUrl={data.photoUrl}
              onDelete={onPhotoDelete}
              onPhotoClick={() => data.photoUrl && setLightboxOpen(true)}
              disabled={disabled}
            />
          )}
        </div>
      </div>
      
      {showComment && (
        <div className="mt-3 space-y-2 w-full">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="text-sm min-h-[60px] w-full"
            disabled={disabled}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCommentText(data.comment);
                setShowComment(false);
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCommentSave}
              disabled={disabled}
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}
      
      {!showComment && data.comment && (
        <p className="mt-2 text-sm text-gray-500 italic break-words">
          "{data.comment}"
        </p>
      )}

      {/* Lightbox for viewing full photo */}
      {data.photoUrl && (
        <PhotoLightbox
          photos={[data.photoUrl]}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
