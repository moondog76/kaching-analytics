# KaChing Analytics Platform

## Overview

KaChing Analytics is an AI-native retail analytics platform designed for Romanian merchants. It provides real-time insights, anomaly detection, AI-powered recommendations, and executive briefings to help merchants understand their cashback campaign performance.

**Production URL:** `https://kaching-analytics-production.up.railway.app`

---

## For Merchants

### Getting Started

1. **Login:** Go to `/login` and enter your credentials (e.g., `megaimage@demo.com` / `demo123`)
2. After login, you'll see your merchant dashboard with all your analytics

---

### Dashboard (`/`)

The main dashboard provides a comprehensive overview of your business performance:

#### Key Metrics Cards
- **Transactions** - Total number of transactions in the last 30 days
- **Revenue** - Total revenue generated (in RON)
- **Customers** - Unique customers who made purchases
- **Cashback Paid** - Total cashback distributed to customers

Each metric card shows the current value and can be clicked for detailed drill-down analysis.

#### Executive Briefing Panel
An AI-generated summary of your business performance:
- **Performance Score** (0-100) - Overall health indicator with color coding (green/yellow/red)
- **Daily/Weekly Toggle** - Switch between daily and weekly briefing views
- **Key Metrics Comparison** - Current period vs previous period with trend arrows
- **Highlights** - Positive and negative performance highlights
- **Alerts** - Critical issues requiring attention (e.g., revenue drops >20%)
- **Top Recommendations** - AI-suggested actions to improve performance

#### Anomaly Alerts
Automatic detection of unusual patterns in your data:
- **Spikes** - Unexpected increases (e.g., 50% more transactions than normal)
- **Drops** - Unexpected decreases requiring investigation
- **Severity Levels** - Low, Medium, High, Critical
- Each anomaly includes:
  - What happened (description)
  - Expected vs actual values
  - Deviation percentage
  - Recommended action

#### AI Recommendations
Personalized suggestions based on your data:
- **Urgency Levels** - High, Medium, Low priority
- **Expected Impact** - Potential revenue/customer improvement
- Categories include:
  - Retention strategies
  - Campaign optimization
  - Customer engagement
  - Revenue growth tactics

#### AI Chat Assistant
A conversational interface to ask questions about your data:
- "What are my top insights right now?"
- "How am I doing vs competitors?"
- "Forecast next week's transactions"
- "Why did revenue drop yesterday?"

---

### Analytics Page (`/analytics`)

Deep-dive analytics with four tabs:

#### Trends Tab
- Interactive charts showing historical performance
- Revenue, transactions, customers over time
- Customizable date ranges
- Trend lines and moving averages

#### Forecast Tab
- 7-day predictions for key metrics
- Confidence intervals (upper/lower bounds)
- Based on time-series decomposition
- Shows seasonal patterns (weekday effects)

#### Competition Tab
- Anonymous comparison with other merchants
- Your rank in the platform
- Benchmark metrics (revenue, transactions, cashback)
- Industry averages

#### AI Insights Tab
- Combined view of:
  - Executive Briefing
  - Anomaly Alerts
  - AI Recommendations
- All AI features in one place

---

### Data Import (`/admin/import`)

For merchants who need to upload their own data:

1. **Drag & Drop CSV** - Upload your transaction data
2. **Auto-Detection** - System analyzes CSV structure
3. **Column Mapping** - Map your columns to database fields:
   - `transaction_date` → Transaction date
   - `amount` or `amount_cents` → Transaction amount
   - `customer_id` or `user_id` → Customer identifier
   - `merchant_name` → Merchant name
4. **Import Options**:
   - Clear existing data (full replacement)
   - Append to existing data
5. **Aggregate to Metrics** - After import, click to generate daily summaries

Supported CSV formats:
- `amount` (in euros/RON)
- `amount_cents` (auto-converts to euros)
- `user_id` (maps to customer_id)

---

## For Administrators

### Admin Panel (`/admin`)

**Access:** Only `super_admin` and `admin` roles can access this page.

Login as: `admin@kaching.ro` / `demo123`

---

### Users Management

#### Viewing Users
- List all users with search functionality
- See user details: email, name, role, merchant, status
- Filter by merchant (super_admin only)

#### User Information Displayed

| Field | Description |
|-------|-------------|
| Name/Email | User identity |
| Role | `super_admin`, `admin`, `merchant`, `analyst`, `viewer` |
| Merchant | Assigned merchant (if any) |
| Status | Active (green) or Inactive (red) |
| Last Login | When user last signed in |

