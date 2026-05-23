/**
 * COMPREHENSIVE USER PERSONAS & PROFILE SYSTEM
 * 
 * Structured user profiles for adaptive backend logic
 * Determines system behavior, thresholds, and recommendations
 */

// ============================================================================
// PERSONA TYPES
// ============================================================================

export enum PersonaType {
  STUDENT = 'STUDENT',
  YOUNG_PROFESSIONAL = 'YOUNG_PROFESSIONAL',
  INVESTOR = 'INVESTOR',
  EMERGING_MARKET_USER = 'EMERGING_MARKET_USER',
}

export type RiskTolerance = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type SpendingBehavior = 'aggressive' | 'moderate' | 'conservative';
export type LifeStage = 'student' | 'early_career' | 'established' | 'pre_retirement' | 'retirement';

// ============================================================================
// USER PROFILE DATABASE SCHEMA
// ============================================================================

/**
 * Database Schema: user_profiles
 * 
 * CREATE TABLE user_profiles (
 *   id UUID PRIMARY KEY,
 *   user_id UUID NOT NULL UNIQUE REFERENCES users(id),
 *   persona_type VARCHAR(50) NOT NULL,
 *   risk_tolerance VARCHAR(20) NOT NULL,
 *   spending_behavior VARCHAR(20) NOT NULL,
 *   income_level_usd INT,
 *   income_stability DECIMAL(2,2),
 *   age INT,
 *   region VARCHAR(50),
 *   currency VARCHAR(3) DEFAULT 'USD',
 *   financial_goals TEXT[] DEFAULT '{}',
 *   investment_experience VARCHAR(20),
 *   debt_level INT DEFAULT 0,
 *   employment_status VARCHAR(20),
 *   family_size INT DEFAULT 1,
 *   primary_concern VARCHAR(100),
 *   time_horizon_years INT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   last_assessment_at TIMESTAMP,
 * 
 *   -- System decision flags
 *   emergency_fund_priority BOOLEAN DEFAULT TRUE,
 *   automate_insights BOOLEAN DEFAULT TRUE,
 *   allow_portfolio_adjustments BOOLEAN DEFAULT FALSE,
 * 
 *   -- Personalization weights
 *   risk_aversion_multiplier DECIMAL(3,2) DEFAULT 1.0,
 *   savings_goal_multiplier DECIMAL(3,2) DEFAULT 1.0,
 *   investment_readiness_score DECIMAL(3,2),
 * 
 *   -- Behavioral data
 *   insights_actioned_count INT DEFAULT 0,
 *   insights_ignored_count INT DEFAULT 0,
 *   engagement_score DECIMAL(3,2),
 * 
 *   INDEX idx_persona_type (persona_type),
 *   INDEX idx_region (region),
 *   INDEX idx_risk_tolerance (risk_tolerance)
 * )
 */

export interface UserProfile {
  id: string;
  userId: string;
  
  // Core Profile
  personaType: PersonaType;
  riskTolerance: RiskTolerance;
  spendingBehavior: SpendingBehavior;
  
  // Financial Characteristics
  incomeLevel: number; // in USD or user's preferred currency
  incomeStability: number; // 0-1, higher = more stable
  age: number;
  region: string; // country/region code
  currency: string; // ISO 4217 code
  
  // Goals & Situation
  financialGoals: string[]; // goal types
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  debtLevel: number; // total debt
  employmentStatus: 'student' | 'employed' | 'self_employed' | 'retired' | 'unemployed';
  familySize: number;
  lifeStage: LifeStage;
  
  // Primary Concerns
  primaryConcern: string;
  timeHorizonYears: number;
  
  // System Behavior Flags
  emergencyFundPriority: boolean;
  automateInsights: boolean;
  allowPortfolioAdjustments: boolean;
  
  // Personalization Weights
  riskAversionMultiplier: number; // 0.5-2.0
  savingsGoalMultiplier: number; // 0.5-2.0
  investmentReadinessScore: number; // 0-1
  
  // Behavioral Data (System Updates)
  insightsActionedCount: number;
  insightsIgnoredCount: number;
  engagementScore: number; // 0-1
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastAssessmentAt?: Date;
}

// ============================================================================
// PERSONA CONFIGURATIONS
// ============================================================================

