import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Layers } from "lucide-react";

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewProps {
  cards: Flashcard[];
}

export const FlashcardView = ({ cards }: FlashcardViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-14 h-14 gradient-accent rounded-2xl flex items-center justify-center glow-indigo">
          <Layers className="w-7 h-7 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No flashcards yet. Ask the AI to "Generate Flashcards" in the Chat tab.
        </p>
      </div>
    );
  }

  const card = cards[currentIndex];

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex((i) => i + 1), 150);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex((i) => i - 1), 150);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Card {currentIndex + 1} / {cards.length}
        </span>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFlipped(false); setTimeout(() => setCurrentIndex(i), 150); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-primary glow-indigo scale-125" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          onClick={() => setFlipped(!flipped)}
          className="cursor-pointer select-none"
          style={{ perspective: 1200 }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 25 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative"
          >
            {/* Front */}
            <div
              className="w-[460px] h-[280px] rounded-2xl bg-secondary/60 border border-border p-8 flex flex-col justify-between"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                  Question
                </span>
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-base text-foreground font-medium leading-relaxed break-words overflow-y-auto"
                 style={{ wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal", maxHeight: "160px" }}>
                {card.question}
              </p>
              <p className="text-[10px] text-muted-foreground text-center">Click to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 w-[460px] h-[280px] rounded-2xl bg-primary/10 border border-primary/30 p-8 flex flex-col justify-between"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                  Answer
                </span>
                <RotateCcw className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed break-words overflow-y-auto"
                 style={{ wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal", maxHeight: "160px" }}>
                {card.answer}
              </p>
              <p className="text-[10px] text-muted-foreground text-center">Click to flip back</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-accent text-primary-foreground text-sm font-medium glow-indigo disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
