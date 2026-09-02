import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X, Check, Sparkles, Link } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

interface ImageDropzoneProps {
  currentImage?: string;
  onImageSelected: (base64OrUrl: string) => void;
  onImageRemoved: () => void;
  catalogImage?: string;
  label?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  currentImage,
  onImageSelected,
  onImageRemoved,
  catalogImage,
  label = 'Imagen / Creativo del Anuncio Meta'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImage(file, 400, 400, 0.65);
      onImageSelected(compressed);
    } catch (err) {
      console.error('Error procesando imagen:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            setIsProcessing(true);
            const compressed = await compressImage(file);
            onImageSelected(compressed);
          } catch (err) {
            console.error('Error procesando captura pegada:', err);
          } finally {
            setIsProcessing(false);
          }
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
        </label>
        
        <div className="flex items-center gap-2">
          {catalogImage && !currentImage && (
            <button
              type="button"
              onClick={() => onImageSelected(catalogImage)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              title="Usar la foto del producto de inventario"
            >
              <Sparkles className="w-3 h-3" />
              <span>Usar foto de producto</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsUrlInputOpen(!isUrlInputOpen)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Link className="w-3 h-3" />
            <span>{isUrlInputOpen ? 'Ocultar URL' : 'Pegar Link'}</span>
          </button>
        </div>
      </div>

      {isUrlInputOpen && (
        <div className="flex gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
          <input
            type="url"
            placeholder="https://ejemplo.com/creativo-anuncio.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-white border border-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                onImageSelected(urlInput.trim());
                setUrlInput('');
                setIsUrlInputOpen(false);
              }
            }}
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Usar Link
          </button>
        </div>
      )}

      {currentImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shadow-sm max-h-48 flex items-center justify-center">
          <img
            src={currentImage}
            alt="Creativo de Anuncio"
            className="max-h-48 w-full object-contain bg-slate-950/40"
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={onImageRemoved}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          </div>
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold backdrop-blur-xs">
            ✓ Imagen cargada
          </span>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-100/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {isProcessing ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2 text-slate-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">Procesando y optimizando imagen...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <Upload className="w-4 h-4 stroke-[2.5]" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Arrastra o haz clic para subir la captura / foto del creativo
              </p>
              <p className="text-[11px] text-slate-500">
                Puedes pegar directamente con <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+V</kbd>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
