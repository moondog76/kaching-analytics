# KaChing Analytics Pro - Revision Package

## For Claude Code

This package contains everything needed to implement the major revision of KaChing Analytics Pro.

### Quick Start

```bash
# Copy these files to your KaChing project
cp -r kaching-revision/* /path/to/kaching-analytics/

# Then tell Claude Code:
"Read the BUILDER_PLAN.md file and let's start implementing Phase 1"
```

---

## Package Contents

```
kaching-revision/
├── BUILDER_PLAN.md           # Complete implementation roadmap
├── README.md                 # This file
│
├── styles/
│   └── pluxee-theme.css      # Pluxee brand CSS variables & components
│
├── types/
│   └── analytics.types.ts    # TypeScript interfaces for all data
│
├── prisma/
│   └── schema-extensions.prisma  # Database schema additions
│
├── config/
│   ├── ai-prompts.ts         # AI system prompts (cashback vs retail)
│   └── chart-config.ts       # Chart colors and Recharts helpers
│
└── reference-docs/
    └── CHART_REFERENCE.md    # Maps PDF screenshots to chart implementations
```

---

## Key Concepts

### Two-Tier Product Model

| Tier | Tab | Data Access | AI Behavior |
|------|-----|-------------|-------------|
| **Standard** | Cashback Insights | Own data only | Campaign-focused, redirects competitor questions |
| **Premium** | Retail Insights | Full market data | Full competitive intelligence |

### GDPR Compliance
- All data points must have ≥15 users
- Show "Insufficient data" when threshold not met

### Pluxee Branding
- Primary: Deep Blue (#221C46)
- Accent: Ultra Green (#00EB5E)
- See `pluxee-theme.css` for full palette

---

## Implementation Order

### Phase 1: Foundation
1. Add database schema extensions
2. Implement access tier logic
3. Create tab navigation component
4. Apply Pluxee CSS theme

### Phase 2: Cashback Insights
1. Hero KPIs section
2. Campaign performance charts
3. Own customer demographics
4. AI panel with cashback context

### Phase 3: Retail Insights
1. Market position charts
2. Demographics comparison
3. Behavior analysis
4. Mobility matrix
5. Churn dashboard
6. AI panel with retail context

### Phase 4: Global Features
1. Persistent filter system
2. Export functionality
3. Polish and testing

---

## Suggested Claude Code Prompts

### Starting Phase 1:
```
Read BUILDER_PLAN.md. Let's start Phase 1 - Foundation.
First, show me the current database schema so we can plan the extensions.
```

### Starting Cashback Insights:
```
We've completed the foundation. Now let's build the Cashback Insights tab.
Reference the BUILDER_PLAN.md for the required sections and the 
analytics.types.ts for the data structures.
```

### Starting Retail Insights:
```
Let's build the Retail Insights tab. Use CHART_REFERENCE.md to understand 
the chart types needed. The screenshots in /reference-docs/ show the 
target visualizations.
```

### AI Implementation:
```
Now let's implement the AI Analyst panel. Use the prompts from 
config/ai-prompts.ts. The AI should behave differently based on 
which tab the user is viewing.
```

---

## Reference Materials

The original reference documents were:
1. **Carrefour Smart Marketing Report** - Cashback tab structure
2. **Swedish Analytics Feedback** - Requirements document
3. **Pluxee Brand Guidelines** - Visual design
4. **19 PDF Screenshots** - Retail Insights chart examples

These informed the BUILDER_PLAN.md and CHART_REFERENCE.md.

---

## Notes for Implementation

1. **Existing codebase**: This revision builds on the existing KaChing Analytics codebase deployed on Railway with Next.js, Prisma, PostgreSQL, and Claude AI integration.

2. **Chart library**: Continue using Recharts. Apply Pluxee colors from chart-config.ts.

3. **AI integration**: The AI analyst already exists. Update its system prompt based on active tab using the prompts in ai-prompts.ts.

4. **Filter persistence**: Store in URL params + session storage.

5. **Export**: PDF/PPT generation may need additional libraries (pdfmake, pptxgenjs).
