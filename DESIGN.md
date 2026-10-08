# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Warm paper-light theme with near-black ink text, a muted bronze accent and gold stars, plus a serif heading face — calm and bookish like a reading journal, structured as precisely as Linear or Stripe.

## Colors

- `--color-bg`: **#FAF7F2**
- `--color-surface`: **#FFFFFF**
- `--color-surface_alt`: **#F4EFE7**
- `--color-fg`: **#1F1B16**
- `--color-fg_soft`: **#4A423A**
- `--color-muted`: **#6E655C**
- `--color-border`: **#E5DED3**
- `--color-border_strong`: **#D2C8B9**
- `--color-accent`: **#7A4A21**
- `--color-accent_hover`: **#8F5A2C**
- `--color-accent_active`: **#653C1A**
- `--color-accent_soft`: **#F2E7D9**
- `--color-accent_fg`: **#FFFFFF**
- `--color-star`: **#D9A441**
- `--color-star_empty`: **#D8D0C4**
- `--color-success`: **#3F7A56**
- `--color-success_soft`: **#E4F0E8**
- `--color-info`: **#3B6EA5**
- `--color-info_soft`: **#E4ECF6**
- `--color-danger`: **#A33A2E**
- `--color-danger_soft`: **#F8E6E3**
- `--color-focus_ring`: **#7A4A21**
- `--color-overlay`: **rgba(31,27,22,0.45)**

## Typography

- `font_family`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- `font_family_heading`: 'Charter', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif
- `font_family_numeric`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
- `heading_weight`: 600
- `body_weight`: 400
- `weight_medium`: 500
- `weight_semibold`: 600
- `size_display`: 32px / 1.2 / 600 heading face
- `size_h1`: 24px / 1.25 / 600 heading face
- `size_h2`: 18px / 1.3 / 600 heading face
- `size_body`: 15px / 1.55 / 400
- `size_small`: 13px / 1.45 / 400
- `size_label`: 12px / 1.3 / 600, letter-spacing 0.02em, uppercase for field labels
- `numeric_style`: tabular-nums for star counts, statistics and dates

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Base: min-height 44px (touch target), padding 12px 20px (desktop 10px 18px), radius md (10px), font size body, weight 500, gap 8px to leading icon, transition 120ms ease on background/color/border, cursor pointer. Variants: primary = bg accent #7A4A21, fg #FFFFFF, border 1px transparent; secondary = bg surface #FFFFFF, fg fg #1F1B16, border 1px border_strong #D2C8B9; ghost = transparent bg, fg muted #6E655C, no border; danger = bg transparent, fg danger #A33A2E, border 1px danger, used for delete. States for EVERY variant: default, hover (primary bg accent_hover #8F5A2C, secondary bg surface_alt #F4EFE7, ghost bg accent_soft #F2E7D9 fg accent, danger bg danger_soft #F8E6E3), active/pressed (primary bg accent_active #653C1A + translateY(1px); secondary/ghost/danger: translateY(1px) + stronger bg tint), focus-visible (2px outline focus_ring #7A4A21 with 2px offset, never removed), disabled (opacity 0.45, cursor not-allowed, no hover change; used to mark 'Speichern' unavailable while title or author is empty). Never rely on colour alone: disabled/danger carry an icon or label change too.

### IconButton

Square or circular control for row actions (edit, delete). Hit area 44x44px minimum even when the glyph is 18px, radius pill, bg transparent, fg muted #6E655C; hover bg accent_soft #F2E7D9 fg accent; active translateY(1px); focus-visible 2px outline accent, offset 2px; disabled opacity 0.45. Delete variant hover bg danger_soft #F8E6E3 fg danger #A33A2E. Every icon-only control MUST carry a tooltip plus aria-label with the concrete action and the book title, e.g. 'Buch löschen: Der Process'.

### TextField / SearchInput

Label above field, size_label (12px, 600, uppercase, letter-spacing 0.02em), 6px gap. Input: min-height 44px, padding 12px 14px, radius md 10px, border 1px border_strong #D2C8B9, bg surface #FFFFFF, fg fg, font size body; placeholder fg muted; hover border accent at 40% opacity; focus border accent #7A4A21 + 2px focus ring in focus_ring at 30% alpha; disabled bg surface_alt, fg muted, opacity 0.6; error state border danger #A33A2E + message 13px danger directly beneath the field + aria-invalid and aria-describedby; success/valid state keeps the neutral border (no green). SearchInput variant: same metrics, magnifier icon at 16px inset left, left padding 40px, clear (x) button inside the field when non-empty, width 100% up to 320px.

