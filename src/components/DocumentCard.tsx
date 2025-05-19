import React from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileIcon,
  EditIcon,
  ArchiveIcon,
  TrashIcon,
  StarIcon,
  EyeIcon,
  LockIcon,
  GlobeIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { Document } from '@/types/project'
import { Badge } from '@/components/ui/badge'

interface DocumentCardProps {
  document: Document
  onView: (document: Document) => void
  onEdit: (document: Document) => void
  onArchive: (document: Document) => void
  onDelete: (document: Document) => void
  onToggleStar: (document: Document) => void
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onToggleStar,
}) => {
  const fileTypeIcon = () => {
    switch (document.fileType) {
      case 'pdf':
        return <FileIcon className="h-4 w-4 mr-1 text-red-500" />
      case 'docx':
        return <FileIcon className="h-4 w-4 mr-1 text-blue-500" />
      case 'xlsx':
        return <FileIcon className="h-4 w-4 mr-1 text-green-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileIcon className="h-4 w-4 mr-1 text-yellow-500" />
      default:
        return <FileIcon className="h-4 w-4 mr-1 text-gray-500" />
    }
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

  // Translation map for access levels
  const accessLevelTranslations = {
    public: 'Public',
    private: 'Privé',
    project: 'Projet',
  }

  // Safely format file size for display, handle undefined or null values
  const fileSizeFormatted =
    document.fileSizeFormatted ||
    (typeof document.fileSize === 'number' ? document.fileSize.toString() : '0')

  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-tight">
          {document.name}
        </CardTitle>
        <div className="space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(document)}
          >
            <StarIcon
              className={`h-4 w-4 ${document.isStarred ? 'text-yellow-500' : 'text-muted-foreground'}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 py-2 text-sm">
        <div className="flex items-center">
          {fileTypeIcon()}
          <span>Fichier {document.fileType.toUpperCase()}</span>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">Taille:</span>
          <span className="ml-1">{fileSizeFormatted}</span>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">Projet:</span>
          <span className="ml-1">{document.projectName || 'Inconnu'}</span>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">Stockage:</span>
          <div className="flex items-center ml-1">
            <Badge variant="outline" className="text-xs">
              {document.storageProvider.toUpperCase()}
            </Badge>
            {document.storageProvider === 's3' && document.s3Region && (
              <Badge variant="outline" className="text-xs ml-1">
                {document.s3Region}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">Accès:</span>
          <div className="flex items-center ml-1">
            {getAccessLevelIcon()}
            <span>
              {accessLevelTranslations[
                document.accessLevel as keyof typeof accessLevelTranslations
              ] || document.accessLevel}
            </span>
          </div>
        </div>
        {document.description && (
          <div>
            <span className="text-muted-foreground">Description:</span>
            <CardDescription className="mt-1">
              {document.description}
            </CardDescription>
          </div>
        )}
        {document.tags && document.tags.length > 0 && (
          <div>
            <span className="text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center py-2">
        <span className="text-xs text-muted-foreground">
          Importé le {format(document.uploadedAt, 'dd MMM yyyy')}
        </span>
        <div className="space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onView(document)}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(document)}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onArchive(document)}
            className={document.isArchived ? 'text-green-500' : 'text-red-500'}
          >
            <ArchiveIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(document)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default DocumentCard
