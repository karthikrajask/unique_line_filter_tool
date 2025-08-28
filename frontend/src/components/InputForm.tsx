import React, { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface InputFormProps {
  text: string;
  setText: (t: string) => void;
  setFileName: React.Dispatch<React.SetStateAction<string>>;
  setCsvColumns: React.Dispatch<React.SetStateAction<string[]>>;
}


const InputForm: React.FC<InputFormProps> = ({ text, setText, setCsvColumns }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        const firstLine = content.split(/\r?\n/)[0];
        const headers = firstLine.split(",");
        setCsvColumns(headers.map(h => h.trim()));
      };
      reader.readAsText(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.log') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => setText(e.target?.result as string);
      reader.readAsText(file);
      setCsvColumns([]); // Not CSV → clear headers
    } else {
      alert('Please upload a valid text or CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Input Text
      </h2>
      
      {/* Text Area */}
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here or upload a file below..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg textarea-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-gray-50 ${
          isDragOver ? 'drag-over' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm text-gray-500">
          Supports .txt, .csv, .log, .md files
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.log,.md"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default InputForm;
