import { useState } from "react";
import { motion } from "framer-motion";
import { Send, BookOpen } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  suggestions: string[];
  studyMode: boolean;
  onToggleStudyMode: () => void;
}

export const ChatInput = ({ onSend, suggestions, studyMode, onToggleStudyMode }: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="p-6 bg-gradient-to-t from-background to-transparent">
      <div className="max-w-3xl mx-auto relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={studyMode ? "Ask in Study Mode..." : "Ask DocuMind anything..."}
          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-6 pr-28 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleStudyMode}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              studyMode
                ? "gradient-accent glow-indigo text-primary-foreground"
                : "bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
            title={studyMode ? "Study Mode ON" : "Study Mode OFF"}
          >
            <BookOpen className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center glow-indigo transition-shadow"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </motion.button>
        </div>
      </div>

      {studyMode && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mt-2"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
            <BookOpen className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">
              Study Mode — Responses include summaries, key points & learning tips
            </span>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center gap-2 mt-3 flex-wrap max-w-3xl mx-auto">
        {suggestions.map((q) => (
          <motion.button
            key={q}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSend(q)}
            className="text-[10px] px-3 py-1.5 rounded-full bg-secondary/40 border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all"
          >
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