export interface PersonaConfig {
  name: string;
  description: string;
  incomeLevel: {
    min: number;
    typical: number;
    max: number;
  };
  incomeVariability: 'high' | 'medium' | 'low';
  incomeStability: number;
  riskTolerance: RiskTolerance;
  spendingBehavior: SpendingBehavior;
  
  // System Configuration
  emergencyFundMonths: number; // recommended months of expenses
  savingsRateTarget: number; // percentage of income
  investmentReadiness: boolean;
  
  // Portfolio Defaults
  portfolioFocus: string[];
  defaultAllocation: Record<string, number>;
  
  // Insight Thresholds (overrides)
  thresholds: {
    overspendingAlert: number; // % of category limit
    lowSavingsAlert: number; // % of income
    goalOffTrackAlert: number; // % behind schedule
    portfolioConcentrationAlert: number; // % in single asset
  };
  
  // Budget Categories
  suggestedCategories: string[];
  categoryWeights: Record<string, number>;
  
  // Rules to Emphasize
  priorityRules: string[]; // rule types to emphasize for this persona
  deemphasizedRules?: string[]; // rules to deemphasize
}

export const personaConfigs: Record<PersonaType, PersonaConfig> = {
  [PersonaType.STUDENT]: {
    name: 'Student',
    description: 'Low income, high variability, learning phase',
    incomeLevel: {
      min: 0,
      typical: 8000,
      max: 20000,
    },
    incomeVariability: 'high',
    incomeStability: 0.3,
    riskTolerance: 'low',
    spendingBehavior: 'moderate',
    
    emergencyFundMonths: 2,
    savingsRateTarget: 0.15,
    investmentReadiness: false,
    
    portfolioFocus: ['cash', 'savings_account'],
    defaultAllocation: {
      cash: 1.0,
    },
    
    thresholds: {
      overspendingAlert: 1.2, // 20% over
      lowSavingsAlert: 0.15,
      goalOffTrackAlert: 0.3,
      portfolioConcentrationAlert: 1.0,
    },
    
    suggestedCategories: [
      'tuition',
      'housing',
      'food',
      'transportation',
      'utilities',
      'entertainment',
      'subscriptions',
    ],
    categoryWeights: {
      tuition: 0.3,
      housing: 0.25,
      food: 0.15,
      transportation: 0.1,
      utilities: 0.08,
      entertainment: 0.07,
      subscriptions: 0.05,
    },
    
    priorityRules: [
      'emergency_fund_low',
      'low_savings_rate',
      'overspending_in_categories',
      'income_instability',
    ],
    deemphasizedRules: [
      'portfolio_concentration_risk',
      'investment_diversity',
    ],
  },

  [PersonaType.YOUNG_PROFESSIONAL]: {
    name: 'Young Professional',
    description: 'Stable salary, growth potential, wealth building phase',
    incomeLevel: {
      min: 30000,
      typical: 75000,
      max: 200000,
    },
    incomeVariability: 'medium',
    incomeStability: 0.75,
    riskTolerance: 'medium',
    spendingBehavior: 'moderate',
    
    emergencyFundMonths: 3,
    savingsRateTarget: 0.25,
    investmentReadiness: true,
    
    portfolioFocus: ['stocks', 'bonds', 'retirement'],
    defaultAllocation: {
      stocks: 0.6,
      bonds: 0.3,
      cash: 0.1,
    },
    
    thresholds: {
      overspendingAlert: 1.15, // 15% over
      lowSavingsAlert: 0.25,
      goalOffTrackAlert: 0.2,
      portfolioConcentrationAlert: 0.65,
    },
    
    suggestedCategories: [
      'salary',
      'housing',
      'food',
      'transportation',
      'utilities',
      'insurance',
      'investments',
      'entertainment',
      'subscriptions',
    ],
    categoryWeights: {
      housing: 0.3,
      food: 0.12,
      transportation: 0.1,
      utilities: 0.08,
      insurance: 0.08,
      investments: 0.15,
      entertainment: 0.1,
      subscriptions: 0.07,
    },
    
    priorityRules: [
      'low_savings_rate',
      'goal_progress_tracking',
      'portfolio_allocation_mismatch',
      'housing_cost_high',
    ],
  },

  [PersonaType.INVESTOR]: {
    name: 'Investor',
    description: 'High income, portfolio-heavy, wealth optimization phase',
    incomeLevel: {
      min: 150000,
      typical: 500000,
      max: 10000000,
    },
    incomeVariability: 'low',
    incomeStability: 0.9,
    riskTolerance: 'high',
    spendingBehavior: 'conservative',
    
    emergencyFundMonths: 6,
    savingsRateTarget: 0.5,
    investmentReadiness: true,
    
    portfolioFocus: [
      'stocks',
      'bonds',
      'real_estate',
      'crypto',
      'commodities',
      'dividend_income',
    ],
    defaultAllocation: {
      stocks: 0.4,
      bonds: 0.2,
      real_estate: 0.2,
      crypto: 0.1,
      commodities: 0.08,
      cash: 0.02,
    },
    
    thresholds: {
      overspendingAlert: 1.25, // 25% over (more tolerant)
      lowSavingsAlert: 0.4,
      goalOffTrackAlert: 0.15,
      portfolioConcentrationAlert: 0.6,
    },
    
    suggestedCategories: [
      'dividend_income',
      'capital_gains',
      'real_estate_income',
      'investment_expenses',
      'taxes',
      'lifestyle',
      'philanthropy',
    ],
    categoryWeights: {
      investment_expenses: 0.15,
      taxes: 0.25,
      lifestyle: 0.3,
      philanthropy: 0.1,
      capital_gains: 0.1,
      real_estate_income: 0.1,
    },
    
    priorityRules: [
      'portfolio_concentration_risk',
      'investment_diversity',
      'portfolio_allocation_mismatch',
      'economic_awareness',
    ],
    deemphasizedRules: [
      'emergency_fund_low',
      'low_savings_rate',
    ],
  },

  [PersonaType.EMERGING_MARKET_USER]: {
    name: 'Emerging Market User',
    description: 'Growing economy, currency variability, localized solutions',
    incomeLevel: {
      min: 2000,
      typical: 12000,
      max: 50000,
    },
    incomeVariability: 'high',
    incomeStability: 0.4,
    riskTolerance: 'low',
    spendingBehavior: 'aggressive',
    
    emergencyFundMonths: 1,
    savingsRateTarget: 0.1,
    investmentReadiness: false,
    
    portfolioFocus: ['cash', 'local_assets'],
    defaultAllocation: {
      local_currency_savings: 0.7,
      stablecoins: 0.2,
      local_stocks: 0.1,
    },
    
    thresholds: {
      overspendingAlert: 1.3, // 30% over
      lowSavingsAlert: 0.1,
      goalOffTrackAlert: 0.4,
      portfolioConcentrationAlert: 1.0,
    },
    
    suggestedCategories: [
      'food',
      'housing',
      'transportation',
      'healthcare',
      'education',
      'utilities',
      'entertainment',
    ],
    categoryWeights: {
      food: 0.35,
      housing: 0.25,
      transportation: 0.12,
      healthcare: 0.08,
      education: 0.08,
      utilities: 0.07,
      entertainment: 0.05,
    },
    
    priorityRules: [
      'emergency_fund_low',
      'overspending_in_categories',
      'income_instability',
      'cashflow_anomalies',
    ],
    deemphasizedRules: [
      'portfolio_concentration_risk',
      'investment_diversity',
      'portfolio_allocation_mismatch',
    ],
  },
};

