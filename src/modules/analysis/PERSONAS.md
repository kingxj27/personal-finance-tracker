# User Persona & Profile System Documentation

## Overview

The Personal Finance Tracker implements a **comprehensive user profiling system** that transforms a basic CRUD application into an **Intelligent Financial Operating System (IFOS)**. User profiles determine how the system:

- Generates personalized insights
- Adjusts financial thresholds and alerts
- Recommends portfolio allocations
- Prioritizes rules and recommendations
- Adapts to user behavior over time

This document explains the complete profile system, how it affects backend logic, and how to extend it.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [User Persona Types](#user-persona-types)
3. [UserProfile Database Schema](#userprofile-database-schema)
4. [Personalization Rules Engine](#personalization-rules-engine)
5. [Backend Integration Examples](#backend-integration-examples)
6. [System Decision Flow](#system-decision-flow)
7. [Implementation Guide](#implementation-guide)

---

## Core Concepts

### What is a User Profile?

A user profile is a multi-dimensional representation of a user's financial situation, goals, and constraints. It includes:

- **Demographics**: Age, region, employment status, family size
- **Financial Characteristics**: Income level, income stability, debt, assets
- **Behavioral Traits**: Risk tolerance, spending behavior, investment experience
- **System Preferences**: Automation settings, alert preferences, portfolio adjustments
- **Behavioral Data**: Engagement score, insights acted on, historical decisions

### How Profiles Drive System Behavior

The system uses profiles to **personalize every decision**:

```
User Profile → Rule Weights → Personalized Thresholds → Insights
                                                       ↓
                                    Adjusted Recommendations
                                                       ↓
                                       User Actions
                                                       ↓
                                      System Updates Profile
```

---

## User Persona Types

The system includes **4 main personas**, each with specific financial characteristics and system adaptations:

### 1. STUDENT

**Characteristics:**
- Income: $0-$20,000/year (variable, often seasonal)
- Income Stability: 0.3 (low - summers off, part-time work)
- Risk Tolerance: Very Low
- Spending Behavior: Moderate (limited budget)
- Investment Experience: None

**Financial Focus:**
- Emergency fund: 2 months of expenses (minimal)
- Savings target: 15% of income
- Portfolio: 100% cash/savings only
- Key concern: Making ends meet month-to-month

**System Adaptations:**
- ❌ Deemphasizes: Portfolio diversification, investment opportunities
- ✅ Emphasizes: Emergency fund building, expense tracking, debt awareness
- 📊 Thresholds: More forgiving on spending (allows 30% overage), lower savings rate requirement
- 💡 Insights: Focus on cash management, scholarships, part-time work optimization

**Example Personalization Rules:**
```
Rule: Student Debt Awareness
  ├─ Condition: Has education debt
  └─ Action: Reduce investment readiness score (-0.3)
             Prioritize debt repayment over portfolio building

Rule: Student Income Instability
  ├─ Condition: Income stability < 0.5
  └─ Action: Dynamic savings targets
             └─ High income months (summer): 25% savings target
             └─ Low income months (school): 5% savings target
```

---

### 2. YOUNG PROFESSIONAL

**Characteristics:**
- Income: $30,000-$200,000/year (stable salary)
- Income Stability: 0.75 (good - salaried position)
- Risk Tolerance: Medium
- Spending Behavior: Moderate (some flexibility)
- Investment Experience: Beginner to Intermediate

**Financial Focus:**
- Emergency fund: 3 months of expenses
- Savings target: 25% of income
- Portfolio: 60% stocks, 30% bonds, 10% cash
- Key concern: Building wealth while managing lifestyle

**System Adaptations:**
- ✅ Emphasizes: Goal tracking, savings rate, portfolio balance, housing cost optimization
- 📊 Thresholds: Standard thresholds, 15% spending overage alert
- 💡 Insights: Focus on goal progress, housing cost optimization, retirement savings
- 🎯 Actions: Recommend refinancing opportunities, side hustle tracking

**Example Personalization Rules:**
```
Rule: Young Professional Goal Tracking
  ├─ Condition: Has defined financial goals
  └─ Action: Emphasize goal progress
             ├─ Display dashboard daily
             ├─ Alert on milestones
             └─ Celebrate achievements

Rule: Housing Cost Optimization
  ├─ Condition: Housing > 30% of income
  └─ Action: Recommend optimization
             ├─ Negotiate lease reduction: $X/year potential
             ├─ Roommate opportunity
             └─ Relocation analysis
```

---

### 3. INVESTOR

**Characteristics:**
- Income: $150,000-$10,000,000/year (high, stable)
- Income Stability: 0.9 (very stable)
- Risk Tolerance: High
- Spending Behavior: Conservative (wealth preservation)
- Investment Experience: Advanced to Expert

**Financial Focus:**
- Emergency fund: 6 months of expenses (comfort)
- Savings target: 50% of income
- Portfolio: 40% stocks, 20% bonds, 20% real estate, 10% crypto, 8% commodities, 2% cash
- Key concern: Optimizing tax efficiency and returns

**System Adaptations:**
- ✅ Emphasizes: Portfolio concentration risk, diversification, tax optimization, dividend tracking
- ❌ Deemphasizes: Emergency fund alerts, low savings warnings
- 📊 Thresholds: More stringent on concentration (35% alert), very forgiving on spending (25% overage)
- 💡 Insights: Focus on tax-loss harvesting, rebalancing opportunities, sector exposure

**Example Personalization Rules:**
```
Rule: Investor Tax Efficiency
  ├─ Condition: Portfolio > $100,000
  └─ Action: Recommend tax optimization
             ├─ Quarterly tax-loss harvesting
             ├─ Monthly capital gains review
             └─ Annual tax strategy planning

Rule: Investor Dividend Tracking
  ├─ Condition: Has dividend stocks
  └─ Action: Track passive income
             ├─ Daily distribution tracking
             ├─ DRIP optimization
             └─ Income reinvestment strategy

Rule: Investor Diversification
  ├─ Condition: Any asset > 30%
  └─ Action: Concentration alert
             ├─ Alert threshold: 35% (higher than YP's 40%)
             └─ Rebalancing recommendation
```

---

### 4. EMERGING_MARKET_USER

**Characteristics:**
- Income: ₦2,000-₦50,000/month (regional equivalent, ~$2-50k/year)
- Income Stability: 0.4 (variable, regional economy dependent)
- Risk Tolerance: Very Low
- Spending Behavior: Aggressive (limited surplus)
- Investment Experience: None

**Financial Focus:**
- Emergency fund: 1 month of expenses (minimal, cash is king)
- Savings target: 10% of income
- Portfolio: 70% local currency savings, 20% stablecoins (USD/USDT), 10% local stocks
- Key concern: Currency preservation, accessibility to cash

**System Adaptations:**
- ✅ Emphasizes: Cash savings, stablecoin holdings, currency protection
- ❌ Deemphasizes: Portfolio diversification, investment opportunities
- 🌍 Localization: Supports local currencies, regional financial products, stablecoins
- 📊 Thresholds: Very forgiving on savings (10% alert instead of 25%)
- 💡 Insights: Focus on stablecoin strategies, currency hedging, regional arbitrage opportunities

**Example Personalization Rules:**
```
Rule: Emerging Market Currency Volatility
  ├─ Condition: Region has currency volatility
  └─ Action: Recommend stablecoin allocation
             ├─ 20% USDC/USDT (USD stablecoins)
             ├─ 70% Local currency savings (accessibility)
             └─ 10% Local stocks (growth potential)

Rule: Emerging Market Cash Preference
  ├─ Condition: Always for EM users
  └─ Action: Skip portfolio concentration checks
             └─ System won't flag "too much cash"
             └─ Cash is safety, not sub-optimal
```

---

## UserProfile Database Schema

### Complete Prisma Model

```prisma
enum PersonaType {
  STUDENT
  YOUNG_PROFESSIONAL
  INVESTOR
  EMERGING_MARKET_USER
}

enum RiskTolerance {
  VERY_LOW
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

model UserProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // CORE PROFILE
  personaType           PersonaType
  riskTolerance         RiskTolerance
  spendingBehavior      SpendingBehavior

  // FINANCIAL CHARACTERISTICS
  incomeLevel           Int               // in base currency
  incomeStability       Float             // 0-1, higher = more stable
  age                   Int?
  region                String            // country/region code
  currency              String            @default("USD")

  // GOALS & SITUATION
  financialGoals        String[]          // goal types: ["retirement", "home", "car"]
  investmentExperience  String            @default("beginner")
  debtLevel             Int               @default(0)
  employmentStatus      String
  familySize            Int               @default(1)
  timeHorizonYears      Int?

  // SYSTEM BEHAVIOR
  emergencyFundPriority Boolean           @default(true)
  automateInsights      Boolean           @default(true)
  allowPortfolioAdjustments Boolean       @default(false)

  // PERSONALIZATION WEIGHTS
  riskAversionMultiplier    Float         @default(1.0)  // 0.5-2.0
  savingsGoalMultiplier     Float         @default(1.0)  // 0.5-2.0
  investmentReadinessScore  Float?        // 0-1

  // BEHAVIORAL DATA
  insightsActionedCount     Int           @default(0)
  insightsIgnoredCount      Int           @default(0)
  engagementScore           Float?        // 0-1

  // METADATA
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  lastAssessmentAt      DateTime?

  // RELATIONSHIPS
  thresholdOverrides    ThresholdOverride[]

  @@index([personaType])
  @@index([riskTolerance])
}

model ThresholdOverride {
  id                String   @id @default(cuid())
  userProfileId     String
  userProfile       UserProfile @relation(fields: [userProfileId], references: [id])

  ruleType          String        // "overspending_alert", "low_savings_alert", etc.
  baseThreshold     Float         // from persona config
  customThreshold   Float         // user's personalized threshold
  reason            String?

  @@unique([userProfileId, ruleType])
}
```

### Key Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| `personaType` | Primary persona classification | YOUNG_PROFESSIONAL |
| `riskTolerance` | Investment risk tolerance | MEDIUM |
| `incomeStability` | How stable the income is (0-1) | 0.75 (good stability) |
| `riskAversionMultiplier` | Adjusts thresholds by risk (0.5-2.0) | 1.2 (20% more risk-averse) |
| `savingsGoalMultiplier` | Adjusts savings targets (0.5-2.0) | 0.8 (20% lower targets) |
| `investmentReadinessScore` | Readiness to invest (0-1) | 0.65 |
| `engagementScore` | % of insights acted on (0-1) | 0.72 |

---

## Personalization Rules Engine

### What are Personalization Rules?

**Personalization rules** are conditional logic that adapts system behavior based on user profiles. They:

1. **Check conditions** specific to the user's situation
2. **Apply actions** that modify system behavior
3. **Have priorities** for ordering when multiple rules apply
4. **Can be enabled/disabled** per user

### Rule Categories

#### A. Persona-Specific Rules

**Student Debt Awareness**
```typescript
Applies to: STUDENT personas with debt
Condition: debtLevel > 0
Action: Reduce investment readiness score by 0.3
        Suggest debt repayment strategy
Result: Student sees debt payoff advice before investment suggestions
```

**Investor Tax Efficiency**
```typescript
Applies to: INVESTOR personas with large portfolios
Condition: portfolioValue > $100,000
Action: Emphasize tax optimization insights
        Enable tax-loss harvesting recommendations
Result: Investor sees quarterly tax strategies automatically
```

#### B. Threshold Adjustment Rules

**Emergency Fund Alert Threshold**
```
Base Threshold (all users):    Low emergency fund = < 3 months
Student Threshold:             Low emergency fund = < 2 months
Investor Threshold:            Low emergency fund = < 6 months
Emerging Market Threshold:     Low emergency fund = < 1 month

Formula: personalizedThreshold = baseThreshold * persona.emergencyFundMonths / 3
```

**Portfolio Concentration Alert**
```
Base Threshold:               Alert if single asset > 40%
Young Professional:           Alert if > 40% (unchanged)
Investor:                     Alert if > 35% (more conservative - wants diversity)
Emerging Market User:         Alert if > 60% (allows cash concentration)
```

#### C. Rule Emphasis Rules

**Rule Weight Multipliers**

```typescript
StudentPersona:
  emergency_fund_low:           1.5x (emphasize)
  income_instability:           1.3x (emphasize)
  low_savings_rate:             1.3x (emphasize)
  portfolio_concentration:      0.5x (deemphasize)
  investment_diversity:         0.5x (deemphasize)

InvestorPersona:
  portfolio_concentration:      1.5x (emphasize - wants to know about concentration)
  investment_diversity:         1.5x (emphasize)
  tax_efficiency:               1.4x (emphasize)
  emergency_fund_low:           0.5x (deemphasize - has money)
  low_savings_rate:             0.5x (deemphasize)
```

### Implementing Custom Rules

Add a new personalization rule:

```typescript
export const customMyRule: PersonalizationRule = {
  id: 'my_custom_rule',
  name: 'My Custom Rule',
  description: 'Does something specific',
  appliesToPersonas: [PersonaType.YOUNG_PROFESSIONAL],
  priority: 85,
  enabled: true,
  
  condition: (data) => {
    // Return true when rule should apply
    return data.monthlyIncome > 5000 && data.savingsRate < 0.2;
  },
  
  action: (data) => ({
    type: 'modify_suggestion',
    target: 'savings_strategy',
    value: { /* your recommendation */ },
    explanation: 'Why this rule matters for this user',
  }),
};
```

---

## Backend Integration Examples

### Example 1: Personalized Insight Generation

```typescript
// Get user's profile with personalization rules
const profile = await getPersonalizedProfile(userId);

// Build thresholds based on profile
const thresholds = {
  savingsAlert: profile.savingsRateTarget * profile.savingsGoalMultiplier,
  spendingAlert: getPersonalizedThreshold(profile, 'overspending_alert'),
  concentrationAlert: getPersonalizedThreshold(profile, 'portfolio_concentration'),
};

// Generate insights using profile-weighted rules
const insights = await insightEngine.analyze({
  transactions,
  portfolio,
  profile,
  thresholds,
  ruleWeights: getRuleWeights(profile.personaType),
});
```

### Example 2: Different Emergency Fund Targets

```typescript
// Database query
const status = await getEmergencyFundStatus(userId);

// Returns persona-specific recommendation
if (profile.personaType === 'STUDENT') {
  return {
    current: 1200,
    target: 2400,           // 2 months expenses
    message: 'Aim for 2 months',
  };
} else if (profile.personaType === 'INVESTOR') {
  return {
    current: 30000,
    target: 90000,          // 6 months expenses
    message: 'Maintain 6 months for security',
  };
}
```

### Example 3: Portfolio Allocation by Persona

```typescript
// Different allocations by persona
const recommendedAllocation = getRecommendedAllocation(profile);

STUDENT:                60/40/0          → Cash/Savings/Stocks
YOUNG_PROFESSIONAL:     60/30/10         → Stocks/Bonds/Cash
INVESTOR:              40/20/20/10/8/2   → Stocks/Bonds/RE/Crypto/Commodities/Cash
EMERGING_MARKET_USER:  70/20/10          → Local Currency/Stablecoins/Local Stocks

// Then adjust based on individual risk tolerance
const adjusted = adjustByRiskTolerance(recommended, profile.riskTolerance);
```

### Example 4: Behavioral-Based Profile Updates

```typescript
// Track insight engagement
await recordInsightEngagement(userId, insightId, 'actioned');

// System updates profile
profile.insightsActionedCount += 1;
profile.engagementScore = actionedCount / totalInsights;

// If engagement high, might suggest new features
if (profile.engagementScore > 0.8) {
  // User is engaged - can offer advanced features
  profile.allowPortfolioAdjustments = true;
}

// Save audit log
await logProfileChange(userId, 'engagement_update', {
  engagementScore,
  insightsActioned,
});
```

---

## System Decision Flow

### How the System Uses Profiles for Every Decision

```
┌─────────────────────────────────────────────────────────────┐
│ USER EVENT: New transaction, portfolio change, etc.         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. FETCH USER PROFILE                                       │
│    - PersonaType, riskTolerance, demographics              │
│    - Customization weights (riskAversionMultiplier, etc.)   │
│    - Behavioral data (engagementScore, etc.)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BUILD PERSONALIZED THRESHOLDS                            │
│    - Load persona's base thresholds                         │
│    - Apply customization weights                            │
│    - Check for user overrides                               │
│    Result: customThresholds = baseThresholds * weights      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SELECT APPLICABLE RULES                                  │
│    Filter PersonalizationRules by:                          │
│    - Matches profile's personaType ✓                        │
│    - Matches profile's riskTolerance (if specified) ✓       │
│    - Rule is enabled ✓                                      │
│    - Rule's condition is met ✓                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. APPLY RULES BY PRIORITY                                  │
│    - Sort by priority (highest first)                       │
│    - Apply actions sequentially                             │
│    - Accumulate modifications                               │
│    Result: ruleActions = [action1, action2, ...]            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. GENERATE INSIGHTS WITH WEIGHTS                           │
│    - Run analysis engine                                    │
│    - Apply rule weights to insight priority                 │
│    - Deemphasize irrelevant rules                            │
│    Result: insights = [...] sorted by priority              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PERSONALIZE RECOMMENDATIONS                              │
│    - Adjust messaging tone for persona                      │
│    - Include persona-specific suggestions                   │
│    - Use localized language/currency                        │
│    Result: personalizedInsights = [insight1 + context, ...] │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. RETURN TO USER                                           │
│    Dashboard sees:                                          │
│    - High-priority insights first                           │
│    - Persona-specific recommendations                       │
│    - Personalized thresholds applied                        │
│    - Behavioral context considered                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Guide

### Step 1: Create UserProfile in Database

```sql
-- Run this migration
npx prisma migrate dev --name add_user_profile

-- Add to schema.prisma (see schema section above)
```

### Step 2: Initialize Profile for New User

```typescript
async function initializeUserProfile(userId: string, metadata: {
  age: number;
  region: string;
  incomeLevel: number;
}) {
  // Suggest persona based on initial data
  const suggestedPersona = suggestPersona(
    metadata.incomeLevel,
    metadata.age,
    'employed',
    'beginner',
    metadata.region
  );

  // Create profile
  const profile = await prisma.userProfile.create({
    data: {
      userId,
      personaType: suggestedPersona,
      incomeLevel: metadata.incomeLevel,
      incomeStability: 0.5, // Start neutral
      age: metadata.age,
      region: metadata.region,
      riskTolerance: 'MEDIUM', // Default
      investmentExperience: 'beginner',
    },
  });

  return profile;
}
```

### Step 3: Integrate Personalization Rules

```typescript
// In your insight generation endpoint
async function generateInsights(userId: string) {
  const profile = await getPersonalizedProfile(userId);
  const engine = new PersonalizationRuleEngine();
  
  // Apply rules to get personalization actions
  const actions = engine.applyRules(userContext);
  
  // Use personalized thresholds for analysis
  const insights = await analyzeWithPersonalization(
    userData,
    profile,
    actions
  );
  
  return insights;
}
```

### Step 4: Track Behavioral Data

```typescript
// When user acts on insights
app.post('/insights/:id/action', async (req, res) => {
  const { userId, action } = req.body; // 'actioned', 'ignored', 'dismissed'
  
  // Record engagement
  await recordInsightEngagement(userId, req.params.id, action);
  
  // Profile is automatically updated with engagement score
  const updated = await prisma.userProfile.findUnique({
    where: { userId },
  });
  
  res.json({ engagementScore: updated.engagementScore });
});
```

### Step 5: Periodically Re-assess Persona

```typescript
// Cron job - monthly persona reassessment
async function reassessUserPersonas() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const { currentPersona, suggestedPersona, shouldUpdate } = 
      await assessPersonaChange(user.id);
    
    if (shouldUpdate) {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          personaType: suggestedPersona,
          lastAssessmentAt: new Date(),
        },
      });
      
      // Notify user of change
      await sendNotification(user.id, 
        `Your financial profile suggests you're now a ${suggestedPersona}`
      );
    }
  }
}
```

---

## Key Takeaways

1. **Profiles drive personalization**: Every system decision checks the user's profile
2. **Four personas cover most users**: Student, Young Professional, Investor, Emerging Market
3. **Rules enable flexibility**: Personalization rules let you adapt behavior per user
4. **Behavioral data improves over time**: System learns engagement and adjusts recommendations
5. **Database-backed**: All profile data persists for consistency across sessions
6. **Audit trails**: ProfileAuditLog tracks why profile decisions change

---

## See Also

- [RULES.md](RULES.md) - Detailed 12-rule insight engine specification
- [README.md](README.md) - Analysis module overview
- [personalization-rules.ts](personalization-rules.ts) - Rule implementations
- [profile-logic-examples.ts](profile-logic-examples.ts) - Backend query examples
- [../../modules/personas.ts](../../modules/personas.ts) - Persona configurations
