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
} from 'lucide-react'
import { format } from 'date-fns'
import { Document } from '@/types/project'
import { Badge } from '@/components/ui/aiUi/badge'

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

  const fileSizeFormatted =
    document.fileSizeFormatted ||
    (typeof document.fileSize === 'number' ? document.fileSize.toString() : '0')

  return (
    <Card className="bg-card text-card-foreground shadow-sm relative">
      {/* Star and Archive badges */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {document.isStarred && (
          <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">★</Badge>
        )}
        {document.isArchived && (
          <Badge variant="outline" className="bg-slate-200 text-slate-700">Archived</Badge>
        )}
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-tight">
          {document.name}
        </CardTitle>
        <div className="space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(document)}
            title={document.isStarred ? "Unstar" : "Star"}
          >
            <StarIcon
              className={`h-4 w-4 ${document.isStarred ? 'text-yellow-500' : 'text-muted-foreground'}`}
              fill={document.isStarred ? "#FFD600" : "none"}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 py-2 text-sm">
        <div className="flex items-center">
          {fileTypeIcon()}
          <span>
            Fichier {document.fileType?.toUpperCase() ?? ''}
          </span>
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
          <span className="text-muted-foreground">Par:</span>
          <span className="ml-1 font-semibold">{document.uploadedBy || '-'}</span>
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
          Importé le{' '}
          {document.uploadedAt && !isNaN(new Date(document.uploadedAt as any).getTime())
            ? format(new Date(document.uploadedAt as any), 'dd MMM yyyy')
            : 'Unknown'}
        </span>
        <div className="space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onView(document)}
            title="View"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(document)}
            title="Edit"
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onArchive(document)}
            className={document.isArchived ? 'text-green-500' : 'text-red-500'}
            title={document.isArchived ? "Unarchive" : "Archive"}
          >
            <ArchiveIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(document)}
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default DocumentCard