// ============================================================================
// PERSONA-BASED SYSTEM LOGIC
// ============================================================================

/**
 * Get personalized threshold for a rule
 */
export const getPersonalizedThreshold = (
  persona: UserProfile,
  ruleType: string,
  baseThreshold: number
): number => {
  const config = personaConfigs[persona.personaType];
  const thresholds = config.thresholds as Record<string, number>;
  
  // Get persona-specific threshold
  const key = ruleType
    .toLowerCase()
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase();
  
  if (thresholds[key]) {
    // Apply user's risk aversion multiplier
    return thresholds[key] * persona.riskAversionMultiplier;
  }
  
  // Fall back to base threshold
  return baseThreshold;
};

/**
 * Determine if a rule should be emphasized for this user
 */
export const shouldEmphasizeRule = (
  persona: UserProfile,
  ruleType: string
): boolean => {
  const config = personaConfigs[persona.personaType];
  
  if (config.priorityRules.includes(ruleType)) {
    return true;
  }
  
  if (config.deemphasizedRules?.includes(ruleType)) {
    return false;
  }
  
  return true; // neutral
};

/**
 * Get rule weight multiplier based on persona
 */
export const getRuleWeightMultiplier = (
  persona: UserProfile,
  ruleType: string
): number => {
  const config = personaConfigs[persona.personaType];
  
  if (config.priorityRules.includes(ruleType)) {
    return 1.5; // Emphasize
  }
  
  if (config.deemphasizedRules?.includes(ruleType)) {
    return 0.5; // Deemphasize
  }
  
  return 1.0; // Normal weight
};

