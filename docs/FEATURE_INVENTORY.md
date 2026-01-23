# KaChing Analytics - Complete Feature Inventory

> Last updated: January 2026
> Use this document for competitive gap analysis and roadmap planning.

---

## 1. CORE ANALYTICS DASHBOARDS

### Cashback Insights (Standard Tier)

| Feature | Description |
|---------|-------------|
| **Hero KPIs** | Campaign budget, revenue, ROI, CAC, total customers, repeat rate with 7-day trend indicators |
| **Campaign Performance** | Name, status, duration, budget vs spend, cashback %, performance visualization |
| **Customer Profile** | Total customers, gender distribution, age segmentation (6 groups), top spenders, spending behavior |
| **Receipt Comparison** | Domestic vs campaign avg receipt value, uplift % calculation |
| **Visit Patterns** | Domestic vs campaign visits/customer, frequency change % |
| **Distribution Metrics** | Sector growth %, new customer %, loyalty %, max reach % |
| **Transaction History** | Detailed list with amount, date, customer ID, category breakdown |

### Retail Insights (Premium Tier)

| Feature | Description |
|---------|-------------|
| **Market Position** | Market share by sales & transactions, 3/6-month reach, share of wallet |
| **Mobility Matrix** | Cross-shopping analysis, customer overlap %, migration patterns, heatmap |
| **Churn Intelligence** | Churn identification, destination tracking, new customer sources, cohort retention |
| **Competitive Demographics** | Multi-competitor age/gender comparison, demographic trends |

---

## 2. AI & INTELLIGENCE FEATURES

### Pluxee Analyst (Conversational AI)

- Context-aware chat (switches between cashback/retail modes)
- Streaming responses via Opper API
- Suggested follow-up questions
- Session persistence and message history
- Expandable right-side sidebar panel

### Autonomous AI Features

| Feature | Description |
|---------|-------------|
| **Anomaly Detection** | Z-score analysis, multi-metric monitoring, severity classification (low→critical) |
| **Executive Briefing** | AI-generated daily/weekly summaries, 0-100 health score, actionable insights |
| **Recommendation Cards** | Priority-based suggestions with rationale and suggested actions |
| **Forecast Engine** | Revenue/customer forecasting with confidence intervals |

### AI Conversation Analytics (Admin)

- Topic clustering and extraction
- Pain point identification
- Feature request mining
- Confusion area detection
- Resolution rate metrics

---

## 3. DATA MANAGEMENT

### Import

- CSV drag-and-drop upload
- Structure detection and column mapping
- Bulk import with error reporting
- Support for transactions and daily_metrics

### Export

| Format | Content |
|--------|---------|
| CSV | Excel-compatible spreadsheets |
| Excel | Native .xlsx workbooks |
| JSON | Full metadata for developers |

All exports include: date range filtering, merchant selection, audit trail logging

---

## 4. REPORTING & NOTIFICATIONS

### Scheduled Reports

- Daily, weekly, monthly frequency
- Multiple email recipients
- Include/exclude competitors and historical data
- Manual send trigger
- Next scheduled date tracking

### Notifications

| Channel | Events |
|---------|--------|
| **Email** | Anomalies, weekly digest, threshold alerts |
| **Slack** | Anomaly notifications, threshold alerts via webhook |
| **Custom Thresholds** | Revenue/transaction minimums with alerts |

---

## 5. USER & ACCESS MANAGEMENT

### Role Hierarchy

| Role | Capabilities |
|------|--------------|
| **super_admin** | Full platform access, manage all merchants/users, create merchants |
| **admin** | Merchant admin, manage users within merchant, settings access |
| **analyst** | View all data, create reports, read-only config |
| **merchant** | View dashboard, create reports |
| **viewer** | Read-only dashboard access |

### User Management Features

- Create/edit/deactivate users
- Password generation and reset
- Role assignment
- SSO support (Azure AD, Okta, Google)
- Last login tracking

---

## 6. ADMIN FEATURES

### Merchant Management

- Create merchants with auto-generated admin
- View merchant stats (users, transactions, metrics)
- Industry classification
- Access tier management (standard/premium)

### Audit & Compliance

- Comprehensive action logging
- IP address and user agent tracking
- Searchable/filterable audit logs
- Action type grouping

### AI Conversation Browser

- Paginated list with filters
- Flagged/starred tracking
- Full message history view
- Performance analytics

---

## 7. SETTINGS & CONFIGURATION

### Branding (White-Label)

- Custom logo URL
- Primary/secondary colors
- Custom domain support

### API & Integrations

- API key generation/revocation
- Rate limit configuration
- Webhook setup with event subscriptions:
  - Anomaly detected
  - Daily/weekly report ready
  - Threshold exceeded

### Localization

- Language selector
- Multi-language infrastructure
- Locale-aware date/currency formatting (RON)

### Mobile/PWA

- Progressive Web App support
- Platform-specific install guides
- Home screen installability

---

## 8. DATA VISUALIZATION TYPES

| Chart Type | Use Case |
|------------|----------|
| Line Charts | Time series, forecasts |
| Bar Charts | Comparisons, demographics |
| Pie/Donut | Distribution breakdown |
| Area Charts | Cumulative trends |
| Heatmaps | Mobility matrix, correlations |
| Gauge Charts | Performance indicators |
| Sparklines | Inline trend indicators |

