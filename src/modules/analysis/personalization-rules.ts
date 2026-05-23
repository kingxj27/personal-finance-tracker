/**
 * PERSONALIZATION RULES ENGINE
 * 
 * Demonstrates how user profiles affect system decisions
 * Rules are applied differently based on persona, risk tolerance, and behavioral data
 */

import { UserProfile, PersonaType, getPersonalizedThreshold, getRuleWeightMultiplier } from '../personas';

// ============================================================================
// PERSONALIZATION RULE TYPES
// ============================================================================

export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  
  // Application context
  appliesToPersonas: PersonaType[];
  appliesToRiskLevels?: string[];
  
  // Rule logic
  condition: (data: PersonalizationContext) => boolean;
  action: (data: PersonalizationContext) => PersonalizationAction;
  
  // Meta
  priority: number;
  enabled: boolean;
}

export interface PersonalizationContext {
  profile: UserProfile;
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFundBalance: number;
  portfolioValue: number;
  savingsRate: number;
  investments: Record<string, number>;
  goals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    dueDate: Date;
  }>;
}

export interface PersonalizationAction {
  type: 'adjust_threshold' | 'skip_rule' | 'emphasize' | 'modify_suggestion' | 'alert_variant';
  target: string;
  value: any;
  explanation: string;
}

// ============================================================================
// RULE IMPLEMENTATIONS
// ============================================================================

/**
 * RULE 1: STUDENT DEBT AWARENESS
 * Students often have education debt, not just credit debt
 * System should track and prioritize debt repayment over investments
 */
export const studentDebtAwarenessRule: PersonalizationRule = {
  id: 'student_debt_awareness',
  name: 'Student Debt Awareness',
  description: 'Prioritize debt repayment over investments for students',
  appliesToPersonas: [PersonaType.STUDENT],
  priority: 100,
  enabled: true,
  
  condition: (data) => {
    // Applies when student has debt
    return data.profile.debtLevel > 0;
  },
  
  action: (data) => ({
    type: 'adjust_threshold',
    target: 'investment_readiness_score',
    value: Math.max(0, data.profile.investmentReadinessScore - 0.3),
    explanation: `As a student with $${data.profile.debtLevel.toLocaleString()} debt, focus on debt repayment before investing. Consider debt-to-income ratio before allocating to stocks.`,
  }),
};

/**
 * RULE 2: EMERGING MARKET CURRENCY VOLATILITY
 * Emerging market users experience high currency variability
 * System should recommend stablecoins and reduce portfolio concentration
 */
export const emergingMarketCurrencyRule: PersonalizationRule = {
  id: 'em_currency_volatility',
  name: 'Emerging Market Currency Volatility',
  description: 'Recommend stablecoins and currency hedging for EM users',
  appliesToPersonas: [PersonaType.EMERGING_MARKET_USER],
  priority: 95,
  enabled: true,
  
  condition: (data) => {
    // Applies to EM users in volatile currency regions
    return data.profile.region.startsWith('EM_');
  },
  
  action: (data) => ({
    type: 'modify_suggestion',
    target: 'portfolio_allocation',
    value: {
      stablecoins: 0.2,
      localCurrencySavings: 0.7,
      localStocks: 0.1,
    },
    explanation: `Given currency volatility in ${data.profile.region}, allocate 20% to stablecoins (USDC/USDT) to protect purchasing power. Keep 70% in local savings for accessibility.`,
  }),
};

/**
 * RULE 3: INVESTOR TAX EFFICIENCY
 * Investors have significant capital gains; system should track and optimize tax efficiency
 * Apply capital gains harvesting recommendations
 */
export const investorTaxEfficiencyRule: PersonalizationRule = {
  id: 'investor_tax_efficiency',
  name: 'Investor Tax Efficiency',
  description: 'Recommend tax-loss harvesting and capital gains strategies',
  appliesToPersonas: [PersonaType.INVESTOR],
  priority: 90,
  enabled: true,
  
  condition: (data) => {
    // Applies when investor has significant portfolio
    return data.portfolioValue > 100000;
  },
  
  action: (data) => ({
    type: 'emphasize',
    target: 'tax_optimization_insights',
    value: {
      priority: 'high',
      frequency: 'monthly',
      recommendation: 'tax_loss_harvesting',
    },
    explanation: `With a $${data.portfolioValue.toLocaleString()} portfolio, implement quarterly tax-loss harvesting to offset capital gains. Review realized gains monthly and consider timing sales strategically.`,
  }),
};

/**
 * RULE 4: YOUNG PROFESSIONAL GOAL TRACKING
 * Young professionals are in wealth-building phase; system should emphasize goal tracking
 * Make goal progress highly visible
 */
