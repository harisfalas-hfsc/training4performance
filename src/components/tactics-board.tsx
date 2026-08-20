import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Circle as CircleIcon,
  Spline,
  Waves,
  RefreshCw,
  Download,
  Eraser,
  Maximize2,
  Minimize2,
  MousePointer2,
  Minus,
  Pencil,
  RotateCcw,
  Shapes,
  Square,
  Trash2,
  Type as TypeIcon,
  Undo2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";


/* ------------------------------------------------------------------ */
/* types                                                               */
/* ------------------------------------------------------------------ */

export type Orientation = "portrait" | "landscape";

type Tool =
  | "select"
  | "arrow"
  | "dashed"
  | "zigzag"
  | "curve"
  | "line"
  | "pen"
  | "penArrow"
  | "loop"
  | "zone"
  | "circle"
  | "text"
  | "erase";

type TokenKind =
  | "player"
  | "keeper"
  | "ball"
  | "cone"
  | "disc"
  | "pole"
  | "ladder"
  | "hurdle"
  | "mannequin"
  | "minigoal"
  | "goal"
  | "label";

export interface BoardToken {
  id: string;
  kind: TokenKind;
  x: number;
  y: number;
  color: string;
  label?: string | undefined;
}

export interface BoardShape {
  id: string;
  tool: Exclude<Tool, "select" | "erase" | "text">;
  color: string;
  points: { x: number; y: number }[];
}

type Snapshot = { tokens: BoardToken[]; shapes: BoardShape[] };

/* ------------------------------------------------------------------ */
/* palette                                                             */
/* ------------------------------------------------------------------ */

const TEAM_COLORS = [
  { id: "home", label: "Home", value: "#3b82f6" },
  { id: "away", label: "Away", value: "#ef4444" },
  { id: "bib", label: "Bibs", value: "#eab308" },
  { id: "neutral", label: "Neutral", value: "#f8fafc" },
  { id: "gk", label: "Keeper", value: "#22c55e" },
] as const;

const DRAW_COLORS = ["#f8fafc", "#facc15", "#ef4444", "#3b82f6", "#111827"];

const PLAYER_ITEMS: { kind: TokenKind; label: string; color?: string }[] = [
  { kind: "player", label: "Home player", color: "#3b82f6" },
  { kind: "player", label: "Away player", color: "#ef4444" },
  { kind: "player", label: "Bib player", color: "#eab308" },
  { kind: "player", label: "Neutral player", color: "#f8fafc" },
  { kind: "keeper", label: "Goalkeeper", color: "#22c55e" },
  { kind: "ball", label: "Ball", color: "#f8fafc" },
];

const EQUIPMENT_ITEMS: { kind: TokenKind; label: string; color?: string }[] = [
  { kind: "cone", label: "Tall cone", color: "#facc15" },
  { kind: "cone", label: "Tall cone red", color: "#ef4444" },
  { kind: "disc", label: "Disc cone", color: "#facc15" },
  { kind: "disc", label: "Disc cone blue", color: "#3b82f6" },
  { kind: "pole", label: "Pole", color: "#facc15" },
  { kind: "ladder", label: "Agility ladder", color: "#facc15" },
  { kind: "hurdle", label: "Hurdle", color: "#facc15" },
  { kind: "mannequin", label: "Mannequin", color: "#facc15" },
  { kind: "minigoal", label: "Mini goal", color: "#e2e8f0" },
  { kind: "goal", label: "Full goal", color: "#e2e8f0" },
];

