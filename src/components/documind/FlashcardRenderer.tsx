import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface Flashcard {
  question: string;
  answer: string;
}

function parseFlashcards(content: string): Flashcard[] {
  const cards: Flashcard[] = [];
  const sections = content.split(/---+/).filter((s) => s.trim());

  for (const section of sections) {
    const qMatch = section.match(/\*?\*?Q:\*?\*?\s*([\s\S]*?)(?=\*?\*?A:\*?\*?)/i);
    const aMatch = section.match(/\*?\*?A:\*?\*?\s*([\s\S]*?)$/i);
    if (qMatch && aMatch) {
      cards.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      });
    }
  }

  // Fallback: try line-by-line Q/A pairs
  if (cards.length === 0) {
    const lines = content.split("\n");
    let currentQ = "";
    for (const line of lines) {
      const qLine = line.match(/\*?\*?Q:\*?\*?\s*(.*)/i);
      const aLine = line.match(/\*?\*?A:\*?\*?\s*(.*)/i);
      if (qLine) currentQ = qLine[1].trim();
      if (aLine && currentQ) {
        cards.push({ question: currentQ, answer: aLine[1].trim() });
        currentQ = "";
      }
    }
  }

  return cards;
}

interface FlashcardRendererProps {
  content: string;
}

const FlashcardCard = ({ card, index }: { card: Flashcard; index: number }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer"
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative h-44 w-full"
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl bg-secondary/60 border border-border p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
              Card {index + 1}
            </span>
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">{card.question}</p>
          <p className="text-[10px] text-muted-foreground">Click to flip</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/30 p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
              Answer
            </span>
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed">{card.answer}</p>
          <p className="text-[10px] text-muted-foreground">Click to flip back</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FlashcardRenderer = ({ content }: FlashcardRendererProps) => {
  const cards = parseFlashcards(content);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        {cards.length} Flashcards Generated
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <FlashcardCard key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  );
};
