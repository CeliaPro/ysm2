import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Project } from '@/types/project'
import { formatDistanceToNow } from 'date-fns'
import {
  FileIcon,
  UsersIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ArchiveIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ProjectCardProps {
  project: Project
  canManageProjects: boolean
  onEditProject: (project: Project) => void
  onArchiveProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  canManageProjects,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
}) => {
  const handleArchive = () => {
    onArchiveProject(project)
    toast.success(
      `Projet "${project.name}" ${project.isArchived ? 'désarchivé' : 'archivé'} avec succès`
    )
  }

  const handleDelete = () => {
    onDeleteProject(project)
    toast.success(`Projet "${project.name}" supprimé avec succès`)
  }

  // French-localized date formatting for display
  const formatCreatedDate = () => {
    return `Créé ${formatDistanceToNow(project.createdAt, { addSuffix: true })}`
  }

  const formatUpdatedDate = () => {
    return `Mis à jour ${formatDistanceToNow(project.lastUpdated, { addSuffix: true })}`
  }

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-md ${project.isArchived ? 'opacity-70' : 'opacity-100'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center">
              {project.name}
              {project.isArchived && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  Archivé
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="max-w-[280px]">
              {project.description}
            </CardDescription>
          </div>

          {canManageProjects && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditProject(project)}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <ArchiveIcon className="h-4 w-4 mr-2" />
                  {project.isArchived ? 'Désarchiver' : 'Archiver'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex justify-between items-center mb-2 text-sm">
          <div className="flex items-center">
            <FileIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.documentsCount} documents</span>
          </div>
          <div className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.membersCount} membres</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stockage</span>
            <span>
              {project.storageUsed} / {project.storageLimit}
            </span>
          </div>
          <Progress value={project.usagePercentage} />
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex justify-between text-xs text-muted-foreground">
        <span>{formatCreatedDate()}</span>
        <span>{formatUpdatedDate()}</span>
      </CardFooter>
    </Card>
  )
}

export default ProjectCard
