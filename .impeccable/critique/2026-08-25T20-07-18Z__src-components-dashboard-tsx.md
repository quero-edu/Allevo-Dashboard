---
target: Dashboard Geral tab (src/components/Dashboard.tsx)
total_score: 24
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
timestamp: 2026-08-25T20-07-18Z
slug: src-components-dashboard-tsx
---
Method: dual-agent (A: aee65cd8c3dd0928c · B: ae84a5c986668495b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good sync/loading feedback; no distinct signal for background re-sync after initial load |
| 2 | Match System / Real World | 2 | Investimento Total uses the same "up is good" green/red polarity as revenue — a spend *decrease* renders red/bad even when cutting waste is the right call |
| 3 | User Control and Freedom | 3 | "Limpar seleção," reversible toggles, delete-confirm modal are solid; no undo once several metrics are toggled onto a crowded chart |
| 4 | Consistency and Standards | 2 | Brand cyan (#00FFBB) simultaneously means "positive trend," "Verificado" trust chip, and the error/warning banner icon — one hue carries three unrelated meanings |
| 5 | Error Prevention | 3 | Confirm-before-delete and inline date-range validation are solid; metric-card's dual-purpose click (display + chart toggle) has weak affordance |
| 6 | Recognition Rather Than Recall | 2 | Mobile "Funis ⌄" button shows no selection state until opened; chart legends demand holding 7-10 color mappings in working memory |
| 7 | Flexibility and Efficiency | 3 | Click-to-chart, MM7D, and period-comparison toggles are good power-user affordances; no saved views or URL-encoded filter state |
| 8 | Aesthetic and Minimalist Design | 2 | Product-sales legend is a wall of near-duplicate 11px text (confirmed by detector: 5× `tiny-text` hits) |
| 9 | Error Recovery | 4 | Permission-error state is best-in-class: distinguishes error types, gives a numbered fix checklist, keeps stale data visible, offers retry |
| 10 | Help and Documentation | n/a | No help/onboarding exists, but per-card subtext doubles as documentation — defensible n/a for an internal analyst tool |

**Total** | | **24/36** | **Acceptable (67%)**

## Design Specificity Verdict

**LLM assessment**: Not generic SaaS chrome. Domain vocabulary (CPA Tráfego vs. CPA Total, ROAS on its own axis, "Order Bump," ticket médio scoped to funnel) and a funnel color system derived from real product names show real domain modeling — not placeholder copy. Where it slips toward generic-dashboard territory is the interaction chrome (popovers, checkbox lists, toggle pills), which is appropriately standard-issue for an Operate surface.

**Deterministic scan**: CLI detector (`detect.mjs` against the 3 source files) reported clean — 0 findings. The **live/DOM detector** (injected into the running page) found **79 anti-patterns**, overwhelmingly (67 of ~79) one repeated `ai-color-palette` rule flagging the brand's cyan-neon color (#00FFBB/#3ee8b5) wherever it appears — text, gradients, box-shadow glow. This is the same brand-color decision the user explicitly confirmed as intentional in a prior session ("Deixar como está") and is **not actionable here**. Past that one dominant rule, the detector also independently found: `text-overflow` (4×, see Priority Issue below), `tiny-text`/`undersized-ui-text` (6× total, corroborating the legend-readability finding), `skipped-heading` (h1→h3, missing h2), `low-contrast` (3.4:1 vs. 4.5:1 required, `#71717b` on `#16231f`), and single hits for `pulsing-dot`, `layout-transition`×2, `dark-glow`, `radial-spotlight-glow` (the last two are also brand-color-driven and out of scope for the same reason).

**Visual overlays**: Live-server injection succeeded and ran in a background browser tab; findings above were read from console output. The tab was closed and the live-server process stopped before this report, so no overlay is currently visible — re-run `/impeccable critique` or `/impeccable audit` to regenerate one if needed.

## Overall Impression
The KPI layer is genuinely well-built — domain-accurate subtext, a real per-funnel breakdown feature, and an excellent error-recovery flow. The gap is in the "more information at once" surfaces: comparison labels still truncate on the two highest-stakes cards, the daily-chart legend and product-sales legend both overload working memory, and one metric's color-coding actively misleads (spend-down shown as bad). The single biggest opportunity is tightening the KPI-card text layer and legend density before adding any more chart complexity.

## What's Working
- **Per-funnel breakdown legend** (`MetricCard.tsx:81-90`) — appearing only for 2-3 selected funnels is well-judged progressive disclosure: enough funnels to need context, few enough not to explode the card.
- **Permission-error recovery flow** (`Dashboard.tsx:1951-1961`) — tells the user exactly what to click in Google Sheets, keeps stale data visible with a note, offers one-click retry. Best single element in the surface.
- **Consistent funnel color identity** — `getFunnelColor` assigns hue once by index and reuses it identically across badges, checkboxes, KPI dots, and chart series.

## Priority Issues

**[P1] Comparison-period label still truncates on the two highest-stakes cards**
- Why it matters: Investimento Total and Faturamento Total — the two headline financial metrics — show "vs. ..." / "vs..." instead of the actual comparison label, while lower-stakes cards render it fully. Hiding what period a spend/revenue swing is compared against is exactly wrong for the cards a user checks first.
- Fix: give the label a fixed min-width or prevent `truncate` from engaging before the value chip does, or shorten the chip instead of the label when the row is tight.
- Evidence: manually verified by Assessment A; independently corroborated by Assessment B's live detector (`text-overflow` on `span.truncate.text-left.sm:text-right`, overflowing its box by 37px — 2 occurrences).
- Location: `src/components/ui/MetricCard.tsx:111-121`.
- Suggested command: `/impeccable clarify` or `/impeccable layout`

**[P1] KPI value text overflows its card box (16-43px) on at least two card states**
- Why it matters: The live detector independently found the value `<h3>` overflowing its container by 16px in the default (white) state and by 43px in the selected (`text-[#00FFBB]`) state. Removing the unconditional `overflow-hidden` earlier (to stop clipping) traded a clipping bug for a visible-overflow bug — long currency values with no break point can now spill past the card edge into whatever sits beside it, instead of wrapping or clipping cleanly.
- Fix: add `break-words`/`overflow-wrap: anywhere` (or a `min-w-0` + `flex-wrap` treatment) to the value `<h3>` so long values wrap inside the card instead of overflowing it.
- Location: `src/components/ui/MetricCard.tsx:79`.
- Suggested command: `/impeccable layout`

**[P1] "Up is good" polarity is backwards for Investimento Total**
- Why it matters: `calculateComparison(investimentoTotal, prevInvestimentoTotal, false, 'currency')` treats a spend *decrease* as bad (red), identical to revenue. Cutting wasteful ad spend is often the correct move; painting that red at the top of a performance dashboard discourages good decisions.
- Fix: either invert this specific comparison, or drop good/bad coloring for Investimento Total entirely and let ROAS/CPA carry that judgment.
- Location: `src/components/Dashboard.tsx:781`.
- Suggested command: `/impeccable clarify`

**[P2] Unescaped HTML entity leaks into the product-chart legend**
- Why it matters: One legend entry literally renders "Estrat. · Livro Estratégia: PMOs &amp; VMOs" — the raw entity instead of "&". A visible markup artifact next to revenue numbers reads as "this data pipeline wasn't checked."
- Fix: HTML-decode product/funnel names once at ingestion, or broaden the `compactProductName` regex to also match the encoded form.
- Location: `src/components/tabs/DailyChartSection.tsx:104-119`.
- Suggested command: `/impeccable harden`

**[P2] Product-sales legend is a wall of near-duplicate 11px text**
- Why it matters: Up to 7 legend entries differing only by a trailing clause ("Gestão · Gestão IA" vs. "... – Base de Conhecimento e Co-piloto de Leitura" vs. "Gestão · OB · ...") sit stacked in cramped 11px lines. Readers can't disambiguate stacked-bar segments without reading three near-identical strings letter by letter. Corroborated by the live detector: 5× `tiny-text` findings at 11px.
- Fix: truncate more aggressively using the existing `title` tooltip as fallback, or move to hover-driven single-line legend / on-chart labels for the top 2-3 segments only.
- Location: `src/components/tabs/DailyChartSection.tsx:324-328`.
- Suggested command: `/impeccable typeset`

## Persona Red Flags

**Alex (Power User)**: The "select up to five metrics" chart control draws from all 10 KPI cards with no saved-view or URL-encoded filter state — every session Alex reselects funnels, metrics, and toggles Média Móvel + Comparar período from scratch. The 7-10-series legend when several metrics + moving average are active is a real obstacle for exactly the user most likely to turn that combination on.

**Sam (Accessibility-dependent)**: Product-chart legend text renders at 11px with no user-adjustable scale (SVG text ignores OS zoom the way DOM text doesn't) — confirmed by the detector's `tiny-text`/`undersized-ui-text` findings, including a 9px "Navegação" label below the 11px floor. The product-tint system (lighter = main product, darker = Order Bump, same hue family) relies on lightness-only discrimination between adjacent stacked-bar segments with no pattern/texture backup, unlike the top chart's dash-pattern attempt.

## Minor Observations
- Mobile "Funis ⌄" button shows no selection-count summary, unlike the desktop version (`sm:inline` hides it) — an avoidable platform inconsistency.
- "Comparar período" and "Média Móvel (7D)" use visually identical toggle-pill styling for conceptually parallel actions, but sit in two different locations (KPI row vs. chart header).
- The error banner's icon/border color (#00FFBB) matches the "Verificado" trust badge — on first glance the error banner could read as another positive state.
- Detector found a heading-level skip: `<h1>` "Dashboard de performance AllevoTech" jumps straight to `<h3>` KPI values with no `<h2>` in between.
- Detector found one WCAG AA contrast failure: 3.4:1 (need 4.5:1) for `#71717b` on `#16231f`.
- Recharts logged a recurring (non-error) console warning about zero-size chart containers on first paint, 4× per page load — cosmetic race condition, not a runtime error.

## Questions to Consider
1. Is "up is good" the right default for every metric, or does Investimento Total need its own polarity rule the way ROAS and CPA already imply one?
2. With 10 clickable KPI cards feeding a "select up to five" chart control, has a first-time user ever been watched trying to find the moving-average feature without being told it exists?
3. Now that per-funnel breakdown proved a good progressive-disclosure pattern for KPI cards, could the same idea (show less, expand on demand) fix the product-sales legend's wall-of-text problem?
