# ಮನಸು (Manasu) — "Structured Calm" Vibe Spec

> This replaces the orb-wheel visual direction from `manasu-ui-ux.md`. Keep the fonts (Fraunces / Nunito Sans / JetBrains Mono) from that doc — everything else described here supersedes it.

---

## 1. The Core Shift (say this out loud before building anything)

Your current build is **a floating object on an empty page** — one heading, one shape cluster, nothing else. The reference is **a complete product with chrome**: navbar, contained content column, footer, all present and doing work. That's the actual gap — not "circles vs. cards." A page with no navbar and no footer reads as a prototype no matter how nice the shape in the middle looks. Fix the shell first; the selection component is secondary.

---

## 2. Page Anatomy (top to bottom, every screen)

Every screen in the check-in flow — Identify, Refine, Deep Dive, Reflect — sits inside this same shell. Nothing floats alone anymore.

```
┌─────────────────────────────────────────────┐
│  NAVBAR (persistent)                         │
│  ಮನಸು            Check-in  Insights  Library  ⓟ │
├─────────────────────────────────────────────┤
│                                               │
│         [max-width: 640-720px, centered]     │
│                                               │
│         STEP X OF 4          [step label]    │
│         ▬▬▬▬▬▬▬▬░░░░░░░░░░  (progress bar)   │
│                                               │
│              Heading (Fraunces)              │
│           Muted one-line subtext             │
│                                               │
│         [ selection grid or list ]           │
│                                               │
│         [ optional quote/insight card ]      │
│                                               │
├─────────────────────────────────────────────┤
│  FOOTER: ಮನಸು · tagline    Privacy · Support │
└─────────────────────────────────────────────┘
```

### Navbar spec
- Height ~64px, background matches page background (or 1-2 shades lighter), thin 1px bottom border in `--card-border` — not a floating card, part of the page.
- Logo (ಮನಸು wordmark) top-left, small, in `--foreground` or `--accent`.
- Nav items top-right: plain text links (`Check-in`, `Insights`, `Library`), current page underlined in `--accent`. No pill buttons here — text links only, matches reference's restraint.
- Account avatar, small circle, top-right corner.
- This exists on every screen, identical, never disappears mid-flow.

### Content container
- `max-width: 680px`, centered (`margin: 0 auto`), consistent across all 4 steps — this is what makes the flow feel like one product instead of four disconnected screens.
- Generous top padding (~64-80px) before the step indicator starts.

### Footer
- Always present, even mid-flow. Small, quiet: wordmark + one-line tagline centered or left, utility links (`Privacy`, `Support`, `Resources`) right-aligned, all in `--muted`.
- This is what makes it feel like a real, trustworthy product rather than a demo — small detail, disproportionate effect on perceived polish.

### Ambient background treatment
- Reference uses a very subtle color wash at the page edges (soft blue-lavender bleeding in from corners) rather than a flat single color. For Manasu, do the same with sage/warm tones: a very faint radial gradient using `--accent-dim` bleeding in from top corners against the warm cream base. Barely visible — this is atmosphere, not a feature.

---

## 3. Step Indicator (replaces the current dot-progress)

