import React, { useState, useRef } from 'react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { UploadCloud, Loader2, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemove = () => {
    // Only clear input from form state; do NOT delete the underlying CDN asset
    // to protect cloned products, orders, and avoid accidental data loss!
    onChange('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Converting & uploading WebP image...');

    try {
      const uploadedUrl = await uploadToCloudinary(file);
      onChange(uploadedUrl);
      toast.success('WebP image uploaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
        >
          {showUrlInput ? 'Switch to Upload' : 'Paste Direct URL'}
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://res.cloudinary.com/..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-gray-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button Box */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 flex items-center justify-center gap-2 p-3 bg-gray-900 hover:bg-gray-800/80 border-2 border-dashed rounded-2xl transition group ${
              value ? 'border-emerald-500/50 text-emerald-300' : 'border-gray-700 hover:border-emerald-500 text-gray-400'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">Uploading Image...</span>
              </>
            ) : value ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-200">Change Image (Uploaded)</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Click to Upload from Device</span>
              </>
            )}
          </button>

          {/* Preview Thumbnail */}
          {value && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-950 border border-gray-700 flex-shrink-0 group">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/logo.webp';
                }}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {helpText && <p className="text-[10px] text-gray-500">{helpText}</p>}
    </div>
  );
};
