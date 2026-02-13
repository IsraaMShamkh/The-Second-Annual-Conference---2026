import React, { useState } from 'react';
import { Upload, Book, FileText } from 'lucide-react';

interface FileUploadOverlayProps {
  onUpload: (content: string, title: string) => void;
}

export const FileUploadOverlay: React.FC<FileUploadOverlayProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file: File) => {
    setIsLoading(true);
    const text = await file.text();
    // In a real app, we'd have a PDF parser here. For this demo, we assume Text/Markdown
    // or we inform the user.
    // If it's a PDF, we might display an error for this frontend-only demo, 
    // BUT strictly, we'll try to read it as text (which works for simple ASCII) or just take the name.
    
    // Simulating "Processing" delay for effect
    setTimeout(() => {
        onUpload(text, file.name);
        setIsLoading(false);
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 bg-opacity-95 backdrop-blur-md">
      <div 
        className={`w-full max-w-xl p-10 border-2 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center space-y-6 ${
          isDragging 
            ? 'border-cyan-500 bg-slate-900/80 scale-105 shadow-2xl shadow-cyan-500/20' 
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
           {isLoading ? (
             <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
           ) : (
             <Book className="w-8 h-8 text-cyan-400" />
           )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {isLoading ? "Analyzing Content..." : "Load Your Book"}
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            Upload your study material (TXT, MD) to initialize ALEXA, your personal voice mentor.
          </p>
        </div>

        {!isLoading && (
            <div className="relative group">
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".txt,.md"
                />
                <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-semibold shadow-lg group-hover:shadow-cyan-500/25 transition-all flex items-center gap-3">
                    <Upload size={20} />
                    <span>Select File</span>
                </button>
            </div>
        )}

        <div className="pt-8 flex items-center gap-4 text-xs text-slate-500 font-mono">
           <span className="flex items-center gap-1"><FileText size={12}/> TXT</span>
           <span className="flex items-center gap-1"><FileText size={12}/> MD</span>
        </div>
      </div>
    </div>
  );
};