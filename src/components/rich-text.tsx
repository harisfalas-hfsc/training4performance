import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Renders an answer as text with working links.
 *
 * Supported inside the text:
 *  - `[Platform manual](/manual)` — markdown style link
 *  - a bare in-app path such as `/manual` or `/account`
 *  - a full https:// address (opens in a new tab)
 *
 * In-app paths are rendered as router links, so pressing them keeps the
 * customer inside the platform instead of reloading the site.
 */

const PATTERN = /\[([^\]]+)\]\((\/[^\s)]*|https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)|(?:^|(?<=[\s(]))(\/[a-z0-9][a-z0-9/-]*)/gi;

function linkClass() {
  return "font-semibold text-primary underline underline-offset-2 hover:opacity-80";
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const m of text.matchAll(PATTERN)) {
    const start = m.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    last = start + m[0].length;

    const label = m[1];
    const href = m[2] ?? m[3] ?? m[4] ?? "";
    const shown = label ?? href;

    if (href.startsWith("/")) {
      nodes.push(
        <Link key={`l${key++}`} to={href as never} className={linkClass()}>
          {shown}
        </Link>,
      );
    } else {
      nodes.push(
        <a key={`a${key++}`} href={href} target="_blank" rel="noreferrer" className={linkClass()}>
          {shown}
        </a>,
      );
    }
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <p className={className}>{nodes}</p>;
}
