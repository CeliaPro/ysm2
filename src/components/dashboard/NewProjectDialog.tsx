import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Project } from '@/types/project'

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (project: Project) => void
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  open,
  onOpenChange,
  onCreateProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Le nom du projet est requis')
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

    onCreateProject(newProject)
    setNewProjectName('')
    setNewProjectDescription('')
    onOpenChange(false)

    toast.success(`Projet "${newProjectName}" créé avec succès`)
  }

  const handleClose = () => {
    setNewProjectName('')
    setNewProjectDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un Nouveau Projet</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau projet pour organiser vos documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nom du Projet</Label>
            <Input
              id="project-name"
              placeholder="Entrez le nom du projet"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Entrez la description du projet"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleCreateProject}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewProjectDialog
