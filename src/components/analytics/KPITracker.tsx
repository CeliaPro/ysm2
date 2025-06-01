'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Clock, CheckCircle, Users, Target } from 'lucide-react'
import KPICard from './KPICard'
import { Task, Project } from '@/types/project'

type KPITrackerProps = {
  tasks: Task[]
  projects?: Project[]
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'TERMINEE':
      return 'Terminé'
    case 'EN_COURS':
      return 'En cours'
    case 'A_FAIRE':
    default:
      return 'En attente'
  }
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B']

 const KPITracker: React.FC<KPITrackerProps> = ({ tasks, projects }) => {
  // --------------- KPI calculations -----------------
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'TERMINEE').length
  const inProgressTasks = tasks.filter(t => t.status === 'EN_COURS').length
  const pendingTasks = tasks.filter(t => t.status === 'A_FAIRE').length

  // Tasks done %
  const completionPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // "Team efficiency" as % tasks not delayed (endDate <= deadline or no endDate means in progress)
  const timelyTasks = tasks.filter(
    t => t.status !== 'TERMINEE' ||
      (t.endDate && t.deadline && new Date(t.endDate) <= new Date(t.deadline))
  ).length
  const teamEfficiency = totalTasks ? Math.round((timelyTasks / totalTasks) * 100) : 0

  // "Respect des délais": of completed, what % ended on or before deadline
  const completedAndOnTime = tasks.filter(
    t =>
      t.status === 'TERMINEE' &&
      t.endDate &&
      t.deadline &&
      new Date(t.endDate) <= new Date(t.deadline)
  ).length
  const onTimePercent = completedTasks ? Math.round((completedAndOnTime / completedTasks) * 100) : 0

  // "Objectifs atteints": e.g., completed projects this month (demo: just use completed tasks for now)
  const month = new Date().getMonth()
  const objectivesReached = tasks.filter(
    t => t.status === 'TERMINEE' && new Date(t.endDate || t.deadline).getMonth() === month
  ).length
  // For example, say there were 10 objectives, adjust as needed:
  const totalObjectives = 10
  const objectivesPercent = Math.round((objectivesReached / totalObjectives) * 100)

  // Trends (fake: just demo, you can calculate real deltas if you want)
  const kpiData = [
    {
      title: 'Tâches terminées',
      value: `${completedTasks}/${totalTasks}`,
      subtitle: `${completionPercent}% du total`,
      icon: CheckCircle,
      trend: { value: completedTasks, isPositive: true },
      color: 'bg-green-500'
    },
    {
      title: "Efficacité équipe",
      value: `${teamEfficiency}%`,
      subtitle: "Performance globale",
      icon: Users,
      trend: { value: teamEfficiency, isPositive: true },
      color: "bg-blue-500"
    },
    {
      title: "Respect des délais",
      value: `${onTimePercent}%`,
      subtitle: "Tâches à temps",
      icon: Clock,
      trend: { value: onTimePercent, isPositive: onTimePercent > 80 },
      color: "bg-purple-500"
    },
    {
      title: "Objectifs atteints",
      value: `${objectivesReached}/${totalObjectives}`,
      subtitle: "Ce mois-ci",
      icon: Target,
      trend: { value: objectivesReached, isPositive: objectivesReached > totalObjectives / 2 },
      color: "bg-orange-500"
    }
  ]

  // Weekly progress (group by week: use deadline as reference)
  function groupByWeek(tasks: Task[]) {
    const byWeek: Record<string, { planned: number, completed: number }> = {}
    tasks.forEach(task => {
      const d = new Date(task.deadline)
      const year = d.getFullYear()
      const week = Math.ceil(
        ((+d - +new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
      )
      const key = `S${week}`
      if (!byWeek[key]) byWeek[key] = { planned: 0, completed: 0 }
      byWeek[key].planned++
      if (task.status === 'TERMINEE') byWeek[key].completed++
    })
    return Object.entries(byWeek).map(([week, data]) => ({
      week, ...data
    }))
  }

  const weeklyProgressData = groupByWeek(tasks)

  // Pie chart data
  const taskStatusData = [
    { name: 'Terminé', value: completedTasks, color: COLORS[0] },
    { name: 'En cours', value: inProgressTasks, color: COLORS[1] },
    { name: 'En attente', value: pendingTasks, color: COLORS[2] },
  ]

  // Line chart: fake trend, but you can aggregate by month and avg. performance (e.g., % completed)
  function getPerformanceTrend(tasks: Task[]) {
    const byMonth: Record<string, { total: number, completed: number }> = {}
    tasks.forEach(task => {
      const date = new Date(task.deadline)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!byMonth[key]) byMonth[key] = { total: 0, completed: 0 }
      byMonth[key].total++
      if (task.status === 'TERMINEE') byMonth[key].completed++
    })
    // Only last 6 months
    const sortedKeys = Object.keys(byMonth).sort().slice(-6)
    return sortedKeys.map(key => {
      const [year, month] = key.split('-')
      return {
        month: new Date(Number(year), Number(month)).toLocaleString('fr-FR', { month: 'short' }),
        performance: byMonth[key].total ? Math.round((byMonth[key].completed / byMonth[key].total) * 100) : 0
      }
    })
  }
  const performanceData = getPerformanceTrend(tasks)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Suivi de performance (KPI)</h2>
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-5 w-5 mr-2" />
          <span className="font-medium">Performance en hausse</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Progression hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="week" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="planned" fill="#E5E7EB" name="Planifié" />
                <Bar dataKey="completed" fill="#3B82F6" name="Terminé" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Répartition des tâches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Tendance de performance (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default KPITracker