#### Creating Users
1. Click "Add User"
2. Fill in:
   - **Email** (required) - Must be unique
   - **Name** (optional)
   - **Role** - Permission level
   - **Merchant** - Which merchant they belong to (super_admin only)
   - **Password** - Generate secure password or set custom
3. System shows generated password - share securely with user

#### User Actions

| Action | Description |
|--------|-------------|
| Activate/Deactivate | Toggle user access without deleting |
| Reset Password | Generate new secure password |
| Delete | Permanently remove user (cannot delete yourself) |

#### Role Permissions

| Role | Can Access | Can Manage |
|------|-----------|------------|
| `super_admin` | All merchants, admin panel | All users, all merchants |
| `admin` | Own merchant, admin panel | Users in own merchant |
| `merchant` | Own merchant dashboard | Nothing |
| `analyst` | Own merchant dashboard (read-only) | Nothing |
| `viewer` | Limited dashboard access | Nothing |

---

### Merchants Management

#### Viewing Merchants
- List all merchants with statistics
- Search by name or industry
- Quick link to view merchant's dashboard

#### Merchant Information Displayed

| Field | Description |
|-------|-------------|
| Name | Merchant business name |
| Industry | Business category (e.g., Retail, Restaurant) |
| Users | Number of users assigned |
| Transactions | Total transaction count |
| Cashback % | Configured cashback percentage |

#### Creating Merchants (Super Admin Only)
1. Click "Add Merchant"
2. Fill in:
   - **Name** (required) - Business name
   - **Industry** (optional) - Defaults to "Retail"
   - **Cashback %** (optional) - e.g., 5.00
   - **Create Admin User** - Optionally create an admin for this merchant
   - **Admin Email** - Custom email or auto-generated
3. System shows merchant details and admin credentials

#### Merchant Actions

| Action | Description |
|--------|-------------|
| View Dashboard | Open merchant's dashboard with `?merchantId=xxx` |
| Edit | Update name, industry, cashback % |
| Delete | Remove merchant and ALL associated data (requires confirmation) |

---

### Merchant Selector (Header)

For admins with access to multiple merchants:
- Dropdown in the header to switch between merchants
- Shows all accessible merchants
- Selected merchant affects all dashboard data
- URL updates with `?merchantId=xxx` for bookmarking/sharing

---

### Audit Logs (`/admin/audit-logs`)

Track all user activity:
- Who accessed what
- When actions occurred
- IP addresses
- User agents
- Filter by user, merchant, action type, date range

---

## Technical Details

### Authentication
- **NextAuth.js** with JWT strategy
- **Azure AD SSO** support (enterprise)
- **Credentials** provider with database lookup
- **Bcrypt** password hashing (12 rounds)
- **Session** contains: userId, merchantId, merchantName, role

### Security Features
- **Rate Limiting:**
  - 60 requests/min (standard APIs)
  - 10 requests/min (auth endpoints)
  - 20 requests/min (AI endpoints)
  - 5 requests/5min (import operations)
- **Permission Checks:** Every API validates merchant access
- **Audit Logging:** All significant actions recorded
- **Password Requirements:** 8+ chars, uppercase, lowercase, number

### Database
- **PostgreSQL** via Prisma ORM
- **Indexes** on merchant_id for fast multi-tenant queries
- **Tables:** merchants, users, transactions, daily_metrics, audit_logs, sessions

### AI Features
- **Anomaly Detection:** Z-score based (threshold: 2.0)
- **Recommendations:** Trend analysis over 14+ days
- **Executive Briefings:** Aggregated metrics with AI-generated summaries
- **Forecasting:** Time-series decomposition with seasonal adjustment
- **Chat:** Claude AI integration for natural language queries

---

## Quick Reference

### Login Credentials (Demo)

| User | Email | Password | Access |
|------|-------|----------|--------|
| Platform Admin | `admin@kaching.ro` | `demo123` | All merchants + admin panel |
| Any Merchant | `{merchantname}@demo.com` | `demo123` | Own merchant only |

### Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Main merchant dashboard |
| Analytics | `/analytics` | Deep-dive analytics |
| Admin Panel | `/admin` | User & merchant management |
| Data Import | `/admin/import` | CSV upload |
| Audit Logs | `/admin/audit-logs` | Activity tracking |
| Login | `/login` | Authentication |

---

## Support

For issues or feature requests, contact the platform administrator or open an issue in the project repository.
