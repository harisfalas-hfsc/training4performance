# Tactics Board — standalone full-screen mode

Make the board usable as a real tool: one button turns it into a full-screen tablet-style workspace with the tools pinned on top and the pitch filling the rest of the screen. Press it again and you drop straight back into the page exactly where you were, with the drawing intact.

## How it will behave

- A **Full screen** button sits in the board toolbar (next to Rotate/Export). On the Tactics Board page it is also offered as a prominent "Open board full screen" action so it is obvious.
- In full-screen mode:
  - The board takes the entire viewport as an overlay — no page scroll, no header, no footer, no site chrome behind it.
  - The toolbar (tools, colours, undo/clear/rotate/export, field type, pitch area, orientation) is **fixed at the top** and always visible while you draw.
  - The player/equipment palette stays reachable: a side column on wide screens, a compact horizontal strip under the toolbar on phones/tablets.
  - The pitch scales to fill all remaining height, keeping its correct aspect ratio for the selected field type, area and orientation.
  - `Esc` exits, as does the **Exit full screen** button.
- Nothing is lost on enter or exit: tokens, shapes, colour, tool, field type, area and orientation are the same component state, so the drawing continues seamlessly in both modes. The board also auto-captures the current drawing continuously (same data the "Use this drawing" button produces), so the page's save/attach panels below always have the latest version — no need to remember to press save before exiting.
- On the Tactics Board page the drill fields and the "Where does it go?" panel stay on the page underneath; you exit full screen and save to library or attach to a training as today.
- The same full-screen button works everywhere the board appears (Training Designer, board page), so an embedded board can be blown up to full screen and collapsed back.

## Technical notes

- All changes stay in `src/components/tactics-board.tsx`, plus a small copy/button addition in `src/routes/_authenticated/board.tsx`.
- Add `fullscreen` state in `TacticsBoard`. When on, render the existing board markup inside a fixed overlay (`fixed inset-0 z-50 bg-background flex flex-col`) via a portal, with `overflow: hidden` locked on `body` and safe-area padding for mobile. The board internals are extracted into one shared render so both modes use identical code — no duplicated board.
- Layout in overlay mode: toolbar + selectors in a non-shrinking header, palette + pitch in a `flex-1 min-h-0` row; the pitch wrapper sizes from available height (`h-full` with aspect-ratio clamp) instead of the page's width-driven sizing.
- Continuous capture: call the existing `onSave` handler (debounced) whenever tokens/shapes/orientation change, so the parent always holds current JSON. Keep the explicit "Use this drawing" button for the confirmation message.
- `Esc` key listener and a cleanup effect restore body scroll on unmount.
- Optionally also request the native browser `requestFullscreen()` when available, falling back to the CSS overlay — the overlay alone is enough on iOS where the API is unsupported.
