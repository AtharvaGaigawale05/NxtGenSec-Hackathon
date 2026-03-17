import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are DocuMind AI, an intelligent document analysis assistant. You have been given the full text of a document. Answer user questions about the document accurately, concisely, and helpfully. Reference specific parts of the document when relevant. If the answer isn't in the document, say so. When referencing specific information, include "(Source: Page X)" where X is your best estimate of the page number based on the document structure.`,

  studyChat: `You are DocuMind AI, an intelligent study assistant. You have been given the full text of a document. For EVERY response, structure your answer with these sections:

## 📝 Summary
A brief 2-3 sentence summary of the answer.

## 🔑 Key Points
- Key point 1
- Key point 2
- Key point 3
(add more as needed)

## 💡 Remember
A memorable tip, mnemonic, or key takeaway related to the content.

When referencing specific information, include "(Source: Page X)" where X is your best estimate based on document structure.`,

  summary: `You are DocuMind AI. Generate a comprehensive but concise summary of the provided document. Structure it with:
- A brief overview (2-3 sentences)
- Key points (bullet points)
- Important figures/data mentioned
- Conclusion/takeaways
Format using markdown.`,

  insights: `You are DocuMind AI. Extract key insights from the provided document. Return a JSON object with this exact structure:
{
  "summary": "A 2-3 sentence overview of the document",
  "metrics": [
    {"label": "Metric Name", "value": "value", "trend": "positive|negative|neutral"}
  ],
  "confidence": 85
}
Return ONLY valid JSON, no markdown formatting.`,

  mindmap: `You are DocuMind AI. Analyze the document and create a mind map structure. Return a JSON object with this exact structure:
{
  "center": "Main Topic",
  "branches": [
    {
      "label": "Branch Label",
      "children": ["Child 1", "Child 2"]
    }
  ]
}
Create 4-6 main branches with 2-3 children each. Return ONLY valid JSON, no markdown formatting.`,

  flashcards: `You are DocuMind AI. Generate exactly 5 flashcards based on the key concepts in the provided document. Return a JSON array with this exact structure:
[
  {"question": "Question based on the document", "answer": "Short clear answer derived from the document"},
  {"question": "Another key concept question", "answer": "Relevant explanation from the document"},
  {"question": "Important topic mentioned in the document", "answer": "Clear summarized explanation"},
  {"question": "Concept explained in the document", "answer": "Relevant answer"},
  {"question": "Key takeaway from the document", "answer": "Concise explanation"}
]
Rules:
- Always generate exactly 5 flashcards
- Questions must come from the uploaded document content
- Answers must be concise (1-2 sentences max)
- Return ONLY valid JSON array, no markdown formatting, no code fences`,

  quiz: `You are DocuMind AI. Generate exactly 5 multiple-choice quiz questions based on the provided document. Return a JSON array with this exact structure:
[
  {
    "question": "What is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A"
  }
]
Rules:
- Generate exactly 5 questions
- Each question must have exactly 4 options
- One option must be the correct answer and must match exactly one of the options
- Questions must be derived from the uploaded document content
- Return ONLY valid JSON array, no markdown formatting, no code fences`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentText, messages, mode, studyMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let promptKey = mode || "chat";
    if (mode === "chat" && studyMode) {
      promptKey = "studyChat";
    }

    const systemPrompt = SYSTEM_PROMPTS[promptKey] || SYSTEM_PROMPTS.chat;
    const docContext = documentText ? `\n\nDOCUMENT CONTENT:\n${documentText.slice(0, 30000)}` : "";

    const aiMessages = [
      { role: "system", content: systemPrompt + docContext },
      ...(messages || [{ role: "user", content: promptKey === "summary" ? "Summarize this document" : promptKey === "insights" ? "Extract key insights" : promptKey === "mindmap" ? "Create a mind map" : promptKey === "flashcards" ? "Generate flashcards from this document" : promptKey === "quiz" ? "Generate quiz questions from this document" : "Analyze this document" }]),
    ];

    const stream = mode === "chat";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