---

## 9. TECHNICAL INFRASTRUCTURE

### Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Next.js API routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth with credentials + SSO
- **AI**: Opper (chat), Anthropic (admin insights fallback)

### Security

- Role-based access control (RBAC)
- Multi-tenant isolation
- bcrypt password hashing
- Session token management
- Rate limiting
- Audit logging

### Public API (v1)

| Endpoint | Description |
|----------|-------------|
| `/api/v1/metrics` | Daily metrics retrieval |
| `/api/v1/anomalies` | Recent anomalies |
| `/api/v1/forecast` | Revenue forecasting |

Authentication: X-API-Key header

---

## 10. ACCESS TIERS

| Feature | Standard | Premium |
|---------|:--------:|:-------:|
| Cashback Insights | ✅ | ✅ |
| Basic Anomaly Detection | ✅ | ✅ |
| Email Notifications | ✅ | ✅ |
| Scheduled Reports | ✅ | ✅ |
| API Access | Limited | Full |
| **Retail Insights** | ❌ | ✅ |
| **Market Analysis** | ❌ | ✅ |
| **Mobility Matrix** | ❌ | ✅ |
| **Churn Intelligence** | ❌ | ✅ |
| Webhook Integration | ❌ | ✅ |
| White-labeling | ❌ | ✅ |

---

## 11. API ENDPOINTS SUMMARY

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handler

### Chat & AI
- `POST /api/chat` - AI chat with streaming
- `POST /api/ai-chat/log` - Message logging

### Analytics
- `GET /api/insights` - Insight detection
- `GET /api/anomalies` - Anomaly detection
- `GET /api/forecast` - Forecasting
- `GET /api/recommendations` - AI recommendations
- `GET /api/executive-briefing` - Executive summaries
- `GET /api/cohort` - Cohort analysis

### Data
- `GET /api/merchant-data` - Merchant analytics
- `GET /api/merchants` - List merchants
- `GET /api/export` - Data export
- `POST /api/import` - Data import

### Notifications & Reports
- `GET/POST /api/notification-settings` - Notification prefs
- `GET/POST /api/scheduled-reports` - Report scheduling
- `GET/POST /api/scheduled-reports/send` - Trigger reports

### Admin
- `GET/POST /api/admin/merchants` - Merchant CRUD
- `GET/PUT/DELETE /api/admin/users` - User management
- `GET /api/admin/ai-conversations` - Conversation list
- `GET/POST /api/admin/ai-insights` - Conversation analytics
- `GET /api/admin/audit-logs` - Audit trail

### Public API (v1)
- `GET /api/v1/metrics` - Metrics endpoint
- `GET /api/v1/anomalies` - Anomalies endpoint
- `GET /api/v1/forecast` - Forecast endpoint

---

## 12. DATABASE MODELS

### Core
- `merchants` - Multi-tenant organizations
- `users` - User accounts with SSO
- `transactions` - Individual transactions
- `daily_metrics` - Aggregated daily stats
- `campaigns` - Marketing campaigns
- `stores` - Physical locations
- `customers` - Customer profiles

### Analytics
- `anomalies` - Detected anomalies
- `ai_recommendations` - AI suggestions
- `ai_chat_messages` - Chat history
- `ai_chat_sessions` - Session aggregation
- `churn_analyses` - Churn snapshots
- `market_share_snapshots` - Market position
- `customer_mobility_snapshots` - Customer flow

### Admin
- `audit_logs` - Action logging
- `api_logs` - API tracking
- `webhook_logs` - Webhook events
- `notification_settings` - User preferences
- `scheduled_reports` - Report configuration
- `admin_conversation_insights` - AI analytics

---

## SUMMARY STATS

| Metric | Count |
|--------|-------|
| User Pages | 5 |
| Admin Pages | 4 |
| API Endpoints | 30+ |
| Dashboard Modes | 2 |
| User Roles | 5 |
| AI Feature Categories | 3 |
| Export Formats | 3 |
| Notification Channels | 2 |
| Visualization Types | 10+ |
| Database Models | 20+ |

---

## COMPETITIVE GAP ANALYSIS CHECKLIST

Use this checklist to compare against competitors:

### Must-Have Features
- [ ] Multi-tenant architecture
- [ ] Role-based access control
- [ ] Real-time dashboards
- [ ] Data export (CSV/Excel)
- [ ] Scheduled reports
- [ ] Email notifications
- [ ] API access

### Differentiators
- [ ] Conversational AI analyst
- [ ] Anomaly detection
- [ ] Predictive forecasting
- [ ] Customer mobility/flow analysis
- [ ] Churn intelligence
- [ ] Market share tracking
- [ ] White-label support
- [ ] Webhook integrations

### Advanced Features
- [ ] AI-generated executive briefings
- [ ] Cohort analysis
- [ ] Competitive demographics
- [ ] Share of wallet analysis
- [ ] SSO integration
- [ ] Audit logging
- [ ] Custom thresholds with alerts

---

*Document generated for roadmap planning and competitive analysis.*
