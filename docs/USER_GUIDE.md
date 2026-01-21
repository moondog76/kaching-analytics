# Kaching Analytics Platform

## Overview

Kaching Analytics is an AI-native retail analytics platform designed for Romanian merchants. It provides real-time insights, anomaly detection, AI-powered recommendations, and executive briefings to help merchants understand their cashback campaign performance.

**Production URL:** `https://kaching-analytics-production.up.railway.app`

---

## For Merchants

### Getting Started

1. **Login:** Go to `/login` and enter your credentials
2. After login, you'll see your merchant dashboard with all your analytics

**Example Logins:**
| User | Email | Password |
|------|-------|----------|
| Admin | `admin@kaching.com` | `admin123` |
| Mega Image | `merchant@megaimage.ro` | `megaimage123` |

---

### Dashboard (`/`)

The main dashboard provides a comprehensive overview of your business performance:

#### Date Range Picker
Select the time period for your data:
- **Quick Presets:** Last 7, 14, 30, 60, or 90 days
- **Custom Range:** Select specific start and end dates
- Click "Apply Range" to update all dashboard data

#### Data Export
Export your data in multiple formats:
- **CSV** - Comma-separated values for spreadsheets
- **Excel** - Microsoft Excel format (.xls)
- **JSON** - For developers and integrations

Click the export button next to the date picker to download.

#### Dashboard Customization
Personalize your dashboard layout:
1. Click the sliders icon in the header
2. Toggle widgets on/off
3. Drag to reorder widgets
4. Click "Reset to default" to restore original layout

Your preferences are saved automatically.

#### Key Metrics Cards
- **Transactions** - Total number of transactions in the selected period
- **Revenue** - Total revenue generated (in RON)
- **Customers** - Unique customers who made purchases
- **Cashback Paid** - Total cashback distributed to customers

#### Executive Briefing Panel
An AI-generated summary of your business performance:
- **Performance Score** (0-100) - Overall health indicator
- **Daily/Weekly Toggle** - Switch between briefing views
- **Key Metrics Comparison** - Current vs previous period with trends
- **Highlights** - Positive and negative performance highlights
- **Alerts** - Critical issues requiring attention
- **Top Recommendations** - AI-suggested actions

#### Anomaly Alerts
Automatic detection of unusual patterns:
- **Spikes** - Unexpected increases
- **Drops** - Unexpected decreases
- **Severity Levels** - Low, Medium, High, Critical
- Each includes: description, expected vs actual values, recommended action

#### AI Recommendations
Personalized suggestions based on your data:
- **Urgency Levels** - High, Medium, Low priority
- **Expected Impact** - Potential improvement metrics
- Categories: Retention, Campaign optimization, Engagement, Growth

#### AI Chat Assistant
Conversational interface for data questions:
- "What are my top insights right now?"
- "How am I doing vs competitors?"
- "Forecast next week's transactions"
- "Why did revenue drop yesterday?"

---

### Analytics Page (`/analytics`)

Deep-dive analytics with five tabs:

#### Trends Tab
- Interactive charts showing historical performance
- Revenue, transactions, customers over time
- Customizable date ranges
- Trend lines and moving averages

#### Forecast Tab
- 7-day predictions for key metrics
- Confidence intervals (upper/lower bounds)
- Seasonal pattern detection

#### Competition Tab
- Anonymous comparison with other merchants
- Your rank in the platform
- Benchmark metrics

#### Cohorts Tab (NEW)
Customer retention analysis:
- **Cohort Matrix** - Visual heatmap of retention over time
- **Acquisition Cohorts** - Group customers by first purchase month
- **Retention Rates** - Track how many customers return each month
- **Key Metrics:**
  - Total customers analyzed
  - Average 1st month retention
  - Average 3rd month retention

#### AI Insights Tab
Combined view of Executive Briefing, Anomaly Alerts, and AI Recommendations.

---

### Settings Page (`/settings`)

Configure your merchant account:

#### API Access
Generate and manage your API key:
1. Click "Generate API Key" - Creates `ka_live_xxx` format key
2. **Important:** Copy immediately - shown only once (stored as hash)
3. Rate limit: 1000 requests/hour default

**API Authentication:** Use `Authorization: Bearer <api_key>` header.

```bash
curl -H "Authorization: Bearer ka_live_xxx" \
  https://kaching-analytics-production.up.railway.app/api/v1/metrics
```

#### Webhooks
Receive real-time notifications:
- **URL:** Your HTTPS endpoint (required)
- **Events:** anomaly.detected, daily_report.ready, threshold.exceeded, weekly_report.ready
- **Security:** HMAC-SHA256 signature in `X-KaChing-Signature` header

#### Branding (White-Labeling)
Customize dashboard appearance:
- Logo URL
- Primary/Secondary colors
- Custom domain (contact support)

#### Scheduled Reports (NEW)
Automated email reports:
1. Click "Add Report Schedule"
2. Configure:
   - **Report Name** - e.g., "Weekly Summary"
   - **Frequency** - Daily, Weekly, or Monthly
   - **Recipients** - Email addresses (comma-separated)
