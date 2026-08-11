import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  assistantCreateThread,
  assistantDeleteThread,
  assistantGetCredits,
  assistantListMessages,
  assistantListThreads,
  assistantRenameThread,
  assistantSaveMessage,
} from "@/lib/assistant.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  created_at?: string;
}

interface Thread {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Give me a weekly workload report for the squad",
  "Compare the top 3 highest and lowest distance players this week",
  "Who is at risk of overload based on ACWR?",
  "Summarise the last 5 training sessions",
  "What is the squad average wellness today?",
];

export function AssistantChat({ onClose }: { onClose: () => void }) {
  const { session } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [view, setView] = useState<"chat" | "threads">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  const listThreads = useServerFn(assistantListThreads);
  const listMessages = useServerFn(assistantListMessages);
  const createThread = useServerFn(assistantCreateThread);
  const saveMessage = useServerFn(assistantSaveMessage);
  const deleteThread = useServerFn(assistantDeleteThread);
  const renameThread = useServerFn(assistantRenameThread);
  const getCredits = useServerFn(assistantGetCredits);

  useEffect(() => {
    void loadThreads();
    void loadCredits();
  }, []);

  useEffect(() => {
    if (activeThread) {
      void loadMessages(activeThread);
      setView("chat");
    }
  }, [activeThread]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function loadThreads() {
    try {
      const { threads } = await listThreads({ data: {} });
      setThreads(threads);
      if (threads.length && !activeThread) setActiveThread(threads[0].id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load threads");
    }
  }

  async function loadMessages(threadId: string) {
    try {
      const { messages } = await listMessages({ data: { threadId } });
      setMessages(messages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load messages");
    }
  }

  async function loadCredits() {
    try {
      const { balance } = await getCredits({ data: {} });
      setCredits(balance);
    } catch {
      setCredits(0);
    }
  }

  async function handleNewThread() {
    try {
      const { thread } = await createThread({ data: { title: "New chat" } });
      setThreads((prev) => [thread, ...prev]);
      setActiveThread(thread.id);
      setMessages([]);
      setView("chat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create thread");
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    let threadId = activeThread;
    if (!threadId) {
      try {
        const { thread } = await createThread({ data: { title: input.trim().slice(0, 40) } });
        threadId = thread.id;
        setThreads((prev) => [thread, ...prev]);
        setActiveThread(thread.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start chat");
        return;
      }
    }

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userText }]);
    setLoading(true);

    try {
      await saveMessage({ data: { threadId, role: "user", content: userText } });

      const token = session?.access_token;
      if (!token) throw new Error("Not signed in");

      const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: userText }];

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
          threadId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Assistant unavailable" }));
        throw new Error(err.error ?? "Assistant unavailable");
      }

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const events = chunk.split("\n\n").filter(Boolean);
        for (const event of events) {
          const lines = event.split("\n");
          const ev = lines.find((l) => l.startsWith("event:"))?.slice(7).trim();
          const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            if (ev === "text" && data.text) {
              fullText += data.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)),
              );
            }
          } catch {
            // ignore
          }
        }
      }

      await saveMessage({ data: { threadId, role: "assistant", content: fullText } });
      await loadCredits();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteThread(threadId: string) {
    try {
      await deleteThread({ data: { id: threadId } });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThread === threadId) {
        setActiveThread(null);
        setMessages([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete thread");
    }
  }

  async function handleRenameThread(threadId: string, title: string) {
    const next = window.prompt("Rename chat", title);
    if (!next) return;
    try {
      await renameThread({ data: { id: threadId, title: next } });
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title: next } : t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename thread");
    }
  }

  const activeTitle = useMemo(
    () => threads.find((t) => t.id === activeThread)?.title ?? "Smarty Assistant",
    [threads, activeThread],
  );

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === "chat" && threads.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("threads")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-[#3B82F6]" />
              {view === "chat" ? activeTitle : "Chat history"}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {credits ?? "—"} credits
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <span className="sr-only">Close</span>✕
            </Button>
          </div>
        </div>
        <SheetDescription className="text-left">
          Ask Smarty about reports, player comparisons, workload, or training ideas.
        </SheetDescription>
      </SheetHeader>

      {view === "threads" ? (
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewThread}>
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
            {threads.map((t) => (
              <div
                key={t.id}
                className="group flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 cursor-pointer"
                onClick={() => setActiveThread(t.id)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRenameThread(t.id, t.title)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteThread(t.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {threads.length === 0 && <p className="text-sm text-muted-foreground">No chats yet.</p>}
          </div>
        </ScrollArea>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-medium">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="rounded-full border bg-white px-3 py-1.5 text-xs text-left hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.role === "user" ? <AvatarFallback><User className="h-4 w-4" /></AvatarFallback> : <AvatarFallback className="bg-[#3B82F6] text-white"><Bot className="h-4 w-4" /></AvatarFallback>}
                  </Avatar>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-[#3B82F6] text-white" : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{m.content || (loading ? "Thinking…" : "")}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-[#3B82F6] text-white"><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="border-t p-4">
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Smarty Assistant…"
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0 bg-[#3B82F6] hover:bg-[#2563EB]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
