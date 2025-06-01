import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Calendar, Clock, TrendingUp, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { Project, Task } from "@/types/project";

// --- MAP Prisma ENUMS to Dashboard-friendly strings ---
const projectStatusMap: Record<string, string> = {
  ACTIF: "active",
  EN_ATTENTE: "on-hold",
  TERMINE: "completed",
};
const taskStatusMap: Record<string, string> = {
  A_FAIRE: "todo",
  EN_COURS: "in-progress",
  TERMINEE: "completed",
};
const taskSeverityMap: Record<string, string> = {
  CRITIQUE: "critical",
  HAUTE: "high",
  MOYENNE: "medium",
  FAIBLE: "low",
};

// --- Chart Colors ---
const chartConfig = {
  completed: {
    label: "Completed",
    color: "#22c55e",
  },
  inProgress: {
    label: "In Progress", 
    color: "#f59e0b",
  },
  todo: {
    label: "To Do",
    color: "#64748b",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
  },
  high: {
    label: "High",
    color: "#f97316",
  },
  medium: {
    label: "Medium",
    color: "#eab308",
  },
  low: {
    label: "Low",
    color: "#84cc16",
  },
};


export const ProjectAnalytics = ({ projects, tasks }: { projects: Project[], tasks: Task[] }) => {
  // Map DB status/severity to dashboard
  const mappedProjects = projects.map(p => ({
    ...p,
    dashboardStatus: projectStatusMap[p.status as string] || p.status,
  }));
  const mappedTasks = tasks.map(t => ({
    ...t,
    dashboardStatus: taskStatusMap[t.status as string] || t.status,
    dashboardSeverity: taskSeverityMap[t.severity as string] || t.severity,
  }));

  // --- Key Metrics ---
  const totalProjects = mappedProjects.length;
  const activeProjects = mappedProjects.filter(p => p.dashboardStatus === "active").length;
  const completedProjects = mappedProjects.filter(p => p.dashboardStatus === "completed").length;
  const onHoldProjects = mappedProjects.filter(p => p.dashboardStatus === "on-hold").length;

  const totalTasks = mappedTasks.length;
  const completedTasks = mappedTasks.filter(t => t.dashboardStatus === "completed").length;
  const inProgressTasks = mappedTasks.filter(t => t.dashboardStatus === "in-progress").length;
  const todoTasks = mappedTasks.filter(t => t.dashboardStatus === "todo").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // --- Chart Data ---
  const taskStatusData = [
    { name: "Completed", value: completedTasks, fill: chartConfig.completed.color },
    { name: "In Progress", value: inProgressTasks, fill: chartConfig.inProgress.color },
    { name: "To Do", value: todoTasks, fill: chartConfig.todo.color },
  ];
  const taskSeverityData = [
    { name: "Critical", value: mappedTasks.filter(t => t.dashboardSeverity === "critical").length, fill: chartConfig.critical.color },
    { name: "High", value: mappedTasks.filter(t => t.dashboardSeverity === "high").length, fill: chartConfig.high.color },
    { name: "Medium", value: mappedTasks.filter(t => t.dashboardSeverity === "medium").length, fill: chartConfig.medium.color },
    { name: "Low", value: mappedTasks.filter(t => t.dashboardSeverity === "low").length, fill: chartConfig.low.color },
  ];
  const projectProgressData = mappedProjects.map(project => {
    const projectTasks = mappedTasks.filter(t => t.projectId === project.id);
    const projectCompletedTasks = projectTasks.filter(t => t.dashboardStatus === "completed").length;
    const progress = projectTasks.length > 0 ? Math.round((projectCompletedTasks / projectTasks.length) * 100) : 0;
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + "..." : project.name,
      progress,
      completed: projectCompletedTasks,
      total: projectTasks.length
    };
  });

  // --- MOCK Weekly Data (you can replace with real data!) ---
  const weeklyProgressData = [
    { week: "Week 1", completed: 12, inProgress: 8, todo: 15 },
    { week: "Week 2", completed: 18, inProgress: 6, todo: 11 },
    { week: "Week 3", completed: 25, inProgress: 4, todo: 6 },
    { week: "Week 4", completed: 32, inProgress: 3, todo: 2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Project Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive overview of your project performance</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mappedTasks.filter(t => t.dashboardSeverity === "critical").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>Overview of task completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Task Severity Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Task Severity Distribution</CardTitle>
            <CardDescription>Breakdown of task priorities</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={taskSeverityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Completion percentage by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectProgressData.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900 dark:text-gray-100">{project.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {project.completed}/{project.total} ({project.progress}%)
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Weekly Progress Trend</CardTitle>
            <CardDescription>Task completion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={weeklyProgressData}>
                <XAxis dataKey="week" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke={chartConfig.completed.color} 
                  strokeWidth={2}
                  name="Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="inProgress" 
                  stroke={chartConfig.inProgress.color} 
                  strokeWidth={2}
                  name="In Progress"
                />
                <Line 
                  type="monotone" 
                  dataKey="todo" 
                  stroke={chartConfig.todo.color} 
                  strokeWidth={2}
                  name="To Do"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
