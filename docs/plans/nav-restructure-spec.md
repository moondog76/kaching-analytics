# Navigation Restructure - Dev Spec

## Objective

Replace the current top-level navigation ("Dashboard" | "Analytics") with the new two-tier model ("Cashback Insights" | "Retail Insights"), and remove the redundant secondary tab row.

## Current State (from screenshot)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Mega Image  [Last 30 days▼] [Export▼]  Dashboard  Analytics  [Insights|Charts] [Mega Image Pro] [Logout] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [◎ Cashback Insights] [📊 Retail Insights Pro]                              │  ← Remove this row
├─────────────────────────────────────────────────────────────────────────────┤
│ Retail Insights [Premium]                                                   │
│ Market intelligence and competitive analysis for Mega Image                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Target State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Mega Image  [Last 30 days▼] [Export▼]  [Cashback Insights | Retail Insights Pro]  [Mega Image Pro] [Logout] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Retail Insights [Premium]                                                   │
│ Market intelligence and competitive analysis for Mega Image                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Changes Required

### 1. Update Top Navigation Bar

**File**: Likely `components/Navigation.tsx` or `components/Header.tsx` or `components/Layout.tsx`

**Find**: The navigation items that render "Dashboard" and "Analytics"

**Replace with**:
```tsx
// Old
<NavItem href="/dashboard">Dashboard</NavItem>
<NavItem href="/analytics">Analytics</NavItem>

// New
<NavItem href="/cashback-insights" active={currentTab === 'cashback'}>
  Cashback Insights
</NavItem>
<NavItem href="/retail-insights" active={currentTab === 'retail'}>
  <span>Retail Insights</span>
  <Badge variant="premium">Pro</Badge>
</NavItem>
```

### 2. Remove Secondary Tab Row

**Find**: The component rendering the secondary tabs (the row with "◎ Cashback Insights" and "📊 Retail Insights Pro")

**Action**: Remove this entire component/section since it's now redundant

### 3. Update Routing

**File**: `pages/` or `app/` directory (depending on Next.js version)

**Changes**:
- Rename or redirect `/dashboard` → `/cashback-insights`
- Rename or redirect `/analytics` → `/retail-insights`
- Or update the existing pages to use new naming

### 4. Access Control for Retail Insights

**Logic**: Only show "Retail Insights" tab (or show it disabled/locked) if merchant doesn't have premium access

```tsx
// In navigation component
const { merchant } = useMerchant(); // or however you get merchant data

{merchant.hasRetailInsightsAccess ? (
  <NavItem href="/retail-insights">
    Retail Insights <Badge>Pro</Badge>
  </NavItem>
) : (
  <NavItem href="/retail-insights" disabled className="opacity-50">
    Retail Insights <Badge>Pro</Badge> 🔒
  </NavItem>
)}
```

### 5. Style Updates (Pluxee Branding)

Apply to the navigation tabs:

```css
/* Active tab */
.nav-tab--active {
  background: #FFFFFF;
  color: #221C46;
  box-shadow: 0 2px 8px rgba(34, 28, 70, 0.08);
}

/* Pro badge */
.badge-pro {
  background: #00EB5E;
  color: #221C46;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-left: 8px;
}
```

---

## Files to Examine

Ask Claude Code to show you these files first:

1. **Navigation/Header component**: Where "Dashboard" and "Analytics" are defined
2. **Layout component**: Where the secondary tab row is rendered
3. **Page files**: `/dashboard` and `/analytics` pages
4. **Routing config**: Any route definitions

## Suggested Claude Code Prompt

```
Let's restructure the navigation. I need to:

1. Replace "Dashboard | Analytics" in the top nav with "Cashback Insights | Retail Insights"
2. Remove the secondary tab row (it's now redundant)
3. Add a "Pro" badge next to Retail Insights
4. Keep access control - Retail Insights should check hasRetailInsightsAccess

First, show me the current navigation component and layout files so we can see where these are defined.
```

---

## Verification Checklist

After implementation, verify:

- [ ] Top nav shows "Cashback Insights" and "Retail Insights" (not Dashboard/Analytics)
- [ ] "Pro" badge appears next to Retail Insights
- [ ] Secondary tab row is removed
- [ ] Clicking tabs navigates to correct pages
- [ ] Active tab is highlighted correctly
- [ ] Retail Insights respects access control (if merchant lacks premium access)
- [ ] URLs are clean (`/cashback-insights`, `/retail-insights`)
- [ ] Page titles/headers still show correctly
- [ ] AI Analyst uses correct context based on active tab
- [ ] AI responses change appropriately between tabs

---

## AI Analyst Context Switching

### Problem

