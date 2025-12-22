import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, Plus } from 'lucide-react';
import { User } from '../types';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (file: File, priority: 'Normal' | 'High' | 'Urgent') => Promise<void>;
  isUploading: boolean;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onCreate, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onCreate(selectedFile, priority);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">Start New Job</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Design Photo</label>
            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-500 transition-colors group"
              >
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full mb-2 group-hover:bg-indigo-200 transition-colors">
                  <Camera size={24} />
                </div>
                <span className="font-medium text-gray-700">Upload Design</span>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden" 
              accept="image/*"
              capture="environment"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
             <div className="flex gap-2">
               {(['Normal', 'High', 'Urgent'] as const).map((p) => (
                 <button
                   key={p}
                   onClick={() => setPriority(p)}
                   className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
                     priority === p 
                       ? 'bg-indigo-600 text-white border-indigo-600' 
                       : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                   }`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedFile || isUploading}
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            Create Job
          </button>
        </div>
      </div>
    </div>
  );
};