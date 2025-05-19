'use client'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import DocumentCard from '@/components/DocumentCard'
import { Document } from '@/types/project'
import DocumentViewer from '@/components/DocumentViewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SearchIcon,
  PlusIcon,
  FilterIcon,
  StarIcon,
  ArchiveIcon,
  CheckIcon,
  XIcon,
  FileIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FloatingChat from '@/components/FloatingChat'

// Mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Q4 Financial Report.pdf',
    fileType: 'pdf',
    fileSize: 2400000,
    fileSizeFormatted: '2.4 MB',
    projectId: '1',
    projectName: 'Finance Portal',
    uploadedBy: '2',
    uploadedAt: new Date(2023, 11, 15),
    updatedAt: new Date(2023, 11, 15),
    tags: ['financial', 'quarterly'],
    description: 'Financial report for Q4 2023',
    isArchived: false,
    storageProvider: 'local',
    s3BucketName: null,
    s3ObjectKey: null,
    s3Region: null,
    contentType: 'application/pdf',
    publicUrl: null,
    accessLevel: 'project',
    filePath: '/documents/financial-report-q4.pdf',
  },
  {
    id: '2',
    name: 'Product Roadmap 2024.docx',
    fileType: 'docx',
    fileSize: 1800000,
    fileSizeFormatted: '1.8 MB',
    projectId: '2',
    projectName: 'Product Development',
    uploadedBy: '3',
    uploadedAt: new Date(2023, 11, 10),
    updatedAt: new Date(2023, 11, 10),
    tags: ['roadmap', 'planning'],
    description: 'Product development roadmap for 2024',
    isArchived: false,
    storageProvider: 'local',
    s3BucketName: null,
    s3ObjectKey: null,
    s3Region: null,
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    publicUrl: null,
    accessLevel: 'project',
    filePath: '/documents/roadmap-2024.docx',
  },
  {
    id: '3',
    name: 'Marketing Campaign Analysis.xlsx',
    fileType: 'xlsx',
    fileSize: 3200000,
    fileSizeFormatted: '3.2 MB',
    projectId: '3',
    projectName: 'Marketing',
    uploadedBy: '1',
    uploadedAt: new Date(2023, 11, 5),
    updatedAt: new Date(2023, 11, 5),
    tags: ['marketing', 'analysis'],
    isStarred: true,
    description: 'Analysis of Q4 marketing campaign results',
    isArchived: false,
    storageProvider: 'local',
    s3BucketName: null,
    s3ObjectKey: null,
    s3Region: null,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    publicUrl: null,
    accessLevel: 'project',
    filePath: '/documents/marketing-analysis.xlsx',
  },
  {
    id: '4',
    name: 'Employee Handbook.pdf',
    fileType: 'pdf',
    fileSize: 5700000,
    fileSizeFormatted: '5.7 MB',
    projectId: '4',
    projectName: 'HR Policies',
    uploadedBy: '2',
    uploadedAt: new Date(2023, 10, 20),
    updatedAt: new Date(2023, 10, 20),
    tags: ['hr', 'policies'],
    isArchived: true,
    description: 'Updated employee handbook for 2024',
    storageProvider: 'local',
    s3BucketName: null,
    s3ObjectKey: null,
    s3Region: null,
    contentType: 'application/pdf',
    publicUrl: null,
    accessLevel: 'project',
    filePath: '/documents/employee-handbook.pdf',
  },
  {
    id: '5',
    name: 'Logo Design Finals.png',
    fileType: 'png',
    fileSize: 12800000,
    fileSizeFormatted: '12.8 MB',
    projectId: '3',
    projectName: 'Marketing',
    uploadedBy: '3',
    uploadedAt: new Date(2023, 11, 2),
    updatedAt: new Date(2023, 11, 2),
    tags: ['design', 'branding'],
    isStarred: true,
    description: 'Final logo designs for the new brand identity',
    isArchived: false,
    storageProvider: 's3',
    s3BucketName: 'company-assets',
    s3ObjectKey: 'logos/final-2023.png',
    s3Region: 'us-west-2',
    contentType: 'image/png',
    publicUrl:
      'https://company-assets.s3.us-west-2.amazonaws.com/logos/final-2023.png',
    accessLevel: 'public',
    filePath: '/documents/logo-finals.png',
  },
  {
    id: '6',
    name: 'Project Timeline.xlsx',
    fileType: 'xlsx',
    fileSize: 1200000,
    fileSizeFormatted: '1.2 MB',
    projectId: '2',
    projectName: 'Product Development',
    uploadedBy: '2',
    uploadedAt: new Date(2023, 11, 8),
    updatedAt: new Date(2023, 11, 8),
    tags: ['planning', 'timeline'],
    description: 'Product development timeline for Q1 2024',
    isArchived: false,
    storageProvider: 'local',
    s3BucketName: null,
    s3ObjectKey: null,
    s3Region: null,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    publicUrl: null,
    accessLevel: 'project',
    filePath: '/documents/project-timeline.xlsx',
  },
]

