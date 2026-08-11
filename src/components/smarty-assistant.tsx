import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AssistantChat } from "@/components/assistant-chat";
import { useAuth } from "@/lib/auth";

export function SmartyAssistant() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(120);
  const [pulse, setPulse] = useState(false);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startY = useRef(0);
  const startPos = useRef(0);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("t4p.assistant.position") : null;
    if (saved) setPosition(Number(saved));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 900);
      return () => clearTimeout(t);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!session) return null;

  function onPointerDown(e: React.PointerEvent) {
    if (open) return;
    dragging.current = true;
    moved.current = false;
    startY.current = e.clientY;
    startPos.current = position;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    if (Math.abs(delta) > 5) moved.current = true;
    const next = Math.max(60, Math.min(window.innerHeight - 140, startPos.current + delta));
    setPosition(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (typeof window !== "undefined") {
      const delta = e.clientY - startY.current;
      const finalPosition = Math.max(60, Math.min(window.innerHeight - 140, startPos.current + delta));
      window.localStorage.setItem("t4p.assistant.position", String(finalPosition));
    }
  }

  function openAssistant() {
    if (moved.current) {
      moved.current = false;
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <div
        className="fixed right-4 z-50 hidden touch-none select-none md:block"
        style={{ top: position }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <button
          onClick={openAssistant}
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-[#3B82F6]/20 transition-all hover:scale-105 hover:shadow-xl active:scale-95 ${
            pulse ? "animate-pulse ring-[#3B82F6]" : ""
          }`}
          aria-label="Open Smarty Assistant"
        >
          <img src="/logo-t4p.png" alt="T4P" className="h-9 w-9 object-contain" />
          <span className="pointer-events-none absolute right-full mr-3 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
            Smarty Assistant
          </span>
        </button>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-[#3B82F6]/20 md:hidden"
        aria-label="Open Smarty Assistant"
      >
        <img src="/logo-t4p.png" alt="T4P" className="h-8 w-8 object-contain" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md p-0">
          <SheetTitle className="sr-only">Smarty Assistant</SheetTitle>
          <SheetDescription className="sr-only">Ask Smarty about your squad and training data.</SheetDescription>
          <AssistantChat onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
