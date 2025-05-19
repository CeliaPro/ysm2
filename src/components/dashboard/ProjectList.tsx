import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FolderIcon, PlusIcon } from 'lucide-react'
import { Project } from '@/types/project'
import ProjectCard from './ProjectCard'

interface ProjectListProps {
  projects: Project[]
  searchQuery: string
  showArchived: boolean
  canManageProjects: boolean
  onNewProject: () => void
  onEditProject: (project: Project) => void
  onArchiveProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  searchQuery,
  showArchived,
  canManageProjects,
  onNewProject,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
}) => {
  if (projects.length === 0) {
    return (
      <Card className="w-full py-12">
        <CardContent className="text-center">
          <FolderIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucun projet trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `Aucun projet ne correspond à "${searchQuery}"`
              : showArchived
                ? 'Aucun projet archivé trouvé'
                : 'Commencez par créer votre premier projet'}
          </p>
          {canManageProjects && !searchQuery && (
            <Button onClick={onNewProject}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Créer un Projet
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          canManageProjects={canManageProjects}
          onEditProject={onEditProject}
          onArchiveProject={onArchiveProject}
          onDeleteProject={onDeleteProject}
        />
      ))}
    </div>
  )
}

export default ProjectList
