
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Award,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { differenceInDays, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

interface ProductivityInsightsProps {
  projects: any[];
}

interface TypeStats {
  total: number;
  completed: number;
}

const ProductivityInsights = ({ projects }: ProductivityInsightsProps) => {
  const currentWeek = {
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  };
  
  const lastWeek = {
    start: startOfWeek(subWeeks(new Date(), 1)),
    end: endOfWeek(subWeeks(new Date(), 1))
  };

  // Calculate weekly metrics
  const thisWeekProjects = projects.filter(p => {
    const created = new Date(p.created_at);
    return created >= currentWeek.start && created <= currentWeek.end;
  }).length;

  const lastWeekProjects = projects.filter(p => {
    const created = new Date(p.created_at);
    return created >= lastWeek.start && created <= lastWeek.end;
  }).length;

  const weeklyGrowth = lastWeekProjects > 0 
    ? Math.round(((thisWeekProjects - lastWeekProjects) / lastWeekProjects) * 100)
    : thisWeekProjects > 0 ? 100 : 0;

  // Calculate project completion velocity
  const completedProjects = projects.filter(p => p.status === 'completed');
  const averageCompletionTime = completedProjects.length > 0
    ? Math.round(completedProjects.reduce((sum, p) => {
        return sum + differenceInDays(new Date(p.updated_at), new Date(p.created_at));
      }, 0) / completedProjects.length)
    : 0;

  // Most productive project type
  const typeStats = projects.reduce((acc, p) => {
    const type = p.project_type || 'other';
    if (!acc[type]) acc[type] = { total: 0, completed: 0 };
    acc[type].total++;
    if (p.status === 'completed') acc[type].completed++;
    return acc;
  }, {} as Record<string, TypeStats>);

  const mostProductiveType = Object.entries(typeStats)
    .map(([type, stats]: [string, TypeStats]) => ({
      type,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      total: stats.total
    }))
    .sort((a, b) => b.completionRate - a.completionRate)[0];

  // Generate insights
  const insights = [];

  if (weeklyGrowth > 0) {
    insights.push({
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      title: 'Growing Momentum',
      description: `${weeklyGrowth}% more projects created this week`,
      type: 'positive'
    });
  }

  if (averageCompletionTime > 0 && averageCompletionTime < 30) {
    insights.push({
      icon: <Target className="h-4 w-4 text-blue-600" />,
      title: 'Fast Execution',
      description: `Average completion time: ${averageCompletionTime} days`,
      type: 'neutral'
    });
  }

  if (mostProductiveType && mostProductiveType.completionRate > 50) {
    insights.push({
      icon: <Award className="h-4 w-4 text-purple-600" />,
      title: 'Top Category',
      description: `${mostProductiveType.type.replace('_', ' ')} projects have ${Math.round(mostProductiveType.completionRate)}% completion rate`,
      type: 'positive'
    });
  }

  const activeProjectsRatio = projects.length > 0 
    ? (projects.filter(p => p.status === 'in-progress').length / projects.length) * 100 
    : 0;

  if (activeProjectsRatio > 70) {
    insights.push({
      icon: <Lightbulb className="h-4 w-4 text-yellow-600" />,
      title: 'Focus Opportunity',
      description: 'Consider completing some projects before starting new ones',
      type: 'suggestion'
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <CardTitle className="text-lg">Productivity Insights</CardTitle>
        </div>
        <CardDescription>
          Analytics and recommendations for your project management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Performance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">This Week's Activity</h4>
            <Badge variant={weeklyGrowth > 0 ? "default" : "secondary"} className="text-xs">
              {weeklyGrowth > 0 ? '+' : ''}{weeklyGrowth}%
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{thisWeekProjects} new projects</span>
            <span>•</span>
            <span>vs {lastWeekProjects} last week</span>
          </div>
        </div>

        {/* Completion Rate Progress */}
        {completedProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Overall Completion</h4>
              <span className="text-sm text-muted-foreground">
                {Math.round((completedProjects.length / projects.length) * 100)}%
              </span>
            </div>
            <Progress value={(completedProjects.length / projects.length) * 100} className="h-2" />
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Key Insights</h4>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">More insights will appear as you create and manage projects</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityInsights;
