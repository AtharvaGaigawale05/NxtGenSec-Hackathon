import { motion } from "framer-motion";
import {
  MessageSquare,
  FileText,
  Zap,
  Network,
  Upload,
  Plus,
  Cpu,
  Trash2,
  Layers,
  HelpCircle,
} from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { ScrollArea } from "@/components/ui/scroll-area";

export type TabId = "chat" | "summary" | "insights" | "map" | "flashcards" | "quiz";

export interface ConversationEntry {
  id: string;
  title: string;
  documentName?: string;
  timestamp: number;
}

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onUploadClick: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  activeConversationId: string;
  conversations: ConversationEntry[];
  documentName?: string;
}

const navItems: { id: TabId; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "insights", label: "Key Insights", icon: Zap },
  { id: "map", label: "Mind Map", icon: Network },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

export const Sidebar = ({
  activeTab,
  onTabChange,
  onUploadClick,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  activeConversationId,
  conversations,
  documentName,
}: SidebarProps) => (
  <aside className="w-64 flex flex-col gap-4 flex-shrink-0">
    <div className="px-4 py-6 flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center glow-indigo"
      >
        <Cpu className="w-5 h-5 text-primary-foreground" />
      </motion.div>
      <h1 className="text-xl font-bold tracking-tight gradient-title">DocuMind AI</h1>
    </div>

    <GlassPanel className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewConversation}
        className="w-full py-2.5 mb-1 gradient-accent rounded-xl flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm glow-indigo"
      >
        <Plus className="w-4 h-4" /> New Chat
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onUploadClick}
        className="w-full py-3 mb-2 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
          Upload PDF
        </span>
      </motion.button>

      {documentName && (
        <div className="px-3 py-2 mb-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-[10px] text-primary uppercase tracking-widest font-semibold">Active</p>
          <p className="text-xs text-foreground truncate">{documentName}</p>
        </div>
      )}

      {navItems.map((item) => {
        const active = activeTab === item.id;
        return (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              active
                ? "bg-primary/15 text-primary border border-primary/30 glow-indigo"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </motion.button>
        );
      })}

      {conversations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-2 mb-1">
            History
          </p>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 pr-2">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-left ${
                      isActive
                        ? "bg-primary/10 text-foreground border border-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{conv.title}</p>
                      {conv.documentName && (
                        <p className="text-[10px] text-muted-foreground truncate">{conv.documentName}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </GlassPanel>
  </aside>
);
