import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ZoomIn, ZoomOut, Maximize, X } from "lucide-react";
import { analyzeDocument } from "@/lib/ai-service";

interface MindMapData {
  center: string;
  branches: { label: string; children: string[] }[];
}

interface InteractiveMindMapProps {
  documentText?: string;
}

interface DragNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isCenter: boolean;
  isBranch: boolean;
  parentId?: string;
  branchIndex?: number;
  childIndex?: number;
  collapsed?: boolean;
}

export const InteractiveMindMap = ({ documentText }: InteractiveMindMapProps) => {
  const [data, setData] = useState<MindMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [nodes, setNodes] = useState<DragNode[]>([]);
  const [collapsedBranches, setCollapsedBranches] = useState<Set<number>>(new Set());
  const [tooltip, setTooltip] = useState<{ node: DragNode; explanation: string } | null>(null);
  const [loadingTooltip, setLoadingTooltip] = useState(false);

  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragRef = useRef<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const BRANCH_RADIUS = 220;
  const CHILD_OFFSET = 120;

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
          setCollapsedBranches(new Set());
          setTooltip(null);
        } catch { setError("Failed to parse mind map"); }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentText]);

  // Build nodes from data
  useEffect(() => {
    if (!data) { setNodes([]); return; }
    const built: DragNode[] = [];
    const cx = 500, cy = 500;

    built.push({ id: "center", label: data.center, x: cx, y: cy, isCenter: true, isBranch: false });

    data.branches.forEach((branch, bi) => {
      const angle = (2 * Math.PI / data.branches.length) * bi - Math.PI / 2;
      const bx = cx + Math.cos(angle) * BRANCH_RADIUS;
      const by = cy + Math.sin(angle) * BRANCH_RADIUS;
      built.push({ id: `b${bi}`, label: branch.label, x: bx, y: by, isCenter: false, isBranch: true, parentId: "center", branchIndex: bi });

      if (!collapsedBranches.has(bi)) {
        branch.children.forEach((child, ci) => {
          const spread = ((ci - (branch.children.length - 1) / 2) * 0.3);
          const childAngle = angle + spread;
          const dist = BRANCH_RADIUS + CHILD_OFFSET + ci * 35;
          const ccx = cx + Math.cos(childAngle) * dist;
          const ccy = cy + Math.sin(childAngle) * dist;
          built.push({ id: `b${bi}c${ci}`, label: child, x: ccx, y: ccy, isCenter: false, isBranch: false, parentId: `b${bi}`, branchIndex: bi, childIndex: ci });
        });
      }
    });

    setNodes(built);
  }, [data, collapsedBranches]);

  const connections = useMemo(() => {
    const conns: [string, string][] = [];
    for (const node of nodes) {
      if (node.parentId) conns.push([node.parentId, node.id]);
    }
    return conns;
  }, [nodes]);

  const getNodePos = useCallback((id: string) => {
    const n = nodes.find((n) => n.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  }, [nodes]);

  // Dragging nodes
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragRef.current = { id: nodeId, startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      setNodes((prev) => prev.map((n) =>
        n.id === dragRef.current!.id ? { ...n, x: dragRef.current!.nodeX + dx, y: dragRef.current!.nodeY + dy } : n
      ));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Click node for tooltip
  const handleNodeClick = async (e: React.MouseEvent, node: DragNode) => {
    e.stopPropagation();

    // Toggle collapse for branch nodes
    if (node.isBranch && node.branchIndex !== undefined) {
      setCollapsedBranches((prev) => {
        const next = new Set(prev);
        if (next.has(node.branchIndex!)) next.delete(node.branchIndex!);
        else next.add(node.branchIndex!);
        return next;
      });
      return;
    }

    if (!documentText || node.isCenter) return;

    setTooltip({ node, explanation: "" });
    setLoadingTooltip(true);
    try {
      const content = await analyzeDocument({
        documentText,
        mode: "summary",
      });
      // Use a shorter explanation
      const short = content.split("\n").filter((l) => l.trim()).slice(0, 3).join(" ").slice(0, 200);
      setTooltip({ node, explanation: short || "Key concept from the document." });
    } catch {
      setTooltip({ node, explanation: "Could not load explanation." });
    } finally {
      setLoadingTooltip(false);
    }
  };

  // Pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
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
    <div className="relative w-full h-full min-h-[400px] overflow-hidden" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {[
          { icon: ZoomIn, action: () => setZoom((z) => Math.min(3, z + 0.2)) },
          { icon: ZoomOut, action: () => setZoom((z) => Math.max(0.3, z - 0.2)) },
          { icon: Maximize, action: resetView },
        ].map(({ icon: Icon, action }, i) => (
          <button key={i} onClick={action} className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <span className="flex items-center px-2 text-[10px] text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-3 text-[10px] text-muted-foreground">
        <span>🖱 Drag nodes</span>
        <span>🔍 Scroll to zoom</span>
        <span>📌 Click branch to expand/collapse</span>
      </div>

      {/* Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setTooltip(null)}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: 1000,
            height: 1000,
            position: "relative",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
            flexShrink: 0,
          }}
        >
          {/* Lines */}
          <svg className="absolute inset-0 pointer-events-none" width={1000} height={1000}>
            {connections.map(([fromId, toId], i) => {
              const from = getNodePos(fromId);
              const to = getNodePos(toId);
              return (
                <motion.line
                  key={`${fromId}-${toId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="hsl(var(--primary) / 0.25)"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const hasChildren = node.isBranch && data.branches[node.branchIndex!]?.children.length > 0;
            const isCollapsed = node.isBranch && node.branchIndex !== undefined && collapsedBranches.has(node.branchIndex);

            return (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute flex flex-col items-center cursor-pointer group"
                style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)", zIndex: node.isCenter ? 10 : 5 }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node)}
              >
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  className={`rounded-full mb-1.5 flex-shrink-0 transition-shadow duration-200 ${
                    node.isCenter
                      ? "w-8 h-8 gradient-accent glow-indigo-strong"
                      : node.isBranch
                      ? "w-5 h-5 bg-primary/70 glow-indigo group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.6)]"
                      : "w-3 h-3 bg-primary/40 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                  }`}
                />
                <div
                  className={`bg-secondary border border-border px-3 py-1.5 rounded-lg text-center whitespace-nowrap transition-all group-hover:border-primary/40 group-hover:bg-primary/5 ${
                    node.isCenter
                      ? "text-xs font-bold text-foreground glow-indigo"
                      : node.isBranch
                      ? "text-[11px] font-medium text-muted-foreground"
                      : "text-[10px] text-muted-foreground"
                  }`}
                >
                  {node.label}
                  {hasChildren && (
                    <span className="ml-1 text-primary text-[9px]">
                      {isCollapsed ? `+${data.branches[node.branchIndex!].children.length}` : "−"}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 max-w-sm w-full"
          >
            <div className="glass-panel-strong rounded-xl p-4 border border-primary/20 relative">
              <button onClick={() => setTooltip(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-xs font-bold text-primary mb-1">{tooltip.node.label}</p>
              {loadingTooltip ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{tooltip.explanation}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
