import React, { useState, useRef, useEffect } from "react";
import { Input, Spin, Tooltip } from "antd";
import { IconSparkles, IconX, IconSend, IconTrash } from "@tabler/icons-react";
import { sendAIChatMessage, type ChatMessage } from "@/actions/aiActions";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAIChat } from "@/contexts/AIChatContext";

interface DisplayMessage {
  role: "user" | "model";
  text: string;
}

export default function AIChatModal() {
  const { contextData, contextTitle } = useAIChat();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("ai_chat_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          console.error("Failed to parse chat history");
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Markdown custom renderers for tables
  const markdownComponents: Components = {
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm whitespace-nowrap">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50 text-gray-700 font-semibold">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-gray-200 bg-white text-gray-600">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-gray-50 transition-colors">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 font-semibold">{children}</th>
    ),
    td: ({ children }) => <td className="px-4 py-3">{children}</td>,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
      >
        {children}
      </a>
    ),
  };

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newUserMsg: DisplayMessage = { role: "user", text: trimmed };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Build Gemini-compatible history
    const history: ChatMessage[] = updatedMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const responseText = await sendAIChatMessage(contextData, history);
      setMessages((prev) => [...prev, { role: "model", text: responseText }]);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `❌ Sorry, something went wrong: ${err.message ?? "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    sessionStorage.removeItem("ai_chat_history");
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <Tooltip title={open ? "" : "Ask AI"} placement="left">
        <button
          id="ai-chat-fab"
          onClick={() => setOpen((prev) => !prev)}
          className={`
            fixed bottom-6 right-6 z-9999 
            w-14 h-14 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${
              open
                ? "bg-black text-white scale-100 rotate-90"
                : "bg-black text-white hover:scale-110 hover:shadow-green-500/30"
            }
          `}
          aria-label={open ? "Close AI Chat" : "Open AI Chat"}
        >
          {open ? (
            <IconX size={22} stroke={2.5} />
          ) : (
            <IconSparkles size={22} stroke={2} />
          )}
        </button>
      </Tooltip>

      {/* Chat Panel */}
      <div
        className={`
          fixed z-9998 bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"}
          ${
            isMaximized
              ? "inset-4 rounded-3xl border border-gray-200 max-w-[1200px] mx-auto w-full max-h-[90vh] my-auto"
              : "bottom-24 right-6 w-[380px] max-w-[calc(100vw-24px)] rounded-3xl border border-gray-100 h-[540px]"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <IconSparkles size={18} stroke={1.5} className="text-white" />
            </div>
            <div>
              <p className="m-0 font-bold text-gray-900 text-sm leading-tight">
                NeverBe AI
              </p>
              <p className="m-0 text-[10px] text-gray-400 font-medium">
                Context:{" "}
                <span className="text-black font-semibold">{contextTitle}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Tooltip title="Clear chat">
                <button
                  onClick={handleClear}
                  className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                  <IconTrash size={16} />
                </button>
              </Tooltip>
            )}
            <Tooltip title={isMaximized ? "Minimize" : "Maximize"}>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMaximized ? (
                    <>
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </>
                  ) : (
                    <>
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </>
                  )}
                </svg>
              </button>
            </Tooltip>
            <button
              onClick={() => {
                setOpen(false);
                setIsMaximized(false);
              }}
              className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                <IconSparkles
                  size={28}
                  stroke={1.5}
                  className="text-gray-400"
                />
              </div>
              <div>
                <p className="m-0 font-semibold text-gray-700 text-sm">
                  How can I help you?
                </p>
                <p className="m-0 text-gray-400 text-xs mt-1 leading-relaxed">
                  Ask me anything about your orders, products, reports, or
                  business data.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {[
                  "Show me top products",
                  "Summarize recent orders",
                  "Low stock items?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors bg-white hover:bg-gray-50 font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <IconSparkles size={13} stroke={1.5} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-black text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100"
                }`}
              >
                {msg.role === "model" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    className="prose prose-sm prose-p:leading-relaxed prose-headings:font-semibold"
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <span>{msg.text}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <IconSparkles size={13} stroke={1.5} className="text-white" />
              </div>
              <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <Spin size="small" />
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-black focus-within:bg-white transition-all">
            <Input.TextArea
              id="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              variant="borderless"
              className="flex-1 bg-transparent resize-none text-sm"
              style={{ padding: 0, background: "transparent" }}
              disabled={loading}
            />
            <button
              id="ai-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5 ${
                input.trim() && !loading
                  ? "bg-black text-white hover:scale-105"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <IconSend size={15} stroke={2} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2 m-0">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </>
  );
}