// Mock projects for selection
const mockProjects = [
  { id: '1', name: 'Finance Portal' },
  { id: '2', name: 'Product Development' },
  { id: '3', name: 'Marketing' },
  { id: '4', name: 'HR Policies' },
]

export default function DocumentsPage() {
  const { isLoading, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [activeProject, setActiveProject] = useState<string>('all')

  // Document viewer
  const [viewedDocument, setViewedDocument] = useState<Document | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)

  // Upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadProject, setUploadProject] = useState<string>('')
  const [uploadTags, setUploadTags] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Edit document dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProject, setEditProject] = useState<string>('')
  const [editTags, setEditTags] = useState('')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleViewDocument = (document: Document) => {
    setViewedDocument(document)
    setDocumentDialogOpen(true)
  }

  const handleToggleStar = (document: Document) => {
    const updatedDocuments = documents.map((doc) =>
      doc.id === document.id ? { ...doc, isStarred: !doc.isStarred } : doc
    )

    setDocuments(updatedDocuments)
    toast.success(
      `${document.isStarred ? 'Removed from' : 'Added to'} favorites`
    )
  }

  const handleArchiveDocument = (document: Document) => {
    const updatedDocuments = documents.map((doc) =>
      doc.id === document.id ? { ...doc, isArchived: !doc.isArchived } : doc
    )

    setDocuments(updatedDocuments)
    toast.success(
      `${document.isArchived ? 'Unarchived' : 'Archived'} ${document.name}`
    )

    if (documentDialogOpen) {
      setDocumentDialogOpen(false)
    }
  }

  const handleDeleteDocument = (document: Document) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== document.id)
    setDocuments(updatedDocuments)
    toast.success(`Deleted ${document.name}`)

    if (documentDialogOpen) {
      setDocumentDialogOpen(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Auto-fill filename from the selected file
      if (!uploadFileName) {
        setUploadFileName(file.name)
      }
    }
  }

  const handleUploadDocument = () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    if (!uploadFileName.trim()) {
      toast.error('Please enter a file name')
      return
    }

    if (!uploadProject) {
      toast.error('Please select a project')
      return
    }

    // Create new document
    const fileExtension = selectedFile.name.split('.').pop() || ''
    const selectedProjectObj = mockProjects.find((p) => p.id === uploadProject)

    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: uploadFileName,
      fileType: fileExtension,
      fileSize: selectedFile.size,
      fileSizeFormatted: formatFileSize(selectedFile.size),
      projectId: uploadProject,
      projectName: selectedProjectObj?.name || 'Unknown Project',
      uploadedBy: user?.id || '',
      uploadedAt: new Date(),
      updatedAt: new Date(),
      description: uploadDescription || null,
      tags: uploadTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      isArchived: false,
      storageProvider: 'local',
      s3BucketName: null,
      s3ObjectKey: null,
      s3Region: null,
      contentType: selectedFile.type,
      publicUrl: null,
      accessLevel: 'project',
      filePath: `/documents/${uploadFileName.toLowerCase().replace(/\s+/g, '-')}`,
      isStarred: false,
    }

    setDocuments([newDocument, ...documents])

    // Reset form
    setUploadFileName('')
    setUploadDescription('')
    setUploadProject('')
    setUploadTags('')
    setSelectedFile(null)
    setIsUploadDialogOpen(false)

    toast.success(`Uploaded ${newDocument.name}`)
  }

  const handleEditDocument = () => {
    if (!editingDocument) return

    if (!editName.trim()) {
      toast.error('Please enter a file name')
      return
    }

    if (!editProject) {
      toast.error('Please select a project')
      return
    }

    const selectedProjectObj = mockProjects.find((p) => p.id === editProject)

    const updatedDocuments = documents.map((doc) =>
      doc.id === editingDocument.id
        ? {
            ...doc,
            name: editName,
            description: editDescription,
            projectId: editProject,
            projectName: selectedProjectObj?.name || 'Unknown Project',
            tags: editTags
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag),
          }
        : doc
    )

    setDocuments(updatedDocuments)
    setIsEditDialogOpen(false)
    toast.success(`Updated ${editName}`)
  }

  const openEditDialog = (document: Document) => {
    setEditingDocument(document)
    setEditName(document.name)
    setEditDescription(document.description || '')
    setEditProject(document.projectId)
    setEditTags((document.tags || []).join(', '))
    setIsEditDialogOpen(true)

    if (documentDialogOpen) {
      setDocumentDialogOpen(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Filter documents based on tab and search
  const filteredDocuments = documents.filter((doc) => {
    // Project filter
    if (activeProject !== 'all' && doc.projectId !== activeProject) {
      return false
    }

    // Tab filter
    if (activeTab === 'starred' && !doc.isStarred) return false
    if (activeTab === 'archived' && !doc.isArchived) return false
    if (activeTab === 'all' && doc.isArchived) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        doc.name.toLowerCase().includes(query) ||
        doc.projectName?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        doc.fileType.toLowerCase().includes(query)
      )
    }

    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Browse and manage your documents
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>

            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={activeProject} onValueChange={setActiveProject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-6">
              {renderDocumentsList(
                filteredDocuments,
                "You don't have any documents yet"
              )}
            </TabsContent>

            <TabsContent value="starred" className="mt-6">
              {renderDocumentsList(
                filteredDocuments,
                "You haven't starred any documents yet",
                <StarIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              )}
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              {renderDocumentsList(
                filteredDocuments,
                "You don't have any archived documents",
                <ArchiveIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Document Viewer */}
        <DocumentViewer
          document={viewedDocument}
          open={documentDialogOpen}
          onClose={() => setDocumentDialogOpen(false)}
          onEdit={openEditDialog}
          onArchive={handleArchiveDocument}
          onDelete={handleDeleteDocument}
        />

        {/* Upload Document Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="space-y-2 text-center">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <Badge variant="outline" className="mb-2">
                          {selectedFile.name} (
                          {formatFileSize(selectedFile.size)})
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                          >
                            <XIcon className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById('file-upload')?.click()
                            }
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your file here or click to browse
                        </p>
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById('file-upload')?.click()
                          }
                        >
                          Browse Files
                        </Button>
                      </>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-name">Document Name</Label>
                <Input
                  id="file-name"
                  placeholder="Enter document name"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter document description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={uploadProject} onValueChange={setUploadProject}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g. report, financial, quarterly"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUploadDocument}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Document Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter document name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter document description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-project">Project</Label>
                <Select value={editProject} onValueChange={setEditProject}>
                  <SelectTrigger id="edit-project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input
                  id="edit-tags"
                  placeholder="e.g. report, financial, quarterly"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditDocument}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <FloatingChat />
    </div>
  )

  function renderDocumentsList(
    docs: Document[],
    emptyMessage: string,
    emptyIcon?: React.ReactNode
  ) {
    if (docs.length === 0) {
      return (
        <div className="py-12 text-center">
          {emptyIcon || (
            <FileIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          )}
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? `No documents match "${searchQuery}"` : emptyMessage}
          </p>
          {!searchQuery && activeTab !== 'archived' && (
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onView={handleViewDocument}
            onEdit={openEditDialog}
            onArchive={handleArchiveDocument}
            onDelete={handleDeleteDocument}
            onToggleStar={handleToggleStar}
          />
        ))}
      </div>
    )
  }
}
