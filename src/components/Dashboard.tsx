'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SearchIcon, PlusIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProjectList from '@/components/dashboard/ProjectList'
import NewProjectDialog from '@/components/dashboard/NewProjectDialog'
import EditProjectDialog from '@/components/dashboard/EditProjectDialog'
import { Project } from '@/types/project'

// Mock data moved to a separate file
import { mockProjects } from '@/data/mockProjects'

const Dashboard: React.FC = () => {
  const { isAdmin, isProjectManager } = useAuth()
  const canManageProjects = isAdmin() || isProjectManager()

  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [showArchived, setShowArchived] = useState(false)

  // New project dialog
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)

  // Edit project dialog
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const filteredProjects = projects
    .filter((project) => showArchived || !project.isArchived)
    .filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const handleArchiveProject = (project: Project) => {
    const updatedProjects = projects.map((p) =>
      p.id === project.id ? { ...p, isArchived: !p.isArchived } : p
    )

    setProjects(updatedProjects)
  }

  const handleDeleteProject = (project: Project) => {
    const updatedProjects = projects.filter((p) => p.id !== project.id)
    setProjects(updatedProjects)
  }

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project)
    setIsEditProjectDialogOpen(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-bold">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets de documents
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des projets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {canManageProjects && (
            <Button onClick={() => setIsNewProjectDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <Badge variant="outline">
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'projet' : 'projets'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? 'Masquer les archivés' : 'Afficher les archivés'}
        </Button>
      </div>

      <ProjectList
        projects={filteredProjects}
        searchQuery={searchQuery}
        showArchived={showArchived}
        canManageProjects={canManageProjects}
        onNewProject={() => setIsNewProjectDialogOpen(true)}
        onEditProject={openEditProjectDialog}
        onArchiveProject={handleArchiveProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* New Project Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onCreateProject={(newProject) => setProjects([newProject, ...projects])}
      />

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
        project={editingProject}
        onSaveChanges={(updatedProject) => {
          const updatedProjects = projects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          )
          setProjects(updatedProjects)
        }}
      />
    </div>
  )
}

export default Dashboard
