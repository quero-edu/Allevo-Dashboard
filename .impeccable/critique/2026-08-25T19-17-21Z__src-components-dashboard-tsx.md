---
target: src/components/Dashboard.tsx (aba Geral)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-25T19-17-21Z
slug: src-components-dashboard-tsx
---
Method: dual-agent (A: ae775ad9ebfe1eb3d · B: a0a323ec8acd6fffe)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Sync confirmation is real but buried at the bottom of a long page |
| 2 | Match System / Real World | 4 | Domain vocabulary (ROAS, CPA, Order Bump) used correctly; subtexts double as glossary |
| 3 | User Control and Freedom | 3 | "Limpar seleção", reversible toggles, Escape closes menus — nothing destructive on this tab |
| 4 | Consistency and Standards | 2 | "vs. anterior" truncates 3 different ways across cards in the same row |
| 5 | Error Prevention | 3 | No destructive actions on Geral; confirm dialogs exist elsewhere for funnel deletion |
| 6 | Recognition Rather Than Recall | 2 | Funnel-breakdown dots are color-only; user must recall the mapping from the badge row above |
| 7 | Flexibility and Efficiency | 3 | Click-a-KPI-to-highlight-in-chart is a real power-user shortcut |
| 8 | Aesthetic and Minimalist Design | 2 | 10 cards + 2 dense charts all visible by default; detector independently confirms a 5-size flat type scale (9/11/12/14/16px, 1.8:1 ratio) |
| 9 | Error Recovery | 3 | Scored from funnel add/delete flows (Geral itself surfaces no error states) |
| 10 | Help and Documentation | 3 | Self-documenting subtexts substitute for a help system |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

**LLM assessment (Assessment A):** Not a generic SaaS template in Portuguese clothing. Card subtexts are hand-written business logic ("Gasto * 1.1215 (Com impostos)", "22 OB / 151 vendas"), funnel names are real products, and the per-funnel color system is load-bearing in the data model, not decorative. Reads as built for AllevoTech's actual Meta Ads → book/course workflow.

**Deterministic scan (Assessment B):** The CLI regex scan over `src/components/*.tsx` came back clean (0 findings) — but that engine only pattern-matches text/markup, and it deliberately skips CSS. The **browser-injected** detector (which also reads computed styles) found real issues the CLI pass and Assessment A's manual read both missed: 22 instances of `ai-color-palette`/`dark-glow` flagging the brand's cyan-green (`#00FFBB`) as a neon/AI-slop signature, plus a `radial-spotlight-glow` on the page background, 2 `layout-transition` (animating `width` — the sidebar collapse), 1 `undersized-ui-text` (a 9px "Navegação" label, below the 11px floor), and the flat-type-hierarchy finding folded into heuristic 8 above.

**Important context on the neon-green finding:** this is `--brand-strategy`, the app's deliberate, documented action color (Sync button, primary CTAs, positive-metric color) — chosen and kept on purpose across this week's whole design-system rework, not an accident. The detector is right that it *reads* as an "AI dashboard" neon signature; whether that's a problem is a brand call, not a bug — flagged here so you can decide with full information, not silently fixed either way.

## Overall Impression

The bones are good — real domain language, a genuinely systemized color/token architecture, and a nice card↔chart interaction model. But the newest features (funnel-breakdown dots, the denser default KPI set) shipped without a pass for numeric overflow and color-only encoding, and the brand's signature green is technically indistinguishable from the "AI dashboard glow" pattern the industry has converged on — worth a deliberate look, not because it's wrong, but because right now it's not a decision, it's a default.

## What's Working

1. **Self-documenting metric subtexts** — every card explains its own math inline, which matters for a 5-10 person internal tool with no dedicated onboarding.
2. **One real categorical color system** — the same funnel hue shows up on the badge chip, the KPI breakdown dot, and the chart series (lighter tints for products, darker for Order Bumps). Verified consistent by both assessments.
3. **KPI-to-chart linking** — clicking a card highlights its series in the trend chart, unifying two UI regions into one mental model.

## Priority Issues

**[P0] Numeric overflow/clipping in compact metric cards**
- **Why it matters**: At 1440px, "Lucro Total"'s value clips past the card edge and its comparison delta truncates to a bare "-1" in the 6-column compact row. In a financial dashboard, a number that looks cut off reads as broken data, not a styling quirk — this is the single worst place for this to happen.
- **Fix**: Drop to 4-5 columns at `xl`, let `.metric-card--compact [data-metric-value]` shrink/wrap, or set a `min-width` so 6-digit R$ amounts never truncate.
- **Suggested command**: `/impeccable adapt`