const TOOLS: { id: Tool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Move", icon: MousePointer2 },
  { id: "arrow", label: "Run / pass arrow", icon: ArrowUpRight },
  { id: "dashed", label: "Dashed arrow (pass)", icon: ArrowUpRight },
  { id: "zigzag", label: "Zigzag run (dribble)", icon: Waves },
  { id: "curve", label: "Curved run", icon: Spline },
  { id: "loop", label: "Loop / circle run", icon: RefreshCw },
  { id: "line", label: "Line", icon: Minus },
  { id: "penArrow", label: "Freehand run (arrow)", icon: Pencil },
  { id: "zone", label: "Zone", icon: Square },
  { id: "circle", label: "Circle", icon: CircleIcon },
  { id: "text", label: "Text", icon: TypeIcon },
  { id: "erase", label: "Erase", icon: Eraser },
];

/* ------------------------------------------------------------------ */
/* pitch geometry                                                      */
/* ------------------------------------------------------------------ */

const DIMS: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 680, h: 1000 },
  landscape: { w: 1000, h: 680 },
};

export type PitchView = "full" | "half";
export type FieldType = "football" | "blank";

const VIEWS: { id: PitchView; label: string }[] = [
  { id: "full", label: "Full pitch" },
  { id: "half", label: "Half pitch" },
];

const FIELDS: { id: FieldType; label: string }[] = [
  { id: "football", label: "Football 11v11" },
  { id: "blank", label: "Blank field" },
];

/* Legacy drawings may still carry retired options; fall back to the
   supported ones so old saved boards keep opening. */
function normView(v: unknown): PitchView {
  return v === "half" ? "half" : "full";
}
function normField(f: unknown): FieldType {
  return f === "blank" ? "blank" : "football";
}

/** Visible area of the base pitch for the chosen view. */
function viewBoxFor(orientation: Orientation, view: PitchView) {
  const { w, h } = DIMS[orientation];
  if (view === "full") return { x: 0, y: 0, w, h };
  if (orientation === "portrait") return { x: 0, y: 0, w, h: h / 2 };
  return { x: 0, y: 0, w: w / 2, h };
}

function PitchMarkings({
  orientation,
  field,
  vb,
}: {
  orientation: Orientation;
  field: FieldType;
  vb: { x: number; y: number; w: number; h: number };
}) {
  const { w, h } = DIMS[orientation];
  const m = 26;
  const line = "var(--color-pitch-line)";
  const common = { fill: "none", stroke: line, strokeWidth: 3 } as const;
  const long = orientation === "portrait" ? h : w;
  const short = orientation === "portrait" ? w : h;
  const boxDepth = long * 0.15;
  const boxWidth = short * 0.62;
  const goalDepth = long * 0.05;
  const goalWidth = short * 0.3;
  const spot = long * 0.1;
  const r = short * 0.16;

  /* Boundary hugs the visible area so the half view reads as a real
     playing surface instead of a cropped full pitch. */
  const boundary = (
    <rect x={vb.x + m} y={vb.y + m} width={vb.w - m * 2} height={vb.h - m * 2} {...common} />
  );

  const el: React.ReactNode[] = [];

  if (field === "blank") return <g pointerEvents="none">{boundary}</g>;





  if (orientation === "portrait") {
    const cx = w / 2;
    el.push(<line key="half" x1={m} y1={h / 2} x2={w - m} y2={h / 2} {...common} />);
    el.push(<circle key="cc" cx={cx} cy={h / 2} r={r} {...common} />);
    el.push(<circle key="cs" cx={cx} cy={h / 2} r={5} fill={line} stroke="none" />);
    for (const top of [true, false]) {
      const yBox = top ? m : h - m - boxDepth;
      const yGoal = top ? m : h - m - goalDepth;
      const ySpot = top ? m + spot : h - m - spot;
      el.push(
        <rect key={`b${top}`} x={cx - boxWidth / 2} y={yBox} width={boxWidth} height={boxDepth} {...common} />,
        <rect key={`g${top}`} x={cx - goalWidth / 2} y={yGoal} width={goalWidth} height={goalDepth} {...common} />,
        <circle key={`s${top}`} cx={cx} cy={ySpot} r={5} fill={line} stroke="none" />,
        <path
          key={`a${top}`}
          d={
            top
              ? `M ${cx - r * 0.72} ${m + boxDepth} A ${r} ${r} 0 0 0 ${cx + r * 0.72} ${m + boxDepth}`
              : `M ${cx - r * 0.72} ${h - m - boxDepth} A ${r} ${r} 0 0 1 ${cx + r * 0.72} ${h - m - boxDepth}`
          }
          {...common}
        />,
      );
    }
  } else {
    const cy = h / 2;
    el.push(<line key="half" x1={w / 2} y1={m} x2={w / 2} y2={h - m} {...common} />);
    el.push(<circle key="cc" cx={w / 2} cy={cy} r={r} {...common} />);
    el.push(<circle key="cs" cx={w / 2} cy={cy} r={5} fill={line} stroke="none" />);
    for (const left of [true, false]) {
      const xBox = left ? m : w - m - boxDepth;
      const xGoal = left ? m : w - m - goalDepth;
      const xSpot = left ? m + spot : w - m - spot;
      el.push(
        <rect key={`b${left}`} x={xBox} y={cy - boxWidth / 2} width={boxDepth} height={boxWidth} {...common} />,
        <rect key={`g${left}`} x={xGoal} y={cy - goalWidth / 2} width={goalDepth} height={goalWidth} {...common} />,
        <circle key={`s${left}`} cx={xSpot} cy={cy} r={5} fill={line} stroke="none" />,
        <path
          key={`a${left}`}
          d={
            left
              ? `M ${m + boxDepth} ${cy - r * 0.72} A ${r} ${r} 0 0 1 ${m + boxDepth} ${cy + r * 0.72}`
              : `M ${w - m - boxDepth} ${cy - r * 0.72} A ${r} ${r} 0 0 0 ${w - m - boxDepth} ${cy + r * 0.72}`
          }
          {...common}
        />,
      );
    }
  }
  return (
    <g pointerEvents="none">
      <g clipPath="url(#t4p-pitch-clip)">{el}</g>
      {boundary}
    </g>
  );


}

