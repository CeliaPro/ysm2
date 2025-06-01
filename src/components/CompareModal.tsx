'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, FileText, XCircle, Check, RefreshCw } from 'lucide-react';
import { Fragment } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/aiUi/badge";
import { Spinner } from "@/components/ui/aiUi/spinner"; // Ajoutez ce composant si nécessaire
import { JSX } from 'react/jsx-runtime';


// Types définis avec TypeScript pour une meilleure lisibilité et sécurité de type
interface DocumentMetadata {
  processingId?: string;
  originalName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  totalChunks?: number;
  event?: string;
  [key: string]: string | number | boolean | undefined;
}

interface Document {
  id: string;
  metadata: DocumentMetadata;
  content?: string;
}

interface ComparisonResult {
  added: Array<{chunkIndex: number; text: string}>;
  removed: Array<{chunkIndex: number; text: string}>;
  unchanged: Array<{chunkIndex: number; text: string}>;
  // modified: Array<{old: string; new: string; oldIndex: number; newIndex: number}>;
}

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

export default function CompareModal({
  open,
  onClose,
  conversationId
}: CompareModalProps) {
  // États pour gérer les données et l'UI
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [comparing, setComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

 
  // Fonction pour récupérer les documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chat/getDocs?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      setDocuments(data || []);
    } catch (err) {
      setError("Impossible de charger les documents. Veuillez réessayer.");
      console.error("Erreur de chargement des documents:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

   // Récupérer les documents lorsque la modale s'ouvre
  useEffect(() => {
    if (open) {
      fetchDocuments();
    } else {
      setSelectedDocs([]);
      setComparisonResult(null);
      setError(null);
      setSearchTerm('');
    }
  }, [open, conversationId, fetchDocuments]);


  // Filtrer les documents en fonction du terme de recherche
  const filteredDocuments = documents.filter(doc => 
    doc.metadata?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gérer la sélection ou désélection d'un document
  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
      // Réinitialiser le résultat de comparaison si un document est désélectionné
      setComparisonResult(null);
    } else if (selectedDocs.length < 2) {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  // Fonction pour comparer deux documents
  const handleCompare = async () => {
    if (selectedDocs.length !== 2) return;
    
    setComparing(true);
    setError(null);
    setComparisonResult(null);
    
    try {
      // Obtenir les processingIds des documents sélectionnés
      const doc1 = documents.find(doc => doc.id === selectedDocs[0]);
      const doc2 = documents.find(doc => doc.id === selectedDocs[1]);
      
      if (!doc1?.metadata.processingId || !doc2?.metadata.processingId) {
        throw new Error("Informations de traitement manquantes pour les documents sélectionnés");
      }
      
      const response = await fetch('/api/documents/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc1ProcessingId: doc1.metadata.processingId,
          doc2ProcessingId: doc2.metadata.processingId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur de comparaison: ${response.status}`);
      }
      
      const result = await response.json();
      setComparisonResult(result.comparison);
    } catch (err) {
      setError("Erreur lors de la comparaison des documents. Veuillez réessayer.");
      console.error("Erreur de comparaison:", err);
    } finally {
      setComparing(false);
    }
  };

  // Formatage de la taille des fichiers
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Taille inconnue";
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Formatage de la date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Date inconnue";
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Obtenir une icône en fonction du type de fichier
  const getFileIcon = (fileType?: string): JSX.Element => {
    if (!fileType) return <FileText size={16} />;
    
    if (fileType.includes('pdf')) return <FileText size={16} />;
    if (fileType.includes('word')) return <FileText size={16} />;
    
    return <FileText size={16} />;
  };

  // Trouver le nom du document par ID
  const getDocNameById = (docId: string): string => {
    const doc = documents.find(d => d.id === docId);
    return doc?.metadata.originalName || "Document inconnu";
  };

  return (
    <Transition appear show={open} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-xl font-semibold text-gray-900 flex justify-between items-center">
                  <span>Comparer des documents ({selectedDocs.length}/2)</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose}
                    className="p-1 h-auto"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </Button>
                </Dialog.Title>

                {/* Barre de recherche */}
                <div className="relative mt-4 mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher un document..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Liste des documents */}
                  <div className="w-full md:w-1/2">
                    <h3 className="font-medium text-sm text-gray-500 mb-2">
                      Documents disponibles
                    </h3>

                    {loading ? (
                      <div className="flex justify-center items-center h-40">
                        <Spinner className="h-6 w-6 text-blue-500" />
                        <span className="ml-2 text-sm text-gray-500">Chargement des documents...</span>
                      </div>
                    ) : error ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                        <p>{error}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={fetchDocuments} 
                          className="mt-2"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
                        </Button>
                      </div>
                    ) : filteredDocuments.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                        {searchTerm ? "Aucun document trouvé pour cette recherche." : "Aucun document disponible."}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {filteredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className={cn(
                              "flex justify-between items-start border rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50",
                              selectedDocs.includes(doc.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                            )}
                            onClick={() => toggleDocSelection(doc.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-0.5 text-gray-500">
                                {getFileIcon(doc.metadata.fileType)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm truncate max-w-[200px]">
                                  {doc.metadata.originalName || "Sans nom"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(doc.metadata.fileSize)} • {formatDate(doc.metadata.uploadedAt)}
                                </span>
                                {doc.metadata.totalChunks && (
                                  <Badge variant="outline" className="mt-1 text-xs w-fit">
                                    {doc.metadata.totalChunks} fragments
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              className="mt-1"
                              onCheckedChange={() => {}}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zone de résultats de comparaison */}
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm text-gray-500">
                        Résultats de la comparaison
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleCompare}
                        disabled={selectedDocs.length !== 2 || comparing}
                      >
                        {comparing ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Comparaison...
                          </>
                        ) : (
                          "Comparer"
                        )}
                      </Button>
                    </div>

                    {error && comparisonResult === null ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                        <p>{error}</p>
                      </div>
                    ) : selectedDocs.length < 2 ? (
                      <div className="rounded-lg border border-gray-200 p-6 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">Sélectionnez deux documents pour les comparer</p>
                      </div>
                    ) : comparisonResult ? (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Comparaison entre :</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{getDocNameById(selectedDocs[0])}</Badge>
                            <span className="text-gray-400">et</span>
                            <Badge variant="secondary">{getDocNameById(selectedDocs[1])}</Badge>
                          </div>
                        </div>

                        {/* Éléments ajoutés */}
                        <div>
                          <h4 className="text-sm font-medium text-green-600 flex items-center">
                            <Check size={16} className="mr-1" />
                            Ajoutés ({comparisonResult.added.length})
                          </h4>
                          {comparisonResult.added.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {comparisonResult.added.map((chunk, idx) => (
                                <div key={`added-${idx}`} className="bg-green-50 border border-green-200 rounded-md p-3">
                                  <div className="text-xs text-green-700 mb-1">Fragment #{chunk.chunkIndex}</div>
                                  <p className="text-sm whitespace-pre-wrap">{chunk.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Aucun fragment ajouté</p>
                          )}
                        </div>

                        {/* Éléments supprimés */}
                        <div>
                          <h4 className="text-sm font-medium text-red-600 flex items-center">
                            <XCircle size={16} className="mr-1" />
                            Supprimés ({comparisonResult.removed.length})
                          </h4>
                          {comparisonResult.removed.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {comparisonResult.removed.map((chunk, idx) => (
                                <div key={`removed-${idx}`} className="bg-red-50 border border-red-200 rounded-md p-3">
                                  <div className="text-xs text-red-700 mb-1">Fragment #{chunk.chunkIndex}</div>
                                  <p className="text-sm whitespace-pre-wrap">{chunk.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Aucun fragment supprimé</p>
                          )}
                        </div>

                          
                        {/* Éléments modifiés légèrement */}
                        {/* <div>
                          <h4 className="text-sm font-medium text-yellow-600 flex items-center">
                            <RefreshCw size={16} className="mr-1" />
                            Modifiés légèrement ({comparisonResult.modified.length})
                          </h4>
                          {comparisonResult.modified.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {comparisonResult.modified.map((chunk, idx) => (
                                <div key={`modified-${idx}`} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                  <div className="text-xs text-yellow-700 mb-1">Fragment #{chunk.oldIndex} modifié</div>
                                  <p className="text-sm whitespace-pre-wrap">{chunk.old}</p>
                                  <p className="text-xs text-gray-500 mt-1">→</p>
                                  <p className="text-sm whitespace-pre-wrap">{chunk.new}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Aucun fragment modifié légèrement</p>
                          )}
                        </div>
                        */}
                        {/* Éléments inchangés */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 flex items-center">
                            <Check size={16} className="mr-1" />
                            Inchangés ({comparisonResult.unchanged.length})
                          </h4>
                          {comparisonResult.unchanged.length > 0 ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                Afficher les fragments inchangés
                              </summary>
                              <div className="mt-2 space-y-2">
                                {comparisonResult.unchanged.map((chunk, idx) => (
                                  <div key={`unchanged-${idx}`} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                    <div className="text-xs text-gray-500 mb-1">Fragment #{chunk.chunkIndex}</div>
                                    <p className="text-sm whitespace-pre-wrap">{chunk.text}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Aucun fragment inchangé</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 p-6 text-center">
                        <p className="text-gray-500">Cliquez sur &quot;Comparer&quot; pour voir les différences</p>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}