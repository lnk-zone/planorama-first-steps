
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface ProjectProgressChartProps {
  projects: any[];
}

const ProjectProgressChart = ({ projects }: ProjectProgressChartProps) => {
  // Prepare data for status distribution pie chart
  const statusData = projects.reduce((acc, project) => {
    const status = project.status || 'planning';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count as number,
    status
  }));

  // Color mapping for different statuses
  const statusColors = {
    planning: '#3b82f6',
    'in-progress': '#f59e0b',
    completed: '#10b981',
    'on-hold': '#6b7280'
  };

  const chartConfig = {
    value: {
      label: "Projects",
    },
    planning: {
      label: "Planning",
      color: statusColors.planning,
    },
    'in-progress': {
      label: "In Progress", 
      color: statusColors['in-progress'],
    },
    completed: {
      label: "Completed",
      color: statusColors.completed,
    },
    'on-hold': {
      label: "On Hold",
      color: statusColors['on-hold'],
    },
  };

  // Prepare data for project types bar chart
  const typeData = projects.reduce((acc, project) => {
    const type = project.project_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(typeData).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
    count: count as number,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Project Status Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Project Status Distribution</CardTitle>
            <CardDescription>Overview of your project statuses</CardDescription>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={statusColors[entry.status as keyof typeof statusColors] || '#6b7280'} 
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No projects to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Project Types</CardTitle>
            <CardDescription>Distribution by project category</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={barData}>
                <XAxis dataKey="type" />
                <YAxis />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No project types to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectProgressChart;
