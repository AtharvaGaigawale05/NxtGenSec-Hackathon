import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Brain, BookOpen, Hash, Type } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

interface DocumentAnalyticsProps {
  documentText: string;
}

interface Metric {
  label: string;
  value: string;
  percentage: number;
  icon: typeof BarChart3;
  color: string;
}

export const DocumentAnalytics = ({ documentText }: DocumentAnalyticsProps) => {
  const metrics = useMemo<Metric[]>(() => {
    const words = documentText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = documentText.split(/[.!?]+/).filter((s) => s.trim()).length;
    const paragraphs = documentText.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);
    const avgSentenceLength = wordCount / (sentences || 1);
    const readingTimeMin = Math.ceil(wordCount / 200);

    // Complexity score: based on avg word length and sentence length
    const complexityRaw = Math.min(100, Math.round((avgWordLength - 3) * 15 + (avgSentenceLength - 10) * 2));
    const complexity = Math.max(5, Math.min(95, complexityRaw));

    const complexityLabel =
      complexity < 30 ? "Beginner" : complexity < 60 ? "Intermediate" : "Advanced";

    // AI confidence approximation based on text quality signals
    const confidence = Math.min(98, Math.max(60, Math.round(85 + (wordCount > 500 ? 5 : 0) + (sentences > 10 ? 3 : 0) - (avgSentenceLength > 30 ? 5 : 0))));

    return [
      {
        label: "Document Complexity",
        value: complexityLabel,
        percentage: complexity,
        icon: Brain,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
      {
        label: "Reading Time",
        value: `${readingTimeMin} min`,
        percentage: Math.min(100, (readingTimeMin / 30) * 100),
        icon: Clock,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
      {
        label: "AI Confidence",
        value: `${confidence}%`,
        percentage: confidence,
        icon: BarChart3,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
      {
        label: "Word Count",
        value: wordCount.toLocaleString(),
        percentage: Math.min(100, (wordCount / 10000) * 100),
        icon: Type,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
      {
        label: "Sentences",
        value: sentences.toLocaleString(),
        percentage: Math.min(100, (sentences / 500) * 100),
        icon: Hash,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
      {
        label: "Paragraphs",
        value: paragraphs.toLocaleString(),
        percentage: Math.min(100, (paragraphs / 100) * 100),
        icon: BookOpen,
        color: "from-primary to-[hsl(var(--glow-purple))]",
      },
    ];
  }, [documentText]);

  return (
    <aside className="w-72 flex-shrink-0">
      <GlassPanel className="h-full p-4 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" />
          Document Analytics
        </h3>

        <div className="space-y-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{metric.label}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {metric.value}
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))]"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Analytics computed in real-time
          </p>
        </div>
      </GlassPanel>
    </aside>
  );
};
