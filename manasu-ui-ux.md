# ಮನಸು (Manasu) UI Design System — Target Spec & How to Build It

> **Note on status:** unlike a typical design-system README, this doesn't document code that already exists. The current emotion check-in screen is a wireframe (flat saturated circles on pure black) — this document specs out the *target* system we're building toward, so it can be handed to an agent or built section-by-section with a consistent source of truth from day one.

---

## 1. The Art Style In One Sentence

> **Calm Organic Minimalism** — warm off-black/off-white surfaces (never pure black or pure white), soft blurred shadows instead of hard offsets, generous rounded radii, a single desaturated brand accent kept separate from the emotion palette, and slow, breathing motion instead of snappy mechanical motion.

It is deliberately the *opposite* of neo-brutalism: no thick black borders, no zero-blur offset shadows, no high-contrast "press-a-button" physicality. Every surface should feel like it's exhaling, not clicking into place. The one place structure is allowed to feel more "engineered" is the professional monitoring dashboard (Section 8) — that's for observers, not someone mid check-in.

---

## 2. The Tech Stack

| Concern | Choice |
|---|---|
| Frontend | **Next.js** (App Router) |
| Backend | **FastAPI** |
| Database | **Neon PostgreSQL** |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline`) |
| Fonts | **Fraunces** (display/headings — warm optical-size serif) + **Nunito Sans** (body/UI — rounded terminals) + **JetBrains Mono** (numbers/timestamps, dashboard only) |
| Icons | Hand-inlined SVG primitives — no emoji, no icon library |
| Theming | CSS custom properties on `:root` and `.dark`, toggled via `.dark` class on `<html>` |

**Why Fraunces + Nunito Sans, not Internly's Plus Jakarta Sans + JetBrains Mono everywhere:** Internly is a utility tool (job tracking) — Manasu is opened by someone in an emotional state. A soft serif for headings signals "journal," not "dashboard." JetBrains Mono is kept, but scoped only to the professional dashboard where data precision matters more than warmth.

---

## 3. The Design Tokens (single source of truth)

```css
/* Light Mode (default) */
:root {
  --background: #faf6f0;        /* warm cream, not pure white */
  --foreground: #2b2620;        /* warm near-black, not pure black */
  --card: #ffffff;
  --card-border: #e8e0d4;       /* soft warm border — NOT black */
  --card-hover: #fdf9f2;

  --accent: #7c9885;            /* muted sage — brand chrome only, never used for emotions */
  --accent-light: #a3bfaa;
  --accent-dim: rgba(124, 152, 133, 0.12);
  --accent-glow: rgba(124, 152, 133, 0.25);

  --muted: #8b8378;
  --success: #7c9885;
  --error: #c97b63;             /* muted terracotta, not alarm-red */
  --warning: #d9a566;

  --surface-1: #ffffff;
  --surface-2: #f3eee5;
  --header-bg: rgba(250, 246, 240, 0.8); /* blurred glass header, not solid */

  --shadow-color: rgba(43, 38, 32, 0.12);
  --shadow-soft: 0 8px 24px var(--shadow-color);      /* blurred, no offset — opposite of brutalist */
  --shadow-soft-lg: 0 16px 40px var(--shadow-color);
  --shadow-soft-sm: 0 4px 12px var(--shadow-color);

  --border-width: 1px;          /* thin — brutalism uses 2px+ */
  --radius: 24px;
  --radius-sm: 16px;
  --radius-lg: 32px;
  --radius-pill: 9999px;
  --overlay-bg: rgba(43, 38, 32, 0.4);

  /* Emotion palette — desaturated ~20% from the raw wireframe colors, each paired with a soft glow */
  --emotion-bad: #a8a395;       --emotion-bad-glow: rgba(168, 163, 149, 0.35);
  --emotion-afraid: #b79fd1;    --emotion-afraid-glow: rgba(183, 159, 209, 0.35);
  --emotion-angry: #e0937e;     --emotion-angry-glow: rgba(224, 147, 126, 0.35);
  --emotion-disgust: #8fc7a8;   --emotion-disgust-glow: rgba(143, 199, 168, 0.35);
  --emotion-sad: #8fb8d9;       --emotion-sad-glow: rgba(143, 184, 217, 0.35);
  --emotion-happy: #e8a9be;     --emotion-happy-glow: rgba(232, 169, 190, 0.35);
  --emotion-surprise: #e8be7e;  --emotion-surprise-glow: rgba(232, 190, 126, 0.35);
}

