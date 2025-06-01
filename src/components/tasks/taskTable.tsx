'use client'
import React, { useState, useMemo } from "react"
import { Edit, Trash2, Calendar, User, AlertCircle, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/aiUi/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Task, TaskStatus, TaskSeverity } from "@/types/project"

// Enums mapping for display in French
const statusLabels: Record<TaskStatus, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
}

const severityLabels: Record<TaskSeverity, string> = {
  FAIBLE: "Faible",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
}

const getSeverityColor = (severity: TaskSeverity) => {
  switch (severity) {
    case "FAIBLE": return "bg-gray-100 text-gray-800"
    case "MOYENNE": return "bg-blue-100 text-blue-800"
    case "HAUTE": return "bg-orange-100 text-orange-800"
    case "CRITIQUE": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "A_FAIRE": return "bg-gray-100 text-gray-800"
    case "EN_COURS": return "bg-yellow-100 text-yellow-800"
    case "TERMINEE": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const isOverdue = (deadline: Date | string | null | undefined) => {
  if (!deadline) return false
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline
  const now = new Date()
  return deadlineDate < now && deadlineDate.toDateString() !== now.toDateString()
}

interface TaskTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const TaskTable = ({ tasks, onEdit, onDelete }: TaskTableProps) => {
  const [search, setSearch] = useState("")

  // Filter tasks using search text
  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks
    const lower = search.trim().toLowerCase()
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lower) ||
      (task.description && task.description.toLowerCase().includes(lower)) ||
      (task.assignee && task.assignee.toLowerCase().includes(lower))
    )
  }, [tasks, search])

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
        <p className="text-gray-600">Commencez par ajouter votre première tâche à ce projet</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 p-3">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Rechercher une tâche…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tâche</TableHead>
            <TableHead>Assigné à</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Sévérité</TableHead>
            <TableHead>Date limite</TableHead>
            <TableHead>Dépend de</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                Aucune tâche trouvée.
              </TableCell>
            </TableRow>
          ) : (
            filteredTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600">{task.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {task.assignee}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(task.status)}>
                    {statusLabels[task.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(task.severity)}>
                    {severityLabels[task.severity]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center gap-2 ${isOverdue(task.deadline) ? "text-red-600" : ""}`}>
                    <Calendar className="w-4 h-4" />
                    {task.deadline
                      ? (typeof task.deadline === "string"
                        ? new Date(task.deadline).toLocaleDateString()
                        : (task.deadline as Date).toLocaleDateString())
                      : "-"}
                    {isOverdue(task.deadline) && (
                      <Badge className="bg-red-100 text-red-800 text-xs">En retard</Badge>
                    )}
                  </div>
                </TableCell>
                {/* Dependencies cell */}
                <TableCell>
                  {(Array.isArray(task.dependencies) && task.dependencies.length > 0) ? (
                    <div className="flex flex-wrap gap-1 items-center">
                      {task.dependencies.map((dep: any) => (
                        <Badge key={dep.id} className="bg-gray-200 text-gray-700 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> {dep.title || dep.id}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(task)}
                      aria-label="Modifier la tâche"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(task.id)}
                      className="text-red-600 hover:text-red-700"
                      aria-label="Supprimer la tâche"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default TaskTable
