# PoorDown — Design System

## Table of Contents
1. [Brand Identity](#1-brand-identity)
2. [SVG Assets](#2-svg-assets)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Component Design Specs](#5-component-design-specs)
6. [Board Visual Design](#6-board-visual-design)
7. [Motion & Animation Spec](#7-motion--animation-spec)
8. [Spacing & Layout System](#8-spacing--layout-system)
9. [Iconography](#9-iconography)

---

## 1. Brand Identity

### Name
**PoorDown** — a portmanteau of "breakdown" (what happens to your finances) + poverty + Monopoly's core mechanic of grinding opponents into bankruptcy. The name is self-deprecating and immediately signals the game's spirit.

### Tagline
*"The board game you know, anywhere you are."*

### Brand Personality
- **Nostalgic but modern.** Like a vintage Parker Brothers board game that got a flat design makeover — Saul Bass poster aesthetics, not a startup landing page.
- **Warm and inviting.** Cream tones, rounded corners, serif display type. Nothing feels clinical or cold.
- **Slightly irreverent.** The name is a joke. The copy can have a wink. Don't be stuffy.
- **Not corporate.** No gradients trying to look premium. No dark mode by default. No drop shadows fighting for attention.

### Design References
- Visual direction: Richup.io (game feel), Linear (motion quality), vintage Monopoly box art (color palette, serif type hierarchy)
- Avoid: neon esports aesthetics, skeuomorphic board textures, Comic Sans energy

### Core Design Decisions
- Inline styles throughout JSX (not Tailwind utility classes in markup) — match existing codebase pattern
- All spacing on the 8px grid
- Border radii are generous (12–24px) — approachable and game-like, not enterprise
- Shadows are subtle. One shadow vocabulary: `rgba(0,0,0,0.08)` family
- Color fills, not borders, communicate state

---

## 2. SVG Assets

### a) Primary Logo — Horizontal

"Poor" in dark (#2B2D42), "Down" in red (#E63946). Dice icon to the left using custom SVG dots. Playfair Display aesthetic encoded in the SVG font references. Viewbox 260x52.

```svg
<svg viewBox="0 0 260 52" xmlns="http://www.w3.org/2000/svg" width="260" height="52">
  <!-- Dice icon, left side, 40x40 centered vertically -->
  <g transform="translate(0, 6)">
    <!-- Dice body -->
    <rect x="1" y="1" width="38" height="38" rx="7" ry="7"
          fill="#F8F4E8" stroke="#2B2D42" stroke-width="2.5"/>
    <!-- Dot layout for face 5 (classic dice feel: 4 corners + center) -->
    <!-- Top-left -->
    <circle cx="11" cy="11" r="4" fill="#2B2D42"/>
    <!-- Top-right -->
    <circle cx="29" cy="11" r="4" fill="#2B2D42"/>
    <!-- Center -->
    <circle cx="20" cy="20" r="4" fill="#E63946"/>
    <!-- Bottom-left -->
    <circle cx="11" cy="29" r="4" fill="#2B2D42"/>
    <!-- Bottom-right -->
    <circle cx="29" cy="29" r="4" fill="#2B2D42"/>
  </g>

  <!-- Logotype: "Poor" dark, "Down" red -->
  <!-- Uses Georgia/serif fallback — engineer should load Playfair Display via Google Fonts -->
  <text
    x="52"
    y="36"
    font-family="'Playfair Display', Georgia, serif"
    font-size="34"
    font-weight="800"
    letter-spacing="-0.5"
    fill="#2B2D42"
  >Poor</text>
  <text
    x="148"
    y="36"
    font-family="'Playfair Display', Georgia, serif"
    font-size="34"
    font-weight="800"
    letter-spacing="-0.5"
    fill="#E63946"
  >Down</text>
</svg>
```

**Usage:** Page header (`<header>`), landing page hero. Render at natural size (260×52) or scale uniformly. Do not crop the dice — it anchors the identity.

**Implementation note:** Load Playfair Display 800 before rendering to avoid FOUT. The `letter-spacing="-0.5"` tightens the display type for a classic editorial feel.

---

### b) Logo Mark / Icon (square, 64×64)

Dice + "P" monogram. Works as favicon (export as .ico at 32×32), PWA icon, and avatar placeholder.

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <!-- Card background — dark like a board game box spine -->
  <rect x="0" y="0" width="64" height="64" rx="12" fill="#2B2D42"/>

  <!-- Inner dice shape, cream, slight padding -->
  <rect x="8" y="8" width="48" height="48" rx="9" fill="#F8F4E8"/>

  <!-- "P" monogram centered -->
  <text
    x="32"
    y="43"
    text-anchor="middle"
    font-family="'Playfair Display', Georgia, serif"
    font-size="34"
    font-weight="800"
    fill="#E63946"
  >P</text>

  <!-- Two dots top-right and bottom-left to signal dice -->
  <circle cx="49" cy="16" r="3.5" fill="#2B2D42"/>
  <circle cx="15" cy="49" r="3.5" fill="#2B2D42"/>
</svg>
```

**At 32×32:** The "P" still reads clearly. The two dots read as accents. Export as PNG for favicon.

**At 512×512:** Use for PWA manifest `icons` array (maskable, use the full rounded square).

---

### c) Player Token SVG

A flat-design pawn silhouette. Circular head, narrow neck, flared base. Think classic Monopoly playing piece simplified into 2 SVG paths. Parameterized by `fill` (player color) and `size`.

```svg
<!--
  Player token. Set width/height to 24 or 48.
  Change fill="#E63946" to any player color.
  The dark stroke (#2B2D42) is always fixed.
-->
<svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" width="24" height="32">
  <!-- Head: circle -->
  <circle cx="12" cy="7" r="5.5" fill="#E63946" stroke="#2B2D42" stroke-width="1.5"/>

  <!-- Neck: short rectangle -->
  <rect x="10" y="11.5" width="4" height="4" fill="#E63946" stroke="#2B2D42" stroke-width="0"
        rx="1"/>

  <!-- Body: trapezoid using polygon — wider at base -->
  <polygon
    points="7,16 17,16 20,28 4,28"
    fill="#E63946"
    stroke="#2B2D42"
    stroke-width="1.5"
    stroke-linejoin="round"
  />

  <!-- Base: rounded rectangle -->
  <rect x="3" y="26" width="18" height="4" rx="2"
        fill="#E63946" stroke="#2B2D42" stroke-width="1.5"/>
</svg>
```

**At 24px (board token):** Render inside the board SVG at `<g transform="translate(x,y) scale(0.75)">`. Add `stroke-width="2"` for legibility.

**At 48px (HUD badge, token picker):** Render at natural viewBox size. Add a soft drop shadow via CSS `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25))` on the `<svg>` element.

**Active player indicator:** Render a pulsing ring around the token: `<circle cx="12" cy="20" r="14" fill="none" stroke="{playerColor}" stroke-width="2" opacity="0.6">` with a CSS `animation: ring-pulse 1.5s ease-in-out infinite`.

---

### d) Dice Face SVGs (1–6)

Flat design. Cream background (#F8F4E8), 2px border #2B2D42, border-radius 12px (in SVG: rx="12"), dots in #2B2D42. Each SVG is 64×64.

**Face 1**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="32" cy="32" r="5.5" fill="#2B2D42"/>
</svg>
```

**Face 2**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="20" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="44" r="5.5" fill="#2B2D42"/>
</svg>
```

**Face 3**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="20" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="32" cy="32" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="44" r="5.5" fill="#2B2D42"/>
</svg>
```

**Face 4**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="20" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="20" cy="44" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="44" r="5.5" fill="#2B2D42"/>
</svg>
```

**Face 5**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="20" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="20" r="5.5" fill="#2B2D42"/>
  <circle cx="32" cy="32" r="5.5" fill="#2B2D42"/>
  <circle cx="20" cy="44" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="44" r="5.5" fill="#2B2D42"/>
</svg>
```

**Face 6**
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <rect x="2" y="2" width="60" height="60" rx="12" fill="#F8F4E8" stroke="#2B2D42" stroke-width="2"/>
  <circle cx="20" cy="16" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="16" r="5.5" fill="#2B2D42"/>
  <circle cx="20" cy="32" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="32" r="5.5" fill="#2B2D42"/>
  <circle cx="20" cy="48" r="5.5" fill="#2B2D42"/>
  <circle cx="44" cy="48" r="5.5" fill="#2B2D42"/>
</svg>
```

**Doubles state:** Swap `stroke="#2B2D42"` on the `<rect>` to `stroke="#F4A261"` and add `filter: drop-shadow(0 0 6px rgba(244,162,97,0.6))` on the `<svg>` element via CSS.

---

### e) Property Color Stripe Swatches

The 8 property groups rendered as a horizontal swatch strip. Each swatch is 40×24px with a 4px gap. Total width 360×24.

```svg
<svg viewBox="0 0 360 32" xmlns="http://www.w3.org/2000/svg" width="360" height="32">
  <!-- Brown: Mediterranean Ave, Baltic Ave -->
  <rect x="0"   y="4" width="40" height="24" rx="4" fill="#8B4513"/>
  <!-- Light Blue: Oriental, Vermont, Connecticut Ave -->
  <rect x="44"  y="4" width="40" height="24" rx="4" fill="#87CEEB"/>
  <!-- Pink: St. Charles, States, Virginia -->
  <rect x="88"  y="4" width="40" height="24" rx="4" fill="#FF69B4"/>
  <!-- Orange: St. James, Tennessee, New York -->
  <rect x="132" y="4" width="40" height="24" rx="4" fill="#FF8C00"/>
  <!-- Red: Kentucky, Indiana, Illinois -->
  <rect x="176" y="4" width="40" height="24" rx="4" fill="#E63946"/>
  <!-- Yellow: Atlantic, Ventnor, Marvin Gardens -->
  <rect x="220" y="4" width="40" height="24" rx="4" fill="#FFD700"/>
  <!-- Green: Pacific, North Carolina, Pennsylvania -->
  <rect x="264" y="4" width="40" height="24" rx="4" fill="#228B22"/>
  <!-- Dark Blue: Park Place, Boardwalk -->
  <rect x="308" y="4" width="40" height="24" rx="4" fill="#1D3557"/>
</svg>
```

On board spaces, the color stripe is a rectangle spanning the full width of the space, 20% of space height (approximately 22px in the 1000×1000 viewBox at TRACK_WIDTH=110). It sits at the outer edge of the space (the edge facing away from the board center).

---

## 3. Color System

### Core UI Palette

| Token | Name | Hex | RGB | HSL | Usage |
|-------|------|-----|-----|-----|-------|
| `--color-board-green` | Board Green | `#2D6A4F` | rgb(45,106,79) | hsl(152,41%,30%) | Board center field, GO corner, Free Parking corner, Success action buttons |
| `--color-cream` | Cream | `#F8F4E8` | rgb(248,244,232) | hsl(44,60%,94%) | Page background, card surfaces, dice face, track background |
| `--color-red` | Player Red | `#E63946` | rgb(230,57,70) | hsl(355,77%,56%) | Primary action buttons, Player 1 token, Chance space background, "Down" in logo |
| `--color-navy` | Player Blue | `#1D3557` | rgb(29,53,87) | hsl(214,50%,23%) | Secondary action buttons, Player 2 token, Community Chest space background, borders |
| `--color-gold` | Gold | `#F4A261` | rgb(244,162,97) | hsl(27,87%,67%) | Money displays, End Turn button, Tax space, doubles indicator, highlight accents |
| `--color-dark` | Dark | `#2B2D42` | rgb(43,45,66) | hsl(235,21%,21%) | Body text, headings, board outer background, "Poor" in logo, space borders, dot fills |
| `--color-jail-orange` | Jail Orange | `#E76F51` | rgb(231,111,81) | hsl(14,73%,61%) | Jail corner, Go To Jail corner |
| `--color-rail-gray` | Rail Gray | `#8D99AE` | rgb(141,153,174) | hsl(220,16%,62%) | Railroad properties, disabled states, muted/secondary text, placeholder text |

### Property Group Colors

| Token | Name | Hex | RGB | Usage |
|-------|------|-----|-----|-------|
| `--prop-brown` | Brown | `#8B4513` | rgb(139,69,19) | Mediterranean Ave, Baltic Ave |
| `--prop-light-blue` | Light Blue | `#87CEEB` | rgb(135,206,235) | Oriental, Vermont, Connecticut Ave |
| `--prop-pink` | Pink | `#FF69B4` | rgb(255,105,180) | St. Charles, States, Virginia |
| `--prop-orange` | Orange | `#FF8C00` | rgb(255,140,0) | St. James, Tennessee, New York |
| `--prop-red` | Red | `#E63946` | rgb(230,57,70) | Kentucky, Indiana, Illinois (same as Player Red) |
| `--prop-yellow` | Yellow | `#FFD700` | rgb(255,215,0) | Atlantic, Ventnor, Marvin Gardens |
| `--prop-green` | Green | `#228B22` | rgb(34,139,34) | Pacific, North Carolina, Pennsylvania |
| `--prop-dark-blue` | Dark Blue | `#1D3557` | rgb(29,53,87) | Park Place, Boardwalk (same as Player Blue) |

### Player Token Colors (assigned in join order)

| Slot | Hex | Name |
|------|-----|------|
| P1 | `#E63946` | Red |
| P2 | `#1D3557` | Navy |
| P3 | `#2D6A4F` | Green |
| P4 | `#F4A261` | Gold |
| P5 | `#8B4513` | Brown |
| P6 | `#87CEEB` | Sky Blue |
| P7 | `#FF69B4` | Pink |
| P8 | `#8D99AE` | Gray |

### Color Usage Rules

**Do:**
- Use Cream (`#F8F4E8`) as the primary surface for all cards, modals, and the page background.
- Use Dark (`#2B2D42`) for all body text on cream backgrounds — this passes WCAG AA at normal size.
- Use Board Green (`#2D6A4F`) for success/confirmation actions (buy, pay, confirm).
- Use Player Red (`#E63946`) for the primary CTA only — Roll Dice, Start Game.
- Use Gold (`#F4A261`) for the End Turn action and money amounts exclusively.
- Use Rail Gray (`#8D99AE`) only for disabled states and secondary/muted text.

**Do not:**
- Put white text on Gold (`#F4A261`) — contrast ratio is only ~2.5:1, fails WCAG. Use Dark text instead.
- Put white text on Cream — obviously invisible.
- Use Light Blue (`#87CEEB`) for any UI chrome — it's a property color only.
- Use Player Red and Jail Orange adjacent to each other — they clash.
- Mix Dark Blue (`#1D3557`) and Board Green (`#2D6A4F`) as adjacent button pairs — they read as similarly dark.

### Accessibility — Contrast Ratios

| Foreground | Background | Ratio | WCAG Result |
|------------|------------|-------|-------------|
| `#2B2D42` Dark | `#F8F4E8` Cream | 12.5:1 | AAA |
| `#FFFFFF` White | `#2B2D42` Dark | 13.8:1 | AAA |
| `#FFFFFF` White | `#E63946` Red | 4.6:1 | AA (normal) |
| `#FFFFFF` White | `#2D6A4F` Green | 5.9:1 | AA |
| `#FFFFFF` White | `#1D3557` Navy | 10.2:1 | AAA |
| `#2B2D42` Dark | `#F4A261` Gold | 3.8:1 | AA (large text only) |
| `#FFFFFF` White | `#F4A261` Gold | 2.5:1 | Fail — use Dark text |
| `#FFFFFF` White | `#E76F51` Jail Orange | 3.4:1 | AA (large text only) |
| `#2B2D42` Dark | `#87CEEB` Light Blue | 4.1:1 | AA |

**Conclusion:** For any text smaller than 18px (or 14px bold) on Gold or Jail Orange, use `#2B2D42` instead of white.

### Dark Mode
Dark mode is **not currently planned**. When/if added, the inversion map would be:

| Light | Dark Mode Equivalent |
|-------|---------------------|
| `#F8F4E8` Cream (background) | `#1A1B2E` |
| `#FFFFFF` White (cards) | `#252638` |
| `#2B2D42` Dark (text) | `#E8E4D8` |
| `#8D99AE` Gray (muted) | `#6B7280` |
| All accent colors stay the same | — |

---

## 4. Typography

### Google Fonts Import

Add to `<head>` in `pages/_app.js` or `pages/_document.js`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

Load `display=swap` to avoid invisible text during font load.

### Font Stack

| Role | Primary | Fallback Stack |
|------|---------|---------------|
| Headings | `Playfair Display` | `Georgia, 'Times New Roman', serif` |
| Body / UI | `Inter` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` |
| Numbers / Codes | `JetBrains Mono` | `'SF Mono', 'Fira Code', 'Consolas', monospace` |

**When to use each:**
- **Playfair Display:** Game title, modal headings (property name, card title), corner square labels (GO, JAIL, FREE PARKING), center board watermark. Never in body copy or buttons.
- **Inter:** All body text, labels, button text, player names, sidebar content, form inputs, error messages. The workhorse font.
- **JetBrains Mono:** Room codes, cash amounts ($1,500), dice values, any numeric game data. Tabular figures ensure columns align.

### Type Scale

| Name | Size | px | CSS | Usage |
|------|------|-----|-----|-------|
| `xs` | 10px | 10 | `font-size: 10px` | Tooltip, fine print |
| `sm` | 12px | 12 | `font-size: 12px` | Player badge text, property price on board |
| `base` | 16px | 16 | `font-size: 16px` | Body text, button labels, form inputs |
| `lg` | 20px | 20 | `font-size: 20px` | Section labels, subheadings |
| `xl` | 24px | 24 | `font-size: 24px` | Modal subheadings, HUD player name |
| `2xl` | 32px | 32 | `font-size: 32px` | Room code display, modal property name |
| `3xl` | 48px | 48 | `font-size: 48px` | Landing page hero title |

### Font Weights

| Weight | Usage |
|--------|-------|
| 400 (Regular) | Body text, secondary labels, subtext |
| 600 (SemiBold) | Button labels, player names, room code text, important UI labels |
| 700 (Bold) | Modal headings, section headers |
| 800 (ExtraBold) | Game title, property name in modal, corner labels (Playfair Display only) |

### Line Height

| Context | Line Height | Reasoning |
|---------|------------|-----------|
| Display/headings | 1.1 | Tight — Playfair Display looks better compressed |
| Body text | 1.5 | Standard comfortable reading |
| UI labels (single line) | 1.0–1.2 | Buttons, badges — no multiline expected |
| Fine print | 1.6 | Smaller text needs more air |

### Letter Spacing

| Context | Value | CSS |
|---------|-------|-----|
| Normal body | 0 | `letter-spacing: 0` |
| Button labels (Inter 600) | +0.3px | `letter-spacing: 0.3px` |
| Room code (JetBrains Mono) | +2px | `letter-spacing: 2px` |
| ALL-CAPS labels | +1px | `letter-spacing: 1px` |
| Playfair Display headings | -0.5px | `letter-spacing: -0.5px` |

**Room code tracking is critical.** The 6-character code (e.g., `ABCDEF`) must be scannable at a glance. Wide tracking (`letter-spacing: 2px`) at 18px JetBrains Mono makes it instantly copy-readable.

---

## 5. Component Design Specs

### Button

Border radius: `12px`. Padding: `12px 24px`. Font: Inter 16px, weight 600. Box shadow (default): `0 4px 12px rgba(0,0,0,0.2)`. Transition: `all 150ms ease-out`.

#### Primary (Roll Dice, Start Game)
```
background: #E63946
color: #FFFFFF
box-shadow: 0 4px 12px rgba(230,57,70,0.35)
```
- **Hover:** `background: #CC2F3C`, `box-shadow: 0 6px 16px rgba(230,57,70,0.45)`, `transform: translateY(-1px)`
- **Active/Pressed:** `background: #B02835`, `box-shadow: 0 2px 6px rgba(230,57,70,0.3)`, `transform: translateY(0px)`
- **Disabled:** `background: #8D99AE`, `color: rgba(255,255,255,0.6)`, `box-shadow: none`, `cursor: not-allowed`, `transform: none`
- **Loading:** Show a 16px CSS spinner (white border, 2px, one quadrant colored, `animation: spin 0.6s linear infinite`) in place of the label. Disable pointer events.

#### Secondary (Join, Cancel, settings actions)
```
background: #1D3557
color: #FFFFFF
box-shadow: 0 4px 12px rgba(29,53,87,0.3)
```
- **Hover:** `background: #162742`, `transform: translateY(-1px)`
- **Active:** `background: #0E1B2D`, `transform: translateY(0px)`
- **Disabled:** Same as primary disabled.

#### Success (Buy Property, Confirm, Pay)
```
background: #2D6A4F
color: #FFFFFF
box-shadow: 0 4px 12px rgba(45,106,79,0.3)
```
- **Hover:** `background: #245A42`
- **Active:** `background: #1B4433`

#### Gold (End Turn, highlighted optional actions)
```
background: #F4A261
color: #2B2D42
box-shadow: 0 4px 12px rgba(244,162,97,0.4)
```
Note: text is dark (#2B2D42), not white — Gold fails white text contrast at this weight.
- **Hover:** `background: #F09040`, `color: #2B2D42`
- **Active:** `background: #E07A2A`

#### Ghost / Outline variant (Auction, secondary alternatives)
```
background: transparent
color: #2B2D42
border: 2px solid #2B2D42
box-shadow: none
```
- **Hover:** `background: rgba(43,45,66,0.06)`

---

### Input Field

```
background: #FFFFFF
border: 2px solid #E8E4D8
border-radius: 12px
padding: 12px 16px
font-family: Inter, sans-serif
font-size: 16px
font-weight: 400
color: #2B2D42
outline: none
transition: border-color 150ms ease-out
```

- **Focus:** `border-color: #2D6A4F`, `box-shadow: 0 0 0 3px rgba(45,106,79,0.15)`
- **Error:** `border-color: #E63946`, `box-shadow: 0 0 0 3px rgba(230,57,70,0.15)`
- **Disabled:** `background: #F0EDE4`, `color: #8D99AE`, `cursor: not-allowed`
- **Placeholder text:** `color: #8D99AE`

Label: Inter 14px, weight 600, color #2B2D42, `margin-bottom: 6px`, displayed above the input.

Error message: Inter 12px, weight 400, color #E63946, displayed below the input with `margin-top: 4px`.

---

### Card / Panel

Three tiers based on visual weight:

**Large Card (modals, landing page hero panels)**
```
background: #FFFFFF
border-radius: 24px
box-shadow: 0 8px 40px rgba(0,0,0,0.08)
padding: 32px
```

**Panel (game room sidebar, HUD container)**
```
background: #FFFFFF
border-radius: 16px
box-shadow: 0 4px 20px rgba(0,0,0,0.06)
padding: 20px
```

**Small Card (compact info cards, tooltips)**
```
background: #FFFFFF
border-radius: 12px
box-shadow: 0 2px 12px rgba(0,0,0,0.06)
padding: 12px 16px
```

**Page background:** Cream `#F8F4E8`. Cards sit on top as white surfaces — the cream/white layering creates depth without shadows fighting.

---

### Room Code Display

```
display: inline-flex
align-items: center
background: #2B2D42
color: #FFFFFF
font-family: 'JetBrains Mono', monospace
font-size: 18px
font-weight: 600
letter-spacing: 2px
border-radius: 12px
padding: 8px 16px
gap: 10px
```

Append a copy icon (Lucide `Copy`, 16px, `#8D99AE`) with `cursor: pointer`. On copy success: icon briefly turns `#2D6A4F` (green) for 1.5s then reverts. Show a "Copied!" tooltip for 1.5s.

---

### Player Badge (header row)

Pill shape. Background = player's assigned token color. Text: white (verify contrast — see color table; for Gold token use dark text).

```
display: inline-flex
align-items: center
background: {playerColor}
color: #FFFFFF  /* or #2B2D42 for Gold token */
font-family: Inter, sans-serif
font-size: 12px
font-weight: 600
padding: 4px 12px
border-radius: 20px
gap: 6px
```

- **Active player state:** `transform: scale(1.05)`, add `box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px {playerColor}` (white ring outline then colored outer ring). The double ring clearly marks whose turn it is.
- **Eliminated player:** `opacity: 0.4`, strike through name with `text-decoration: line-through`.

---

### Property Card (modal)

Triggered when a player lands on an unowned or owned property.

```
background: #FFFFFF
border-radius: 20px
overflow: hidden
width: 320px
box-shadow: 0 12px 48px rgba(0,0,0,0.15)
```

**Structure (top to bottom):**

1. **Color stripe** — full width, 10px tall, background = property group color. No border-radius override (parent `overflow: hidden` handles corners).

2. **Header area** — padding: 20px 20px 12px
   - Property name: Playfair Display 22px, weight 800, color #2B2D42
   - Group label: Inter 12px, weight 600, color = group color (or #8D99AE if gray)
   - Price: JetBrains Mono 18px, weight 600, color #2D6A4F, prefixed with "$"

3. **Divider** — 1px solid #E8E4D8

4. **Rent table** — padding: 12px 20px
   - Table rows: Inter 13px, two columns (label left, value right)
   - Label: color #8D99AE, weight 400
   - Value: JetBrains Mono 13px, color #2B2D42, weight 600
   - Rows: Rent, With 1 House, 2 Houses, 3 Houses, 4 Houses, Hotel
   - Active rent row (matching current house count): background #F8F4E8, label color #2B2D42, value color #E63946

5. **Footer** — padding: 16px 20px
   - If unowned and active player: Full-width Success green Buy button ("Buy $XXX"), then smaller ghost "Auction" button below
   - If owned by another player: "Pay Rent $XX" success button (non-interactive, greyed, just informational)
   - If owned by current player: "Manage" secondary button → mortgage / build houses
   - If mortgaged: "Unmortgage $XX" gold button

---

### Dice Component

Two dice rendered side by side. Each die: 64×64px.

```
/* Die container */
width: 64px
height: 64px
background: #F8F4E8
border: 2px solid #2B2D42
border-radius: 12px
display: flex
align-items: center
justify-content: center
```

Dots: SVG circles, fill `#2B2D42`, radius 5.5px. See Section 2d for per-face SVG.

**Doubles state:**
```
border-color: #F4A261
filter: drop-shadow(0 0 6px rgba(244,162,97,0.6))
```

**Rolling animation state:** Apply CSS class `.rolling` which adds:
```css
@keyframes tumble {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(90deg) scale(0.9); }
  50%  { transform: rotate(180deg) scale(1.05); }
  75%  { transform: rotate(270deg) scale(0.95); }
  100% { transform: rotate(360deg) scale(1); }
}
.rolling {
  animation: tumble 0.35s ease-in-out;
}
```

The die SVG face changes to the result value after the animation completes (`onAnimationEnd` callback).

**Two-die layout:**
```
display: flex
gap: 12px
align-items: center
```

---

### Player HUD Card

One card per player in the sidebar. Ordered by join sequence.

```
background: #FFFFFF
border-radius: 12px
border-left: 4px solid {playerColor}
padding: 12px 14px
display: flex
flex-direction: column
gap: 8px
```

**Active player:** Add `box-shadow: 0 4px 20px rgba({playerColorRGB}, 0.25)`. To get the RGB from the hex: pre-compute per player color at render time and inject as inline style.

**Eliminated player:** `opacity: 0.5`. Player name gets `text-decoration: line-through`. Cash shows "$0". Position doesn't update.

**Card contents:**
```
Row 1: [Token colored circle 12px] [Player name, Inter 14px 600] ... [Cash, JetBrains Mono 14px 600, #2D6A4F]
Row 2: [Position label, Inter 12px, #8D99AE] e.g. "Boardwalk"  ... [Property count, Inter 12px, #8D99AE] e.g. "7 props"
Row 3 (if active): [Subtle pulsing green dot] "Your turn" Inter 12px #2D6A4F
Row 3 (if in jail): [Orange indicator dot] "In Jail (turn 2/3)" Inter 12px #E76F51
```

---

## 6. Board Visual Design

The board SVG uses a 1000×1000 viewBox. Key dimensions (from actual Board.js):
- Corner size: 120×120px
- Track width: 110px
- Space width: 88px
- 9 non-corner spaces per side

### Surface Colors

| Surface | Color | Notes |
|---------|-------|-------|
| Board outer background | `#2B2D42` (Dark) | The board "frame" / table surface |
| Track background | `#F8F4E8` (Cream) | Behind all non-property spaces |
| Center field | `#2D6A4F` (Board Green) | The large center rectangle |
| GO corner | `#2D6A4F` (Board Green) | Welcoming, safe |
| Free Parking corner | `#2D6A4F` (Board Green) | Safe corner |
| Jail corner | `#E76F51` (Jail Orange) | Warning tone |
| Go To Jail corner | `#E76F51` (Jail Orange) | Warning tone |
| Space border | `2px solid #2B2D42` | All space borders |

### Property Spaces

- Each property space background: its group color (full space fill)
- Text on group-colored spaces: white, with `text-shadow: 1px 1px 1px rgba(0,0,0,0.4)` for legibility on lighter groups (Light Blue, Yellow, Pink)
- Property name: Inter 9px 600, truncated to ~11 chars
- Price: JetBrains Mono 7px, opacity 0.9

**Color stripe alternative approach (future refinement):** Instead of filling the entire space with group color, use cream background with only a 22px-tall color stripe at the outer edge. This improves readability but requires refactoring `renderPropertySpace`. The current full-color-fill approach is acceptable for the MVP.

### Special Spaces

| Type | Background | Icon | Text Color |
|------|-----------|------|-----------|
| Chance | `#E63946` | "?" Playfair Display 20px | White |
| Community Chest | `#1D3557` | "C" Playfair Display 20px | White |
| Tax | `#F4A261` | "$" Playfair Display 20px | White (acceptable at large size) |

### Corner Squares

Rendered at 120×120px. Text: Playfair Display, white.

| Corner | Background | Primary Text | Subtext |
|--------|-----------|-------------|---------|
| 0 — GO | `#2D6A4F` | "GO" (22px 800) | "Collect $200" (9px Inter) |
| 10 — Jail | `#E76F51` | "JAIL" (18px 800) | "Just Visiting" (9px Inter) |
| 20 — Free Parking | `#2D6A4F` | "FREE" (18px 800) | "PARKING" (9px Inter) |
| 30 — Go To Jail | `#E76F51` | "GO TO" (18px 800) | "JAIL" (second tspan) |

### Player Tokens on Board

Current implementation uses circles (r=10) with player initial. This is the MVP approach.

- Token: filled circle, `fill={playerColor}`, `stroke="#2B2D42"`, `strokeWidth="2"`, `r=10`
- Player initial: Inter 10px bold, white, centered
- Active player ring: outer circle `r=16`, `fill="none"`, `stroke={playerColor}`, `strokeWidth="3"`, `opacity=0.8`
- Multiple players on same space: arranged in a circle (radius 12px) with equal angular spacing — current implementation handles this correctly

**Future upgrade:** Replace circle+initial with the pawn silhouette SVG from Section 2c, scaled to fit within the space bounds.

### Property Ownership Indicators

When a property is owned (PropertyState has an `owner` UUID):

- Render a small colored dot (r=5) in the bottom-right corner of the space, `fill={ownerColor}`
- Stroke: `2px white` to separate it from the space background
- If mortgaged: dot is half-opacity and has a diagonal line through it (use SVG `line` element)

### House / Hotel Indicators

Render inside the space, above the property name:

- **1–4 houses:** Row of small green squares (4×4px each, `fill="#228B22"`, `stroke="#2B2D42"`, `strokeWidth="0.5"`, 2px gap between). Position along the inner edge of the space (toward board center), centered horizontally.
- **Hotel (5):** Single red rectangle (10×6px, `fill="#E63946"`, `stroke="#2B2D42"`, `strokeWidth="0.5"`), centered in the same position.

House/hotel count comes from `ydoc.getMap('board').get(String(spaceId))?.houses`.

---

## 7. Motion & Animation Spec

All animations must respect `prefers-reduced-motion: reduce`. When that media query is active, disable all transforms and replace with instant state changes or simple opacity fades (100ms max).

### Animation Inventory

| Animation | Duration | Easing | Trigger | Implementation |
|-----------|---------|--------|---------|----------------|
| Dice roll | 350ms | `ease-in-out` | Player clicks Roll | CSS `@keyframes tumble`, applied via class |
| Token movement | 300ms per space | Spring (stiffness 200, damping 25) | After dice result | Framer Motion `animate` on position |
| Card reveal (modal open) | 200ms | `ease-out` | Property modal opens | Slide up 20px + fade in, Framer Motion |
| Card dismiss (modal close) | 150ms | `ease-in` | Modal closes | Fade out + scale 0.97 |
| Turn indicator pulse | 1500ms | `ease-in-out`, infinite | Active player change | CSS `@keyframes ring-pulse` on token ring |
| Property purchase celebration | 400ms | Spring | Buy button clicked | Icon scale burst + color flash |
| Player elimination | 500ms | `ease-out` | Player goes bankrupt | HUD card fades to 0.5 opacity, name strikethrough animates via CSS `text-decoration` transition |
| Toast / notification | 200ms in, 150ms out | `ease-out` in, `ease-in` out | System events | Slide in from top, auto-dismiss at 3s |
| Active player badge scale | 200ms | `ease-out` | Turn changes | `transform: scale(1.05)` on badge |
| Dice doubles glow | 300ms | `ease-out` | Doubles rolled | Box-shadow and border-color transition |
| Room link copy flash | 1500ms | `ease-out` | Copy button clicked | Icon color: gray → green → gray |
| Button press | 100ms | `ease-out` | `mousedown` | `translateY(1px)` on press |

### Token Movement — Spring Parameters

Use Framer Motion `animate` with `type: "spring"` transition:

```js
// In Framer Motion motion.g or motion.circle wrapping each token
transition={{
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 0.8,
  restDelta: 0.5,
}}
```

Tokens do not travel in a straight line — they follow the board path. Implementation: pre-compute the (x,y) center of each of the 40 spaces. On position change, animate through each intermediate space center sequentially with 300ms delay per step. Use Framer Motion's `animate` called in sequence or a `useEffect` loop that updates position state one step at a time.

### Dice Roll Animation

```css
@keyframes tumble {
  0%   { transform: rotate(0deg) scale(1);    opacity: 1; }
  15%  { transform: rotate(45deg) scale(0.85); }
  35%  { transform: rotate(150deg) scale(1.1); }
  60%  { transform: rotate(270deg) scale(0.92); }
  80%  { transform: rotate(340deg) scale(1.04); }
  100% { transform: rotate(360deg) scale(1);    opacity: 1; }
}

.dice-rolling {
  animation: tumble 0.35s ease-in-out;
  pointer-events: none;
}
```

After `onAnimationEnd`: update the SVG face to the result value.

For the two-die pair, stagger the second die by 40ms using `animation-delay: 40ms` to avoid a perfectly synchronized look.

### Card Reveal (Property Modal)

```js
// Framer Motion variants
const modalVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 8,  scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
};
```

Wrap modal content in `<AnimatePresence>` + `<motion.div variants={modalVariants}>`.

### Property Purchase Celebration

When "Buy" is clicked and confirmed:

1. The Buy button: scale from 1 → 1.12 → 1 in 200ms (spring, stiffness 400).
2. The property space on the board: flash border to gold (`#F4A261`) for 300ms, then transition to owner's color dot appearing (200ms fade-in).
3. Player's cash in HUD: counter animates from old value to new value using a number tween (Framer Motion `useMotionValue` + `useTransform` or a custom counter hook). Duration: 400ms.
4. No confetti or particle effects — keep it subtle. This is Monopoly, not a slot machine.

### Turn Transition

When `currentPlayer` index changes:

1. Previous active badge: `scale: 1.05 → 1.0` (200ms ease-out).
2. New active badge: `scale: 1.0 → 1.05` (200ms ease-out), ring outline fades in.
3. Previous player's HUD card: box-shadow fades out (300ms).
4. New player's HUD card: box-shadow fades in (300ms).
5. Action bar buttons: fade out (100ms) → update button states → fade in (100ms).

---

## 8. Spacing & Layout System

### Base Grid

**Base unit: 8px.** All spacing values are multiples.

| Token | Value | px |
|-------|-------|-----|
| `xs` | 0.5× | 4px |
| `sm` | 1× | 8px |
| `md` | 2× | 16px |
| `lg` | 3× | 24px |
| `xl` | 4× | 32px |
| `2xl` | 6× | 48px |
| `3xl` | 8× | 64px |

**Inline style convention:** Use raw px values in JSX inline styles — `padding: '16px 24px'`, `gap: '8px'`, etc. Don't abstract into CSS vars for inline styles.

### Breakpoints

| Name | Range | Notes |
|------|-------|-------|
| Mobile | `< 640px` | Board fills full width. Sidebar hidden (drawer). Action bar pinned to bottom. |
| Tablet | `640px – 1024px` | Board at left, sidebar at right (240px). Some HUD elements compact. |
| Desktop | `> 1024px` | Board max 800px, sidebar 300px. Full layout as designed. |

### Page Layout — Game Room

```
Desktop (>1024px):
┌─────────────────────────────────────────────────────────────┐
│  [Logo 48px]  [ROOM: ABCDEF 📋]  [P1 badge] [P2 badge]...  │  Header: 64px
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│         Board SVG                │    Sidebar               │
│         (square, max 800px)      │    (300px fixed)         │
│         fills remaining space    │    Player HUD cards       │
│                                  │    stacked, gap 12px      │
│                                  │                          │
├──────────────────────────────────┤    Phase indicator       │
│  [🎲 Die 1] [🎲 Die 2]           │    Room code             │
│  [Roll] [Buy] [End Turn]         │                          │
│  Action bar: 80px                │                          │
└──────────────────────────────────┴──────────────────────────┘

Mobile (<640px):
┌──────────────────────────────────┐
│  [Logo]  [ABCDEF]  [≡ Menu]      │  Header: 56px
├──────────────────────────────────┤
│      Board SVG (100vw square)    │
│                                  │
├──────────────────────────────────┤
│  [Die 1][Die 2]  [Roll][End]     │  Action bar: 72px, pinned bottom
└──────────────────────────────────┘
  Sidebar: slide-up drawer from bottom, triggered by [≡ Menu]
```

### Board Sizing

- `width: 100%`, `max-width: 800px`
- `height: auto` (the SVG viewBox is square — natural aspect ratio maintained)
- Centered horizontally in its container column
- Board column: `flex: 1`, sidebar: `width: 300px`, `flex-shrink: 0`

### Landing Page Layout

```
Desktop:
  Page background: #F8F4E8 full viewport
  Centered container: max-width 960px, padding 0 24px
  
  Hero:
    Logo centered, margin-bottom: 24px
    Tagline: Inter 20px, #8D99AE, text-align center, margin-bottom: 48px

  Two-column card row:
    gap: 24px
    Each card: flex 1, min-width 0, Large Card style (background white, border-radius 24px)
    Card heading: Playfair Display 24px 800
    Card body: form inputs + button
    
Mobile:
  Single column, cards stacked, gap: 16px
  Hero text smaller: 32px title, 16px tagline
```

---

## 9. Iconography

### Icon Library

**Lucide React** — used for all UI chrome icons. Import individually:
```js
import { Copy, Dice5, Home, ArrowLeftRight, SkipForward, Settings, Users, LogOut, ChevronRight, AlertCircle, CheckCircle, X } from 'lucide-react';
```

Default size: `20px`. Use `size={20}` or `size={16}` props. Color: inherit from parent `color` or pass `color="#8D99AE"` explicitly for secondary icons.

### Icon-to-Action Map

| Action | Lucide Icon | Size | Color | Notes |
|--------|------------|------|-------|-------|
| Roll Dice | `Dice5` | 20px | White | In Roll button |
| Buy Property | `Home` | 20px | White | In Buy button |
| Trade | `ArrowLeftRight` | 20px | White | In Trade button |
| End Turn | `SkipForward` | 20px | `#2B2D42` | In gold End Turn button |
| Copy room code | `Copy` | 16px | `#8D99AE` | Next to room code |
| Settings / Config | `Settings` | 20px | `#8D99AE` | Host pre-game config |
| Players list | `Users` | 16px | `#8D99AE` | Sidebar section header |
| Leave game | `LogOut` | 16px | `#E63946` | Danger action — red |
| Expand / details | `ChevronRight` | 16px | `#8D99AE` | Property details |
| Error / alert | `AlertCircle` | 16px | `#E63946` | Error states, warnings |
| Success / confirm | `CheckCircle` | 16px | `#2D6A4F` | Confirmation states |
| Close modal | `X` | 20px | `#8D99AE` | Modal dismiss button |
| Mortgage toggle | `Archive` | 16px | `#8D99AE` | Property management |
| Build house | `Plus` | 16px | White | In build button |
| Sell house | `Minus` | 16px | White | In sell button |

### Custom Icons Needed

The following Lucide icons don't exist and must be custom SVG:

**Jail icon** — for the Jail corner and "In Jail" HUD indicator. A simple vertical bar + lock:
```svg
<svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Three vertical bars (jail bars) -->
  <rect x="3"  y="3" width="2.5" height="14" rx="1" fill="#E76F51"/>
  <rect x="8.75" y="3" width="2.5" height="14" rx="1" fill="#E76F51"/>
  <rect x="14.5" y="3" width="2.5" height="14" rx="1" fill="#E76F51"/>
  <!-- Top and bottom bars -->
  <rect x="2" y="2"  width="16" height="2.5" rx="1" fill="#E76F51"/>
  <rect x="2" y="15.5" width="16" height="2.5" rx="1" fill="#E76F51"/>
</svg>
```

**Money / Cash icon** — for cash displays and financial events. A simple dollar sign in a circle:
```svg
<svg viewBox="0 0 20 20" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="10" cy="10" r="8.5" stroke="#2D6A4F" stroke-width="1.5"/>
  <text x="10" y="14.5" text-anchor="middle" font-family="'JetBrains Mono', monospace"
        font-size="11" font-weight="600" fill="#2D6A4F">$</text>
</svg>
```

**Railroad icon** — currently uses emoji 🚂 in Board.js. Replace with:
```svg
<svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Engine body -->
  <rect x="1" y="6" width="11" height="6" rx="2" fill="white"/>
  <!-- Chimney -->
  <rect x="8" y="3" width="3" height="4" rx="1" fill="white"/>
  <!-- Wheels -->
  <circle cx="4" cy="13" r="2" fill="white" stroke="#2B2D42" stroke-width="1"/>
  <circle cx="10" cy="13" r="2" fill="white" stroke="#2B2D42" stroke-width="1"/>
  <!-- Cab window -->
  <rect x="2" y="7.5" width="3" height="3" rx="0.5" fill="#2B2D42"/>
  <!-- Wheels undercarriage line -->
  <line x1="14" y1="11" x2="14" y2="11" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

**Utility icon (Electric Company / Waterworks)** — currently emoji ⚡. Replace with a bolt:
```svg
<svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="9,1 4,9 8,9 7,15 12,7 8,7" fill="white" stroke="#2B2D42" stroke-width="0.5"
           stroke-linejoin="round"/>
</svg>
```

### Icon Sizing Rules

- **In buttons:** Always 20px, same color as button text.
- **Standalone / secondary:** 16px, color `#8D99AE` (rail gray) unless indicating an error (red) or success (green).
- **Large decorative (modal headers):** 24–32px.
- **Board space icons:** 12–14px within the 88×110px SVG space bounds — use the custom SVG inline inside the board `<g>` element.
- **Never scale icons via `transform`** — always use the `size` prop or `width`/`height` attributes. SVGs rendered at non-native sizes via transform can appear blurry.