/* Dark Mode — warm charcoal, never true black */
.dark {
  --background: #211d18;
  --foreground: #f2ece2;
  --card: #2c2721;
  --card-border: #3d362d;
  --card-hover: #332d26;
  --accent: #9bb89f;             /* lightens for contrast, stays sage — not violet */
  --accent-dim: rgba(155, 184, 159, 0.14);
  --accent-glow: rgba(155, 184, 159, 0.28);
  --surface-1: #2c2721;
  --surface-2: #332d26;
  --header-bg: rgba(33, 29, 24, 0.8);
  --shadow-color: rgba(0, 0, 0, 0.35);
  /* emotion hues lighten slightly for dark-mode contrast; same hue family, don't reinvent */
}
```

**Key rules for replication:**
- **No pure black, no pure white, anywhere, in either mode.** This is the single biggest thing that separates this from the Internly/neo-brutalist system.
- **Shadows are always blurred, never offset.** `0 Ypx Zpx` — no `Xpx Ypx 0`. Offset-zero-blur shadows read as "physical/mechanical," which is exactly what we don't want here.
- **The brand accent (sage) is never reused as an emotion color**, and no emotion color is ever reused as the brand accent. Keeps the "how am I feeling" data visually distinct from "chrome" (buttons, links, nav).
- Borders are **thin (1px) and soft-colored**, not thick and black — borders should barely announce themselves.

---

## 4. Tailwind v4 Theme Bridge & Fonts

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-display: "Fraunces", ui-serif, serif;
  --font-sans: "Nunito Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

html {
  font-size: 17px;
}
body {
  background: var(--background);
  color: var(--foreground);
  font-weight: 400;             /* lighter than Internly's 500 — less "confident SaaS," more "gentle" */
  line-height: 1.7;             /* airier than a dashboard */
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, .heading {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.01em;
}
```

Loaded via `next/font/google` in `layout.tsx`:

```tsx
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400","500","600"], display: "swap" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap" }); // dashboard only
```

---

## 5. The Reusable "Calm" Component Classes

### `.calm-card` — resting surface, not a pressable button

```css
.calm-card {
  background: var(--card);
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.4s ease,
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.calm-card:hover {
  box-shadow: var(--shadow-soft-lg);
  transform: translateY(-2px);   /* subtle float, not a mechanical lift */
  border-color: var(--accent-light);
}
```
Note there's no `:active` snap-down state like Internly's `.neo-card` — calm surfaces don't need to feel "pressed," they just need to feel present.

### `.emotion-orb` — the check-in circles, replacing the flat-fill wireframe circles

```css
.emotion-orb {
  border-radius: var(--radius-pill);
  background: radial-gradient(circle at 35% 30%, var(--orb-color-light), var(--orb-color));
  box-shadow: 0 12px 32px var(--orb-glow);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.35s ease;
}
.emotion-orb:hover {
  transform: scale(1.06);
  box-shadow: 0 16px 44px var(--orb-glow);
}
.emotion-orb:active {
  transform: scale(0.97);
}
.emotion-orb.selected {
  animation: gentlePulse 2.4s ease-in-out infinite;
}
```
`--orb-color`, `--orb-color-light`, `--orb-glow` are set inline per emotion from the tokens in Section 3 (e.g. `--orb-color: var(--emotion-sad)`).

### `.calm-button` — pill CTA, soft not tactile

```css
.calm-button {
  background: var(--accent);
  color: var(--surface-1);
  border-radius: var(--radius-pill);
  padding: 0.75rem 1.75rem;
  box-shadow: var(--shadow-soft-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}
.calm-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
  background: var(--accent-light);
}
```

### `.calm-input` and `.calm-chip`
Same border/radius/shadow language as `.calm-card`, thin soft border, focus state uses `--accent-glow` as a soft outer glow (`box-shadow: 0 0 0 4px var(--accent-glow)`) rather than a hard focus ring.

---

## 6. Motion Language

Motion should read as **breathing, not clicking.** Concretely:

| Keyframe | Used for | Duration |
|---|---|---|
| `fadeInUp` | cards/content entering | 0.5s (vs. 0.2s brutalist — slower reads as calmer) |
| `gentlePulse` | selected emotion orb, active status dot | 2.4s infinite loop |
| `breathe` | primary CTA on the check-in screen, ambient/idle state | 4s infinite loop |
| `softShimmer` | skeleton loaders | 2.2s infinite |

```css
@keyframes gentlePulse {
  0%, 100% { box-shadow: 0 12px 32px var(--orb-glow); }
  50% { box-shadow: 0 16px 48px var(--orb-glow); }
}
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
```

### Staggered reveals — slower cadence than brutalist

```css
.stagger-1 { animation-delay: 0.08s; }
.stagger-2 { animation-delay: 0.16s; }
/* ...0.08s increments, vs. Internly's 0.04s — the check-in wheel should feel unhurried */
```

**Hard rule:** no transition under 300ms anywhere in the check-in flow. Snappy motion reads as urgency, which is the opposite of what this screen should communicate.

---

## 7. Content & Copy Rules

- **"Nudges, not streaks."** Never punish a missed check-in ("You missed 3 days") — reframe supportively ("We're here whenever you're ready").
- **No forced fields during check-in.** One tap should always be a complete, valid entry. Optional detail (notes, intensity) comes after, never blocks the primary action.
- **Consistent chrome position.** Nav, help, and exit affordances stay in the same place on every screen — this matters more here than in most apps, since users may be checking in during genuine distress.
- **Numbers are mono, everywhere they appear** (streak counts, timestamps, dashboard metrics) — this is the one convention kept from Internly, since precision-reading still benefits from tabular figures even in a warm UI.

