import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { analyzeDocument } from "@/lib/ai-service";

interface SummaryViewProps {
  documentText?: string;
}

export const SummaryView = ({ documentText }: SummaryViewProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentText) { setSummary(null); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    analyzeDocument({ documentText, mode: "summary" })
      .then((content) => { if (!cancelled) setSummary(content); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [documentText]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Generating summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center glow-indigo">
          <span className="text-primary-foreground text-lg">✦</span>
        </div>
        <p className="text-sm text-muted-foreground">Upload a PDF to generate a summary</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3 [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm text-muted-foreground leading-relaxed">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};
