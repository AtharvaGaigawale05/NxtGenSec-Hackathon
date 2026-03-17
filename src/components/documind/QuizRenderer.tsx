import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: { letter: string; text: string }[];
  correct: string;
}

function parseQuiz(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const sections = content.split(/---+/).filter((s) => s.trim());

  const parseSection = (section: string): QuizQuestion | null => {
    const qMatch = section.match(/\*?\*?Question:\*?\*?\s*([\s\S]*?)(?=\n[A-D]\))/i);
    const optMatches = [...section.matchAll(/([A-D])\)\s*(.*)/g)];
    const correctMatch = section.match(/\*?\*?Correct:\*?\*?\s*([A-D])/i);

    if (qMatch && optMatches.length >= 2 && correctMatch) {
      return {
        question: qMatch[1].trim(),
        options: optMatches.map((m) => ({ letter: m[1], text: m[2].trim() })),
        correct: correctMatch[1].toUpperCase(),
      };
    }
    return null;
  };

  if (sections.length > 1) {
    for (const section of sections) {
      const q = parseSection(section);
      if (q) questions.push(q);
    }
  }

  // Fallback: try splitting by question numbers
  if (questions.length === 0) {
    const byNumber = content.split(/\n(?=\*?\*?Question)/i).filter((s) => s.trim());
    for (const section of byNumber) {
      const q = parseSection(section);
      if (q) questions.push(q);
    }
  }

  return questions;
}

interface QuizRendererProps {
  content: string;
}

const QuizCard = ({
  question,
  index,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  onAnswer: (correct: boolean) => void;
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (letter: string) => {
    if (selected) return;
    setSelected(letter);
    onAnswer(letter === question.correct);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl bg-secondary/40 border border-border p-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg gradient-accent text-primary-foreground text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <p className="text-sm text-foreground font-medium leading-relaxed pt-0.5">
          {question.question}
        </p>
      </div>

      <div className="space-y-2 pl-10">
        {question.options.map((opt) => {
          const isCorrect = opt.letter === question.correct;
          const isSelected = opt.letter === selected;
          const showResult = selected !== null;

          let optClass =
            "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3 ";

          if (!showResult) {
            optClass +=
              "border-border/50 bg-secondary/30 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground cursor-pointer";
          } else if (isCorrect) {
            optClass += "border-success/50 bg-success/10 text-foreground";
          } else if (isSelected && !isCorrect) {
            optClass += "border-destructive/50 bg-destructive/10 text-foreground";
          } else {
            optClass += "border-border/30 bg-secondary/20 text-muted-foreground/50";
          }

          return (
            <motion.button
              key={opt.letter}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(opt.letter)}
              disabled={showResult}
              className={optClass}
            >
              <span className="w-6 h-6 rounded-md bg-secondary/50 border border-border/50 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                {opt.letter}
              </span>
              <span className="flex-1">{opt.text}</span>
              <AnimatePresence>
                {showResult && isCorrect && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </motion.span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <XCircle className="w-4 h-4 text-destructive" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export const QuizRenderer = ({ content }: QuizRendererProps) => {
  const questions = parseQuiz(content);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  if (questions.length === 0) return null;

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    setAnswered((a) => a + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Quiz Mode — {questions.length} Questions
        </p>
        {answered > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
          >
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-primary">
              {score}/{answered}
            </span>
          </motion.div>
        )}
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuizCard key={i} question={q} index={i} onAnswer={handleAnswer} />
        ))}
      </div>
    </div>
  );
};
