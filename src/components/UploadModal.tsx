'use client';
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]); // cumuler plusieurs fichiers
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]); // cumuler plusieurs fichiers
  };

  const handleUpload = async () => {
    setLoading(true);
    await onUpload(files); // fonction prop pour gérer le upload
    setLoading(false);
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-[90%] max-w-lg shadow-xl relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}>

        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-black">Importer des documents</h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer text-black bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-sm">Dépose tes fichiers ici ou clique pour choisir</p>
          <input
            type="file"
            accept=".pdf"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-4 text-sm text-gray-600 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <li key={index}>📄 {file.name}</li>
            ))}
          </ul>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Chargement...' : 'Uploader et embeder'}
        </button>
      </motion.div>
    </div>
  );
};

export default UploadModal;
