/**
 * PROFILE-BASED DATABASE SCHEMA EXTENSION
 * 
 * Shows how user profiles integrate with Prisma schema
 * and how backend logic uses profiles to personalize behavior
 */

// ============================================================================
// PRISMA SCHEMA ADDITIONS (for prisma/schema.prisma)
// ============================================================================

/**

// Add this to prisma/schema.prisma:

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

enum SpendingBehavior {
  AGGRESSIVE
  MODERATE
  CONSERVATIVE
}

enum LifeStage {
  STUDENT
  EARLY_CAREER
  ESTABLISHED
  PRE_RETIREMENT
  RETIREMENT
}

model UserProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Core Profile
  personaType           PersonaType
  riskTolerance         RiskTolerance
  spendingBehavior      SpendingBehavior

  // Financial Characteristics
  incomeLevel           Int               // in base currency
  incomeStability       Float             // 0-1
  age                   Int?
  region                String            // country/region code
  currency              String            @default("USD")

  // Goals & Situation
  financialGoals        String[]          // array of goal types
  investmentExperience  String            @default("beginner")
  debtLevel             Int               @default(0)
  employmentStatus      String
  familySize            Int               @default(1)
  lifeStage             LifeStage

  // Primary Concerns
  primaryConcern        String?
  timeHorizonYears      Int?

  // System Behavior Flags
  emergencyFundPriority Boolean           @default(true)
  automateInsights      Boolean           @default(true)
  allowPortfolioAdjustments Boolean       @default(false)

  // Personalization Weights
  riskAversionMultiplier    Float         @default(1.0)
  savingsGoalMultiplier     Float         @default(1.0)
  investmentReadinessScore  Float?        // 0-1

  // Behavioral Data
  insightsActionedCount     Int           @default(0)
  insightsIgnoredCount      Int           @default(0)
  engagementScore           Float?        // 0-1

  // Metadata
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  lastAssessmentAt      DateTime?

  // Relationships
  personalizedRules     PersonalizedRule[]
  thresholdOverrides    ThresholdOverride[]

  @@index([personaType])
  @@index([riskTolerance])
  @@index([region])
}

model PersonalizedRule {
  id                String   @id @default(cuid())
  userProfileId     String
  userProfile       UserProfile @relation(fields: [userProfileId], references: [id], onDelete: Cascade)

  ruleId            String        // references PersonalizationRuleEngine rules
  enabled           Boolean       @default(true)
  customPriority    Int?          // override default priority
  customWeight      Float?        // override default weight

  lastApplied       DateTime?
  applicationCount  Int           @default(0)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([userProfileId, ruleId])
  @@index([userProfileId])
}

model ThresholdOverride {
  id                String   @id @default(cuid())
  userProfileId     String
  userProfile       UserProfile @relation(fields: [userProfileId], references: [id], onDelete: Cascade)

  ruleType          String        // e.g., "low_savings_alert", "overspending_alert"
  baseThreshold     Float
  customThreshold   Float        // user's personalized threshold
  reason            String?       // why this was adjusted
  reviewedAt        DateTime?

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([userProfileId, ruleType])
  @@index([userProfileId])
  @@index([ruleType])
}

model ProfileAuditLog {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation("profileAudits", fields: [userId], references: [id], onDelete: Cascade)

  changeType        String   // "profile_created", "profile_updated", "rule_applied", "threshold_adjusted"
  changeData        Json     // what changed
  reason            String?  // why it changed
  
  createdAt         DateTime @default(now())

  @@index([userId])
  @@index([changeType])
}

model User {
  // ... existing fields ...
  
  // Add profile relationship
  profile           UserProfile?
  profileAudits     ProfileAuditLog[] @relation("profileAudits")
}

 */

// ============================================================================
// BACKEND LOGIC: PROFILE-DRIVEN DATABASE QUERIES
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * EXAMPLE 1: Personalized Insight Generation Query
 * 
 * Fetches insights based on user's profile and personalized thresholds
 */
export const generatePersonalizedInsights = async (userId: string) => {
  // Get user profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      thresholdOverrides: true,
      personalizedRules: {
        where: { enabled: true },
      },
    },
  });

  if (!profile) {
    throw new Error(`Profile not found for user ${userId}`);
  }

  // Build personalized thresholds
  const thresholds = buildPersonalizedThresholds(profile);

  // Fetch user's financial data
  const transactions = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 90, // Last 90 days
  });

  // Apply profile-specific rule weights
  const insights = await generateInsightsWithProfile(transactions, profile, thresholds);

  return {
    profile,
    thresholds,
    insights,
    appliedRules: profile.personalizedRules,
  };
};

/**
 * EXAMPLE 2: Student-Specific Emergency Fund Query
 * 
 * For students, fetch different emergency fund recommendation
 */
