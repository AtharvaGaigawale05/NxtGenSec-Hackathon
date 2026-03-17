import { motion } from "framer-motion";
import { Lightbulb, Globe, BookOpen, Layers, HelpCircle } from "lucide-react";

interface ToolbarAction {
  label: string;
  icon: typeof Lightbulb;
  prompt: string;
  type?: "flashcards" | "quiz";
}

const ACTIONS: ToolbarAction[] = [
  {
    label: "Explain Simply",
    icon: Lightbulb,
    prompt: "Explain the above response in very simple terms for a beginner.",
  },
  {
    label: "Real World Examples",
    icon: Globe,
    prompt: "Provide real world examples for the concepts explained above.",
  },
  {
    label: "Study Notes",
    icon: BookOpen,
    prompt: "Convert the above explanation into structured bullet point study notes.",
  },
  {
    label: "Flashcards",
    icon: Layers,
    prompt:
      "Generate flashcards based on the above information. Create 5-8 flashcards. For each flashcard use exactly this format:\n\n**Q:** [question here]\n**A:** [answer here]\n\n---\n\nDo not add any extra text before or after the flashcards.",
    type: "flashcards",
  },
  {
    label: "Quiz",
    icon: HelpCircle,
    prompt:
      "Create 5 multiple choice quiz questions based on the above content. For each question use exactly this format:\n\n**Question:** [question text]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\n**Correct:** [letter]\n\n---\n\nDo not add any extra text before or after the questions.",
    type: "quiz",
  },
];

interface ResponseToolbarProps {
  onAction: (prompt: string, type?: "flashcards" | "quiz") => void;
}

export const ResponseToolbar = ({ onAction }: ResponseToolbarProps) => (
  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
    {ACTIONS.map((action) => (
      <motion.button
        key={action.label}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onAction(action.prompt, action.type)}
        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)] transition-all"
      >
        <action.icon className="w-3 h-3" />
        {action.label}
      </motion.button>
    ))}
  </div>
);
