import React, { useState } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
}

export const PhotoUploadModal: React.FC<Props> = ({ isOpen, title, onClose, onConfirm }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    await onConfirm(file);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="p-6">
          {!preview ? (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera size={32} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Take Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
            </label>
          ) : (
            <div className="relative">
              <img src={preview} className="w-full h-48 object-cover rounded-xl" />
              <button 
                onClick={() => { setFile(null); setPreview(''); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
          <button 
            disabled={!file || loading}
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};