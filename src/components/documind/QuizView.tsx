import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, Trophy, HelpCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface QuizViewProps {
  questions: QuizQuestion[];
}

export const QuizView = ({ questions }: QuizViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-14 h-14 gradient-accent rounded-2xl flex items-center justify-center glow-indigo">
          <HelpCircle className="w-7 h-7 text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No quiz yet. Ask the AI to "Generate Quiz" in the Chat tab.
        </p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <Trophy className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Quiz Complete!</h2>
        <div className="text-center">
          <p className="text-4xl font-mono font-bold text-primary">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground mt-1">{pct}% correct</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setCurrentIndex(0); setSelected(null); setScore(0); setAnswered(0); setFinished(false); }}
          className="px-6 py-2.5 rounded-xl gradient-accent text-primary-foreground text-sm font-medium glow-indigo"
        >
          Retry Quiz
        </motion.button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isCorrect = selected === q.correct_answer;
  const showResult = selected !== null;

  const handleSelect = (opt: string) => {
    if (showResult) return;
    setSelected(opt);
    setAnswered((a) => a + 1);
    if (opt === q.correct_answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setSelected(null);
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Question {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-primary">{score}/{answered}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full gradient-accent rounded-full"
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full rounded-2xl bg-secondary/40 border border-border p-8 space-y-6"
        >
          <p className="text-lg text-foreground font-semibold leading-relaxed">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isThisCorrect = opt === q.correct_answer;
              const isThisSelected = opt === selected;

              let cls = "w-full text-left px-5 py-3.5 rounded-xl border text-sm transition-all flex items-center gap-4 ";
              if (!showResult) {
                cls += "border-border/50 bg-secondary/30 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground cursor-pointer";
              } else if (isThisCorrect) {
                cls += "border-success/50 bg-success/10 text-foreground";
              } else if (isThisSelected && !isThisCorrect) {
                cls += "border-destructive/50 bg-destructive/10 text-foreground";
              } else {
                cls += "border-border/30 bg-secondary/20 text-muted-foreground/50";
              }

              return (
                <motion.button
                  key={i}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(opt)}
                  disabled={showResult}
                  className={cls}
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                    {letters[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  <AnimatePresence>
                    {showResult && isThisCorrect && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </motion.span>
                    )}
                    {showResult && isThisSelected && !isThisCorrect && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-5 h-5 text-destructive" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`rounded-xl px-5 py-3 text-sm font-medium ${
                  isCorrect
                    ? "bg-success/10 border border-success/30 text-success"
                    : "bg-destructive/10 border border-destructive/30 text-destructive"
                }`}
              >
                {isCorrect ? "✔ Correct! Well done." : `✖ Incorrect. The answer is: ${q.correct_answer}`}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      {showResult && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-accent text-primary-foreground text-sm font-medium glow-indigo"
        >
          {currentIndex < questions.length - 1 ? "Next Question" : "View Results"} <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
};