export const getEmergencyFundStatus = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    },
  });

  const avgMonthlyExpense =
    expenses.reduce((sum, e) => sum + e.amount, 0) / 3;

  // Recommendation depends on persona
  let recommendedMonths = 3; // Default
  let recommendedAmount = avgMonthlyExpense * 3;

  if (profile?.personaType === 'STUDENT') {
    recommendedMonths = 2;
    recommendedAmount = avgMonthlyExpense * 2;
  } else if (profile?.personaType === 'INVESTOR') {
    recommendedMonths = 6;
    recommendedAmount = avgMonthlyExpense * 6;
  }

  return {
    currentExpenses: avgMonthlyExpense,
    recommendedMonths,
    recommendedAmount,
    persona: profile?.personaType,
    urgency: recommendedAmount > 1000 ? 'high' : 'normal',
  };
};

/**
 * EXAMPLE 3: Portfolio Allocation Query
 * 
 * Young professionals get different allocation than investors
 */
export const getPersonalizedPortfolioAllocation = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  let recommendedAllocation = {};

  switch (profile?.personaType) {
    case 'STUDENT':
      recommendedAllocation = {
        cash: 1.0, // 100% cash
      };
      break;

    case 'YOUNG_PROFESSIONAL':
      recommendedAllocation = {
        stocks: 0.6,
        bonds: 0.3,
        cash: 0.1,
      };
      break;

    case 'INVESTOR':
      recommendedAllocation = {
        stocks: 0.4,
        bonds: 0.2,
        real_estate: 0.2,
        crypto: 0.1,
        commodities: 0.08,
        cash: 0.02,
      };
      break;

    case 'EMERGING_MARKET_USER':
      recommendedAllocation = {
        local_currency_savings: 0.7,
        stablecoins: 0.2,
        local_stocks: 0.1,
      };
      break;
  }

  // Apply user's risk tolerance adjustment
  const adjusted = adjustAllocationByRiskTolerance(
    recommendedAllocation,
    profile?.riskTolerance || 'MEDIUM'
  );

  return {
    persona: profile?.personaType,
    riskTolerance: profile?.riskTolerance,
    recommendedAllocation: adjusted,
    investmentReadiness: profile?.investmentExperience !== 'none',
  };
};

/**
 * EXAMPLE 4: Savings Rate Target Query
 * 
 * Different personas have different savings targets
 */
export const getSavingsRateTarget = async (
  userId: string,
  monthlyIncome: number
) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  let baseTarget = 0.25; // Default 25%

  switch (profile?.personaType) {
    case 'STUDENT':
      baseTarget = 0.15; // 15% for students
      break;
    case 'YOUNG_PROFESSIONAL':
      baseTarget = 0.25; // 25% for young professionals
      break;
    case 'INVESTOR':
      baseTarget = 0.5; // 50% for investors
      break;
    case 'EMERGING_MARKET_USER':
      baseTarget = 0.1; // 10% for EM users
      break;
  }

  // Apply user's savings goal multiplier
  const adjustedTarget = baseTarget * (profile?.savingsGoalMultiplier || 1.0);
  const targetAmount = monthlyIncome * adjustedTarget;

  return {
    persona: profile?.personaType,
    baseTarget,
    adjustedTarget,
    targetAmount,
    reason: `Target adjusted based on ${profile?.personaType} persona and your savings goal multiplier of ${profile?.savingsGoalMultiplier || 1.0}x`,
  };
};

/**
 * EXAMPLE 5: Rule Emphasis Query
 * 
 * Some rules are emphasized for certain personas
 */
export const getEmphasizedRules = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    include: {
      personalizedRules: {
        where: { enabled: true },
      },
    },
  });

  // Get rule weights based on persona
  const ruleWeights = getRuleWeightsForPersona(profile?.personaType);

  // Get top 5 rules for this user
  const topRules = Object.entries(ruleWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ruleId, weight]) => ({
      ruleId,
      weight,
      emphasis: weight > 1.0 ? 'high' : weight < 1.0 ? 'low' : 'normal',
    }));

  return {
    persona: profile?.personaType,
    emphasizedRules: topRules,
    deemphasizedRules: topRules.filter((r) => r.weight < 1.0),
  };
};

/**
 * EXAMPLE 6: Behavioral Data Update
 * 
 * Track how user engages with personalized insights
 */