---

## 8. Two Registers: Check-In Flow vs. Professional Dashboard

Manasu needs to hold two different visual personalities without feeling like two different products:

| | Check-in flow | Professional monitoring dashboard |
|---|---|---|
| Surface | `.emotion-orb`, `.calm-card` | `.calm-card` + `surface-2` panels |
| Shadow | Soft, glowing, color-matched | Soft, neutral (`--shadow-color` only) |
| Typography | Fraunces for prompts, generous line-height | Nunito Sans body + JetBrains Mono for all figures |
| Density | Very low — one decision per screen | Higher — tables, trend charts, filters allowed |
| Motion | Breathing, slow (Section 6) | Faster fades (0.3s), no ambient pulsing |
| Color | Full emotion palette | Mostly neutral + sage accent; emotion colors only in small trend indicators |

Both share the same token file — the dashboard just uses `surface-2`/mono/faster-motion variants of the same primitives, rather than a separate system.

---

## 9. How To Build This — Step-By-Step

### Step 0 — Brief for an agent

> "Build the UI using a **Calm Organic Minimalism** style. Warm off-white (`#faf6f0`) / warm charcoal (`#211d18`) surfaces — never pure black or white. Soft blurred box-shadows only (`0 Ypx Zpx`), never hard-offset zero-blur shadows. Radii 16–32px. One brand accent (muted sage `#7c9885`) used only for chrome — never for emotion data. Fonts: Fraunces for headings, Nunito Sans for body, JetBrains Mono for numbers. All transitions ≥300ms, ease-out or spring, no snap states. Provide `.calm-card`, `.calm-button`, `.calm-input`, `.calm-chip`, `.emotion-orb` utility classes. Motion: `fadeInUp`, `gentlePulse`, `breathe`, `softShimmer` keyframes, `stagger-N` at 0.08s increments. Always include loading/empty/error states, written in supportive, non-punitive copy."

### Step 1 — Scaffold
```bash
npx create-next-app@latest manasu-web --ts --app
```

### Step 2 — Drop in tokens
Copy Section 3 + 4 CSS blocks verbatim into `globals.css`.

### Step 3 — Wire fonts
`next/font/google` for Fraunces, Nunito Sans, JetBrains Mono per Section 4.

### Step 4 — Build primitives
`.calm-card`, `.calm-button`, `.calm-input`, `.calm-chip`, `.emotion-orb` per Section 5.

### Step 5 — Rebuild the check-in screen
Replace flat-fill circles with `.emotion-orb` + radial gradient + glow, on the warm-cream/charcoal background instead of pure black, arranged in a balanced layout (no orphaned single circle — center it or use a proper flower/ring arrangement).

### Step 6 — Build the dashboard variant
Reuse the same tokens with `surface-2`, mono numerics, faster transitions per Section 8.

### Step 7 — Pre-flight checklist
- [ ] No pure black or pure white anywhere
- [ ] All shadows are blurred, zero offset-only shadows
- [ ] Brand accent never doubles as an emotion color
- [ ] No transition under 300ms in the check-in flow
- [ ] Copy avoids guilt/streak-shaming language
- [ ] Dashboard and check-in flow share one token file, not two systems
- [ ] No emoji; SVG icons only

---

## 10. Proposed File Map

*(Manasu's frontend doesn't have these files yet — this is where they should live once built, mirroring the Internly structure for consistency across your projects.)*

| File | Role |
|---|---|
| `src/app/globals.css` | All tokens, `.calm-*` classes, keyframes, emotion palette |
| `src/app/layout.tsx` | Font loading (Fraunces, Nunito Sans, JetBrains Mono) |
| `src/app/components/EmotionWheel.tsx` | The check-in screen — orbs, selection state, stagger reveal |
| `src/app/components/ThemeToggle.tsx` | Light/dark switch, anti-flash placeholder |
| `src/app/components/StatusBanner.tsx` | idle/loading/error/success states, warm copy |
| `src/app/components/dashboard/*` | Professional dashboard — surface-2, mono figures, faster motion |

---

### TL;DR

A **token-first Calm Organic system**: warm off-black/off-white surfaces (never true black/white), blurred soft shadows (never hard offsets), one sage brand accent kept strictly separate from the desaturated emotion palette, thin soft borders, generous radii, and slow breathing motion (≥300ms, gentle pulses) instead of snappy mechanical motion. The check-in flow and professional dashboard share one token file but run at different density/speed settings. To build it: copy the token block, load Fraunces + Nunito Sans + JetBrains Mono, build every surface from `.calm-card`/`.calm-button`/`.emotion-orb`, and never let a shadow, a border, or a transition feel harder or faster than it needs to.
