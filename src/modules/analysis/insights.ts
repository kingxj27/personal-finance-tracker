/**
 * Intelligent Financial Operating System (IFOS) - Insight Engine
 * Rule-based system that analyzes financial data and generates actionable insights
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type InsightSeverity = 'low' | 'medium' | 'high';
export type InsightCategory =
  | 'spending'
  | 'saving'
  | 'investing'
  | 'risk'
  | 'goals'
  | 'income'
  | 'planning';

export interface Transaction {
  amount: number;
  category: string;
  date: Date;
  type: 'income' | 'expense';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
}

export interface UserProfile {
  type: 'STUDENT' | 'YOUNG_PROFESSIONAL' | 'INVESTOR';
  riskTolerance: 'low' | 'medium' | 'high';
  incomeStability: number; // 0-1
}

export interface FinancialData {
  transactions: Transaction[];
  monthlyIncome: number;
  totalExpenses: number;
  categoryBreakdown: Record<string, number>;
  savingsRate: number; // 0-1
  portfolioAllocation: Record<string, number>; // asset_class: percentage
  goals: Goal[];
  userProfile: UserProfile;
  emergencyFundAmount?: number;
}

export interface Insight {
  id: string;
  type: string;
  message: string;
  severity: InsightSeverity;
  category: InsightCategory;
  action: string;
  priority: number; // Higher = more important
  metrics?: Record<string, number | string>;
}

// ============================================================================
// FINANCIAL RULES ENGINE
// ============================================================================

export class InsightEngine {
  private insights: Insight[] = [];

  /**
   * Analyze financial data and generate insights
   */
  public analyze(data: FinancialData): Insight[] {
    this.insights = [];

    // Run all rules against the data
    this.checkOverspendingInCategories(data);
    this.checkLowSavingsRate(data);
    this.checkCategoryImbalance(data);
    this.checkPortfolioConcentrationRisk(data);
    this.checkGoalProgress(data);
    this.checkIncomeInstability(data);
    this.checkEmergencyFund(data);
    this.checkHousingCostRatio(data);
    this.checkHighestExpenseCategory(data);
    this.checkPortfolioAssetAllocationMatch(data);
    this.checkInvestmentDiversity(data);
    this.checkSavingsGoalTracking(data);

    // Deduplicate similar insights
    const deduplicated = this.deduplicateInsights(this.insights);

    // Prioritize and sort
    return this.prioritizeInsights(deduplicated);
  }

  // ========================================================================
  // RULE 1: OVERSPENDING IN CATEGORIES
  // ========================================================================
  private checkOverspendingInCategories(data: FinancialData): void {
    const thresholds: Record<string, number> = {
      food: 0.3, // 30% of income
      entertainment: 0.15, // 15% of income
      utilities: 0.15,
      transportation: 0.2,
      shopping: 0.15,
    };

    Object.entries(data.categoryBreakdown).forEach(([category, amount]) => {
      const threshold = thresholds[category];
      if (threshold) {
        const percentageOfIncome = amount / data.monthlyIncome;
        if (percentageOfIncome > threshold) {
          const exceededBy = amount - data.monthlyIncome * threshold;
          this.insights.push({
            id: `overspend-${category}`,
            type: 'overspending',
            message: `You spent ₦${amount.toLocaleString()} (${(percentageOfIncome * 100).toFixed(1)}%) on ${category} this month, exceeding the recommended ${(threshold * 100).toFixed(0)}%.`,
            severity: percentageOfIncome > threshold * 1.5 ? 'high' : 'medium',
            category: 'spending',
            action: `Reduce ${category} spending by ₦${exceededBy.toLocaleString()} to stay within budget.`,
            priority: 8,
            metrics: { amount, percentageOfIncome, threshold },
          });
        }
      }
    });
  }

  // ========================================================================
  // RULE 2: LOW SAVINGS RATE
  // ========================================================================
  private checkLowSavingsRate(data: FinancialData): void {
    const minimumSavingsRate = 0.2; // 20%

    if (data.savingsRate < minimumSavingsRate) {
      const deficit = minimumSavingsRate - data.savingsRate;
      const amountNeeded = data.monthlyIncome * deficit;

      this.insights.push({
        id: 'low-savings-rate',
        type: 'low_savings',
        message: `Your savings rate is ${(data.savingsRate * 100).toFixed(1)}%, which is below the recommended 20%. You need to save ₦${amountNeeded.toLocaleString()} more monthly.`,
        severity: data.savingsRate < 0.1 ? 'high' : 'medium',
        category: 'saving',
        action: `Increase monthly savings to ₦${(data.monthlyIncome * minimumSavingsRate).toLocaleString()}.`,
        priority: 9,
        metrics: { currentRate: data.savingsRate, target: minimumSavingsRate },
      });
    }
  }

  // ========================================================================
  // RULE 3: CATEGORY IMBALANCE
  // ========================================================================
  private checkCategoryImbalance(data: FinancialData): void {
    const totalExpenses = data.totalExpenses;

    Object.entries(data.categoryBreakdown).forEach(([category, amount]) => {
      const percentage = amount / totalExpenses;

      if (percentage > 0.4) {
        this.insights.push({
          id: `imbalance-${category}`,
          type: 'category_imbalance',
          message: `${category} represents ${(percentage * 100).toFixed(1)}% of your total expenses. Consider diversifying your spending.`,
          severity: percentage > 0.6 ? 'high' : 'medium',
          category: 'spending',
          action: `Reduce ${category} to below 40% of total expenses (currently ${(percentage * 100).toFixed(1)}%).`,
          priority: 7,
          metrics: { category, percentage },
        });
      }
    });
  }

  // ========================================================================
  // RULE 4: PORTFOLIO CONCENTRATION RISK
  // ========================================================================
  private checkPortfolioConcentrationRisk(data: FinancialData): void {
    const maxAllocationPerAsset = 0.6; // 60%

    Object.entries(data.portfolioAllocation).forEach(([asset, percentage]) => {
      if (percentage > maxAllocationPerAsset) {
        const severity = percentage > 0.8 ? 'high' : 'medium';
        const recommendedPercentage = maxAllocationPerAsset;

        this.insights.push({
          id: `concentration-${asset}`,
          type: 'concentration_risk',
          message: `Your portfolio is ${(percentage * 100).toFixed(1)}% concentrated in ${asset}. High concentration increases risk.`,
          severity,
          category: 'risk',
          action: `Reduce ${asset} allocation to ${(recommendedPercentage * 100).toFixed(0)}% and diversify into other assets.`,
          priority: severity === 'high' ? 10 : 8,
          metrics: { asset, currentAllocation: percentage, recommended: recommendedPercentage },
        });
      }
    });
  }

  // ========================================================================
  // RULE 5: GOAL PROGRESS TRACKING
  // ========================================================================
  private checkGoalProgress(data: FinancialData): void {
    const now = new Date();

    data.goals.forEach((goal) => {
      const remainingTime = goal.deadline.getTime() - now.getTime();
      const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      const remainingAmount = goal.targetAmount - goal.currentAmount;

      if (remainingAmount <= 0) {
        this.insights.push({
          id: `goal-achieved-${goal.id}`,
          type: 'goal_achieved',
          message: `Congratulations! You've achieved your ${goal.name} goal.`,
          severity: 'low',
          category: 'goals',
          action: `Consider setting a new goal or adjusting your target.`,
          priority: 2,
          metrics: { goal: goal.name },
        });
        return;
      }

      // Check if on track
      const progressPercentage = goal.currentAmount / goal.targetAmount;
      const timeRemainingPercentage = Math.max(
        0,
        remainingDays / (365 * 2)
      );

      if (progressPercentage < timeRemainingPercentage * 0.8) {
        const monthlyNeeded = (remainingAmount / remainingDays) * 30;

        this.insights.push({
          id: `goal-offtrack-${goal.id}`,
          type: 'goal_off_track',
          message: `You're off track for your "${goal.name}" goal. You need ₦${monthlyNeeded.toLocaleString()} monthly to reach ₦${goal.targetAmount.toLocaleString()} by ${goal.deadline.toLocaleDateString()}.`,
          severity: 'high',
          category: 'goals',
          action: `Increase monthly savings for this goal to ₦${monthlyNeeded.toLocaleString()}.`,
          priority: 9,
          metrics: { goal: goal.name, monthlyNeeded, deadline: goal.deadline.toISOString() },
        });
      }
    });
  }

  // ========================================================================
  // RULE 6: INCOME INSTABILITY
  // ========================================================================
  private checkIncomeInstability(data: FinancialData): void {
    if (data.userProfile.incomeStability < 0.5) {
      const recommendedEmergencyFund = data.monthlyIncome * 6; // 6 months

      this.insights.push({
        id: 'income-instability',
        type: 'income_instability',
        message: `Your income is unstable (stability: ${(data.userProfile.incomeStability * 100).toFixed(0)}%). Build a larger emergency fund to weather income fluctuations.`,
        severity: 'high',
        category: 'income',
        action: `Build an emergency fund of ₦${recommendedEmergencyFund.toLocaleString()} (6 months of income).`,
        priority: 10,
        metrics: { incomeStability: data.userProfile.incomeStability },
      });
    }
  }

  // ========================================================================
  // RULE 7: EMERGENCY FUND
  // ========================================================================
  private checkEmergencyFund(data: FinancialData): void {
    const requiredEmergencyFund = data.monthlyIncome * 3; // 3 months minimum
    const currentFund = data.emergencyFundAmount || 0;

    if (currentFund < requiredEmergencyFund) {
      const shortfall = requiredEmergencyFund - currentFund;

      this.insights.push({
        id: 'emergency-fund-low',
        type: 'emergency_fund',
        message: `Your emergency fund is ₦${currentFund.toLocaleString()}, below the recommended ₦${requiredEmergencyFund.toLocaleString()} (3 months of expenses).`,
        severity: currentFund < data.monthlyIncome ? 'high' : 'medium',
        category: 'saving',
        action: `Build your emergency fund to ₦${requiredEmergencyFund.toLocaleString()} by saving ₦${shortfall.toLocaleString()} more.`,
        priority: 9,
        metrics: { current: currentFund, required: requiredEmergencyFund },
      });
    }
  }

  // ========================================================================
  // RULE 8: HOUSING COST RATIO
  // ========================================================================
  private checkHousingCostRatio(data: FinancialData): void {
    const housingCost = data.categoryBreakdown['housing'] || 0;
    const housingRatio = housingCost / data.monthlyIncome;
    const maxRatio = 0.3; // 30%

    if (housingRatio > maxRatio) {
      this.insights.push({
        id: 'housing-cost-high',
        type: 'housing_expensive',
        message: `Your housing costs are ${(housingRatio * 100).toFixed(1)}% of your income, exceeding the recommended 30%.`,
        severity: housingRatio > 0.5 ? 'high' : 'medium',
        category: 'spending',
        action: `Consider finding more affordable housing or increasing income to reduce this ratio.`,
        priority: 8,
        metrics: { currentRatio: housingRatio, recommended: maxRatio },
      });
    }
  }

  // ========================================================================
  // RULE 9: HIGHEST EXPENSE CATEGORY ALERT
  // ========================================================================
  private checkHighestExpenseCategory(data: FinancialData): void {
    let highestCategory = '';
    let highestAmount = 0;

    Object.entries(data.categoryBreakdown).forEach(([category, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestCategory = category;
      }
    });

    if (highestAmount > 0) {
      const percentage = (highestAmount / data.totalExpenses) * 100;

      if (percentage > 30) {
        this.insights.push({
          id: 'top-category-alert',
          type: 'spending_trend',
          message: `Your largest expense is ${highestCategory} at ₦${highestAmount.toLocaleString()} (${percentage.toFixed(1)}% of expenses).`,
          severity: 'low',
          category: 'spending',
          action: `Review ${highestCategory} spending to identify optimization opportunities.`,
          priority: 5,
          metrics: { category: highestCategory, amount: highestAmount },
        });
      }
    }
  }

  // ========================================================================
  // RULE 10: PORTFOLIO ALLOCATION MISMATCH WITH RISK TOLERANCE
  // ========================================================================
  private checkPortfolioAssetAllocationMatch(data: FinancialData): void {
    const stocksAllocation = data.portfolioAllocation['stocks'] || 0;

    const recommendedAllocation: Record<string, number> = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
    };

    const recommended = recommendedAllocation[data.userProfile.riskTolerance];

    if (data.portfolioAllocation['stocks'] > 0) {
      const difference = Math.abs(stocksAllocation - recommended);

      if (difference > 0.15) {
        this.insights.push({
          id: 'allocation-mismatch',
          type: 'allocation_mismatch',
          message: `Your stock allocation (${(stocksAllocation * 100).toFixed(1)}%) doesn't match your ${data.userProfile.riskTolerance} risk tolerance (recommended: ${(recommended * 100).toFixed(0)}%).`,
          severity: 'medium',
          category: 'investing',
          action: `Rebalance your portfolio: Adjust stocks to ${(recommended * 100).toFixed(0)}% allocation.`,
          priority: 7,
          metrics: { current: stocksAllocation, recommended },
        });
      }
    }
  }

  // ========================================================================
  // RULE 11: INVESTMENT DIVERSITY
  // ========================================================================
  private checkInvestmentDiversity(data: FinancialData): void {
    const assetCount = Object.keys(data.portfolioAllocation).length;
    const minAssetTypes = 3;

    if (assetCount < minAssetTypes) {
      this.insights.push({
        id: 'low-diversity',
        type: 'low_diversity',
        message: `Your portfolio has only ${assetCount} asset types. Diversify into at least ${minAssetTypes} different asset classes.`,
        severity: 'medium',
        category: 'risk',
        action: `Consider adding exposure to bonds, commodities, or real estate to diversify risk.`,
        priority: 6,
        metrics: { currentTypes: assetCount, recommended: minAssetTypes },
      });
    }
  }

  // ========================================================================
  // RULE 12: SAVINGS GOAL TRACKING FOR STUDENTS/YOUNG PROFESSIONALS
  // ========================================================================
  private checkSavingsGoalTracking(data: FinancialData): void {
    if (
      data.userProfile.type === 'STUDENT' ||
      data.userProfile.type === 'YOUNG_PROFESSIONAL'
    ) {
      const targetSavingsRate = 0.25; // 25%

      if (data.savingsRate < targetSavingsRate && data.savingsRate > 0) {
        this.insights.push({
          id: 'savings-goal-low',
          type: 'savings_goal',
          message: `As a ${data.userProfile.type.replace(/_/g, ' ')}, aim for a 25% savings rate to build wealth faster.`,
          severity: 'medium',
          category: 'saving',
          action: `Increase savings by ₦${(data.monthlyIncome * (targetSavingsRate - data.savingsRate)).toLocaleString()} monthly.`,
          priority: 7,
          metrics: { currentRate: data.savingsRate, target: targetSavingsRate },
        });
      }
    }
  }

  // ========================================================================
  // DEDUPLICATION LOGIC
  // ========================================================================
  private deduplicateInsights(insights: Insight[]): Insight[] {
    const seen = new Map<string, Insight>();

    insights.forEach((insight) => {
      const key = `${insight.type}-${insight.category}`;

      if (!seen.has(key) || seen.get(key)!.severity === 'low') {
        seen.set(key, insight);
      }
    });

    return Array.from(seen.values());
  }

  // ========================================================================
  // PRIORITIZATION LOGIC
  // ========================================================================
  private prioritizeInsights(insights: Insight[]): Insight[] {
    const severityWeight: Record<InsightSeverity, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const categoryWeight: Record<InsightCategory, number> = {
      risk: 3,
      income: 3,
      goals: 2,
      saving: 2,
      spending: 1,
      investing: 1,
      planning: 1,
    };

    return insights.sort((a, b) => {
      const scoreA =
        a.priority * 10 +
        severityWeight[a.severity] * 5 +
        (categoryWeight[a.category] || 0);
      const scoreB =
        b.priority * 10 +
        severityWeight[b.severity] * 5 +
        (categoryWeight[b.category] || 0);

      return scoreB - scoreA;
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const createInsightEngine = (): InsightEngine => {
  return new InsightEngine();
};