/* ------------------------------------------------------------------ */
/* token rendering                                                     */
/* ------------------------------------------------------------------ */

function TokenShape({ token }: { token: BoardToken }) {
  const c = token.color;
  switch (token.kind) {
    case "player":
    case "keeper":
      return (
        <g>
          <circle r={20} fill={c} stroke="#0b1a14" strokeWidth={2.5} />
          <text
            y={6}
            textAnchor="middle"
            fontSize={19}
            fontWeight={700}
            fill={c === "#f8fafc" || c === "#eab308" || c === "#facc15" ? "#0b1a14" : "#ffffff"}
          >
            {token.label ?? ""}
          </text>
        </g>
      );
    case "ball":
      return (
        <g>
          <circle r={11} fill="#f8fafc" stroke="#0b1a14" strokeWidth={2} />
          <path d="M0,-6 L5,-2 L3,4 L-3,4 L-5,-2 Z" fill="#0b1a14" />
        </g>
      );
    case "cone":
      return (
        <g>
          <path d="M0,-18 L11,14 L-11,14 Z" fill={c} stroke="#0b1a14" strokeWidth={2} />
          <rect x={-14} y={13} width={28} height={5} rx={2} fill={c} stroke="#0b1a14" strokeWidth={1.5} />
        </g>
      );
    case "disc":
      return (
        <g>
          <ellipse rx={16} ry={7} fill={c} stroke="#0b1a14" strokeWidth={2} />
          <ellipse cy={-4} rx={8} ry={4} fill={c} stroke="#0b1a14" strokeWidth={1.5} />
        </g>
      );
    case "pole":
      return (
        <g>
          <line x1={0} y1={-24} x2={0} y2={16} stroke={c} strokeWidth={4} />
          <ellipse cy={17} rx={10} ry={4} fill={c} stroke="#0b1a14" strokeWidth={1.5} />
        </g>
      );
    case "ladder":
      return (
        <g stroke={c} strokeWidth={3} fill="none">
          <rect x={-13} y={-22} width={26} height={44} />
          <line x1={-13} y1={-8} x2={13} y2={-8} />
          <line x1={-13} y1={6} x2={13} y2={6} />
        </g>
      );
    case "hurdle":
      return (
        <g stroke={c} strokeWidth={3.5} fill="none">
          <path d="M-16,14 L-16,-10 L16,-10 L16,14" />
          <line x1={-22} y1={14} x2={-10} y2={14} />
          <line x1={10} y1={14} x2={22} y2={14} />
        </g>
      );
    case "mannequin":
      return (
        <g>
          <path d="M0,-22 C8,-22 10,-12 10,0 L10,16 L-10,16 L-10,0 C-10,-12 -8,-22 0,-22 Z" fill={c} stroke="#0b1a14" strokeWidth={2} />
          <line x1={0} y1={16} x2={0} y2={22} stroke="#0b1a14" strokeWidth={3} />
        </g>
      );
    case "minigoal":
      return (
        <g stroke="#0b1a14" strokeWidth={2}>
          <rect x={-26} y={-10} width={52} height={20} fill={c} opacity={0.85} />
        </g>
      );
    case "goal":
      return (
        <g stroke="#0b1a14" strokeWidth={2}>
          <rect x={-48} y={-13} width={96} height={26} fill={c} opacity={0.9} />
          <line x1={-24} y1={-13} x2={-24} y2={13} />
          <line x1={0} y1={-13} x2={0} y2={13} />
          <line x1={24} y1={-13} x2={24} y2={13} />
        </g>
      );
    case "label":
      return (
        <g>
          <text textAnchor="middle" y={6} fontSize={26} fontWeight={700} fill={c} stroke="#0b1a14" strokeWidth={0.8}>
            {token.label}
          </text>
        </g>
      );
  }
}

