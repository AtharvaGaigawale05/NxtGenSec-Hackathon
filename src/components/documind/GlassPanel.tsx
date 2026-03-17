import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel = ({ children, className }: GlassPanelProps) => (
  <div className={cn("glass-panel", className)}>
    {children}
  </div>
);