**[P1] "vs. anterior" comparison label truncates inconsistently**
- **Why it matters**: The identical string renders as "vs. ...", "vs...", and "vs. 7d an..." across cards in the same row (`MetricCard.tsx`, the `truncate` class with no guaranteed width) — hiding exactly the context (which period) a user needs to trust a trend arrow.
- **Fix**: Shorten the label text itself ("vs. 7d") instead of relying on CSS truncation, or reserve enough width so it never clips.
- **Suggested command**: `/impeccable clarify`

**[P2] Funnel-breakdown dots are color-only and unlabeled**
- **Why it matters**: Each breakdown item is a colored dot + bare value with only a `title` attribute — no text fallback, no reliable screen-reader label. A user must recall the funnel↔color mapping from the badge row above; the chart's own `Line` series already solved this exact problem with dash patterns layered on hue, but the KPI card component didn't inherit that fix.
- **Fix**: Prefix each dot with a one/two-letter funnel initial, or add `aria-label="{funnel}: {value}"` alongside the existing `title`.
- **Suggested command**: `/impeccable adapt`

**[P2] Brand green reads as "AI-dashboard neon glow" (detector-confirmed, 22 instances)**
- **Why it matters**: The browser-injected detector independently flagged `#00FFBB` — the app's real, intentional action color — as the specific neon-cyan-on-dark pattern associated with generic AI-generated dashboards, plus a matching radial glow on the page background. Assessment A's manual read didn't flag this (it reads as "the brand," not "a smell") — which is exactly the risk: a deliberate choice and an accidental default can look identical from outside.
- **Fix**: Not a mandate to change the brand color. Worth a deliberate gut-check: does this dashboard want to keep leaning into the neon-glow aesthetic (glows, radial spotlight), or dial the *glow effects specifically* back while keeping the green as a flat accent? Those are different asks.
- **Suggested command**: `/impeccable colorize`

**[P3] High default information density on Geral**
- **Why it matters**: All 4 funnels selected + 10 KPI cards + 2 charts with heavily abbreviated legends ("Estrat. · OB · Base + Cop.") load at once; full names only surface via hover, which doesn't exist on touch. Cognitive-load checklist: 5 of 8 items fail (high band).
- **Fix**: Consider collapsing "Outras Métricas Operacionais" behind a disclosure by default; let the product-chart legend show full names on wider viewports.
- **Suggested command**: `/impeccable distill`

## Persona Red Flags

**Alex (power user):** Previous-period values in comparison chips are readable only via a `title` hover tooltip — no way to scan all 10 cards' prior-period numbers without ten separate hovers. The 5-metric cap on the trend chart is unexplained in the UI and will frustrate someone trying to compare more series at once.

**Sam (accessibility-dependent):** The KPI breakdown dots (P2 above) fail color-blind and screen-reader users identically. The undersized 9px "Navegação" sidebar label (detector-confirmed, `Dashboard.tsx:1989`) sits below the 11px floor generally considered a legibility minimum.

**Casey (mobile):** The clipped "Lucro Total" value is *more* visible on mobile, not less — the compact grid collapses to one column at full width, so the overflow becomes more conspicuous, not hidden. Header + funnel badge row also consume roughly the first 370px before any KPI appears on a 390px viewport.

## Minor Observations

- "Funis" appears twice near the top (dropdown trigger + a static label 3 lines below) — mildly redundant, not confusing.
- The "Incluir faturamento dos produtos" checkbox uses an ad hoc purple (`#A855F7`) absent from `index.css`'s token list — candidate to fold into the existing `--chart-3` (violet) token.
- Sidebar collapse animates `width` directly (detector-flagged `layout-transition`, `Dashboard.tsx:1898`) — real but low-impact; a transform-based width animation would be cheaper to composite, not worth urgent action.
- Three synchronized Y-axes (currency, count, ROAS) plus optional dashed MM7D overlays is already a lot of decoding for one chart; there's little room to add a fourth metric type before it needs to split.

## Questions to Consider

1. What if the funnel-breakdown dots were collapsed by default (visible on hover/expand) — would the hero row feel calmer, or is anyone actually reading them daily?
2. Was the compact 6-column card row ever QA'd at exactly 1440px with real (not placeholder-short) currency values — since that's exactly where the P0 overflow shows up?
3. Is the neon-glow aesthetic (cyan glows, radial spotlight) a considered brand direction, or did it arrive by default and just never get revisited?