export const recordInsightEngagement = async (
  userId: string,
  insightId: string,
  action: 'actioned' | 'ignored' | 'dismissed'
) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  let updatedData = {};

  if (action === 'actioned') {
    updatedData = {
      insightsActionedCount: (profile?.insightsActionedCount || 0) + 1,
    };
  } else if (action === 'ignored') {
    updatedData = {
      insightsIgnoredCount: (profile?.insightsIgnoredCount || 0) + 1,
    };
  }

  // Calculate engagement score
  const total = (profile?.insightsActionedCount || 0) + (profile?.insightsIgnoredCount || 0) + 1;
  const engagementScore = (profile?.insightsActionedCount || 0) / total;

  await prisma.userProfile.update({
    where: { userId },
    data: {
      ...updatedData,
      engagementScore,
      lastAssessmentAt: new Date(),
    },
  });

  // Log the change
  await prisma.profileAuditLog.create({
    data: {
      userId,
      changeType: 'insight_engagement',
      changeData: { insightId, action },
      reason: `User ${action} insight ${insightId}`,
    },
  });

  return {
    engagementScore,
    actionedCount: (profile?.insightsActionedCount || 0) + (action === 'actioned' ? 1 : 0),
    ignoredCount: (profile?.insightsIgnoredCount || 0) + (action === 'ignored' ? 1 : 0),
  };
};

/**
 * EXAMPLE 7: Persona Re-Assessment Query
 * 
 * Determines if user's persona should be updated based on current behavior
 */
export const assessPersonaChange = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  // Get recent transactions
  const recentExpenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 6 months
      },
    },
  });

  // Get user's recent income
  const recentIncome = await prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Calculate metrics
  const avgMonthlyIncome = recentIncome.length > 0
    ? recentIncome.reduce((sum, i) => sum + i.amount, 0) / 6
    : 0;

  const savingsRate = calculateSavingsRate(recentIncome, recentExpenses);

  // Check if persona should change
  const suggestedPersona = determineBestPersona(
    avgMonthlyIncome,
    savingsRate,
    profile?.age || 25
  );

  return {
    currentPersona: profile?.personaType,
    suggestedPersona,
    shouldUpdate: currentPersona !== suggestedPersona,
    metrics: {
      avgMonthlyIncome,
      savingsRate,
    },
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildPersonalizedThresholds(profile: any): Record<string, number> {
  const baseThresholds = {
    overspendingAlert: 1.2,
    lowSavingsAlert: 0.25,
    goalOffTrackAlert: 0.2,
    portfolioConcentrationAlert: 0.6,
  };

  // Apply overrides
  profile.thresholdOverrides?.forEach((override: any) => {
    baseThresholds[override.ruleType] = override.customThreshold;
  });

  // Apply risk aversion multiplier
  baseThresholds.portfolioConcentrationAlert *= profile.riskAversionMultiplier;

  return baseThresholds;
}

function getRuleWeightsForPersona(
  persona: string | undefined
): Record<string, number> {
  const weights: Record<string, Record<string, number>> = {
    STUDENT: {
      emergency_fund_low: 1.5,
      low_savings_rate: 1.3,
      overspending_in_categories: 1.4,
      income_instability: 1.3,
      portfolio_concentration_risk: 0.5,
      investment_diversity: 0.5,
    },
    YOUNG_PROFESSIONAL: {
      low_savings_rate: 1.2,
      goal_progress_tracking: 1.4,
      portfolio_allocation_mismatch: 1.2,
      housing_cost_high: 1.3,
    },
    INVESTOR: {
      portfolio_concentration_risk: 1.5,
      investment_diversity: 1.5,
      portfolio_allocation_mismatch: 1.3,
      economic_awareness: 1.4,
      emergency_fund_low: 0.5,
    },
    EMERGING_MARKET_USER: {
      emergency_fund_low: 1.4,
      overspending_in_categories: 1.3,
      income_instability: 1.5,
      cashflow_anomalies: 1.2,
      portfolio_concentration_risk: 0.3,
    },
  };

  return weights[persona || 'YOUNG_PROFESSIONAL'] || weights.YOUNG_PROFESSIONAL;
}

function adjustAllocationByRiskTolerance(
  allocation: Record<string, number>,
  riskTolerance: string
): Record<string, number> {
  const riskMultipliers: Record<string, number> = {
    VERY_LOW: 0.5,
    LOW: 0.75,
    MEDIUM: 1.0,
    HIGH: 1.25,
    VERY_HIGH: 1.5,
  };

  const multiplier = riskMultipliers[riskTolerance] || 1.0;

  // Adjust stocks vs bonds based on risk tolerance
  if (allocation.stocks) {
    allocation.stocks *= multiplier;
  }
  if (allocation.bonds) {
    allocation.bonds /= multiplier;
  }

  return allocation;
}

function calculateSavingsRate(
  income: Array<{ amount: number }>,
  expenses: Array<{ amount: number }>
): number {
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
}

function determineBestPersona(
  income: number,
  savingsRate: number,
  age: number
): string {
  if (age < 25 && income < 30000) return 'STUDENT';
  if (income > 150000 && savingsRate > 0.4) return 'INVESTOR';
  if (income < 30000) return 'EMERGING_MARKET_USER';
  return 'YOUNG_PROFESSIONAL';
}

function generateInsightsWithProfile(
  transactions: any[],
  profile: any,
  thresholds: Record<string, number>
): any[] {
  // Implementation would use personalization rules engine
  // to generate insights weighted by profile
  return [];
}
