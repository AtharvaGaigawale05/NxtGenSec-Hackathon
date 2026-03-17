import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { analyzeDocument } from "@/lib/ai-service";

interface InsightData {
  summary: string;
  metrics: { label: string; value: string; trend: string }[];
  confidence: number;
}

interface InsightPanelProps {
  documentText?: string;
}

export const InsightPanel = ({ documentText }: InsightPanelProps) => {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentText) { setData(null); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    analyzeDocument({ documentText, mode: "insights" })
      .then((content) => {
        if (cancelled) return;
        try {
          const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          setData(parsed);
        } catch {
          setError("Failed to parse insights");
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [documentText]);

  const trendColor = (trend: string) => {
    if (trend === "positive") return "text-success";
    if (trend === "negative") return "text-danger";
    return "text-primary";
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-4">
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Analyzing document...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center glow-indigo">
              <span className="text-primary-foreground text-lg">✦</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Upload a PDF to see AI-generated insights
            </p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                Document Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.summary}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                Key Insights
              </h3>
              <ul className="space-y-3">
                {data.metrics.map((item) => (
                  <li
                    key={item.label}
                    className="flex justify-between items-center p-3 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${trendColor(item.trend)}`}>
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-primary font-medium mb-2">
                  AI Confidence Score
                </p>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.confidence}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="h-full gradient-accent rounded-full"
                  />
                </div>
                <p className="text-[10px] text-right mt-1.5 text-muted-foreground">
                  {data.confidence}% Accurate
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
