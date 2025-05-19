import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import {
  FileIcon,
  ArchiveIcon,
  TrashIcon,
  EditIcon,
  DownloadIcon,
  XIcon,
  GlobeIcon,
  LockIcon,
  ServerIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Document } from '@/types/project'

interface DocumentViewerProps {
  document: Document | null
  open: boolean
  onClose: () => void
  onEdit: (document: Document) => void
  onArchive: (document: Document) => void
  onDelete: (document: Document) => void
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  open,
  onClose,
  onEdit,
  onArchive,
  onDelete,
}) => {
  if (!document) {
    return null
  }

  // Translation map for access levels
  const accessLevelTranslations = {
    public: 'Public',
    private: 'Privé',
    project: 'Projet',
  }

  const getStorageIcon = () => {
    return document.storageProvider === 's3' ? (
      <ServerIcon className="h-4 w-4 text-blue-500 mr-1" />
    ) : (
      <FileIcon className="h-4 w-4 text-gray-500 mr-1" />
    )
  }

  const getAccessLevelIcon = () => {
    switch (document.accessLevel) {
      case 'public':
        return <GlobeIcon className="h-4 w-4 mr-1 text-green-500" />
      case 'private':
        return <LockIcon className="h-4 w-4 mr-1 text-red-500" />
      case 'project':
        return <LockIcon className="h-4 w-4 mr-1 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{document.name}</DialogTitle>
          <DialogDescription>
            Importé le {format(document.uploadedAt, 'dd MMMM yyyy')} dans{' '}
            {document.projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{document.name}</p>
              <p className="text-xs text-muted-foreground">
                {document.fileType.toUpperCase()} -{' '}
                {document.fileSizeFormatted || document.fileSize.toString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-b py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {getStorageIcon()}
                <span className="text-sm capitalize">
                  {document.storageProvider}
                </span>
                {document.storageProvider === 's3' && document.s3Region && (
                  <Badge variant="outline" className="ml-2">
                    {document.s3Region}
                  </Badge>
                )}
              </div>

              <div className="flex items-center">
                {getAccessLevelIcon()}
                <span className="text-sm">
                  {accessLevelTranslations[
                    document.accessLevel as keyof typeof accessLevelTranslations
                  ] || document.accessLevel}
                </span>
              </div>
            </div>

            <div>
              {document.isArchived && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  Archivé
                </Badge>
              )}
            </div>
          </div>

          {document.description && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {document.description}
              </p>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex items-center gap-2">
                {document.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {document.storageProvider === 's3' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Détails du Stockage Cloud</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Bucket:</span>
                  <span className="ml-1">{document.s3BucketName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Clé d&#39;objet:
                  </span>
                  <span className="ml-1 truncate">{document.s3ObjectKey}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="hidden sm:block">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              onClick={() => {
                // Implement download functionality here
                console.log('Télécharger le document', document.name)
              }}
            >
              <DownloadIcon className="h-4 w-4" />
            </IconButton>
            <IconButton onClick={() => onEdit(document)}>
              <EditIcon className="h-4 w-4" />
            </IconButton>
            <IconButton onClick={() => onArchive(document)}>
              <ArchiveIcon className="h-4 w-4" />
            </IconButton>
            <IconButton
              onClick={() => onDelete(document)}
              className="text-destructive"
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
            <div className="sm:hidden">
              <Button size="sm" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewer
