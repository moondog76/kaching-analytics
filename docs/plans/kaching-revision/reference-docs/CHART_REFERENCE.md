# Retail Insights Reference Charts

This document maps the uploaded PDF screenshots to the charts needed for the Retail Insights tab.

## Market Position Section

### Market Share Charts
| File | Chart Type | Description |
|------|-----------|-------------|
| `Market_Share.pdf` | Multi-line time series | Monthly market share by sales (%) for all merchants |
| `Market_share_by_transactions.pdf` | Multi-line time series | Monthly market share by transaction count (%) |
| `Store_Market_Share.pdf` | Multi-line time series | Store-level market share breakdown |
| `Market_reach.pdf` | Grouped bar chart | 3-month and 6-month market reach per merchant |

---

## Demographics Section

### Age Analytics
| File | Chart Type | Description |
|------|-----------|-------------|
| `Age_distribution_.pdf` | Multi-column histogram | Age distribution per merchant (Y: age brackets, X: % customers), with avg age line |
| `Average_age.pdf` | Multi-line time series | Average customer age over time per merchant |

### Gender Analytics
| File | Chart Type | Description |
|------|-----------|-------------|
| `Gender_-_by_customers.pdf` | Stacked bar | Female/Male % per merchant |
| `Gender_-_by_sales.pdf` | Stacked area time series | Gender split by sales over time |

---

## Customer Behavior Section

### Receipt Analysis
| File | Chart Type | Description |
|------|-----------|-------------|
| `Receipt_distribution.pdf` | Multi-column histogram | Receipt value distribution per merchant (avg, median indicators) |
| `Store_Receipt_distribution.pdf` | Multi-column histogram | Store-level receipt distribution |
| `Receipt_history.pdf` | Multi-line time series | Average monthly receipt per merchant |
| `Store_Receipt_history.pdf` | Multi-line time series | Store-level receipt trends |

### Return Interval
| File | Chart Type | Description |
|------|-----------|-------------|
| `Customer_return_interval.pdf` | Multi-column histogram | Days between purchases per merchant (avg, median) |
| `Store_Return_interval.pdf` | Multi-column histogram | Store-level return intervals |

### Spending & Wallet Share
| File | Chart Type | Description |
|------|-----------|-------------|
| `Share_of_Wallet_.pdf` | Multi-line time series | Monthly share of wallet per merchant |
| `Customer_spending.pdf` | Distribution chart | Customer spending share distribution per merchant (median indicator) |

---

## Customer Mobility Section

| File | Chart Type | Description |
|------|-----------|-------------|
| `Customer_mobility.pdf` | Heat map matrix | Cross-shopping matrix showing % overlap between merchants + single-merchant loyalty column |

---

## Churn Intelligence Section

| File | Chart Type | Description |
|------|-----------|-------------|
| `Churn_Dashboard.pdf` | Composite dashboard | New/Retained/Churned breakdown, customer profiles, SoW shift tables |
| `Churned_Users.pdf` | Table + distributions | Where churned customers shop, receipt distributions at competitors |

---

## Implementation Notes

### Common Chart Patterns

1. **Multi-line Time Series** (Market Share, Receipt History, SoW)
   - X-axis: Monthly dates (2-year default)
   - Y-axis: Metric value
   - Lines: One per merchant, Pluxee colors
   - Current merchant highlighted/thicker

2. **Multi-column Histogram** (Age, Receipt, Return Interval)
   - Y-axis: Value buckets
   - X-axis: % within bucket
   - Columns: One per merchant side-by-side
   - Indicators: Avg line (dashed), median text

3. **Heat Map Matrix** (Mobility)
   - Rows/Columns: Merchants
   - Cells: % overlap with color intensity
   - Diagonal: Always 100% (self)

4. **Grouped/Stacked Bar** (Gender, Reach)
   - X-axis: Merchants
   - Y-axis: %
   - Bars: Categories stacked or grouped

### Data Requirements

All charts require:
- `merchantId` - current merchant (for highlighting)
- `comparisonGroup` - array of competitor merchant IDs
- `dateRange` - start/end dates
- `filters` - gender, age, etc. (if applicable)

### GDPR Handling

If any data point represents < 15 users:
- Hide that specific data point
- Show "Insufficient data" tooltip on hover
- Do not interpolate or estimate missing points
