import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        onStartDateChange(todayStr);
        onEndDateChange(todayStr);
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        onStartDateChange(weekAgo.toISOString().split('T')[0]);
        onEndDateChange(todayStr);
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        onStartDateChange(monthAgo.toISOString().split('T')[0]);
        onEndDateChange(todayStr);
        break;
      }
      case 'all':
        onStartDateChange('');
        onEndDateChange('');
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            max={endDate || today}
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate}
            max={today}
            className="text-sm"
          />
        </div>
      </div>
      
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset('today')}
          className="text-xs"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset('week')}
          className="text-xs"
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset('month')}
          className="text-xs"
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreset('all')}
          className="text-xs"
        >
          All Time
        </Button>
      </div>
    </div>
  );
}
