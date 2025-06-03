'use client';

import { useEffect, useState, useCallback, Fragment, JSX } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, FileText, XCircle, Check, RefreshCw, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/aiUi/badge";
import { Spinner } from "@/components/ui/aiUi/spinner";
import DOMPurify from 'dompurify'; // npm i dompurify
import { toast } from 'sonner';

// TypeScript interfaces
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

interface ModifiedChunk {
  chunkIndex: number;
  text: string;
  status: string;
  similarity: number;
  confidence: number;
  pageNumber: number;
  diffHighlight: string;
}

interface ComparisonResult {
  added: Array<{chunkIndex: number; text: string; pageNumber: number}>;
  removed: Array<{chunkIndex: number; text: string}>;
  unchanged: Array<{chunkIndex: number; text: string}>;
  modified: ModifiedChunk[];
  statistics?: any;
  pipeline?: { steps: string[]; duration: number; usedLLM: boolean };
}

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

function renderSafeHTML(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

export default function CompareModal({
  open,
  onClose,
  conversationId
}: CompareModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  // Advanced options
  const [compareOptions, setCompareOptions] = useState({
    semanticSimilarityThreshold: 0.85,
    lexicalSimilarityThreshold: 0.7,
    useLLM: true,
    enhanceModifiedChunks: true,
    useVectorSimilarity: true,
    useExactMatching: true,
    useLexicalSimilarity: true,
    llmConfidenceThreshold: 0.75,
    computeConfidenceScores: true,
    maxLLMOps: 50
  });

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/getDocs?conversationId=${conversationId}`);
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      setDocuments(data || []);
    } catch (err) {
      setError("Impossible de charger les documents. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

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

  // Filtered docs by search
  const filteredDocuments = documents.filter(doc =>
    doc.metadata?.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Select/deselect doc
  const toggleDocSelection = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
      setComparisonResult(null);
    } else if (selectedDocs.length < 2) {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  // Delete a document
  const handleDeleteDocument = async (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    setDeletingDoc(docId);

    try {
      const doc = documents.find(d => d.id === docId);
      if (!doc?.metadata.processingId) throw new Error("ID de traitement manquant");
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          processingId: doc.metadata.processingId,
          conversationId
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur de suppression: ${response.status}`);
      }
      toast.success("Document supprimé avec succès");
      setDocuments(documents.filter(d => d.id !== docId));
      if (selectedDocs.includes(docId)) {
        setSelectedDocs(selectedDocs.filter(id => id !== docId));
        setComparisonResult(null);
      }
    } catch (err) {
      toast.error("Erreur lors de la suppression du document");
      setError("Erreur lors de la suppression du document. Veuillez réessayer.");
    } finally {
      setDeletingDoc(null);
    }
  };

  // Compare two docs
  const handleCompare = async () => {
    if (selectedDocs.length !== 2) return;
    setComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const doc1 = documents.find(doc => doc.id === selectedDocs[0]);
      const doc2 = documents.find(doc => doc.id === selectedDocs[1]);
      if (!doc1?.metadata.processingId || !doc2?.metadata.processingId) {
        throw new Error("Informations de traitement manquantes pour les documents sélectionnés");
      }
      const response = await fetch('/api/documents/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc1ProcessingId: doc1.metadata.processingId,
          doc2ProcessingId: doc2.metadata.processingId,
          ...compareOptions
        }),
      });
      if (!response.ok) throw new Error(`Erreur de comparaison: ${response.status}`);
      const result = await response.json();
      setComparisonResult(result.comparison);
    } catch (err) {
      setError("Erreur lors de la comparaison des documents. Veuillez réessayer.");
    } finally {
      setComparing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Taille inconnue";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  // File icon
  const getFileIcon = (fileType?: string): JSX.Element => {
    if (!fileType) return <FileText size={16} />;
    if (fileType.includes('pdf')) return <FileText size={16} />;
    if (fileType.includes('word')) return <FileText size={16} />;
    return <FileText size={16} />;
  };
  // Get doc name by id
  const getDocNameById = (docId: string): string => {
    const doc = documents.find(d => d.id === docId);
    return doc?.metadata.originalName || "Document inconnu";
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
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
                  <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-auto">
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </Button>
                </Dialog.Title>
                {/* Search bar */}
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
                  {/* List of docs */}
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
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedDocs.includes(doc.id)}
                                className="mt-1"
                                onCheckedChange={() => toggleDocSelection(doc.id)}
                              />
                              {/* Delete icon */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                disabled={deletingDoc === doc.id}
                              >
                                {deletingDoc === doc.id ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Comparison result panel */}
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm text-gray-500">Résultats de la comparaison</h3>
                      <Button
                        size="sm"
                        onClick={handleCompare}
                        disabled={selectedDocs.length !== 2}
                        title={selectedDocs.length !== 2 ? "Sélectionnez deux documents pour comparer" : ""}
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
                    {/* Advanced options */}
                    {selectedDocs.length === 2 && !comparing && !comparisonResult && (
                      <details className="mb-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                          Options avancées de comparaison
                        </summary>
                        <div className="space-y-3 border border-gray-200 rounded-md p-3 bg-gray-50">
                          <div className="flex items-center">
                            <Checkbox
                              id="useLLM"
                              checked={compareOptions.useLLM}
                              onCheckedChange={(checked) =>
                                setCompareOptions({ ...compareOptions, useLLM: !!checked })
                              }
                            />
                            <label htmlFor="useLLM" className="ml-2 text-sm text-gray-700">
                              Utiliser l&apos;IA pour affiner l&apos;analyse
                            </label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox
                              id="enhanceModifiedChunks"
                              checked={compareOptions.enhanceModifiedChunks}
                              onCheckedChange={(checked) =>
                                setCompareOptions({ ...compareOptions, enhanceModifiedChunks: !!checked })
                              }
                            />
                            <label htmlFor="enhanceModifiedChunks" className="ml-2 text-sm text-gray-700">
                              Améliorer la détection des modifications
                            </label>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="semanticThreshold" className="block text-xs text-gray-600">
                              Seuil de similarité sémantique: {compareOptions.semanticSimilarityThreshold}
                            </label>
                            <input
                              id="semanticThreshold"
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={compareOptions.semanticSimilarityThreshold}
                              onChange={(e) =>
                                setCompareOptions({
                                  ...compareOptions,
                                  semanticSimilarityThreshold: parseFloat(e.target.value)
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="lexicalThreshold" className="block text-xs text-gray-600">
                              Seuil de similarité lexicale: {compareOptions.lexicalSimilarityThreshold}
                            </label>
                            <input
                              id="lexicalThreshold"
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={compareOptions.lexicalSimilarityThreshold}
                              onChange={(e) =>
                                setCompareOptions({
                                  ...compareOptions,
                                  lexicalSimilarityThreshold: parseFloat(e.target.value)
                                })
                              }
                              className="w-full"
                            />
                          </div>
                          <details className="text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-800">
                              Algorithmes de comparaison
                            </summary>
                            <div className="pl-2 pt-2 space-y-2">
                              <div className="flex items-center">
                                <Checkbox
                                  id="useVectorSimilarity"
                                  checked={compareOptions.useVectorSimilarity}
                                  onCheckedChange={(checked) =>
                                    setCompareOptions({ ...compareOptions, useVectorSimilarity: !!checked })
                                  }
                                />
                                <label htmlFor="useVectorSimilarity" className="ml-2 text-sm text-gray-700">
                                  Similarité vectorielle
                                </label>
                              </div>
                              <div className="flex items-center">
                                <Checkbox
                                  id="useExactMatching"
                                  checked={compareOptions.useExactMatching}
                                  onCheckedChange={(checked) =>
                                    setCompareOptions({ ...compareOptions, useExactMatching: !!checked })
                                  }
                                />
                                <label htmlFor="useExactMatching" className="ml-2 text-sm text-gray-700">
                                  Correspondance exacte
                                </label>
                              </div>
                              <div className="flex items-center">
                                <Checkbox
                                  id="useLexicalSimilarity"
                                  checked={compareOptions.useLexicalSimilarity}
                                  onCheckedChange={(checked) =>
                                    setCompareOptions({ ...compareOptions, useLexicalSimilarity: !!checked })
                                  }
                                />
                                <label htmlFor="useLexicalSimilarity" className="ml-2 text-sm text-gray-700">
                                  Similarité lexicale
                                </label>
                              </div>
                            </div>
                          </details>
                        </div>
                      </details>
                    )}

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
                          {/* Pipeline info */}
                          {comparisonResult.pipeline && (
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Temps: {comparisonResult.pipeline.duration}ms
                              </Badge>
                              {comparisonResult.pipeline.usedLLM && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Analyse IA activée
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Modified chunks */}
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-amber-600 flex items-center">
                            <RefreshCw size={16} className="mr-1" />
                            Modifiés ({comparisonResult.modified ? comparisonResult.modified.length : 0})
                          </h4>
                          {comparisonResult.modified && comparisonResult.modified.length > 0 ? (
                            <div className="mt-2 space-y-4">
                              {comparisonResult.modified.map((chunk: ModifiedChunk, idx: number) => (
                                <div key={`modified-${idx}`} className="rounded-md border border-amber-200 overflow-hidden shadow-sm">
                                  <div className="bg-amber-50 px-3 py-2 text-xs flex justify-between items-center text-amber-700 border-b border-amber-200">
                                    <div>
                                      <span className="font-semibold">
                                        Fragment #{chunk.chunkIndex !== undefined ? chunk.chunkIndex : idx}
                                      </span>
                                      {chunk.pageNumber !== undefined && (
                                        <span className="ml-2 text-gray-500">(Page {chunk.pageNumber})</span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {chunk.status && (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                          {chunk.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-4 bg-white">
                                    <div className="text-xs text-gray-500 mb-2">Modifications mises en évidence:</div>
                                    <div className="text-sm whitespace-pre-wrap">
                                      {renderSafeHTML(chunk.diffHighlight || chunk.text)}
                                    </div>
                                  </div>
                                  <div className="bg-amber-50 text-xs text-gray-600 px-3 py-2 border-t border-amber-200 flex flex-wrap items-center gap-4">
                                    {chunk.similarity !== undefined && (
                                      <div className="flex items-center">
                                        <span className="font-medium mr-1">Similarité:</span>
                                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mr-1">
                                          <div
                                            className={cn(
                                              "h-full rounded-full",
                                              chunk.similarity > 0.7 ? "bg-green-500" :
                                              chunk.similarity > 0.4 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${Math.max(chunk.similarity * 100, 5)}%` }}
                                          />
                                        </div>
                                        <span>{(chunk.similarity * 100).toFixed(1)}%</span>
                                      </div>
                                    )}
                                    {chunk.confidence !== undefined && (
                                      <div className="flex items-center">
                                        <span className="font-medium mr-1">Confiance:</span>
                                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mr-1">
                                          <div
                                            className={cn(
                                              "h-full rounded-full",
                                              chunk.confidence > 0.7 ? "bg-green-500" :
                                              chunk.confidence > 0.4 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${Math.max(chunk.confidence * 100, 5)}%` }}
                                          />
                                        </div>
                                        <span>{(chunk.confidence * 100).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 flex items-center justify-center p-6 bg-gray-50 rounded-md border border-gray-200">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Aucun fragment modifié détecté</p>
                                <p className="text-xs text-gray-400 mt-1">Les documents semblent identiques ou les différences sont minimes</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Ajoutés */}
                        <div>
                          <h4 className="text-sm font-medium text-green-600 flex items-center">
                            <Check size={16} className="mr-1" />
                            Ajoutés ({comparisonResult.added.length})
                          </h4>
                          {comparisonResult.added.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {comparisonResult.added.map((chunk, idx) => (
                                <div key={`added-${idx}`} className="bg-green-50 border border-green-200 rounded-md p-3">
                                  <div className="text-xs text-green-700 mb-1">
                                    Fragment #{chunk.chunkIndex}, page {chunk.pageNumber}
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{chunk.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Aucun fragment ajouté</p>
                          )}
                        </div>
                        {/* Supprimés */}
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
                        {/* Inchangés */}
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
