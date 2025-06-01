'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import DocumentCard from '@/components/DocumentCard'
import { Document } from '@/types/project'
import DocumentViewer from '@/components/DocumentViewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SearchIcon, PlusIcon, FilterIcon, StarIcon, ArchiveIcon,
  XIcon, FileIcon,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DocumentsPage() {
  const { isLoading, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [activeProject, setActiveProject] = useState<string>('all')

  // Document viewer
  const [viewedDocument, setViewedDocument] = useState<Document | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)

  // Upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadProject, setUploadProject] = useState<string>('none')
  const [uploadTags, setUploadTags] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileKey, setFileKey] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadFileName, setUploadFileName] = useState('') // Derived from file

  // Users and Projects
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // --------- Fetchers ----------
  const fetchUsersAndProjects = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/users?minimal=true').then(res => res.json()).then((res: any) => setUsers(Array.isArray(res) ? res : res.data)),
      fetch('/api/projects?minimal=true').then(res => res.json()).then((res: any) => setProjects(Array.isArray(res) ? res : res.data)),
    ]).then(() => setLoading(false))
  }

  const fetchDocuments = () => {
    setLoading(true)
    fetch('/api/documents')
      .then(res => res.json())
      .then((res: any) => {
            console.log('API DATA:', res);
        const docsArr = Array.isArray(res) ? res : res.data
        if (!Array.isArray(docsArr)) {
          setDocuments([])
          setLoading(false)
          return
        }
        const docs: Document[] = docsArr.map((dc: any) => ({
          id: dc.id,
          name: dc.name,
          fileType: dc.type,
          fileSize: dc.size,
          fileSizeFormatted: formatFileSize(dc.size),
          projectId: dc.projectId,
          projectName: dc.projectName ?? '',
          uploadedBy: dc.uploadedBy ?? '',
          uploadedById: dc.uploadedById ?? '',
          uploadedAt: dc.createdAt ? new Date(dc.createdAt) : new Date(),
          updatedAt: dc.updatedAt ? new Date(dc.updatedAt) : new Date(),
          updatedBy: dc.updatedBy ?? '',
          updatedById: dc.updatedById ?? '',
          tags: Array.isArray(dc.tags) ? dc.tags : [],
          isStarred: dc.favorite ?? false,
          description: dc.description ?? '',
          isArchived: dc.archived ?? false,
          contentType: dc.type ?? '',
          publicUrl: dc.url ?? '',
          filePath: dc.url ?? '',
        }))
        setDocuments(docs)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchUsersAndProjects()
    fetchDocuments()
    // eslint-disable-next-line
  }, [])

  // --------- Actions ----------
  const handleViewDocument = (document: Document) => {
    setViewedDocument(document)
    setDocumentDialogOpen(true)
  }

  // ---- STAR/UNSTAR ----
  const handleToggleStar = async (document: Document) => {
    const newStar = !document.isStarred
    setDocuments(docs => docs.map(doc =>
      doc.id === document.id ? { ...doc, isStarred: newStar } : doc
    ))
    try {
      await fetch('/api/documents/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: document.id, star: newStar }),
      })
      toast.success(newStar ? 'Added to favorites' : 'Removed from favorites')
      fetchDocuments()
    } catch {
      toast.error('Could not update star status')
    }
  }

  // ---- ARCHIVE/UNARCHIVE ----
  const handleArchiveDocument = async (document: Document) => {
    const newArchived = !document.isArchived
    setDocuments(docs => docs.map(doc =>
      doc.id === document.id ? { ...doc, isArchived: newArchived } : doc
    ))
    try {
      await fetch('/api/documents/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: document.id, archived: newArchived }),
      })
      toast.success(newArchived ? 'Document archived' : 'Document unarchived')
      fetchDocuments()
    } catch {
      toast.error('Could not archive document')
    }
    if (documentDialogOpen) setDocumentDialogOpen(false)
  }

  // ---- DELETE ----
  const handleDeleteDocument = async (document: Document) => {
    const res = await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: document.id }),
    })
    if (res.ok) {
      setDocuments(d => d.filter(doc => doc.id !== document.id))
      toast.success(`Deleted ${document.name}`)
    } else {
      toast.error('Failed to delete')
    }
    if (documentDialogOpen) setDocumentDialogOpen(false)
  }

  // ---- FILE UPLOAD (DRAG & DROP + PICKER) ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | null
    if ('target' in e) {
      if (!e.target.files?.length) return
      file = e.target.files[0]
    } else {
      file = e
    }
    setSelectedFile(file)
    setUploadFileName(file.name) // Name comes from the file, disables renaming
    setUploadingFile(true)
    fetch('/api/files/upload', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ contentType: file.type }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const { presignedUrl, key } = res
          setFileKey(key)
          fetch(presignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          }).then(() => {
            setUploadingFile(false)
            toast.success('File uploaded successfully')
          })
        } else {
          toast.error('Failed to upload file')
          setUploadingFile(false)
        }
      })
  }

  // DRAG AND DROP HANDLERS
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }
  const openFilePicker = () => fileInputRef.current?.click()

  // ---- UPLOAD DOC ----
  const handleUploadDocument = () => {
    if (!selectedFile) return
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uploadFileName,
        description: uploadDescription,
        url: fileKey,
        size: selectedFile.size,
        type: selectedFile.type,
        projectId: uploadProject === 'none' ? null : uploadProject,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    }).then(() => {
      fetchDocuments()
      setIsUploadDialogOpen(false)
      setUploadDescription('')
      setUploadProject('none')
      setUploadTags('')
      setSelectedFile(null)
      setFileKey('')
      setUploadFileName('')
    })
  }

  // ------------- UI: Filtering -------------
  const filteredDocuments = documents.filter(doc => {
    if (activeProject !== 'all' && doc.projectId !== activeProject) return false
    if (activeTab === 'starred' && !doc.isStarred) return false
    if (activeTab === 'archived' && !doc.isArchived) return false
    if (activeTab === 'all' && doc.isArchived) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.projectName?.toLowerCase().includes(q) ||
        doc.description?.toLowerCase().includes(q) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        doc.fileType.toLowerCase().includes(q)
      )
    }
    return true
  })

  function formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // ---- Rendering ----
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 animate-fade-in">

        {/* Header: Search + Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-xl">Documents</h1>
            <p className="text-muted-foreground">Browse and manage your documents</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs for document types */}
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
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TabsContent value="all" className="mt-6">
              {renderDocumentsList(filteredDocuments, "You don't have any documents yet")}
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
          onEdit={() => null}
          onArchive={handleArchiveDocument}
          onDelete={handleDeleteDocument}
        />

        {/* ==== Drag & Drop Upload Dialog ==== */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload a Document</DialogTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Add a new file to your document library.
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-2">
              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg px-4 py-8 text-center transition-all cursor-pointer
                  ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-muted'}`}
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                />
                <FileIcon className="mx-auto h-8 w-8 mb-2 text-blue-600" />
                <p className="font-semibold text-sm mb-1">Drag & drop your file here, or <span className="underline text-blue-600 cursor-pointer">browse</span></p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile ? selectedFile.name : "PDF, DOCX, PNG, ..."}
                </p>
              </div>
              {/* File name (auto) */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="name" className="font-semibold">Name</Label>
                <Input
                  id="name"
                  value={uploadFileName}
                  disabled
                  className="bg-white"
                />
              </div>
              {/* Description */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  disabled={uploadingFile}
                  placeholder="Describe this document"
                  rows={2}
                  className="bg-white"
                />
              </div>
              {/* Project */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="project" className="font-semibold">Project</Label>
                <Select value={uploadProject} onValueChange={setUploadProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Tags */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="tags" className="font-semibold">Tags</Label>
                <Input
                  id="tags"
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  disabled={uploadingFile}
                  placeholder="tag1, tag2, tag3"
                  className="bg-white"
                />
              </div>
              {/* Actions */}
              <DialogFooter className="flex flex-row justify-between gap-2 pt-2">
                <Button
                  onClick={handleUploadDocument}
                  disabled={uploadingFile || !selectedFile || !uploadFileName}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </main>
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
            onEdit={() => null}
            onArchive={handleArchiveDocument}
            onDelete={handleDeleteDocument}
            onToggleStar={handleToggleStar}
          />
        ))}
      </div>
    )
  }
}