/**
 * Get recommended emergency fund target
 */
export const getEmergencyFundTarget = (
  persona: UserProfile,
  monthlyExpenses: number
): number => {
  const config = personaConfigs[persona.personaType];
  return monthlyExpenses * config.emergencyFundMonths;
};

/**
 * Get recommended monthly savings target
 */
export const getMonthlysSavingsTarget = (
  persona: UserProfile,
  monthlyIncome: number
): number => {
  const config = personaConfigs[persona.personaType];
  return monthlyIncome * config.savingsRateTarget * persona.savingsGoalMultiplier;
};

/**
 * Determine if user is ready for investments
 */
export const isUserReadyForInvestments = (
  persona: UserProfile,
  emergencyFundAmount: number,
  monthlyExpenses: number
): boolean => {
  // User must have adequate emergency fund
  const config = personaConfigs[persona.personaType];
  const requiredEmergencyFund = monthlyExpenses * config.emergencyFundMonths;
  
  if (emergencyFundAmount < requiredEmergencyFund) {
    return false;
  }
  
  // Investment readiness based on persona
  if (!config.investmentReadiness) {
    return false;
  }
  
  // User's individual investment readiness score
  if (persona.investmentReadinessScore < 0.5) {
    return false;
  }
  
  return true;
};

/**
 * Get recommended portfolio allocation for user
 */
export const getRecommendedAllocation = (
  persona: UserProfile
): Record<string, number> => {
  const config = personaConfigs[persona.personaType];
  const baseAllocation = { ...config.defaultAllocation };
  
  // Adjust based on risk tolerance override
  const riskMultiplier = getRiskToleranceMultiplier(persona.riskTolerance);
  
  if (riskMultiplier < 1.0) {
    // User more risk-averse than persona default
    // Shift from stocks to bonds
    baseAllocation.stocks = (baseAllocation.stocks || 0) * riskMultiplier;
    baseAllocation.bonds = (baseAllocation.bonds || 0) / riskMultiplier;
  } else if (riskMultiplier > 1.0) {
    // User more risk-tolerant
    // Shift from bonds to stocks
    baseAllocation.bonds = (baseAllocation.bonds || 0) / riskMultiplier;
    baseAllocation.stocks = (baseAllocation.stocks || 0) * riskMultiplier;
  }
  
  return baseAllocation;
};

/**
 * Helper: Get numeric multiplier for risk tolerance
 */
const getRiskToleranceMultiplier = (riskTolerance: RiskTolerance): number => {
  const multipliers: Record<RiskTolerance, number> = {
    very_low: 0.5,
    low: 0.75,
    medium: 1.0,
    high: 1.25,
    very_high: 1.5,
  };
  return multipliers[riskTolerance];
};

/**
 * Get persona configuration by type
 */
export const getPersonaConfig = (
  persona: PersonaType
): PersonaConfig => {
  return personaConfigs[persona];
};

/**
 * Get all available personas
 */
export const getAllPersonas = (): Array<{
  type: PersonaType;
  config: PersonaConfig;
}> => {
  return Object.values(PersonaType).map((type) => ({
    type,
    config: personaConfigs[type],
  }));
};

/**
 * Suggest a persona based on user characteristics
 */
export const suggestPersona = (
  annualIncome: number,
  age: number,
  employmentStatus: string,
  investmentExperience: string,
  region: string
): PersonaType => {
  // Student
  if (employmentStatus === 'student' || (age < 25 && annualIncome < 30000)) {
    return PersonaType.STUDENT;
  }
  
  // Investor
  if (
    annualIncome > 150000 &&
    investmentExperience !== 'none'
  ) {
    return PersonaType.INVESTOR;
  }
  
  // Emerging Market User
  if (annualIncome < 30000 && region.startsWith('EM')) {
    return PersonaType.EMERGING_MARKET_USER;
  }
  
  // Default: Young Professional
  return PersonaType.YOUNG_PROFESSIONAL;
};
