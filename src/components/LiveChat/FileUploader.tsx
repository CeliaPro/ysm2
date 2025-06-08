"use client";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onClose: () => void;
}

export const FileUploader = ({ onFileSelect, onClose }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      // Accept any file type; restrict if you want
      // "application/pdf": [".pdf"],
      // "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      // "application/*": [],
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Upload File
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag and drop a file here"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                or click to select a file
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Maximum file size: 10MB
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
