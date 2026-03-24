import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploadZoneProps {
  onUpload: (files: FileList) => void;
  multiple?: boolean;
  loading?: boolean;
  className?: string;
  text?: string;
  subText?: string;
  icon?: React.ReactNode;
}

export default function ImageUploadZone({ 
  onUpload, 
  multiple = false, 
  loading = false,
  className = "",
  text = "Nhấn để tải lên",
  subText = "hoặc kéo thả ảnh vào đây",
  icon
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'}
        ${loading ? 'opacity-50 pointer-events-none' : ''}
        ${className || 'p-6'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        multiple={multiple}
        accept="image/*"
        className="hidden"
      />
      {icon || <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />}
      <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{text}</span> {subText}
      </p>
      {!className && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          PNG, JPG, GIF up to 10MB
        </p>
      )}
    </div>
  );
}
