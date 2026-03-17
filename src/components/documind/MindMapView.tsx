import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { analyzeDocument } from "@/lib/ai-service";

interface MindMapData {
  center: string;
  branches: { label: string; children: string[] }[];
}

interface MindMapViewProps {
  documentText?: string;
}

interface NodeInfo {
  id: string;
  label: string;
  x: number;
  y: number;
  isCenter: boolean;
  isBranch: boolean;
}

export const MindMapView = ({ documentText }: MindMapViewProps) => {
  const [data, setData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!documentText) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyzeDocument({ documentText, mode: "mindmap" })
      .then((content) => {
        if (cancelled) return;
        try {
          const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
          setData(JSON.parse(cleaned));
          setZoom(1);
          setPan({ x: 0, y: 0 });
        } catch { setError("Failed to parse mind map"); }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentText]);

  const { nodes, connections, canvasSize } = useMemo(() => {
    if (!data) return { nodes: [], connections: [], canvasSize: 0 };

    const allNodes: NodeInfo[] = [];
    const allConns: [number, number, number, number][] = [];

    const branchCount = data.branches.length;
    const BRANCH_RADIUS = 200;
    const CHILD_OFFSET = 100;
    const CHILD_SPACING = 55;
    const maxChildren = Math.max(...data.branches.map(b => b.children.length), 0);
    const size = (BRANCH_RADIUS + CHILD_OFFSET + maxChildren * CHILD_SPACING) * 2 + 100;
    const center = size / 2;

    // Center node
    allNodes.push({ id: "center", label: data.center, x: center, y: center, isCenter: true, isBranch: false });

    // Branches radiate outward from center
    data.branches.forEach((branch, bi) => {
      const angle = (2 * Math.PI / branchCount) * bi - Math.PI / 2;
      const bx = center + Math.cos(angle) * BRANCH_RADIUS;
      const by = center + Math.sin(angle) * BRANCH_RADIUS;

      allNodes.push({ id: `b${bi}`, label: branch.label, x: bx, y: by, isCenter: false, isBranch: true });
      allConns.push([center, center, bx, by]);

      // Children extend further out along the same angle
      branch.children.forEach((child, ci) => {
        const spread = ((ci - (branch.children.length - 1) / 2) * 0.25);
        const childAngle = angle + spread;
        const dist = BRANCH_RADIUS + CHILD_OFFSET + ci * 30;
        const cx = center + Math.cos(childAngle) * dist;
        const cy = center + Math.sin(childAngle) * dist;

        allNodes.push({ id: `b${bi}c${ci}`, label: child, x: cx, y: cy, isCenter: false, isBranch: false });
        allConns.push([bx, by, cx, cy]);
      });
    });

    return { nodes: allNodes, connections: allConns, canvasSize: size };
  }, [data]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.2, Math.min(3, z + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Generating mind map...</p>
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center glow-indigo">
          <span className="text-primary-foreground text-lg">✦</span>
        </div>
        <p className="text-sm text-muted-foreground">Upload a PDF to generate a mind map</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={resetView} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Maximize className="w-4 h-4" />
        </button>
        <span className="flex items-center px-2 text-[10px] text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: canvasSize,
            height: canvasSize,
            position: "relative",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
            flexShrink: 0,
          }}
        >
          <svg className="absolute inset-0 pointer-events-none" width={canvasSize} height={canvasSize}>
            {connections.map(([x1, y1, x2, y2], i) => (
              <motion.line
                key={i}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="hsl(239 84% 67% / 0.25)"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 150, damping: 14 }}
              className="absolute flex flex-col items-center"
              style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
            >
              <div
                className={`rounded-full mb-1.5 flex-shrink-0 ${
                  node.isCenter
                    ? "w-7 h-7 gradient-accent glow-indigo-strong"
                    : node.isBranch
                    ? "w-4 h-4 bg-primary/70 glow-indigo"
                    : "w-2.5 h-2.5 bg-primary/40"
                }`}
              />
              <div
                className={`bg-secondary border border-border px-3 py-1.5 rounded-lg text-center whitespace-nowrap ${
                  node.isCenter
                    ? "text-xs font-bold text-foreground glow-indigo"
                    : node.isBranch
                    ? "text-[11px] font-medium text-muted-foreground"
                    : "text-[10px] text-muted-foreground"
                }`}
              >
                {node.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