### StarRating

Five stars, each star a 32x32px glyph inside a 44x44px tap target, gap 2px, radius pill for the hover highlight. Star path filled with star #D9A441 when set, 1.5px stroke star_empty #D8D0C4 on surface when unset. Behaviour: click star N sets rating N, click the currently set star again removes the rating (rating 0 = unrated); hover fills 1..N with a preview tint; focus-visible 2px outline accent, offset 2px, arrow-left/right move between stars, Enter/Space commits. Read-only variant (in the list column) is 16px stars, tabular, non-interactive, with a text equivalent for screen readers ('4 von 5 Sternen' / 'Nicht bewertet') — never a bare visual-only rating.

### Select (StatusFilter)

Native select wrapper, min-height 44px, padding 12px 36px 12px 14px, radius md, bg surface, border 1px border_strong, fg fg, custom chevron icon right at 12px inset. Options in fixed order: Alle, Geplant, Lese gerade, Gelesen (value null = Alle). Hover border accent 40%, focus ring as TextField, disabled opacity 0.6 with visible muted state. On narrow screens it stretches full width.

### StatusChip

Inline pill: padding 4px 10px, radius pill, size_label (12px, 600), 1px border, optional 6px dot before the text. Variants: Geplant = bg surface_alt #F4EFE7, border border_strong, fg fg_soft #4A423A; Lese gerade = bg info_soft #E4ECF6, border #3B6EA5 40%, fg #2C5480; Gelesen = bg success_soft #E4F0E8, border #3F7A56 40%, fg #2F5C41. Always text + colour, never colour alone.

### BookRow (list item)

A row inside the list container: bg surface, 16px 20px padding, 1px bottom border border #E5DED3 (last row no border). Grid columns: title+author (1fr) | status chip (140px) | stars (120px) | reading date (110px) | actions (88px, right-aligned). Title 16px/1.35 weight 500, fg fg, truncate with ellipsis at one line; author 13px muted directly beneath. Reading date renders as DD.MM.YYYY in 13px tabular-nums muted, or an en dash '–' when absent. Hover raises the row background to surface_alt #F4EFE7 and reveals the action buttons (which stay 44px tap targets and remain focusable/reachable via keyboard at all times). Below 720px the row collapses to two stacked blocks: text block on top, chip+stars+date in a wrapped meta line, actions top-right.

### BookForm / Modal (create & edit)

Create form sits in a Card above the list and starts neutral: no error message, no red border, submit button visually disabled (opacity 0.45) until title and author are both non-empty after trim. Edit reuses the same fields inside a centred Modal: max-width 520px, radius lg 16px, bg surface, padding 24px, overlay rgba(31,27,22,0.45), shadow 0 12px 32px rgba(31,27,22,0.16), title in heading face 18px, close IconButton top right, Esc closes, focus trapped inside, focus returns to the triggering row on close. Fields: Titel (required), Autor (required), Status (segmented control or Select with the three values), Bewertung (StarRating, optional and clearable). Footer right-aligned: secondary 'Abbrechen' + primary 'Speichern'.

### FilterBar / Toolbar

One row above the list, gap 12px, wrap enabled: StatusFilter Select, SearchInput (flex 1, max 320px), and a ghost 'Filter zurücksetzen' button that only appears (or is visibly disabled) when a status filter other than Alle or a non-empty search term is active. Layout: max-width container, sticky at top of the list area with bg bg #FAF7F2 and a 1px bottom border once scrolled. Below 720px the controls stack full width, 8px vertical gap.

### StatCard (year statistic)

Prominent, quiet card in the header area: bg accent_soft #F2E7D9, radius lg 16px, padding 20px 24px, border 1px #7A4A21 at 15% alpha. Content: label 'Gelesen im Jahr 2025' in size_label (12px, 600, uppercase, fg muted), the count below as a number in the heading face at 32px weight 600 fg accent #7A4A21 with tabular-nums, and the unit word 'Bücher' as a 15px muted suffix on the same baseline. The number must update immediately after a status toggle; while a request is in flight show the previous value at opacity 0.6 plus a 14px spinner, and on failure keep the last value and show an inline error with retry. Never a bare number without its unit and year.

