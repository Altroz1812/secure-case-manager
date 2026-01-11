import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium',
        active
          ? 'bg-success/10 text-success hover:bg-success/20'
          : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
