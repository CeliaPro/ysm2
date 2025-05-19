import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ServerIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react'
import { S3Bucket } from '@/types/project'
import { mockS3Buckets } from '@/data/mockStorage'

const S3StorageConfig: React.FC = () => {
  const [buckets, setBuckets] = useState<S3Bucket[]>(mockS3Buckets)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isAddBucketDialogOpen, setIsAddBucketDialogOpen] = useState(false)

  // New bucket form state
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketRegion, setNewBucketRegion] = useState('us-east-1')
  const [newBucketDescription, setNewBucketDescription] = useState('')

  const handleTestConnection = () => {
    setIsTestingConnection(true)

    // Simulate connection test
    setTimeout(() => {
      setIsTestingConnection(false)
      toast.success('Successfully connected to S3')
    }, 1500)
  }

  const handleAddBucket = () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name is required')
      return
    }

    if (buckets.some((bucket) => bucket.bucketName === newBucketName)) {
      toast.error('Bucket with this name already exists')
      return
    }

    const newBucket: S3Bucket = {
      id: `bucket-${Date.now()}`,
      bucketName: newBucketName,
      region: newBucketRegion,
      isActive: true,
      description: newBucketDescription || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setBuckets([...buckets, newBucket])
    setNewBucketName('')
    setNewBucketRegion('us-east-1')
    setNewBucketDescription('')
    setIsAddBucketDialogOpen(false)

    toast.success(`Bucket "${newBucketName}" added successfully`)
  }

  const handleToggleBucketStatus = (bucket: S3Bucket) => {
    const updatedBuckets = buckets.map((b) =>
      b.id === bucket.id
        ? { ...b, isActive: !b.isActive, updatedAt: new Date() }
        : b
    )

    setBuckets(updatedBuckets)
    toast.success(
      `Bucket "${bucket.bucketName}" ${bucket.isActive ? 'deactivated' : 'activated'}`
    )
  }

  const handleDeleteBucket = (bucket: S3Bucket) => {
    const updatedBuckets = buckets.filter((b) => b.id !== bucket.id)
    setBuckets(updatedBuckets)
    toast.success(`Bucket "${bucket.bucketName}" deleted successfully`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Amazon S3 Storage Configuration
          </CardTitle>
          <CardDescription>
            Configure Amazon S3 storage for your documents
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access-key">AWS Access Key</Label>
              <Input
                id="access-key"
                type="password"
                value="****************************************"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key">AWS Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                value="****************************************"
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>S3 Buckets</CardTitle>
          <Button size="sm" onClick={() => setIsAddBucketDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Bucket
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((bucket) => (
                <TableRow key={bucket.id}>
                  <TableCell className="font-medium">
                    {bucket.bucketName}
                  </TableCell>
                  <TableCell>{bucket.region}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bucket.isActive}
                        onCheckedChange={() => handleToggleBucketStatus(bucket)}
                      />
                      <span
                        className={
                          bucket.isActive ? 'text-green-600' : 'text-gray-500'
                        }
                      >
                        {bucket.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{bucket.description || '-'}</TableCell>
                  <TableCell>{bucket.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon">
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBucket(bucket)}
                        className="text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {buckets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <ServerIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      No buckets configured
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add a bucket to start storing files in S3
                    </p>
                    <Button onClick={() => setIsAddBucketDialogOpen(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Bucket
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Bucket Dialog */}
      <Dialog
        open={isAddBucketDialogOpen}
        onOpenChange={setIsAddBucketDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add S3 Bucket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bucket-name">Bucket Name</Label>
              <Input
                id="bucket-name"
                placeholder="Enter bucket name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket-region">Region</Label>
              <Select
                value={newBucketRegion}
                onValueChange={setNewBucketRegion}
              >
                <SelectTrigger id="bucket-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">
                    US East (N. Virginia)
                  </SelectItem>
                  <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                  <SelectItem value="us-west-1">
                    US West (N. California)
                  </SelectItem>
                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                  <SelectItem value="ap-northeast-1">
                    Asia Pacific (Tokyo)
                  </SelectItem>
                  <SelectItem value="ap-southeast-1">
                    Asia Pacific (Singapore)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket-description">Description (optional)</Label>
              <Input
                id="bucket-description"
                placeholder="Enter description"
                value={newBucketDescription}
                onChange={(e) => setNewBucketDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddBucketDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBucket}>Add Bucket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default S3StorageConfig
