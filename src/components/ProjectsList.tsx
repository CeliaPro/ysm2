'use client'
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  SearchIcon,
  FolderIcon,
  PlusIcon,
  FileIcon,
  UsersIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ArchiveIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface Project {
  id: string
  name: string
  description: string
  documentsCount: number
  membersCount: number
  storageUsed: string
  storageLimit: string
  usagePercentage: number
  createdAt: Date
  lastUpdated: Date
  isArchived?: boolean
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Finance Portal',
    description:
      'Financial documents, reports, and analysis for the finance department.',
    documentsCount: 24,
    membersCount: 8,
    storageUsed: '120 MB',
    storageLimit: '1 GB',
    usagePercentage: 12,
    createdAt: new Date(2023, 5, 15),
    lastUpdated: new Date(2023, 11, 15),
  },
  {
    id: '2',
    name: 'Product Development',
    description:
      'Roadmaps, specifications, and research for product development.',
    documentsCount: 18,
    membersCount: 12,
    storageUsed: '85 MB',
    storageLimit: '1 GB',
    usagePercentage: 8.5,
    createdAt: new Date(2023, 3, 20),
    lastUpdated: new Date(2023, 11, 10),
  },
  {
    id: '3',
    name: 'Marketing',
    description:
      'Campaign analysis, marketing materials, and performance reports.',
    documentsCount: 32,
    membersCount: 6,
    storageUsed: '167 MB',
    storageLimit: '1 GB',
    usagePercentage: 16.7,
    createdAt: new Date(2023, 2, 10),
    lastUpdated: new Date(2023, 11, 5),
  },
  {
    id: '4',
    name: 'HR Policies',
    description: 'Employee handbooks, policies, and procedures.',
    documentsCount: 12,
    membersCount: 4,
    storageUsed: '45 MB',
    storageLimit: '1 GB',
    usagePercentage: 4.5,
    createdAt: new Date(2023, 1, 5),
    lastUpdated: new Date(2023, 10, 25),
    isArchived: true,
  },
]

const ProjectsList: React.FC = () => {
  const { isAdmin, isProjectManager } = useAuth()
  const canManageProjects = isAdmin() || isProjectManager()

  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [showArchived, setShowArchived] = useState(false)

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectDescription, setEditProjectDescription] = useState('')

  const filteredProjects = projects
    .filter((project) => showArchived || !project.isArchived)
    .filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required')
      return
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription,
      documentsCount: 0,
      membersCount: 1,
      storageUsed: '0 KB',
      storageLimit: '1 GB',
      usagePercentage: 0,
      createdAt: new Date(),
      lastUpdated: new Date(),
    }

    setProjects([newProject, ...projects])
    setNewProjectName('')
    setNewProjectDescription('')
    setIsNewProjectDialogOpen(false)

    toast.success(`Project "${newProjectName}" created successfully`)
  }

  const handleEditProject = () => {
    if (!editingProject) return

    if (!editProjectName.trim()) {
      toast.error('Project name is required')
      return
    }

    const updatedProjects = projects.map((project) =>
      project.id === editingProject.id
        ? {
            ...project,
            name: editProjectName,
            description: editProjectDescription,
            lastUpdated: new Date(),
          }
        : project
    )

    setProjects(updatedProjects)
    setIsEditProjectDialogOpen(false)
    toast.success(`Project updated successfully`)
  }

  const handleArchiveProject = (project: Project) => {
    const updatedProjects = projects.map((p) =>
      p.id === project.id ? { ...p, isArchived: !p.isArchived } : p
    )

    setProjects(updatedProjects)
    toast.success(
      `Project "${project.name}" ${project.isArchived ? 'unarchived' : 'archived'} successfully`
    )
  }

  const handleDeleteProject = (project: Project) => {
    const updatedProjects = projects.filter((p) => p.id !== project.id)
    setProjects(updatedProjects)
    toast.success(`Project "${project.name}" deleted successfully`)
  }

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project)
    setEditProjectName(project.name)
    setEditProjectDescription(project.description)
    setIsEditProjectDialogOpen(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your document projects</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          {canManageProjects && (
            <Button onClick={() => setIsNewProjectDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <Badge variant="outline">
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'project' : 'projects'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="w-full py-12">
          <CardContent className="text-center">
            <FolderIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No projects match "${searchQuery}"`
                : showArchived
                  ? 'No archived projects found'
                  : 'Get started by creating your first project'}
            </p>
            {canManageProjects && !searchQuery && (
              <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
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
                          Archived
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
                        <DropdownMenuItem
                          onClick={() => openEditProjectDialog(project)}
                        >
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchiveProject(project)}
                        >
                          <ArchiveIcon className="h-4 w-4 mr-2" />
                          {project.isArchived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
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
                    <span>{project.membersCount} members</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage</span>
                    <span>
                      {project.storageUsed} / {project.storageLimit}
                    </span>
                  </div>
                  <Progress value={project.usagePercentage} />
                </div>
              </CardContent>

              <CardFooter className="pt-3 flex justify-between text-xs text-muted-foreground">
                <span>
                  Created{' '}
                  {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                </span>
                <span>
                  Updated{' '}
                  {formatDistanceToNow(project.lastUpdated, {
                    addSuffix: true,
                  })}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Enter project description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Project Name</Label>
              <Input
                id="edit-project-name"
                placeholder="Enter project name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea
                id="edit-project-description"
                placeholder="Enter project description"
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProjectsList
