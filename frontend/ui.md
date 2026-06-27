# Emotion Intake UI/UX Design Notes

This document captures the design system, aesthetics, and user experience flow of the previously implemented Emotion Check-in screen.

## 1. Overall Aesthetic & Theme
- **Theme:** Dark mode, minimalist, highly focused.
- **Background:** Base color is a deep dark gray (`#141414`). 
- **Dynamic Lighting:** A soft radial gradient illuminates the center of the screen, dynamically tinted based on the currently selected emotion.
- **Typography:** Clean, sans-serif fonts with wide tracking (`0.14em` and `0.1em` for labels) and uppercase styles for a modern, premium feel. Quotes use a serif font (`Georgia`) to feel distinct and literary.
- **Layout:** Centered alignment, restricted maximum width (max `sm` / 320px for the grid) to keep focus tight.

## 2. Color Palette
Core emotions were mapped to specific, muted pastel colors that are easy on the eyes against the dark background:
- **Afraid:** Purple (`#c4a6d4`)
- **Bad:** Gray/Olive (`#a8a89a`)
- **Surprise:** Orange/Gold (`#e8a86a`)
- **Angry:** Rust/Red (`#e07a5f`)
- **Happy:** Rose/Pink (`#d4849e`)
- **Disgust:** Mint/Green (`#8dc7aa`)
- **Sad:** Light Blue (`#8ab4d4`)

## 3. User Experience (UX) Flow
The flow follows a progressive disclosure pattern through three primary states:

### Step 1: Primary Selection
- **Prompt:** "WHAT ARE YOU FEELING?"
- **Visuals:** A 3-column grid of large, perfectly circular buttons for each core emotion.
- **Styling:** Buttons are filled with their respective emotion color but mixed with a darker tone for depth. 
- **Interaction:** Hovering slightly scales the button (`1.04`). Clicking triggers an exaggerated scale (`1.08`) and an inset shadow (inner glow) to confirm selection.

### Step 2: Secondary Refinement
- **Prompt:** A breadcrumb style header (e.g., `Sad → refine`) with a back button (`← Sad`) allowing the user to return to the primary selection.
- **Visuals:** Secondary emotions are presented as a clustered wrap of pill-shaped buttons.
- **Styling:** The pill buttons inherit the color theme of the primary emotion, mixed heavily with white/gray to make them distinct but visually related.
- **Interaction:** Smooth 150ms fade and translate (`-translate-y-2`) animations handle the transition between steps.

### Step 3: Quote & Reflection
- **Loading State:** A minimalist spinning loader with the text "Finding words for this moment…"
- **Display:** The generated quote is presented in a glassmorphism card (white border with high transparency, backdrop blur). 
- **Feedback:** Optional reaction buttons ("This helped" vs "Not quite") are displayed as ghost buttons to gather user feedback on the quote's relevance.

## 4. Micro-interactions
- **Breadcrumb Navigation:** A small progress indicator (three dots at the top of the screen) shows the user which step of the 3-step process they are currently on.
- **Spring Animations:** Extensive use of CSS scaling (`active:scale-[0.96]`) makes tapping buttons feel tactile and responsive.
- **Color Mixing:** Heavy use of modern CSS `color-mix(in srgb, ...)` allows the UI to dynamically generate border, text, and shadow colors based on the single base color of the active emotion.
