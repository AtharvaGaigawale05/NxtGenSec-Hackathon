import { useState, useCallback, useRef, useEffect } from "react";
import { Share2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Sidebar, type TabId, type ConversationEntry } from "@/components/documind/Sidebar";
import { GlassPanel } from "@/components/documind/GlassPanel";
import { ChatMessage, TypingIndicator } from "@/components/documind/ChatMessage";
import { ChatInput } from "@/components/documind/ChatInput";
import { InsightPanel } from "@/components/documind/InsightPanel";
import { InteractiveMindMap } from "@/components/documind/InteractiveMindMap";
import { SummaryView } from "@/components/documind/SummaryView";
import { UploadArea } from "@/components/documind/UploadArea";
import { DocumentAnalytics } from "@/components/documind/DocumentAnalytics";
import { FlashcardView } from "@/components/documind/FlashcardView";
import { QuizView } from "@/components/documind/QuizView";
import { streamChat, analyzeDocument } from "@/lib/ai-service";
import { toast } from "sonner";

interface Message {
  role: "user" | "ai";
  content: string;
  type?: "flashcards" | "quiz";
}

interface Flashcard {
  question: string;
  answer: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface Conversation {
  id: string;
  title: string;
  documentName?: string;
  documentText: string;
  messages: Message[];
  timestamp: number;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key findings?",
  "Explain the main topics",
  "Generate Flashcards",
  "Generate Quiz",
];

const DEFAULT_MSG: Message = {
  role: "ai",
  content:
    "Hello! Upload a PDF document and I'll help you analyze it. You can ask questions, get summaries, extract insights, and generate mind maps.",
};

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    documentName: undefined,
    documentText: "",
    messages: [DEFAULT_MSG],
    timestamp: Date.now(),
    flashcards: [],
    quizQuestions: [],
  };
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [showUpload, setShowUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingTypeRef = useRef<"flashcards" | "quiz" | undefined>();

  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id ?? "");

  const active = conversations.find((c) => c.id === activeId)!;
  const messages = active.messages;
  const documentName = active.documentName;
  const documentText = active.documentText;

  const updateActive = useCallback(
    (updater: (conv: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c)));
    },
    [activeId]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Generate flashcards via dedicated mode
  const generateFlashcards = useCallback(async () => {
    if (!documentText) { toast.error("Please upload a PDF first"); return; }

    updateActive((c) => ({
      ...c,
      messages: [...c.messages, { role: "user", content: "Generate Flashcards" }, { role: "ai", content: "Generating flashcards from your document..." }],
    }));
    setIsTyping(true);

    try {
      const content = await analyzeDocument({ documentText, mode: "flashcards" });
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      const cards: Flashcard[] = JSON.parse(cleaned);
      updateActive((c) => ({
        ...c,
        flashcards: cards,
        messages: [...c.messages.slice(0, -1), { role: "ai", content: `✅ ${cards.length} flashcards generated! Open the **Flashcards** tab to study them.` }],
      }));
      toast.success("Flashcards ready! Switch to the Flashcards tab.");
    } catch {
      updateActive((c) => ({
        ...c,
        messages: [...c.messages.slice(0, -1), { role: "ai", content: "Failed to generate flashcards. Please try again." }],
      }));
      toast.error("Failed to generate flashcards");
    } finally {
      setIsTyping(false);
    }
  }, [documentText, updateActive]);

  // Generate quiz via dedicated mode
  const generateQuiz = useCallback(async () => {
    if (!documentText) { toast.error("Please upload a PDF first"); return; }

    updateActive((c) => ({
      ...c,
      messages: [...c.messages, { role: "user", content: "Generate Quiz" }, { role: "ai", content: "Generating quiz questions from your document..." }],
    }));
    setIsTyping(true);

    try {
      const content = await analyzeDocument({ documentText, mode: "quiz" });
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      const questions: QuizQuestion[] = JSON.parse(cleaned);
      updateActive((c) => ({
        ...c,
        quizQuestions: questions,
        messages: [...c.messages.slice(0, -1), { role: "ai", content: `✅ ${questions.length} quiz questions generated! Open the **Quiz** tab to test yourself.` }],
      }));
      toast.success("Quiz ready! Switch to the Quiz tab.");
    } catch {
      updateActive((c) => ({
        ...c,
        messages: [...c.messages.slice(0, -1), { role: "ai", content: "Failed to generate quiz. Please try again." }],
      }));
      toast.error("Failed to generate quiz");
    } finally {
      setIsTyping(false);
    }
  }, [documentText, updateActive]);

  const handleSend = useCallback(
    (text: string) => {
      // Intercept flashcard/quiz generation
      const lower = text.toLowerCase().trim();
      if (lower.includes("generate flashcard")) { generateFlashcards(); return; }
      if (lower.includes("generate quiz")) { generateQuiz(); return; }

      if (!documentText) {
        toast.error("Please upload a PDF first");
        return;
      }

      const messageType = pendingTypeRef.current;
      pendingTypeRef.current = undefined;

      updateActive((c) => ({
        ...c,
        messages: [...c.messages, { role: "user", content: text }],
        title: c.title === "New Chat" ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title,
      }));
      setIsTyping(true);
      scrollToBottom();

      const chatHistory = messages
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({
          role: (m.role === "ai" ? "assistant" : "user") as "user" | "assistant",
          content: m.content,
        }));
      chatHistory.push({ role: "user", content: text });

      let assistantContent = "";

      streamChat({
        documentText,
        messages: chatHistory,
        studyMode,
        onDelta: (chunk) => {
          assistantContent += chunk;
          const content = assistantContent;
          const type = messageType;
          updateActive((c) => {
            const last = c.messages[c.messages.length - 1];
            if (last?.role === "ai" && content.startsWith(last.content.slice(0, 10))) {
              return { ...c, messages: [...c.messages.slice(0, -1), { role: "ai", content, type }] };
            }
            return { ...c, messages: [...c.messages, { role: "ai", content, type }] };
          });
          scrollToBottom();
        },
        onDone: () => { setIsTyping(false); scrollToBottom(); },
        onError: (error) => { setIsTyping(false); toast.error(error); },
      });
    },
    [scrollToBottom, documentText, messages, updateActive, studyMode, generateFlashcards, generateQuiz]
  );

  const handleToolbarAction = useCallback(
    (prompt: string, type?: "flashcards" | "quiz") => {
      if (type === "flashcards") { generateFlashcards(); return; }
      if (type === "quiz") { generateQuiz(); return; }
      pendingTypeRef.current = type;
      handleSend(prompt);
    },
    [handleSend, generateFlashcards, generateQuiz]
  );

  const handleUpload = useCallback(
    (name: string, text: string) => {
      updateActive((c) => ({
        ...c,
        documentName: name,
        documentText: text,
        title: c.title === "New Chat" ? name : c.title,
        messages: [
          {
            role: "ai",
            content: `I've successfully processed '${name}' (${Math.round(text.length / 1000)}K characters extracted). What would you like to know about this document?`,
          },
        ],
      }));
    },
    [updateActive]
  );

  const handleNewConversation = useCallback(() => {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setActiveTab("chat");
    toast.success("New conversation started");
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setActiveTab("chat");
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          const fresh = createConversation();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) setActiveId(filtered[0].id);
        return filtered;
      });
    },
    [activeId]
  );

  const handleExport = useCallback(
    (type: "summary" | "chat") => {
      const content =
        type === "summary"
          ? messages.filter((m) => m.role === "ai").map((m) => m.content).join("\n\n---\n\n")
          : messages.map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`).join("\n\n");
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documind-${type}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded successfully!");
    },
    [messages]
  );

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const conversationEntries: ConversationEntry[] = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    documentName: c.documentName,
    timestamp: c.timestamp,
  }));

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role}
                content={m.content}
                type={m.type}
                onToolbarAction={m.role === "ai" ? handleToolbarAction : undefined}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        );
      case "map":
        return <InteractiveMindMap documentText={documentText || undefined} />;
      case "summary":
        return <SummaryView documentText={documentText || undefined} />;
      case "insights":
        return <InsightPanel documentText={documentText || undefined} />;
      case "flashcards":
        return <FlashcardView cards={active.flashcards} />;
      case "quiz":
        return <QuizView questions={active.quizQuestions} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex p-4 gap-4 selection:bg-primary/30">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadClick={() => setShowUpload(true)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeConversationId={activeId}
        conversations={conversationEntries}
        documentName={documentName}
      />

      <main className="flex-1 flex flex-col gap-4 min-w-0">
        <GlassPanel className="flex-1 relative flex flex-col overflow-hidden">
          <div className="px-8 py-4 border-b border-border flex justify-between items-center bg-card/20">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {documentName || "No document loaded"}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {documentName
                  ? `Active Session • ${Math.round(documentText.length / 1000)}K chars`
                  : "Upload a PDF to begin"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {documentText && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-[11px]"
                  onClick={() => handleExport("chat")}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {renderContent()}
          </div>

          {activeTab === "chat" && (
            <ChatInput
              onSend={handleSend}
              suggestions={SUGGESTIONS}
              studyMode={studyMode}
              onToggleStudyMode={() => setStudyMode((s) => !s)}
            />
          )}
        </GlassPanel>
      </main>

      {documentText && <DocumentAnalytics documentText={documentText} />}

      <UploadArea
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default Index;