The AI Analyst currently doesn't change its behavior/context when switching between Cashback Insights and Retail Insights tabs. It should:

- **Cashback Insights**: Only reference the merchant's own cashback data, focus on campaign optimization
- **Retail Insights**: Reference full market data, provide competitive intelligence

### Solution

The AI Analyst needs to receive the **current tab context** and use a **different system prompt** based on which tab is active.

### Implementation

#### 1. Pass Active Tab to AI Component

**Find**: The AI Analyst component (likely `components/AIAnalyst.tsx` or `components/AIChat.tsx`)

**Update**: Ensure it receives the current tab as a prop or from context

```tsx
// In the page or layout
<AIAnalyst 
  merchantId={merchant.id}
  contextMode={activeTab} // 'cashback' or 'retail'
/>
```

#### 2. Update AI API Route

**Find**: The API route that calls Claude (likely `pages/api/ai/chat.ts` or `app/api/ai/route.ts`)

**Update**: Switch system prompt based on contextMode

```tsx
// In the API route
import { AI_SYSTEM_PROMPTS } from '@/config/ai-prompts';

export async function POST(req: Request) {
  const { message, merchantId, contextMode } = await req.json();
  
  // Select prompt based on context
  const systemPrompt = contextMode === 'retail' 
    ? AI_SYSTEM_PROMPTS.retail 
    : AI_SYSTEM_PROMPTS.cashback;
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
    // ... rest of config
  });
  
  return Response.json({ response: response.content });
}
```

#### 3. Add System Prompts Config

**Create**: `config/ai-prompts.ts` (or add to existing config)

```tsx
export const AI_SYSTEM_PROMPTS = {
  cashback: `You are an AI analyst for KaChing Analytics Pro, helping merchants optimize their cashback campaigns.

CONTEXT:
- You are viewing the CASHBACK INSIGHTS tab
- You only have access to THIS merchant's own cashback transaction data
- You do NOT have visibility into competitor data or market benchmarks
- Focus on campaign optimization and own-customer analysis

CAPABILITIES:
✓ Analyze campaign performance trends
✓ Identify anomalies in own data
✓ Suggest campaign optimizations
✓ Profile own cashback customers

LIMITATIONS:
✗ Cannot see competitor performance
✗ Cannot compare to market averages
✗ Cannot analyze customer mobility

WHEN ASKED ABOUT COMPETITORS:
Say: "I don't have visibility into competitor data in Cashback Insights. To access competitive analysis, the Retail Insights package provides market intelligence. Based on your own data, I can help you with..."`,

  retail: `You are a retail market intelligence analyst for KaChing Analytics Pro with comprehensive market data.

CONTEXT:
- You are viewing the RETAIL INSIGHTS tab
- You have access to transaction data across the entire market
- You can see all competitor performance, market share, and customer flows
- Provide strategic market intelligence and competitive insights

CAPABILITIES:
✓ Market share analysis and trends
✓ Competitive positioning
✓ Customer mobility patterns (who shops where)
✓ Churn analysis (where customers go/come from)
✓ Demographic comparisons across market
✓ Strategic recommendations

DATA ACCESS:
- All merchants in comparison group
- Cross-merchant customer behavior
- 24+ months historical trends
- Share of wallet data`
};
```

#### 4. Clear Chat History on Tab Switch (Optional but Recommended)

When user switches tabs, consider clearing or separating chat history to avoid confusion:

```tsx
// In the tab switch handler
const handleTabChange = (newTab: 'cashback' | 'retail') => {
  setActiveTab(newTab);
  clearAIChatHistory(); // Or maintain separate histories per tab
};
```

### Suggested Claude Code Prompt

```
The AI Analyst needs to change its behavior based on which tab is active.

Currently it seems to use the same context for both tabs. I need:

1. Pass the active tab ('cashback' or 'retail') to the AI component
2. Update the AI API route to use different system prompts based on context
3. Cashback context: Only own data, campaign-focused, redirect competitor questions
4. Retail context: Full market data, competitive intelligence, strategic insights

Show me the AI Analyst component and the API route that calls Claude so we can add context switching.
```

### Verification

Test by asking the same question on both tabs:

**Question**: "How am I doing compared to competitors?"

**Expected on Cashback Insights**:
> "I don't have visibility into competitor data in Cashback Insights. To access competitive analysis, the Retail Insights package provides market intelligence. Based on your own campaign data, your ROI this month is 8.2x..."

**Expected on Retail Insights**:
> "Based on market data, your market share is 12.3% compared to Kaufland at 28.7% and Lidl at 22.1%. You've gained 2.1 percentage points over the last 6 months, outpacing the market average..."
