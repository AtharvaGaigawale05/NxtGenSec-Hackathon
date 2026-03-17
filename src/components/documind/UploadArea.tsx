import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { extractTextFromPdf } from "@/lib/pdf-extract";

interface UploadAreaProps {
  onUpload: (fileName: string, text: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const UploadArea = ({ onUpload, isOpen, onClose }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("Processing...");
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Max 20MB.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10);
    setStatusText("Reading PDF...");

    try {
      setProgress(30);
      setStatusText("Extracting text...");
      const text = await extractTextFromPdf(file);

      if (!text.trim()) {
        setError("No text found in this PDF. It may be a scanned image.");
        setUploading(false);
        return;
      }

      setProgress(80);
      setStatusText("Preparing document...");

      await new Promise(r => setTimeout(r, 300));
      setProgress(100);
      setStatusText("Done!");

      setTimeout(() => {
        setUploading(false);
        onUpload(file.name, text);
        onClose();
      }, 400);
    } catch (e) {
      setError("Failed to read PDF. Please try another file.");
      setUploading(false);
    }
  }, [onUpload, onClose]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel-strong p-8 w-full max-w-md relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight">Upload Document</h3>
            <p className="text-xs text-muted-foreground mb-6">Drop a PDF to start analyzing</p>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5 glow-indigo"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {uploading ? (
                <>
                  <FileText className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">{statusText}</p>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                    <motion.div
                      className="h-full gradient-accent rounded-full"
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop your PDF here
                  </p>
                  <label className="text-xs text-primary cursor-pointer hover:underline">
                    or browse files
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
