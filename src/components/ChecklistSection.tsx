import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChecklistItem } from '@/components/ChecklistItem';
import type { ChecklistSectionConfig, ChecklistItemData } from '@/types';

interface ChecklistSectionProps {
  config: ChecklistSectionConfig;
  data: Record<string, ChecklistItemData>;
  onValueChange: (itemId: string, value: string) => void;
  onCommentChange: (itemId: string, comment: string) => void;
  onPhotoCapture?: (itemId: string, file: File) => Promise<void>;
  onPhotoDelete?: (itemId: string) => Promise<void>;
  disabled?: boolean;
}

export function ChecklistSection({
  config,
  data,
  onValueChange,
  onCommentChange,
  onPhotoCapture,
  onPhotoDelete,
  disabled = false,
}: ChecklistSectionProps) {
  const completedCount = config.items.filter(
    item => data[item.id]?.value !== null
  ).length;

  // Only exterior items support photos
  const allowPhoto = config.id === 'exterior';

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{config.label}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{config.items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {config.items.map((item) => (
          <ChecklistItem
            key={item.id}
            config={item}
            data={data[item.id] || { value: null, comment: '', answeredBy: '', answeredAt: null }}
            onValueChange={(value) => onValueChange(item.id, value)}
            onCommentChange={(comment) => onCommentChange(item.id, comment)}
            allowPhoto={allowPhoto}
            onPhotoCapture={allowPhoto && onPhotoCapture ? (file) => onPhotoCapture(item.id, file) : undefined}
            onPhotoDelete={allowPhoto && onPhotoDelete ? () => onPhotoDelete(item.id) : undefined}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}
