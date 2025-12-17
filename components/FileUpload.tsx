import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
        isLoading 
          ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
          : 'border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer'
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={!isLoading ? handleClick : undefined}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-white rounded-full shadow-sm">
          {isLoading ? (
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isLoading ? 'Processing...' : 'Upload your Excel File'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag & drop or click to browse (.xlsx)
          </p>
        </div>

        {!isLoading && (
          <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
            Select File
          </button>
        )}
      </div>
    </div>
  );
};