### EmptyState

Centred block inside the list container, padding 48px 24px, max-width 380px: a simple line-art book glyph (2px stroke, 40px, muted) above the title. Two variants: no books at all = heading 'Noch keine Bücher' (heading face 18px) with the hint 'Lege dein erstes Buch mit Titel und Autor an.' and a pointer to the form above; no matches = heading 'Keine Treffer' with the active filters restated in plain text (status label + search term) and a ghost 'Filter zurücksetzen' button. Never render an empty list container as a silent blank area.

### InlineFeedback / Toast

Load and error states for API calls. List loading: the container shows 3 skeleton rows (surface_alt #F4EFE7 blocks, radius sm, 16px 20px padding, subtle 1.4s pulse) instead of a spinner-only void. Request error: an inline banner above the list, bg danger_soft #F8E6E3, border 1px danger at 40%, radius md, padding 12px 16px, text 13px in danger #A33A2E with a 'Erneut versuchen' text button — the failed action's data stays on screen, never wiped. Save/delete success: a small toast bottom centre, bg fg #1F1B16, fg bg #FAF7F2, radius pill, padding 10px 16px, auto-dismiss after 3s, aria-live polite.

### PageHeader

Top of page, max-width container, padding 32px 0 24px. Left: product name 'Leseliste' in the heading face at 24px weight 600 fg fg, with a one-line subtitle 'Bücher, Lesestatus und Bewertungen' in 15px muted beneath. Right: the StatCard, aligned to the top edge, or stacked beneath the title on screens below 720px. A single 1px border #E5DED3 under the header separates it from the form and list.

## Layout Principles

- Page container: max-width 960px, centred, horizontal padding 24px on desktop, 16px below 720px; the list is a single column — no multi-column grid for a reading list.
- Breakpoints: 480px (phone), 720px (tablet — FilterBar and BookRow collapse), 1024px (desktop, full row grid). Fluid in between; nothing is hidden purely because of width, it reflows.
- Vertical rhythm from the spacing scale only: 48px between page header and form, 32px between form and toolbar, 24px between toolbar and list, 16px between list rows, 12px between label and field, 8px between form fields.
- One list container: bg surface, border 1px border, radius lg 16px, overflow hidden so rows clip to the rounded corners. No card-per-book — the list reads as a continuous catalogue.
- Surface hierarchy: bg #FAF7F2 is the page, surface #FFFFFF is the list/form/modal, surface_alt #F4EFE7 is hover and skeleton. Accent #7A4A21 is reserved for the primary action, the statistic number and focus; stars are the only gold in the UI.
- TYPE FORMAT — one format for every value in the product, used identically in list, statistic and empty state: DATE = German calendar date, always DD.MM.YYYY with dots and two-digit day/month (e.g. 07.03.2025), no leading-zero omission, no ISO, no 'Mar 7'. A book with no completion date shows the en dash '–', never an empty cell and never 'null'.
- TYPE FORMAT — YEAR statistic: always '{n} Bücher' with a thin space before the unit, e.g. '12 Bücher'; n is a plain integer with no decimals and no thousands separator below 1000. The label above it always names the running calendar year: 'Gelesen im Jahr 2025'. Zero is rendered as '0 Bücher', not 'Keine'.
- TYPE FORMAT — RATING: interactive and read-only alike express the value as '{n} von 5 Sternen' in text and as n filled stars out of five visually; an unset rating is written 'Nicht bewertet' and shows five empty stars. No half stars, no decimals, no '4.0'.
- TYPE FORMAT — STATUS: exactly the three labels 'Geplant', 'Lese gerade', 'Gelesen' (first letter capitalised, no abbreviations, no lowercase variants) in the chip, the filter, the form and the empty-state restatement.
- TYPE FORMAT — COUNTS of the filtered list, when shown, are '1 Buch' / '{n} Bücher' with the same thin-space rule; no duration or currency appears anywhere in this product.
- Accessibility floor: every interactive control min 44x44px, focus always visible (2px accent outline, 2px offset), body text contrast at least 4.5:1 and never below 3:1 for large text or chip borders, no information carried by colour alone (status, error, disabled and rating all pair colour with text or shape).
- Respect prefers-reduced-motion: disable the skeleton pulse, row hover lift and toast slide; keep only instant state changes.