3. Reports include metrics summary, trends, and anomalies

#### Notification Settings (NEW)
Configure alert preferences:

**Email Notifications:**
- Anomaly alerts - Unusual patterns detected
- Weekly digest - Summary of metrics
- Threshold alerts - When metrics fall below limits

**Slack Integration:**
1. Create a Slack Incoming Webhook
2. Paste the webhook URL
3. Click "Send test" to verify

**Alert Thresholds:**
- Minimum daily revenue (RON)
- Minimum daily transactions

#### Language (NEW)
Switch between English and Romanian (Română).

---

## For Administrators

### Admin Panel (`/admin`)

**Access:** Only `super_admin` and `admin` roles.

### Users Management

#### Creating Users
1. Click "Add User"
2. Fill in: Email, Name, Role, Merchant, Password
3. Share credentials securely with user

#### User Roles

| Role | Dashboard Access | Admin Panel | Manage Users |
|------|-----------------|-------------|--------------|
| `super_admin` | All merchants | Yes | All users |
| `admin` | Own merchant | Yes | Own merchant users |
| `merchant` | Own merchant | No | No |
| `analyst` | Own merchant (read-only) | No | No |
| `viewer` | Limited | No | No |

### Merchants Management

#### Creating Merchants
1. Click "Add Merchant"
2. Fill in: Name, Industry, Cashback %
3. Optionally create admin user

### Data Import (`/admin/import`)

Upload transaction data:
1. **Drag & Drop CSV**
2. **Auto-Detection** - System analyzes structure
3. **Column Mapping** - Map to database fields
4. **Import** - Choose append or replace
5. **Aggregate** - Generate daily metrics

**Requires:** Admin or Super Admin role

### Audit Logs (`/admin/audit-logs`)

Track all user activity:
- Who accessed what
- When actions occurred
- IP addresses and user agents
- Filter by user, merchant, action, date

---

## Security Features

### Authentication
- **NextAuth.js** with JWT strategy
- **Azure AD SSO** support (enterprise)
- **Bcrypt** password hashing (10 rounds)
- **Session timeout:** 24 hours (auto-refresh every hour)

### API Security
- **API keys hashed** with SHA-256 before storage
- **Header-only authentication** (no query params)
- **Rate Limiting:**
  - 60 req/min (standard)
  - 10 req/min (auth)
  - 20 req/min (AI)
  - 10 req/min (export)

### Webhook Security
- **HTTPS required** - HTTP rejected
- **SSRF protection** - Private IPs blocked
- **Request timeout** - 10 seconds max
- **Signature verification** - HMAC-SHA256

### Security Headers
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

---

## API Reference

### Authentication

All API endpoints require authentication via `Authorization: Bearer <api_key>` header.

### GET /api/v1/metrics

Returns daily metrics for your merchant.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Number of days |
| `start_date` | string | - | Start date (YYYY-MM-DD) |
| `end_date` | string | - | End date (YYYY-MM-DD) |

**Response:**
```json
{
  "merchant_id": "uuid",
  "period": { "start": "2024-01-01", "end": "2024-01-30" },
  "metrics": [
    {
      "date": "2024-01-15",
      "transactions_count": 1250,
      "revenue": 45000.00,
      "unique_customers": 890,
      "cashback_paid": 2250.00
    }
  ],
  "totals": {
    "transactions": 35000,
    "revenue": 1250000.00,
    "customers": 12500,
    "cashback": 62500.00
  }
}
```

### GET /api/v1/anomalies

Returns detected anomalies.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Days to analyze |
| `severity` | string | - | Filter: low, medium, high, critical |

### GET /api/v1/forecast

Returns 7-day forecast.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `metric` | string | revenue | revenue or transactions |

---

## Quick Reference

### Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Main merchant dashboard |
| Analytics | `/analytics` | Deep-dive analytics + cohorts |
| Settings | `/settings` | API, webhooks, branding, reports, notifications |
| Admin Panel | `/admin` | User & merchant management |
| Data Import | `/admin/import` | CSV upload |
| Audit Logs | `/admin/audit-logs` | Activity tracking |
| Login | `/login` | Authentication |

### New Features (Phase 4)

| Feature | Location | Description |
|---------|----------|-------------|
| Date Range Picker | Dashboard/Analytics header | Custom date selection with presets |
| Data Export | Dashboard/Analytics header | CSV, Excel, JSON export |
| Scheduled Reports | Settings page | Automated email reports |
| Notifications | Settings page | Email/Slack alerts configuration |
| Cohort Analysis | Analytics > Cohorts tab | Customer retention heatmap |
| Dashboard Customizer | Dashboard header (sliders icon) | Show/hide/reorder widgets |
| Language Selector | Settings page | English/Romanian |

### PWA Installation

**iOS:** Safari > Share > Add to Home Screen
**Android:** Chrome > Menu > Install App
**Desktop:** Click install icon in address bar

---

## Support

For issues or feature requests, contact the platform administrator or open an issue in the project repository.
