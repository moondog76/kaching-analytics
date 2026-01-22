# KaChing Analytics Pro - Complete Revision Builder Plan

## Executive Summary

**Project**: Transform KaChing Analytics from "Dashboard + Analytics" to a two-tier **"Cashback Insights + Retail Insights"** platform with full Pluxee branding.

**Two-Tier Product Model**:
| Tier | Tab | User Profile | Data Scope | AI Focus |
|------|-----|--------------|------------|----------|
| **Standard** | Cashback Insights | Merchant running cashback campaigns | Own cashback transaction data only | Campaign optimization, cashback ROI, own customer behavior |
| **Premium** | Retail Insights | Merchant paying for full analytics | Full market transaction data across all merchants | Market intelligence, competitive analysis, industry trends |

---

## Pluxee Brand Guidelines

### Color System
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Deep Blue | #221C46 | Primary text, headers, icons |
| Ultra Green | #00EB5E | Primary accent, CTAs, highlights |
| Boldly Blue | #17CCF9 | Secondary accent, charts |
| Very Yellow | #FFDC37 | Tertiary accent, alerts |
| Confidently Coral | #FF7375 | Warnings, negative indicators |
| Simply White | #FFFFFF | Backgrounds |

**Tints available**: 50%, 20%, 5% of each color

### Typography
- **Font Family**: TT Travels (fallback: system sans-serif)
- **Headers**: DemiBold/Bold, tracking: -30
- **Body**: Regular, tracking: -25
- **Minimum contrast**: 4.5:1 (WCAG AA)

### Visual Elements
- **X-mark**: Core brand element - use as message punctuation
- **Holding shapes**: Cards with incisions or chamfers
- **Icons**: Deep Blue line style

### Tone of Voice
- **Positive**: Uplifting, benefits before features
- **Energetic**: Active verbs, inspiring calls to action
- **Personal**: You/us/we, not customers/consumers
- **Straightforward**: Simple, clear, honest

---

## Architecture

### Target Structure
```
├── Cashback Insights Tab (Standard Tier)
│   ├── Campaign KPIs (own data only)
│   ├── Campaign Performance (own data only)
│   ├── Own Customer Profile
│   ├── Campaign Analytics
│   └── AI Analyst (campaign-focused context)
│
└── Retail Insights Tab (Premium Tier)
    ├── Market Position (Market Share, Market Reach)
    ├── Competitive Demographics (Age, Gender comparisons)
    ├── Competitive Behavior (Receipts, Return Interval, Share of Wallet)
    ├── Customer Mobility (Matrix, Brand Preference)
    ├── Churn Intelligence (Dashboard, Flow Analysis)
    ├── Advanced Analytics (CLV, Forecasting)
    └── AI Analyst (full market context)
```

---

## Cashback Insights Tab (Standard Tier)

### Data Scope
**ONLY the merchant's own cashback transaction data** - zero competitor visibility.

### Sections

#### 1. Hero KPIs
- Campaign Budget, Campaign Revenue, ROI, CAC
- Total Campaign Customers, Repeat Rate

#### 2. Campaign Performance
- Average Receipts: Domestic vs Campaign with % uplift
- Average Visits: Domestic vs Campaign with % change
- Campaign Distribution: Sector Growth, New Customers, Loyalty, Maximum Reach

#### 3. Own Customer Profile
- Gender distribution (pie chart)
- Age distribution (histogram)
- Top spenders analysis

#### 4. Campaign Analytics
- Receipt history over time
- Transaction volume trends
- Customer acquisition trends

#### 5. AI Insights (Cashback Context)
- Anomalies in own data only
- Campaign optimization recommendations
- **Cannot** answer questions about competitors (suggests upgrade)

---

## Retail Insights Tab (Premium Tier)

### Data Scope
**Full market transaction data** - complete competitive visibility.

### Sections

#### 1. Market Position
- Market Share by Sales (multi-line time series)
- Market Share by Transactions (multi-line time series)
- Market Reach (3m and 6m comparison bars)

#### 2. Competitive Demographics
- Age Distribution Comparison (multi-column histogram per merchant)
- Gender Distribution by Customers (grouped bar)
- Gender by Sales Over Time (stacked area)
- Average Age Over Time (multi-line)

#### 3. Competitive Behavior
- Receipt Distribution (histogram per merchant)
- Receipt History (multi-line time series)
- Customer Return Interval (histogram per merchant)
- Share of Wallet (multi-line time series)
- Customer Spending Share (distribution per merchant)

#### 4. Customer Mobility
- Mobility Matrix (heat map table showing cross-shopping)
- Single-Merchant Loyalty (% who only shop with one merchant)

#### 5. Churn Intelligence
- Churn Dashboard (New/Retained/Churned breakdown)
- Where Churned Customers Went (SoW shift analysis)
- Where New Customers Came From
- Churned Customer Profiles

#### 6. Advanced Analytics
- Customer Lifetime Value comparison
- Forecasting (needs repair)

#### 7. AI Insights (Retail Context)
- Full competitive intelligence
- Market-wide anomaly detection
- Strategic recommendations

---

## Global Features

### Filter System (Persistent)
- Date range (default: 2 years)
- Gender, Age range, Ticket size
- Day of week, Time of day
- Competitor selection (Retail only)

### Export Functionality
- PDF, JPEG, PPT, CSV/Excel
- Pluxee branding on exports

### GDPR Compliance
- Minimum 15 users per data point
- Show "Insufficient data" when threshold not met

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Database schema extensions
- Access tier logic
- Tab navigation with conditional rendering
- Pluxee CSS theme system
- AI context switching

### Phase 2: Cashback Insights (Week 3-6)
- Hero KPIs, Campaign performance
- Own customer demographics
- AI panel with cashback context

### Phase 3: Retail Insights - Core (Week 7-12)
- Market position charts
- Demographics comparison
- Behavior analysis
- Mobility matrix, Churn dashboard

### Phase 4: Retail Insights - AI (Week 13-14)
- Market-wide anomaly detection
- Strategic recommendations
- Full market context chat

### Phase 5: Global Features (Week 15-18)
- Persistent filters
- Export functionality
- Polish and testing

---

## Reference Documents

See `/reference-docs/` folder for:
- Carrefour Smart Marketing Report (cashback structure)
- Swedish feedback document (requirements)
- Pluxee Brand Guidelines
- Retail Insights screenshots (19 PDFs)
