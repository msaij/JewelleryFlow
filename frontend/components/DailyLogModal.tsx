import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Loader2, Sun, Moon, Hammer, CheckCircle } from 'lucide-react';

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: 'Start' | 'End' | 'StartWork' | 'CompleteWork') => Promise<void>;
  isUploading: boolean;
  initialType?: 'Start' | 'End' | 'StartWork' | 'CompleteWork' | null;
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({ isOpen, onClose, onUpload, isUploading, initialType }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logType, setLogType] = useState<'Start' | 'End' | 'StartWork' | 'CompleteWork' | null>(initialType || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or set initial type when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogType(initialType || null);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile && logType) {
      onUpload(selectedFile, logType);
    }
  };

  const getTitle = () => {
    switch (logType) {
      case 'Start': return 'Start Day (Attendance)';
      case 'End': return 'End Day (Attendance)';
      case 'StartWork': return 'Start New Work';
      case 'CompleteWork': return 'Completed Work';
      default: return 'Daily Log';
    }
  };

  const getColorClass = () => {
    switch (logType) {
      case 'Start': return 'bg-orange-600 hover:bg-orange-700 shadow-orange-200';
      case 'End': return 'bg-gray-800 hover:bg-gray-900 shadow-gray-200';
      case 'StartWork': return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200';
      case 'CompleteWork': return 'bg-green-600 hover:bg-green-700 shadow-green-200';
      default: return 'bg-indigo-600';
    }
  };

  const getIconClass = () => {
    switch (logType) {
      case 'Start': return 'bg-orange-100 text-orange-600 group-hover:bg-orange-200';
      case 'End': return 'bg-gray-100 text-gray-600 group-hover:bg-gray-200';
      case 'StartWork': return 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200';
      case 'CompleteWork': return 'bg-green-100 text-green-600 group-hover:bg-green-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* If for some reason type isn't set, we show fallback buttons, but UI flow usually sets it */}
          {!logType ? (
            <div className="text-center text-gray-500">Please select an action from the dashboard.</div>
          ) : (
            <>
              {!previewUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-500 transition-colors group"
                >
                  <div className={`p-4 rounded-full mb-3 transition-colors ${getIconClass()}`}>
                    <Camera size={32} />
                  </div>
                  <span className="font-medium text-gray-700">Take Photo</span>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </>
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

        {logType && (
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
              className={`flex-1 py-3 px-4 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 ${getColorClass()}`}
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Upload size={20} />
                  Upload
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};