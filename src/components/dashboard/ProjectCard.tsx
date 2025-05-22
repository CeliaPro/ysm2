'use client'
import React, { useState } from 'react'
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
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

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
  // control Radix menu open/closed
  const [menuOpen, setMenuOpen] = useState(false)

  const createdText = `Créé ${formatDistanceToNow(project.createdAt, {
    addSuffix: true,
  })}`
  const updatedText = `Mis à jour ${formatDistanceToNow(project.lastUpdated, {
    addSuffix: true,
  })}`

  // each handler closes menu then invokes parent callback
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

  return (
    <Card className={`relative transition-shadow hover:shadow-md ${project.isArchived ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="flex items-center">
            {project.name}
            {project.isArchived && (
              <Badge variant="outline" className="ml-2">
                Archivé
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </div>

        {canManageProjects && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            {/* three-dots trigger, positioned top-right */}
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* Edit */}
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="flex w-full items-center px-2 py-1"
                  onClick={handleEdit}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Modifier
                </button>
              </DropdownMenuItem>

              {/* Archive / Unarchive */}
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="flex w-full items-center px-2 py-1"
                  onClick={handleArchive}
                >
                  <ArchiveIcon className="mr-2 h-4 w-4" />
                  {project.isArchived ? 'Désarchiver' : 'Archiver'}
                </button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  className="flex w-full items-center px-2 py-1 text-destructive"
                  onClick={handleDelete}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Supprimer
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex justify-between items-center mb-2 text-sm">
          <div className="flex items-center">
            <FileIcon className="mr-1 h-4 w-4 text-muted-foreground" />
            {project.documentsCount} documents
          </div>
          <div className="flex items-center">
            <UsersIcon className="mr-1 h-4 w-4 text-muted-foreground" />
            {project.membersCount} membres
          </div>
        </div>
        <Progress value={project.usagePercentage} />
      </CardContent>

      <CardFooter className="flex justify-between text-xs text-muted-foreground pt-3">
        <span>{createdText}</span>
        <span>{updatedText}</span>
      </CardFooter>
    </Card>
  )
}

export default ProjectCard
