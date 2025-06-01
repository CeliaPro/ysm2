'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Calendar, Clock, Users, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Task } from '@/types/project'

function getMonths(startDate: Date, endDate: Date) {
  const months = []
  const cur = new Date(startDate)
  cur.setDate(1)
  while (cur <= endDate) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

function getDaysInRange(start: Date, end: Date) {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function getTaskPosition(taskStart: Date, projectStart: Date) {
  const days = getDaysInRange(projectStart, taskStart)
  return Math.max(0, days * 8)
}

function getTaskWidth(taskStart: Date, taskEnd: Date) {
  const days = getDaysInRange(taskStart, taskEnd)
  return days * 8
}

function getProgressWidth(taskStart: Date, taskEnd: Date, progress: number) {
  const totalWidth = getTaskWidth(taskStart, taskEnd)
  return (totalWidth * progress) / 100
}

function getProgress(task: Task) {
  switch (task.status) {
    case 'TERMINEE': return 100
    case 'EN_COURS': return 50
    case 'A_FAIRE':
    default:
      return 0
  }
}

interface GanttChartProps {
  tasks: Task[]
  projectStartDate?: string | null
  projectEndDate?: string | null
  projectName?: string
}

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  projectStartDate,
  projectEndDate,
  projectName = 'Projet',
}) => {
  const validTasks = tasks.filter(t => t.startDate && (t.endDate || t.deadline))
  const taskDates = validTasks.map(t => ({
    start: new Date(t.startDate!),
    end: t.endDate ? new Date(t.endDate) : new Date(t.deadline!),
  }))

  const minStart = projectStartDate
    ? new Date(projectStartDate)
    : taskDates.length
      ? new Date(Math.min(...taskDates.map(t => t.start.getTime())))
      : new Date()
  const maxEnd = projectEndDate
    ? new Date(projectEndDate)
    : taskDates.length
      ? new Date(Math.max(...taskDates.map(t => t.end.getTime())))
      : new Date()

  const months = getMonths(minStart, maxEnd)

  // Tooltip state
  const [tooltipTaskId, setTooltipTaskId] = useState<string | null>(null)

  function formatDuration(start: Date, end: Date) {
    const days = getDaysInRange(start, end)
    if (days < 2) return `${days} jour`
    return `${days} jours`
  }

  // Excel export handler
  function exportToExcel() {
    const rows = validTasks.map((task) => {
      const start = new Date(task.startDate!)
      const end = task.endDate ? new Date(task.endDate) : new Date(task.deadline!)
      const progress = getProgress(task)
      let dependsOn = ''
      if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
        dependsOn = task.dependencies
          .map(dep => typeof dep === 'string' ? dep : dep.title || dep.id)
          .join(', ')
      }
      return {
        "Titre de tâche": task.title,
        "Assigné à": task.assignee,
        "Date début": start.toLocaleDateString(),
        "Date fin": end.toLocaleDateString(),
        "Durée (jours)": getDaysInRange(start, end),
        "Progression (%)": progress,
        "Statut": task.status,
        "Dépend de": dependsOn,
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "GanttProject")
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' })
    saveAs(fileData, `gantt graph du projet ${projectName}.xlsx`)
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Diagramme de Gantt
          </CardTitle>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exporter en Excel
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b mb-4">
              <div className="w-64 p-2 font-semibold text-gray-700">Tâches</div>
              <div className="flex-1 flex">
                {months.map((month, index) => (
                  <div
                    key={index}
                    className="flex-1 p-2 text-center border-l font-semibold text-gray-700"
                  >
                    {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>
            {/* Tasks */}
            <div className="space-y-3 relative">
              {validTasks.map((task) => {
                const start = new Date(task.startDate!)
                const end = task.endDate ? new Date(task.endDate) : new Date(task.deadline!)
                const progress = getProgress(task)
                const barLeft = getTaskPosition(start, minStart)
                const barWidth = getTaskWidth(start, end)
                const progressWidth = getProgressWidth(start, end, progress)

                return (
                  <div key={task.id} className="flex items-center relative z-10">
                    <div className="w-64 p-2">
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {task.assignee}
                      </div>
                    </div>
                    <div className="flex-1 relative h-8 border-l">
                      {/* Timeline grid */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {months.map((_, index) => (
                          <div key={index} className="flex-1 border-l border-gray-200"></div>
                        ))}
                      </div>
                      {/* Task bar */}
                      <div
                        className="absolute top-1 h-6 bg-blue-200 rounded border border-blue-300 cursor-pointer z-20"
                        style={{
                          left: `${barLeft}px`,
                          width: `${barWidth}px`,
                        }}
                        onMouseEnter={() => setTooltipTaskId(task.id)}
                        onMouseLeave={() => setTooltipTaskId(null)}
                      >
                        {/* Progress bar */}
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${progressWidth}px`,
                          }}
                        ></div>
                        {/* Progress text */}
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {progress}%
                        </div>
                        {/* Tooltip */}
                        {tooltipTaskId === task.id && (
                          <div
                            className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 bg-white shadow-lg rounded-lg p-2 text-xs text-gray-900 border min-w-[210px]"
                          >
                            <div className="font-bold mb-1">{task.title}</div>
                            <div><span className="font-medium">Début :</span> {start.toLocaleDateString()}</div>
                            <div><span className="font-medium">Fin :</span> {end.toLocaleDateString()}</div>
                            <div><span className="font-medium">Durée :</span> {formatDuration(start, end)}</div>
                            <div><span className="font-medium">Progression :</span> {progress}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="mt-4 flex items-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
            <span>Planifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Complété</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {minStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              {' — '}
              {maxEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default GanttChart
