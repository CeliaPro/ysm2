'use client'
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
  onDelete: (id: string) => void
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSaveChanges,
  onDelete,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || '')
    }
  }, [project])

   const handleUpdate = async () => {
    if (!project) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Échec de la mise à jour')
      }

    // Map the returned Prisma object into your Project type:
     const data = body.data
     const updatedProject: Project = {
       id: data.id,
       name: data.name,
       description: data.description,
       // if you have counts/storage on the back, include them here:
       documentsCount: data.documentsCount ?? project.documentsCount,
       membersCount:   data.membersCount   ?? project.membersCount,
       storageUsed:    data.storageUsed    ?? project.storageUsed!,
       storageLimit:   data.storageLimit   ?? project.storageLimit,
       usagePercentage:data.usagePercentage?? project.usagePercentage!,
       isArchived:     data.isArchived,
       createdAt:      new Date(data.createdAt),
       lastUpdated:    new Date(data.updatedAt),  // note `updatedAt`
     }

      onSaveChanges(body.data)
     onSaveChanges(updatedProject)

      toast.success('Projet mis à jour avec succès')
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

const handleDelete = async () => {
  if (!project || !confirm('Voulez-vous vraiment supprimer ce projet ?')) return

  setIsDeleting(true)
  try {
    const res = await fetch(`/api/projects?id=${project.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    console.log('→ DELETE sent') // DEBUG

    const body = await res.json()
    if (!res.ok || !body.success) {
      throw new Error(body.message || 'Échec de la suppression')
    }

    onDelete(project.id)
    toast.success('Projet supprimé')
    onOpenChange(false)
  } catch (err: any) {
    console.error(err)
    toast.error(err.message || 'Erreur lors de la suppression')
  } finally {
    setIsDeleting(false)
  }
}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
          <DialogDescription>Mettez à jour les détails du projet.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label htmlFor="edit-project-name">Nom du projet</Label>
          <Input
            id="edit-project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entrez le nom"
          />

          <Label htmlFor="edit-project-description">Description</Label>
          <Textarea
            id="edit-project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Entrez la description"
          />
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditProjectDialog
