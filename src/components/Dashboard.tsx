'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/aiUi/badge'
import { SearchIcon, PlusIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProjectList from '@/components/dashboard/ProjectList'
import NewProjectDialog from '@/components/dashboard/NewProjectDialog'
import EditProjectDialog from '@/components/dashboard/EditProjectDialog'
import { Project } from '@/types/project'
import { mockProjects } from '@/data/mockProjects'
import { toast } from 'sonner'

const Dashboard: React.FC = () => {
  const { isAdmin, isProjectManager } = useAuth()
  const canManageProjects = isAdmin() || isProjectManager()

  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/projects', { credentials: 'include' })
    const json = await res.json()

    const apiProjects: Project[] = json.map((prj: any) => ({
      id: prj.id,
      name: prj.name,
      description: prj.description,
      documentsCount: prj.documentsCount ?? 0,
      membersCount: prj.membersCount ?? 0,
      storageUsed: prj.storageUsed ?? '',
      storageLimit: prj.storageLimit ?? '',
      usagePercentage: prj.usagePercentage ?? 0,
      isArchived: prj.isArchived ?? false,

      // ✏️ Use prj.createdAt and prj.updatedAt here:
      createdAt: new Date(prj.createdAt),
      lastUpdated: new Date(prj.updatedAt),
    }))

    setProjects(apiProjects)
  } catch (err) {
    console.error(err)
    toast.error('Échec du chargement des projets')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchProjects()
  }, [])

  const onCreateProject = (project: Project) => {
    fetch('/api/projects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        description: project.description,
      }),
    }).then(() => fetchProjects())
  }

  // NEW / EDIT dialog state (unchanged)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const filteredProjects = projects
    .filter((p) => showArchived || !p.isArchived)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // ARCHIVE / UNARCHIVE via API
  const handleArchiveProject = async (project: Project) => {
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !project.isArchived }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Échec de l’archivage')
      }
      // merge updated project back into state
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? body.data : p))
      )
      toast.success(
        `Projet "${project.name}" ${
          project.isArchived ? 'désarchivé' : 'archivé'
        } avec succès`
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de l’archivage')
    }
  }

  // DELETE via API
  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Supprimer "${project.name}" ?`)) return
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Échec de la suppression')
      }
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.success(`Projet "${project.name}" supprimé avec succès`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la suppression')
    }
  }

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project)
    setIsEditProjectDialogOpen(true)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="animate-fade-in">
      {/* Header */}
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

      {/* Badge & toggle */}
      <div className="flex justify-between items-center mb-4">
        <Badge variant="outline">
          {filteredProjects.length}{' '}
          {filteredProjects.length === 1 ? 'projet' : 'projets'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? 'Masquer les archivés' : 'Afficher les archivés'}
        </Button>
      </div>

      {/* Project list */}
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

      {/* New / Edit Dialogs */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onCreateProject={onCreateProject}
      />
      <EditProjectDialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
        project={editingProject}
        onSaveChanges={(updated) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          )
          setIsEditProjectDialogOpen(false)
        }}
        onDelete={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id))
          setIsEditProjectDialogOpen(false)
        }}
      />
    </div>
  )
}

export default Dashboard
