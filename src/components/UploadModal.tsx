'use client';

import { useEffect, useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { FileText, XCircle, Upload } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/aiUi/spinner";
import { JSX } from 'react/jsx-runtime';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser l'état quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setError(null);
    }
  }, [isOpen]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (err) {
      setError("Échec de l'upload. Veuillez réessayer.");
      console.error("Erreur lors de l'upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // Formatage de la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Obtenir une icône en fonction du type de fichier
  const getFileIcon = (fileType: string): JSX.Element => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('xls') || fileType.includes('sheet')) return <FileText className="h-4 w-4 text-green-500" />;
    
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop avec animation */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                  <span>Importer des documents</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="p-1 h-auto"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </Button>
                </Dialog.Title>

                {/* Zone de dépôt de fichiers */}
                <div className="mt-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      dragActive 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Upload className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-600">
                      Dépose tes fichiers de types PDF, XLS, XLSX ici ou <span className="font-medium text-blue-600">clique pour choisir</span>
                    </p>
                  </div>
                </div>

                {/* Liste des fichiers sélectionnés */}
                {files.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-sm text-gray-500 mb-2">
                      Fichiers sélectionnés ({files.length})
                    </h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {files.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-start border rounded-lg p-3 border-gray-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-1 h-auto text-gray-400 hover:text-red-500"
                            onClick={() => removeFile(index)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message d'erreur */}
                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <p>{error}</p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="mt-6 flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={files.length === 0 || loading}
                  >
                    {loading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Uploader et embeder</span>
                      </>
                    )}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UploadModal;