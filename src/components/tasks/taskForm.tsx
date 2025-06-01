import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Task, TaskStatus, TaskSeverity } from "@/types/project"

// Add a multi-select if you want dependencies
interface TaskFormProps {
  task?: Task | null
  onSubmit: (task: Omit<Task, "id" | "createdAt" | "projectId" | "dependencies" | "dependedBy"> & { dependencies?: string[] }) => void
  onCancel: () => void
  members: { id: string; name: string; email: string }[]
  allTasks: { id: string; title: string }[] // for dependencies dropdown
  loading?: boolean
}

const statusOptions: { value: TaskStatus, label: string }[] = [
  { value: "A_FAIRE", label: "À faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminée" }
]

const severityOptions: { value: TaskSeverity, label: string }[] = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "HAUTE", label: "Haute" },
  { value: "CRITIQUE", label: "Critique" }
]

// Add startDate, endDate, and dependencies
type TaskFormState = {
  title: string
  description: string
  assignee: string
  severity: TaskSeverity
  status: TaskStatus
  deadline: string
  startDate: string
  endDate: string
  dependencies: string[] // array of task IDs
}

const TaskForm = ({ task, onSubmit, onCancel, members, allTasks, loading }: TaskFormProps) => {
  const [formData, setFormData] = useState<TaskFormState>({
    title: task?.title || "",
    description: task?.description || "",
    assignee: task?.assignee || "",
    severity: (task?.severity || "MOYENNE") as TaskSeverity,
    status: (task?.status || "A_FAIRE") as TaskStatus,
    deadline: task?.deadline ? (typeof task.deadline === "string" ? task.deadline : task.deadline.toISOString().slice(0,10)) : "",
    startDate: task?.startDate ? (typeof task.startDate === "string" ? task.startDate : (task.startDate as Date).toISOString().slice(0,10)) : "",
    endDate: task?.endDate ? (typeof task.endDate === "string" ? task.endDate : (task.endDate as Date).toISOString().slice(0,10)) : "",
    dependencies: task?.dependencies?.map(dep => dep.id) || []
  })

  // For multi-select dependencies (simple version: checkboxes)
  const handleDependencyChange = (taskId: string, checked: boolean) => {
    setFormData(fd => ({
      ...fd,
      dependencies: checked
        ? [...fd.dependencies, taskId]
        : fd.dependencies.filter(id => id !== taskId)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      formData.title.trim() &&
      formData.assignee &&
      formData.deadline &&
      formData.startDate &&
      formData.endDate
    ) {
      onSubmit({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        deadline: new Date(formData.deadline),
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{task ? "Modifier la tâche" : "Créer une nouvelle tâche"}</CardTitle>
          <CardDescription>
            {task ? "Mettre à jour la tâche" : "Ajoutez une nouvelle tâche à ce projet"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la tâche</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Entrez le titre de la tâche"
                required
                disabled={!!task}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez la tâche"
                rows={3}
                disabled={!!task}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Assigné à</Label>
                <Select
                  value={formData.assignee}
                  onValueChange={value => setFormData({ ...formData, assignee: value })}
                  required
                  disabled={!!task}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Date limite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  disabled={!!task}
                />
              </div>
            </div>

            {/* Start and End Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  disabled={!!task}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={!!task}
                />
              </div>
            </div>

            {/* Dependencies (checkboxes for multi-select) */}
            <div className="space-y-2">
              <Label>Dépend de :</Label>
              <div className="flex flex-wrap gap-3">
                {allTasks
                  .filter(t => !task || t.id !== task.id) // avoid self-dependency
                  .map(otherTask => (
                  <label key={otherTask.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.dependencies.includes(otherTask.id)}
                      onChange={e => handleDependencyChange(otherTask.id, e.target.checked)}
                      disabled={!!task}
                    />
                    <span>{otherTask.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Sévérité</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: TaskSeverity) => setFormData({ ...formData, severity: value })}
                  required
                  disabled={!!task}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {task ? "Mettre à jour" : "Créer la tâche"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskForm
