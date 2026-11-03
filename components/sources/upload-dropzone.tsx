'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { UrlInputModal } from './url-input-modal';

interface UploadDropzoneProps {
  notebookId: string;
  onUploaded: () => void;
}

export function UploadDropzone({ notebookId, onUploaded }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Gagal mengunggah file');
      } else {
        if (json.errors && json.errors.length > 0) {
          setError(json.errors.map((e: any) => e.message).join(', '));
        }
        onUploaded();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold">
              {uploading ? 'Mengunggah file...' : 'Klik atau drag file ke sini'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              PDF, DOCX, Excel, CSV, TXT (Maks. 25 MB)
            </p>
          </div>
        </div>
      </div>

      {/* Add from Link / Google Drive Button */}
      <button
        type="button"
        onClick={() => setUrlModalOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-border/80 bg-card hover:bg-muted/40 hover:border-primary/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
      >
        <LinkIcon className="w-3.5 h-3.5 text-primary" />
        <span>Tambah dari Link / Google Drive</span>
      </button>

      {/* URL Input Modal */}
      <UrlInputModal
        notebookId={notebookId}
        isOpen={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        onUploaded={onUploaded}
      />

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

