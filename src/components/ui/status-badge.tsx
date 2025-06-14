
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const getColorClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        getColorClasses(status),
        getSizeClasses(size)
      )}
    >
      {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
};

export default StatusBadge;
