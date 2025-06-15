
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Zap
} from 'lucide-react';
import { format, differenceInDays, subWeeks } from 'date-fns';

interface ProjectMetricsProps {
  projects: any[];
}

const ProjectMetrics = ({ projects }: ProjectMetricsProps) => {
  // Calculate various metrics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning').length;
  const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
  
  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  
  // Calculate recent activity (projects created in last 2 weeks)
  const twoWeeksAgo = subWeeks(new Date(), 2);
  const recentProjects = projects.filter(p => 
    new Date(p.created_at) >= twoWeeksAgo
  ).length;

  // Calculate average project age
  const averageAge = totalProjects > 0 
    ? Math.round(projects.reduce((sum, p) => {
        return sum + differenceInDays(new Date(), new Date(p.created_at));
      }, 0) / totalProjects)
    : 0;

  // Project health score (based on completion rate and recent activity)
  const healthScore = Math.min(100, Math.round((completionRate * 0.7) + (recentProjects * 10)));

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedProjects} of {totalProjects} completed
          </p>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">
              {projects.filter(p => p.status === 'planning').length} planning
            </Badge>
            <Badge variant="outline" className="text-xs">
              {projects.filter(p => p.status === 'in-progress').length} in progress
            </Badge>
          </div>
          {onHoldProjects > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {onHoldProjects} on hold
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentProjects}</div>
          <p className="text-xs text-muted-foreground">
            Projects created in last 2 weeks
          </p>
          <div className="mt-2">
            <Badge variant={recentProjects > 0 ? "default" : "secondary"} className="text-xs">
              {recentProjects > 0 ? "Active" : "Quiet"} period
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Project Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Health</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
            {healthScore}
          </div>
          <Progress value={healthScore} className="mt-2" />
          <div className="mt-2">
            <Badge variant={getHealthBadgeVariant(healthScore)} className="text-xs">
              {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMetrics;