function shapePath(s: BoardShape) {
  const p = s.points;
  if (p.length < 2) return "";
  if (s.tool === "pen" || s.tool === "penArrow")
    return p.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const a = p[0]!;
  const b = p[p.length - 1]!;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  if (s.tool === "zigzag") {
    const amp = 16;
    const step = 34;
    const n = Math.max(2, Math.round(len / step));
    let d = `M ${a.x} ${a.y}`;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const side = i % 2 === 0 ? -1 : 1;
      const isLast = i === n;
      const off = isLast ? 0 : side * amp;
      d += ` L ${a.x + dx * t + nx * off} ${a.y + dy * t + ny * off}`;
    }
    return d;
  }

  if (s.tool === "curve") {
    const bow = Math.min(len * 0.35, 160);
    const cx = a.x + dx / 2 + nx * bow;
    const cy = a.y + dy / 2 + ny * bow;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }

  if (s.tool === "loop") {
    const r = Math.max(24, len / 2);
    const mx = a.x + dx / 2;
    const my = a.y + dy / 2;
    // a full loop drawn back onto the end point, like a curl / turn
    return [
      `M ${a.x} ${a.y}`,
      `C ${a.x + nx * r} ${a.y + ny * r} ${mx + nx * r} ${my + ny * r} ${mx} ${my}`,
      `C ${mx - nx * r} ${my - ny * r} ${b.x - nx * r} ${b.y - ny * r} ${b.x} ${b.y}`,
    ].join(" ");
  }

  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

const ARROW_TOOLS: Tool[] = ["arrow", "dashed", "zigzag", "curve", "loop", "pen", "penArrow"];

/* ------------------------------------------------------------------ */
/* board                                                               */
/* ------------------------------------------------------------------ */

let seq = 0;
const uid = () => `n${++seq}-${Date.now().toString(36)}`;

export interface BoardDrawing {
  tokens: BoardToken[];
  shapes: BoardShape[];
  orientation?: Orientation;
  view?: PitchView;
  field?: FieldType;

}

