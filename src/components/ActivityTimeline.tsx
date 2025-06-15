
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  Pause
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

interface ActivityTimelineProps {
  projects: any[];
}

const ActivityTimeline = ({ projects }: ActivityTimelineProps) => {
  // Sort projects by creation date and take recent ones
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'on-hold':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <Plus className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    
    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo < 7) return `${daysAgo} days ago`;
    
    return format(date, 'MMM d, yyyy');
  };

  const getActionText = (project: any) => {
    const daysSinceCreated = differenceInDays(new Date(), new Date(project.created_at));
    const daysSinceUpdated = differenceInDays(new Date(), new Date(project.updated_at));
    
    if (daysSinceUpdated < daysSinceCreated && daysSinceUpdated < 7) {
      return 'Updated project';
    }
    return 'Created project';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </div>
        <CardDescription>
          Your latest project updates and milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to show</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={project.id} className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(project.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getActionText(project)} "{project.title}"
                      </p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(project.status)}`}
                        >
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                        </Badge>
                        {project.project_type && project.project_type !== 'other' && (
                          <Badge variant="outline" className="text-xs">
                            {project.project_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