export const youngProfessionalGoalTrackingRule: PersonalizationRule = {
  id: 'yp_goal_tracking',
  name: 'Young Professional Goal Tracking',
  description: 'Emphasize milestone progress and goal achievements',
  appliesToPersonas: [PersonaType.YOUNG_PROFESSIONAL],
  priority: 85,
  enabled: true,
  
  condition: (data) => {
    // Applies when user has defined goals
    return data.goals.length > 0;
  },
  
  action: (data) => ({
    type: 'emphasize',
    target: 'goal_progress_dashboard',
    value: {
      displayFrequency: 'daily',
      notificationOnMilestone: true,
      celebrateAchievements: true,
    },
    explanation: `You have ${data.goals.length} goals. System will track daily progress and celebrate milestones. Currently on track for: ${data.goals
      .filter((g) => {
        const daysLeft = (g.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        const percentComplete = (g.currentAmount / g.targetAmount) * 100;
        const expectedCompletion = (percentComplete / (100 - daysLeft / 365)) * 100;
        return expectedCompletion >= 80;
      })
      .map((g) => g.name)
      .join(', ')}`,
  }),
};

/**
 * RULE 5: STUDENT LOW EMERGENCY FUND ALERT
 * Students have very low emergency fund recommendations (1-2 months)
 * Alert severity is higher because they're more vulnerable
 */
export const studentEmergencyFundAlertRule: PersonalizationRule = {
  id: 'student_emergency_alert',
  name: 'Student Emergency Fund Alert',
  description: 'Adjust emergency fund alert thresholds for students',
  appliesToPersonas: [PersonaType.STUDENT],
  priority: 100,
  enabled: true,
  
  condition: (data) => {
    const monthlyExpenses = data.monthlyExpenses;
    const minimumRequired = monthlyExpenses * 2; // 2 months for students
    return data.emergencyFundBalance < minimumRequired;
  },
  
  action: (data) => ({
    type: 'alert_variant',
    target: 'emergency_fund_alert',
    value: {
      severity: 'critical',
      message: `Your emergency fund covers only ${Math.round((data.emergencyFundBalance / data.monthlyExpenses) * 10) / 10} months of expenses. For students, aim for 2+ months. Build by: setting aside $${Math.round(data.monthlyIncome * 0.15)} monthly.`,
      suggestedAction: 'Setup automatic $50-100 weekly transfers to emergency fund',
    },
    explanation: `As a student with variable income, an emergency fund is crucial. Even 2 months of expenses provides critical protection against income disruption.`,
  }),
};

/**
 * RULE 6: INVESTOR PORTFOLIO CONCENTRATION THRESHOLDS
 * Investors should maintain more diversification than young professionals
 * Adjust concentration alert to be more sensitive
 */
export const investorDiversificationRule: PersonalizationRule = {
  id: 'investor_diversification',
  name: 'Investor Diversification Requirement',
  description: 'Require higher portfolio diversification for investors',
  appliesToPersonas: [PersonaType.INVESTOR],
  priority: 85,
  enabled: true,
  
  condition: (data) => {
    // Find most concentrated asset
    const maxAsset = Math.max(...Object.values(data.investments));
    return maxAsset > 0.3; // Single asset > 30%
  },
  
  action: (data) => ({
    type: 'adjust_threshold',
    target: 'portfolio_concentration_alert',
    value: 0.35, // Alert if any single asset > 35%
    explanation: `Your largest position represents ${Math.round(Math.max(...Object.values(data.investments)) * 100)}% of portfolio. For investors, recommended max is 30-35%. Consider rebalancing.`,
  }),
};

/**
 * RULE 7: EMERGING MARKET CASH PREFERENCE
 * EM users have limited investment options; system should not push investments
 * Emphasize savings rate over investment rate
 */
export const emergingMarketCashPreferenceRule: PersonalizationRule = {
  id: 'em_cash_preference',
  name: 'Emerging Market Cash Preference',
  description: 'Emphasize cash savings over investments for EM users',
  appliesToPersonas: [PersonaType.EMERGING_MARKET_USER],
  priority: 100,
  enabled: true,
  
  condition: (data) => {
    // Always applies to EM users
    return true;
  },
  
  action: (data) => ({
    type: 'skip_rule',
    target: 'portfolio_allocation_mismatch_rule',
    value: true,
    explanation: `For emerging market users with limited investment options, your primary goal is building cash reserves. System will not flag portfolio allocation mismatches. Focus on ${data.profile.currency} savings.`,
  }),
};

/**
 * RULE 8: YOUNG PROFESSIONAL HOUSING COST OPTIMIZATION
 * Young professionals often have highest category spend (30-40% on housing)
 * System should help optimize this critical expense
 */