```
STEP 1 OF 4                              Emotion Identification
▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

- Left: `STEP X OF 4` in small caps, `--muted`, letter-spaced.
- Right: current step's name (`Emotion Identification`, `Refine`, `Deep Dive`, `Reflection`) — this replaces your current breadcrumb-only approach with something that also orients the user in the overall journey, not just their emotion path.
- Below: a single thin (~4px) horizontal progress bar, full width of the content container, filled portion in `--accent` (sage), unfilled in `--surface-2`. Rounded ends.
- The emotion breadcrumb (`Bad → Tired → refine`) can still live *below* the heading as a secondary trail — don't remove it, just don't let it substitute for the step indicator. They serve different jobs: step indicator = "how far in the flow," breadcrumb = "what have I said so far."

---

## 4. Selection Component: Icon-Badge Cards (replaces orbs)

This is the single biggest component change. Replace the big glowing color orbs with this pattern:

```
┌─────────────┐
│     ⊙        │  ← small circular icon badge, pastel fill, ~48px
│             │
│   Happy     │  ← label below, medium weight, small
└─────────────┘
```

- Card: white/`--card` background, thin `1px solid --card-border`, radius `16px` (your existing `--radius-sm` token), soft shadow (`--shadow-soft-sm`) — not the fully-rounded pill shape from your last build.
- Icon badge: small circle (~48-56px) centered at top of card, background is a *pastel tint* of the emotion color (not the full-saturation color) — e.g. `color-mix(in srgb, var(--emotion-happy) 25%, white 75%)` — containing a simple line-icon or face glyph in the full-saturation emotion color.
- Label: sits below the badge, `Nunito Sans` medium weight, colored in a muted tint of the emotion hue (not pure grey, not full saturation) — this is what gives each card its identity without shouting.
- Grid layout: clean rows (3-4 per row depending on breakpoint), consistent gaps, left-to-right reading order — **not** the radial flower/hexagon arrangement. The reference's power is in how *orderly* it looks; a scannable grid outperforms a decorative cluster here.
- Selected state: border becomes `--accent`, subtle `--accent-dim` background wash on the whole card — no big glow, no pulse. Calm means calm on interaction too, not just at rest.

This same card pattern carries through **Refine** and **Deep Dive** steps — just as full-width rows instead of a grid (since those are text-only options like "Boredom," "Stress," "Tired" with no icon), same border/radius/shadow language so it doesn't feel like a different component each screen.

---

## 5. Quote / Insight Card

Appears at the bottom of Step 1 and drives the Reflect step's final screen.

- Background: a muted warm tan/beige (`--surface-2` or a dedicated `--quote-bg` token), noticeably different from the white cards — signals "this is a moment to pause," not another selectable option.
- A large decorative quotation mark (`"`) above the text, in `--muted`, low opacity — small detail, does a lot of work.
- Quote text: `Fraunces`, italic, centered, medium size — this is the one place italic serif should appear; don't overuse it elsewhere or it loses its weight as a "special moment" signal.
- On the Reflect step, this same card becomes the final result: breadcrumb trail above it (`Bad · Tired · Blurry`), the reflection text inside, then two buttons below — filled `--accent` "This helped" / outline "Not quite" — exactly the pattern already in your Reflect screen, just now living inside the full page shell instead of alone on a blank background.

---

## 6. Applying This Across All 4 Steps

| Step | Heading | Body | Notes |
|---|---|---|---|
| **1. Identify** | "How are you feeling right now?" | 7 icon-badge cards in a grid + quote card below | Full shell, step indicator at 1/4 |
| **2. Refine** | "A little more specific" | Full-width list-row cards (Boredom, Busy, Stress...) | Breadcrumb shows `Bad →`, step indicator at 2/4 |
| **3. Deep Dive** | "Almost there" | Full-width list-row cards (Sleepy, Blurry...) | Breadcrumb shows `Bad → Tired →`, step indicator at 3/4 |
| **4. Reflect** | (no heading — quote card is the focus) | Quote card + breadcrumb tag row + This helped/Not quite | Step indicator at 4/4, 100% |

Every step keeps: same navbar, same footer, same `680px` centered container, same step-indicator bar, same card border/radius/shadow language. The *only* thing that changes screen to screen is what's inside the container.

---

## 7. Do / Don't

**Do:**
- Keep Fraunces for all headings, Nunito Sans for body/labels, JetBrains Mono nowhere in this flow (it's dashboard-only)
- Keep every screen inside the same navbar+footer+container shell
- Use pastel icon badges, not full-saturation orbs, for emotion identity
- Keep the accent (sage) consistent across progress bar, selected states, and primary buttons

**Don't:**
- Don't let any screen exist without the navbar/footer shell — that's the #1 thing making the current build feel unfinished
- Don't bring back the radial/flower orb arrangement — grid rows read cleaner and match the reference's orderliness
- Don't use full-pill (fully rounded) shape for selection cards — moderate radius only
- Don't add glow/pulse effects to selection cards — save "energy" for the accent color and progress bar, keep card interactions quiet

---

## 8. Token Additions Needed (on top of `manasu-ui-ux.md`'s existing tokens)

```css
--container-max: 680px;
--navbar-height: 64px;
--quote-bg: #f0e9dc;              /* muted tan, distinct from --card white */
--icon-badge-size: 52px;

/* Pastel icon badge backgrounds — 25% emotion color mixed into white */
--emotion-happy-badge: color-mix(in srgb, var(--emotion-happy) 25%, white 75%);
--emotion-sad-badge: color-mix(in srgb, var(--emotion-sad) 25%, white 75%);
/* ...repeat per emotion */
```

---

### TL;DR

Stop designing individual screens — design **one shell** (navbar, 680px centered container, footer, step-indicator bar) and drop each of the 4 steps into it unchanged. Replace glowing orbs with small pastel icon-badge cards in an orderly grid. Keep Fraunces for headings and the sage accent for progress/selected-states/buttons only. The reference feels "clean" primarily because it's *structurally complete*, not because any single component is fancier than what you already built.