import React, { useState, useEffect } from 'react'
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

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onSaveChanges: (project: Project) => void
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSaveChanges,
}) => {
  const [editProjectName, setEditProjectName] = useState('')
  const [editProjectDescription, setEditProjectDescription] = useState('')

  useEffect(() => {
    if (project) {
      setEditProjectName(project.name)
      setEditProjectDescription(project.description || '')
    }
  }, [project])

  const handleEditProject = () => {
    if (!project) return

    if (!editProjectName.trim()) {
      toast.error('Le nom du projet est requis')
      return
    }

    const updatedProject: Project = {
      ...project,
      name: editProjectName,
      description: editProjectDescription,
      lastUpdated: new Date(),
    }

    onSaveChanges(updatedProject)
    onOpenChange(false)
    toast.success(`Projet mis à jour avec succès`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le Projet</DialogTitle>
          <DialogDescription>
            Mettez à jour les détails de votre projet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-name">Nom du Projet</Label>
            <Input
              id="edit-project-name"
              placeholder="Entrez le nom du projet"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea
              id="edit-project-description"
              placeholder="Entrez la description du projet"
              value={editProjectDescription}
              onChange={(e) => setEditProjectDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleEditProject}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditProjectDialog
