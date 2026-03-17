import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ResponseToolbar } from "./ResponseToolbar";
import { FlashcardRenderer } from "./FlashcardRenderer";
import { QuizRenderer } from "./QuizRenderer";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  type?: "flashcards" | "quiz";
  onToolbarAction?: (prompt: string, type?: "flashcards" | "quiz") => void;
}

export const ChatMessage = ({ role, content, type, onToolbarAction }: ChatMessageProps) => {
  const isFlashcards = type === "flashcards";
  const isQuiz = type === "quiz";
  const showSpecialRenderer = role === "ai" && (isFlashcards || isQuiz);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-6`}
    >
      <div
        className={`max-w-[85%] px-5 py-3.5 text-sm leading-relaxed ${
          role === "user"
            ? "gradient-accent text-primary-foreground rounded-2xl rounded-tr-sm"
            : "bg-secondary text-secondary-foreground border border-border rounded-2xl rounded-tl-sm"
        }`}
      >
        {role === "ai" ? (
          <>
            {showSpecialRenderer ? (
              <>
                {isFlashcards && <FlashcardRenderer content={content} />}
                {isQuiz && <QuizRenderer content={content} />}
              </>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>p:last-child]:mb-0">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            {onToolbarAction && content.length > 20 && (
              <ResponseToolbar onAction={onToolbarAction} />
            )}
          </>
        ) : (
          content
        )}
      </div>
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start mb-6"
  >
    <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot-1" />
      <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot-2" />
      <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot-3" />
    </div>
  </motion.div>
);