export const youngProfessionalHousingOptimizationRule: PersonalizationRule = {
  id: 'yp_housing_optimization',
  name: 'Young Professional Housing Optimization',
  description: 'Focus on optimizing housing costs for debt reduction',
  appliesToPersonas: [PersonaType.YOUNG_PROFESSIONAL],
  priority: 80,
  enabled: true,
  
  condition: (data) => {
    // Calculate housing as % of income
    const housingSpend = data.monthlyExpenses * 0.3; // Estimated 30% on housing
    return (housingSpend / data.monthlyIncome) > 0.3; // More than 30% of income
  },
  
  action: (data) => ({
    type: 'modify_suggestion',
    target: 'housing_expense_optimization',
    value: {
      currentRatio: Math.round((data.monthlyExpenses * 0.3 / data.monthlyIncome) * 100),
      recommendedRatio: 28,
      potentialSavings: Math.round(((data.monthlyExpenses * 0.3) - (data.monthlyIncome * 0.28)) * 12),
    },
    explanation: `Your housing costs are ${Math.round((data.monthlyExpenses * 0.3 / data.monthlyIncome) * 100)}% of income. Optimal is ≤28%. Options: negotiate lease, find roommate, relocate. Potential annual savings: $${Math.round(((data.monthlyExpenses * 0.3) - (data.monthlyIncome * 0.28)) * 12).toLocaleString()}.`,
  }),
};

/**
 * RULE 9: INVESTOR DIVIDEND INCOME TRACKING
 * Investors should have visibility into passive income generation
 * System should track and optimize dividend strategies
 */
export const investorDividendTrackingRule: PersonalizationRule = {
  id: 'investor_dividend_tracking',
  name: 'Investor Dividend Income Tracking',
  description: 'Track and optimize dividend income strategies',
  appliesToPersonas: [PersonaType.INVESTOR],
  priority: 75,
  enabled: true,
  
  condition: (data) => {
    // Applies to investors with dividend-paying assets
    return data.investments['dividend_stocks'] > 0;
  },
  
  action: (data) => ({
    type: 'modify_suggestion',
    target: 'dividend_income_dashboard',
    value: {
      trackingEnabled: true,
      frequency: 'daily',
      reinvestmentStrategy: 'DRIP',
    },
    explanation: `You have ${Math.round(data.investments['dividend_stocks'] * 100)}% in dividend stocks. System will track quarterly distributions and recommend automatic DRIP (reinvestment) to compound growth.`,
  }),
};

/**
 * RULE 10: STUDENT INCOME INSTABILITY COMPENSATION
 * Students have high income variability; system should adapt recommendations accordingly
 * Reduce savings rate targets during low-income months
 */
export const studentIncomeInstabilityRule: PersonalizationRule = {
  id: 'student_income_instability',
  name: 'Student Income Instability Compensation',
  description: 'Adjust savings targets based on seasonal income variation',
  appliesToPersonas: [PersonaType.STUDENT],
  priority: 95,
  enabled: true,
  
  condition: (data) => {
    // Applies when income stability is low
    return data.profile.incomeStability < 0.5;
  },
  
  action: (data) => ({
    type: 'modify_suggestion',
    target: 'savings_rate_targets',
    value: {
      baselineTarget: 0.15,
      dynamicAdjustment: true,
      lowIncomeMonthTarget: 0.05, // Only 5% during low months
      highIncomeMonthTarget: 0.25, // 25% during summer/high months
    },
    explanation: `Your income varies ±${Math.round(data.profile.incomeStability * 100)}%. System will adjust savings targets monthly. During high-income months (average +25%), save extra. During low months, even 5% helps.`,
  }),
};

// ============================================================================
// PERSONALIZATION RULE ENGINE
// ============================================================================

export class PersonalizationRuleEngine {
  private rules: PersonalizationRule[];

  constructor(rules: PersonalizationRule[] = DEFAULT_RULES) {
    this.rules = rules;
  }

  /**
   * Apply all applicable personalization rules
   */
  applyRules(context: PersonalizationContext): PersonalizationAction[] {
    return this.rules
      .filter((rule) => this.isRuleApplicable(rule, context))
      .filter((rule) => rule.condition(context))
      .sort((a, b) => b.priority - a.priority)
      .map((rule) => rule.action(context));
  }

  /**
   * Check if a rule applies to the user's profile
   */
  private isRuleApplicable(
    rule: PersonalizationRule,
    context: PersonalizationContext
  ): boolean {
    if (!rule.enabled) {
      return false;
    }

    // Check persona match
    if (!rule.appliesToPersonas.includes(context.profile.personaType)) {
      return false;
    }

    // Check risk tolerance match (if specified)
    if (
      rule.appliesToRiskLevels &&
      !rule.appliesToRiskLevels.includes(context.profile.riskTolerance)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get explanation of why a rule applied
   */
  getExplanation(action: PersonalizationAction): string {
    return action.explanation;
  }

  /**
   * Add custom rule
   */
  addRule(rule: PersonalizationRule): void {
    this.rules.push(rule);
    // Re-sort by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Enable/disable rule by ID
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }
}

// ============================================================================
// DEFAULT RULES
// ============================================================================

export const DEFAULT_RULES: PersonalizationRule[] = [
  studentDebtAwarenessRule,
  emergingMarketCurrencyRule,
  investorTaxEfficiencyRule,
  youngProfessionalGoalTrackingRule,
  studentEmergencyFundAlertRule,
  investorDiversificationRule,
  emergingMarketCashPreferenceRule,
  youngProfessionalHousingOptimizationRule,
  investorDividendTrackingRule,
  studentIncomeInstabilityRule,
];
