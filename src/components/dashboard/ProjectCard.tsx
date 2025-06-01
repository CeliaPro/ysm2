'use client'
import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/aiUi/badge'
import { Progress } from '@/components/ui/progress'
import { Project } from '@/types/project'
import { formatDistanceToNow } from 'date-fns'
import {
  FileIcon,
  UsersIcon,
  MoreHorizontalIcon,
  EditIcon,
  ArchiveIcon,
  TrashIcon,
  EyeIcon,
  Edit,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ProjectCardProps {
  project: Project & {
    documentsCount?: number
    tasksCount?: number
    membersCount?: number
    archived?: boolean
    isArchived?: boolean
    updatedAt?: string | Date
    lastUpdated?: string | Date
    usagePercentage?: number
  }
  canManageProjects: boolean
  onEditProject: (project: Project) => void
  onArchiveProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onViewProject?: (project: Project) => void
}

const statusColors: Record<string, string> = {
  actif: 'bg-green-100 text-green-800',
  'en-attente': 'bg-yellow-100 text-yellow-800',
  terminé: 'bg-blue-100 text-blue-800',
  ACTIF: 'bg-green-100 text-green-800',
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  TERMINE: 'bg-blue-100 text-blue-800',
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  canManageProjects,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onViewProject,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const status = (project.status || '').toLowerCase()

  const documentsCount = typeof project.documentsCount === 'number' ? project.documentsCount : 0
  const tasksCount = typeof project.tasksCount === 'number' ? project.tasksCount : 0
  const membersCount = typeof project.membersCount === 'number' ? project.membersCount : 0

  const isArchived = project.archived ?? project.isArchived ?? false

  // ---- Fix for possible Date or string types
  const createdText = project.createdAt
    ? `Créé ${formatDistanceToNow(new Date(
        typeof project.createdAt === 'string'
          ? project.createdAt
          : project.createdAt.toISOString()
      ), { addSuffix: true })}`
    : ''

  const updatedText = (project.updatedAt || project.lastUpdated)
    ? `Mis à jour ${formatDistanceToNow(new Date(
        typeof (project.updatedAt || project.lastUpdated) === 'string'
          ? (project.updatedAt || project.lastUpdated)!
          : (project.updatedAt || project.lastUpdated)!
      ), { addSuffix: true })}`
    : ''

  const handleEdit = () => {
    setMenuOpen(false)
    onEditProject(project)
  }
  const handleArchive = () => {
    setMenuOpen(false)
    onArchiveProject(project)
  }
  const handleDelete = () => {
    setMenuOpen(false)
    onDeleteProject(project)
  }
  const handleView = () => {
    if (onViewProject) onViewProject(project)
  }

  return (
    <Card className={`relative transition-shadow hover:shadow-md ${isArchived ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            {project.name}
            {isArchived && (
              <Badge variant="outline" className="ml-2">
                Archivé
              </Badge>
            )}
            {project.status && (
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${statusColors[status] || statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1).toLowerCase()}
              </span>
            )}
          </CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </div>
        {canManageProjects && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <button type="button" className="flex w-full items-center px-2 py-1" onClick={handleEdit}>
                  <EditIcon className="mr-2 h-4 w-4" />
                  Modifier
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button type="button" className="flex w-full items-center px-2 py-1" onClick={handleArchive}>
                  <ArchiveIcon className="mr-2 h-4 w-4" />
                  {isArchived ? 'Désarchiver' : 'Archiver'}
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button type="button" className="flex w-full items-center px-2 py-1 text-destructive" onClick={handleDelete}>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center">
            <FileIcon className="mr-1 h-4 w-4 text-muted-foreground" />
            {documentsCount === 0
              ? "Aucun document"
              : documentsCount === 1
                ? "1 document"
                : `${documentsCount} documents`}
          </div>
          <div className="flex items-center">
            <Edit className="mr-1 h-4 w-4 text-muted-foreground" />
            {tasksCount === 0
              ? "Aucune tâche"
              : tasksCount === 1
                ? "1 tâche"
                : `${tasksCount} tâches`}
          </div>
          <div className="flex items-center">
            <UsersIcon className="mr-1 h-4 w-4 text-muted-foreground" />
            {membersCount === 0
              ? "Aucun membre"
              : membersCount === 1
                ? "1 membre"
                : `${membersCount} membres`}
          </div>
        </div>
        <Progress value={project.usagePercentage ?? 0} />
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-3">
        <Button
          variant="default"
          className="w-full flex gap-2 items-center font-semibold"
          onClick={handleView}
        >
          <EyeIcon className="h-4 w-4" />
          Voir le projet
        </Button>
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <span>{createdText}</span>
          <span>{updatedText}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ProjectCard
