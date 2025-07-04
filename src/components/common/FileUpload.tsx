'use client';
import React, { useRef } from 'react';
import { Upload, File } from 'lucide-react';

interface FileUploadProps {
  onSVGUpload: (svgContent: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onSVGUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const processFile = (file: File) => {
    // Clear any previous errors and set processing state
    setUploadError(null);
    setIsProcessing(true);
    
    // Validate file type
    if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
      setUploadError('Please upload a valid SVG file');
      setIsProcessing(false);
      // Clear error after 3 seconds
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          onSVGUpload(content);
          // Reset the file input to ensure it works for subsequent uploads
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          // Clear any previous errors on successful upload
          setUploadError(null);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process SVG file';
          setUploadError(errorMessage);
          setTimeout(() => setUploadError(null), 5000);
          console.error('SVG upload error:', error);
        }
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
      setIsProcessing(false);
      setTimeout(() => setUploadError(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return; // Prevent uploads while processing
    
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleUploadClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isProcessing) return; // Prevent uploads while processing
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleUploadClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={isProcessing}
        className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors group ${
          isProcessing
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className={`w-8 h-8 ${
            isProcessing
              ? 'text-gray-300 animate-pulse'
              : isDragOver
              ? 'text-blue-500'
              : 'text-gray-400 group-hover:text-blue-500'
          }`} />
          <div className="text-center">
            <div className={`text-sm font-medium ${
              isProcessing
                ? 'text-gray-500'
                : isDragOver
                ? 'text-blue-600'
                : 'text-gray-700 group-hover:text-blue-600'
            }`}>
              {isProcessing 
                ? 'Processing SVG...' 
                : isDragOver 
                ? 'Drop SVG file here' 
                : 'Upload SVG File'
              }
            </div>
            {!isProcessing && (
              <div className="text-xs text-gray-500 mt-1">
                Click to browse or drag and drop
              </div>
            )}
          </div>
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileUpload}
        disabled={isProcessing}
        className="hidden"
      />

      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <File className="w-3 h-3" />
        <span>Supports SVG files only</span>
      </div>

      {uploadError && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
          {uploadError}
        </div>
      )}
    </div>
  );
};