export function parseDrawing(json?: string): BoardDrawing | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as BoardDrawing;
    return d && Array.isArray(d.tokens) ? d : null;
  } catch {
    return null;
  }
}

export function TacticsBoard({
  initialTokens = [] as BoardToken[],
  drawing: initialDrawing,
  onSave,
  saveLabel = "Save drawing",
  fullscreen: fullscreenProp,
  onFullscreenChange,
}: {
  initialTokens?: BoardToken[];
  drawing?: BoardDrawing | null;
  onSave?: (drawing: BoardDrawing) => void;
  saveLabel?: string;
  /** Optional controlled full-screen state (the board manages its own when omitted). */
  fullscreen?: boolean;
  onFullscreenChange?: (value: boolean) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [orientation, setOrientation] = useState<Orientation>(initialDrawing?.orientation ?? "portrait");
  const [view, setView] = useState<PitchView>(normView(initialDrawing?.view));
  const [field, setField] = useState<FieldType>(normField(initialDrawing?.field));
  const [tool, setTool] = useState<Tool>("select");
  const [tokens, setTokens] = useState<BoardToken[]>(initialDrawing?.tokens ?? initialTokens);
  const [shapes, setShapes] = useState<BoardShape[]>(initialDrawing?.shapes ?? []);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [panel, setPanel] = useState<"players" | "equipment" | null>("players");
  const [pending, setPending] = useState<{ kind: TokenKind; color: string } | null>(null);
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]!);
  const [teamColor, setTeamColor] = useState<string>(TEAM_COLORS[0]!.value);
  const [nextNumber, setNextNumber] = useState(1);
  const [ownFullscreen, setOwnFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragId = useRef<string | null>(null);
  const drawing = useRef<BoardShape | null>(null);
  const [, force] = useState(0);

  const fullscreen = fullscreenProp ?? ownFullscreen;
  const setFullscreen = useCallback(
    (value: boolean) => {
      if (fullscreenProp === undefined) setOwnFullscreen(value);
      onFullscreenChange?.(value);
    },
    [fullscreenProp, onFullscreenChange],
  );

  useEffect(() => setMounted(true), []);

  /* lock the page behind the overlay and allow Esc to leave */
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, setFullscreen]);


  const vb = viewBoxFor(orientation, view);
  const w = vb.w;
  const h = vb.h;


  const push = useCallback(
    () => setHistory((prev) => [...prev.slice(-29), { tokens, shapes }]),
    [tokens, shapes],
  );

  const undo = () => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      setTokens(last.tokens);
      setShapes(last.shapes);
      return prev.slice(0, -1);
    });
  };

  const toPoint = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: Math.round(p.x), y: Math.round(p.y) };
  };

  const addToken = (kind: TokenKind, color: string, x: number, y: number) => {
    push();
    const isPlayer = kind === "player" || kind === "keeper";
    setTokens((prev) => [
      ...prev,
      {
        id: uid(),
        kind,
        color,
        x,
        y,
        label: isPlayer ? String(nextNumber) : undefined,
      },
    ]);
    if (isPlayer) setNextNumber((n) => (n >= 30 ? 1 : n + 1));
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toPoint(e);

    if (pending) {
      addToken(pending.kind, pending.color, p.x, p.y);
      return;
    }
    if (tool === "text") {
      const value = window.prompt("Label text");
      if (value) {
        push();
        setTokens((prev) => [...prev, { id: uid(), kind: "label", color: drawColor, x: p.x, y: p.y, label: value }]);
      }
      return;
    }
    if (tool === "select" || tool === "erase") return;

    push();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = { id: uid(), tool, color: drawColor, points: [p, p] };
    force((n) => n + 1);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragId.current) {
      const p = toPoint(e);
      setTokens((prev) => prev.map((t) => (t.id === dragId.current ? { ...t, x: p.x, y: p.y } : t)));
      return;
    }
    if (!drawing.current) return;
    const p = toPoint(e);
    const d = drawing.current;
    if (d.tool === "pen" || d.tool === "penArrow") d.points.push(p);
    else d.points[1] = p;
    force((n) => n + 1);
  };

  const endInteraction = () => {
    if (drawing.current) {
      const d = drawing.current;
      const a = d.points[0]!;
      const b = d.points[d.points.length - 1]!;
      if (Math.hypot(b.x - a.x, b.y - a.y) > 8) setShapes((prev) => [...prev, d]);
      drawing.current = null;
      force((n) => n + 1);
    }
    dragId.current = null;
  };

  const onTokenDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (tool === "erase") {
      push();
      setTokens((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    // any existing item can always be dragged, whatever tool or palette item is active
    push();
    dragId.current = id;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const eraseShape = (e: React.PointerEvent, id: string) => {
    if (tool !== "erase") return;
    e.stopPropagation();
    push();
    setShapes((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAll = () => {
    push();
    setTokens([]);
    setShapes([]);
  };

  const exportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const styles = getComputedStyle(document.documentElement);
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.innerHTML = clone.innerHTML
      .replaceAll("var(--color-pitch-line)", styles.getPropertyValue("--pitch-line").trim() || "#e8f5ec")
      .replaceAll("var(--color-pitch)", styles.getPropertyValue("--pitch").trim() || "#2f6b46");
    const svgText = new XMLSerializer().serializeToString(clone);
    const img = new window.Image();
    img.src = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgText)))}`;
    await new Promise((res) => (img.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = w * 1.5;
    canvas.height = h * 1.5;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "t4p-session-board.png";
    a.click();
  };

  const paletteItems = panel === "players" ? PLAYER_ITEMS : panel === "equipment" ? EQUIPMENT_ITEMS : [];
  const liveShapes = useMemo(
    () => (drawing.current ? [...shapes, drawing.current] : shapes),
    [shapes, drawing.current?.points.length, drawing.current?.id],
  );

  const board = (
    <div
      className={cn(
        "panel overflow-hidden",
        fullscreen && "flex h-full min-h-0 flex-col rounded-none border-0 shadow-none",
      )}
    >
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-surface-2 p-2">
        <ToolButton
          active={fullscreen}
          label={fullscreen ? "Exit full screen (Esc)" : "Full-screen board"}
          onClick={() => setFullscreen(!fullscreen)}
        >
          {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </ToolButton>
        <span className="mx-1 h-6 w-px bg-border" />

        <ToolButton
          active={panel === "players"}
          label="Players"
          onClick={() => {
            setPanel(panel === "players" ? null : "players");
            setPending(null);
          }}
        >
          <Users className="size-4" />
        </ToolButton>
        <ToolButton
          active={panel === "equipment"}
          label="Equipment"
          onClick={() => {
            setPanel(panel === "equipment" ? null : "equipment");
            setPending(null);
          }}
        >
          <Shapes className="size-4" />
        </ToolButton>

        <span className="mx-1 h-6 w-px bg-border" />

        {TOOLS.map((t) => (
          <ToolButton
            key={t.id + t.label}
            active={tool === t.id && !pending}
            label={t.label}
            onClick={() => {
              // tapping an active tool releases it, so the page can scroll again
              setTool(tool === t.id && !pending ? "select" : t.id);
              setPending(null);
            }}
          >
            <t.icon className={cn("size-4", t.id === "dashed" && "opacity-60")} />
          </ToolButton>
        ))}

        <span className="mx-1 h-6 w-px bg-border" />

        <ToolButton label="Undo" onClick={undo}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Clear board" onClick={clearAll}>
          <Trash2 className="size-4" />
        </ToolButton>
        <ToolButton label="Rotate pitch" onClick={() => setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"))}>
          <RotateCcw className="size-4" />
        </ToolButton>
        <ToolButton label="Export PNG" onClick={exportPng}>
          <Download className="size-4" />
        </ToolButton>
        {onSave ? (
          <button
            type="button"
            onClick={() => onSave({ tokens, shapes, orientation, view, field })}
            className="ml-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {saveLabel}
          </button>
        ) : null}

        <span className="ml-auto flex items-center gap-1">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              title={`Draw colour ${c}`}
              onClick={() => setDrawColor(c)}
              style={{ background: c }}
              className={cn(
                "size-6 rounded-full border-2",
                drawColor === c ? "border-primary" : "border-border",
              )}
            />
          ))}
        </span>
      </div>

      {/* pitch setup */}
      <div className="grid gap-2 border-b border-border px-3 py-2 sm:grid-cols-3">
        <label className="field">
          <span className="field-label">Field type</span>
          <select className="control" value={field} onChange={(e) => setField(e.target.value as FieldType)}>
            {FIELDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Pitch area</span>
          <select className="control" value={view} onChange={(e) => setView(e.target.value as PitchView)}>
            {VIEWS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Orientation</span>
          <select
            className="control"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
          >
            <option value="portrait">Portrait (vertical)</option>
            <option value="landscape">Landscape (horizontal)</option>
          </select>
        </label>
      </div>

      {/* status line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span>
          {pending
            ? `Tap the pitch to place: ${pending.kind}`
            : tool === "select"
              ? "Drag any item to reposition it — the page scrolls normally"
              : tool === "erase"
                ? "Tap an item or a drawing to remove it"
                : "Drawing mode: drag on the pitch. Tap the active tool again to release it and scroll."}
        </span>
        <span className="tabular-nums">
          {tokens.filter((t) => t.kind === "player" || t.kind === "keeper").length} players · {tokens.length} items ·{" "}
          {shapes.length} drawings
        </span>
      </div>


      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] gap-3 p-3 lg:grid-cols-[170px_minmax(0,1fr)]",
          fullscreen && "min-h-0 flex-1 overflow-auto",
        )}
      >
        {/* palette */}
        {panel && (
          <div className="min-w-0 rounded-md border border-border bg-surface-2 p-2">

            <p className="eyebrow mb-2">{panel === "players" ? "Players & ball" : "Equipment"}</p>
            {panel === "players" && (
              <div className="mb-2 flex flex-wrap gap-1">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTeamColor(c.value)}
                    title={c.label}
                    style={{ background: c.value }}
                    className={cn("size-6 rounded-full border-2", teamColor === c.value ? "border-primary" : "border-border")}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
              {paletteItems.map((item, i) => {
                const color = panel === "players" && item.kind !== "ball" ? (i === 0 ? teamColor : item.color!) : item.color!;
                const active = pending?.kind === item.kind && pending.color === color;
                return (
                  <button
                    key={item.label}
                    title={item.label}
                    onClick={() => {
                      setPending(active ? null : { kind: item.kind, color });
                      setTool("select");
                    }}
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-md border bg-pitch/40 lg:aspect-square lg:size-auto",
                      active ? "border-primary ring-1 ring-primary" : "border-border",
                    )}
                  >
                    <svg viewBox="-30 -30 60 60" className="size-9">
                      <TokenShape token={{ id: item.label, kind: item.kind, x: 0, y: 0, color, label: "" }} />
                    </svg>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[0.65rem] leading-snug text-muted-foreground">
              Select an item, then tap the pitch. Numbers increase automatically. Anything already on the pitch can be dragged at any time — no need to switch tool.
            </p>
          </div>
        )}

        {/* pitch — the box always matches the chosen view's aspect ratio, so
            there is never empty space beside or below the playing surface. */}
        <div className={cn("relative flex min-w-0 justify-center", fullscreen && "h-full min-h-0 items-center")}>
          <div
            className="relative overflow-hidden rounded-md border border-border bg-pitch"
            style={
              fullscreen
                ? { aspectRatio: `${w} / ${h}`, height: "100%", maxWidth: "100%", width: "auto" }
                : { aspectRatio: `${w} / ${h}`, width: `min(100%, calc(70vh * ${w / h}))` }
            }
          >
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${w} ${h}`}
            preserveAspectRatio="none"
            className="block h-full w-full select-none"

            style={{
              // Drawing tools need the gesture; otherwise let the page scroll
              // vertically even when the finger starts on the pitch.
              touchAction:
                tool === "select" || tool === "erase" || tool === "text" || pending ? "pan-y" : "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endInteraction}
            onPointerLeave={endInteraction}
          >
            <defs>
              <marker id="t4p-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
              </marker>
              <pattern id="t4p-stripes" width={DIMS[orientation].w / 8} height={DIMS[orientation].h} patternUnits="userSpaceOnUse">
                <rect width={DIMS[orientation].w / 16} height={DIMS[orientation].h} fill="#ffffff" opacity="0.045" />
              </pattern>
              <clipPath id="t4p-pitch-clip">
                {/* markings never spill past the touchline of the visible area */}
                <rect x={vb.x + 26} y={vb.y + 26} width={vb.w - 52} height={vb.h - 52} />
              </clipPath>

            </defs>

            <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="var(--color-pitch)" />
            <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="url(#t4p-stripes)" pointerEvents="none" />
            <PitchMarkings orientation={orientation} field={field} vb={vb} />



            {liveShapes.map((s) => (
              <path
                key={s.id}
                d={s.tool === "zone" || s.tool === "circle" ? "" : shapePath(s)}
                fill="none"
                stroke={s.color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={s.tool === "dashed" ? "16 12" : undefined}
                markerEnd={ARROW_TOOLS.includes(s.tool) ? "url(#t4p-arrow)" : undefined}
                onPointerDown={(e) => eraseShape(e, s.id)}
                style={{ cursor: tool === "erase" ? "pointer" : "default" }}
              />
            ))}
            {liveShapes
              .filter((s) => s.tool === "zone" || s.tool === "circle")
              .map((s) => {
                const a = s.points[0]!;
                const b = s.points[s.points.length - 1]!;
                return s.tool === "zone" ? (
                  <rect
                    key={s.id}
                    x={Math.min(a.x, b.x)}
                    y={Math.min(a.y, b.y)}
                    width={Math.abs(b.x - a.x)}
                    height={Math.abs(b.y - a.y)}
                    fill={s.color}
                    fillOpacity={0.14}
                    stroke={s.color}
                    strokeWidth={4}
                    strokeDasharray="14 10"
                    onPointerDown={(e) => eraseShape(e, s.id)}
                  />
                ) : (
                  <ellipse
                    key={s.id}
                    cx={(a.x + b.x) / 2}
                    cy={(a.y + b.y) / 2}
                    rx={Math.abs(b.x - a.x) / 2}
                    ry={Math.abs(b.y - a.y) / 2}
                    fill={s.color}
                    fillOpacity={0.12}
                    stroke={s.color}
                    strokeWidth={4}
                    onPointerDown={(e) => eraseShape(e, s.id)}
                  />
                );
              })}

            {tokens.map((t) => (
              <g
                key={t.id}
                transform={`translate(${t.x} ${t.y})`}
                onPointerDown={(e) => onTokenDown(e, t.id)}
                style={{ cursor: tool === "erase" ? "pointer" : "grab", touchAction: "none" }}
              >
                <TokenShape token={t} />
              </g>
            ))}
          </svg>
          </div>
        </div>

      </div>
    </div>
  );

  if (fullscreen && mounted) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex flex-col bg-background">{board}</div>,
      document.body,
    );
  }

  return board;
}


function ToolButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors",
        active ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
