# AI Integration Course — Lesson "Liquid Glass" Brand Palette

Locked 2026-07-16 (owner-approved). This is the official gradient color
scheme for the lesson experience and downstream brand material. Scope note:
this palette styles **lesson pages only** — the marketing/landing pages keep
their existing look.

Machine-readable copies: `lesson-gradient-palette.json` · `lesson-gradient-palette.css`

## Core

| Token | Hex / value | Role |
|---|---|---|
| Ground | `#0A0F1C` | Deep blue page background |
| Ink | `#E9EEF7` | Primary text on dark |
| Ink Soft | `#C3CDDD` | Body / secondary text |
| Muted | `#8FA0B8` | Labels, captions, metadata |

## Gradient accents (the scheme)

| Token | Hex | Role |
|---|---|---|
| Amber | `#FBBF24` | Primary accent, CTAs (pairs with Amber Strong) |
| Amber Strong | `#F59E0B` | Gradient partner / hover state |
| Cyan | `#22D3EE` | Links, secondary accent, callouts |
| Magenta | `#E879F9` | Sponsored labels, status dots, tertiary pop |
| Yellow | `#FDE047` | Inline-code highlight, small highlights |

**Signature gradients**
- CTA / buttons: `linear-gradient(120deg, #F59E0B, #FBBF24)`
- Progress bar: `linear-gradient(90deg, #F59E0B, #22D3EE)`
- Ambient glows (on `#0A0F1C`): amber `rgba(245,158,11,.16)`, cyan `rgba(34,211,238,.13)`, magenta `rgba(217,70,239,.13)` — 90px blur, slow 70–90s drift

## Liquid glass material

- Panel: `linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.015))` over `rgba(13,20,36,.62)`
- Backdrop: `blur(22px) saturate(1.35)`
- Border: `rgba(255,255,255,.11)` · Top inner rim: `inset 0 1px 0 rgba(255,255,255,.10)`
- Dark cards (contrast portions): `rgba(9,14,26,.55)`, border `rgba(148,163,184,.16)`

## Typography

- Headings: **Montserrat 800**, tight tracking, drop shadow `2px 2px 3px rgba(0,0,0,.45)` (45°)
- Body: **Open Sans**, 1.06rem / 1.7, drop shadow `1px 1px 2px rgba(0,0,0,.3)` (45°)
- Data/labels: Montserrat 700 uppercase, `letter-spacing: .12em`, tabular numerals
