import React, { useCallback, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadSection({ onUpload, loading }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(file);
      }
    }
  }, [onUpload]);

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`
        relative overflow-hidden
        border-2 border-dashed rounded-2xl p-12 transition-all duration-300
        flex flex-col items-center justify-center cursor-pointer
        bg-surface/50 backdrop-blur-sm
        ${isDragActive ? 'border-accent-500 bg-accent-500/10' : 'border-gray-600 hover:border-accent-500/50 hover:bg-white/5'}
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload').click()}
    >
      <input 
        id="file-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleChange}
        disabled={loading}
      />
      
      {loading ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
          <p className="text-lg font-medium">Analyzing Image with YOLOv8...</p>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 mb-6 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-500">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Upload Package Image</h3>
          <p className="text-gray-400">Drag & drop your image here, or click to browse</p>
          <div className="mt-6 px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-full font-medium transition-colors">
            Select Image
          </div>
        </>
      )}
    </motion.div>
  );
}
