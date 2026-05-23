import {
  type FinancialData,
  type Insight,
  type InsightSeverity,
  type InsightCategory,
} from './insights';

// ============================================================================
// PORTFOLIO ALLOCATION ENGINE
// ============================================================================

export interface PortfolioHolding {
  id: string;
  assetClass: string;
  value: number;
  ticker?: string;
  quantity?: number;
}

export interface AllocationTarget {
  assetClass: string;
  targetPercentage: number; // 0-1
  minPercentage?: number; // optional lower band
  maxPercentage?: number; // optional upper band
}

export interface PortfolioAllocationInput {
  holdings: PortfolioHolding[];
  targets: AllocationTarget[];
  cashAvailable?: number;
}

export interface AllocationPosition {
  assetClass: string;
  currentValue: number;
  currentPercentage: number;
  targetPercentage: number;
  drift: number;
  status: 'on_target' | 'underweight' | 'overweight' | 'unallocated';
  recommendation: string;
}

export interface PortfolioAllocationResult {
  totalValue: number;
  cashAvailable: number;
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  positions: AllocationPosition[];
  overAllocated: AllocationPosition[];
  underAllocated: AllocationPosition[];
  unallocatedPercentage: number;
}

export class PortfolioAllocationEngine {
  public calculate(input: PortfolioAllocationInput): PortfolioAllocationResult {
    const totalHoldingValue = input.holdings.reduce((sum, holding) => sum + holding.value, 0);
    const cashAvailable = Math.max(0, input.cashAvailable ?? 0);
    const totalValue = totalHoldingValue + cashAvailable;

    const currentAllocation: Record<string, number> = {};
    input.holdings.forEach((holding) => {
      currentAllocation[holding.assetClass] =
        (currentAllocation[holding.assetClass] || 0) + holding.value / Math.max(totalValue, 1);
    });

    const targetAllocation: Record<string, number> = {};
    input.targets.forEach((target) => {
      targetAllocation[target.assetClass] = target.targetPercentage;
    });

    const unallocatedPercentage = Math.max(
      0,
      1 - Object.values(targetAllocation).reduce((sum, value) => sum + value, 0)
    );

    const positions: AllocationPosition[] = [];
    const allAssetClasses = new Set<string>([
      ...Object.keys(currentAllocation),
      ...Object.keys(targetAllocation),
    ]);

    allAssetClasses.forEach((assetClass) => {
      const currentPercentage = currentAllocation[assetClass] ?? 0;
      const targetPercentage = targetAllocation[assetClass] ?? 0;
      const drift = currentPercentage - targetPercentage;
      const status: AllocationPosition['status'] =
        drift > 0.02
          ? 'overweight'
          : drift < -0.02
          ? 'underweight'
          : targetPercentage === 0 && currentPercentage > 0
          ? 'unallocated'
          : 'on_target';

      const recommendation = this.buildAllocationRecommendation(
        assetClass,
        currentPercentage,
        targetPercentage,
        drift,
        status
      );

      positions.push({
        assetClass,
        currentValue: Math.round(currentPercentage * totalValue),
        currentPercentage,
        targetPercentage,
        drift,
        status,
        recommendation,
      });
    });

    return {
      totalValue,
      cashAvailable,
      currentAllocation,
      targetAllocation,
      positions,
      overAllocated: positions.filter((position) => position.status === 'overweight'),
      underAllocated: positions.filter((position) => position.status === 'underweight'),
      unallocatedPercentage,
    };
  }

  private buildAllocationRecommendation(
    assetClass: string,
    currentPercentage: number,
    targetPercentage: number,
    drift: number,
    status: AllocationPosition['status']
  ): string {
    switch (status) {
      case 'overweight':
        return `Your ${assetClass} exposure is ${(currentPercentage * 100).toFixed(1)}%, above the target of ${(targetPercentage * 100).toFixed(1)}%. Reduce to align with target.`;
      case 'underweight':
        return `Your ${assetClass} exposure is ${(currentPercentage * 100).toFixed(1)}%, below the target of ${(targetPercentage * 100).toFixed(1)}%. Consider increasing allocation.`;
      case 'unallocated':
        return `You own ${assetClass} but it is not part of the stated target allocation. Decide whether to keep, repurpose, or liquidate it.`;
      default:
        return `Your ${assetClass} allocation is within the acceptable range.`;
    }
  }
}

// ============================================================================
// REBALANCING ENGINE
// ============================================================================

export interface RebalanceRequest {
  currentAllocation: Record<string, number>; // 0-1
  targetAllocation: Record<string, number>; // 0-1
  totalPortfolioValue: number;
  tolerance?: number; // fraction drift before action
  transactionCostRate?: number; // percent of trade value, e.g. 0.001 for 0.1%
  maxTurnoverPercentage?: number; // 0-1 of portfolio value
}

export interface RebalanceTrade {
  assetClass: string;
  action: 'buy' | 'sell' | 'hold';
  percentageChange: number;
  valueChange: number;
  estimatedCost: number;
  reason: string;
}

export interface RebalancePlan {
  totalPortfolioValue: number;
  tolerance: number;
  transactionCostRate: number;
  trades: RebalanceTrade[];
  totalTurnover: number;
  estimatedCost: number;
  netCashRequirement: number;
}

export class RebalancingEngine {
  public createPlan(request: RebalanceRequest): RebalancePlan {
    const tolerance = request.tolerance ?? 0.03;
    const transactionCostRate = request.transactionCostRate ?? 0.001;
    const allAssetClasses = new Set<string>([
      ...Object.keys(request.currentAllocation),
      ...Object.keys(request.targetAllocation),
    ]);

    let buyValue = 0;
    let sellValue = 0;
    const trades: RebalanceTrade[] = [];

    allAssetClasses.forEach((assetClass) => {
      const current = request.currentAllocation[assetClass] ?? 0;
      const target = request.targetAllocation[assetClass] ?? 0;
      const drift = current - target;

      if (Math.abs(drift) <= tolerance) {
        trades.push({
          assetClass,
          action: 'hold',
          percentageChange: 0,
          valueChange: 0,
          estimatedCost: 0,
          reason: 'Within tolerance band.',
        });
        return;
      }

      const moveToTarget = drift > 0 ? 'sell' : 'buy';
      const percentageChange = Math.abs(drift);
      const valueChange = Math.round(percentageChange * request.totalPortfolioValue);
      const estimatedCost = Math.round(valueChange * transactionCostRate);

      if (moveToTarget === 'buy') {
        buyValue += valueChange;
      } else {
        sellValue += valueChange;
      }

      trades.push({
        assetClass,
        action: moveToTarget,
        percentageChange,
        valueChange,
        estimatedCost,
        reason: `Bring ${assetClass} back to ${(target * 100).toFixed(1)}% target.`,
      });
    });

    const totalTurnover = trades.reduce((sum, trade) => sum + Math.abs(trade.valueChange), 0);
    const turnoverLimit = Math.max(0, request.maxTurnoverPercentage ?? 1) * request.totalPortfolioValue;
    const estimatedCost = trades.reduce((sum, trade) => sum + trade.estimatedCost, 0);
    const netCashRequirement = Math.max(0, buyValue - sellValue);

    if (turnoverLimit > 0 && totalTurnover > turnoverLimit) {
      // Minimal adjustment to satisfy the turnover limit
      const scaleDown = turnoverLimit / totalTurnover;
      trades.forEach((trade) => {
        trade.valueChange = Math.round(trade.valueChange * scaleDown);
        trade.estimatedCost = Math.round(trade.valueChange * transactionCostRate);
      });
    }

    return {
      totalPortfolioValue: request.totalPortfolioValue,
      tolerance,
      transactionCostRate,
      trades,
      totalTurnover: Math.min(totalTurnover, turnoverLimit || totalTurnover),
      estimatedCost,
      netCashRequirement,
    };
  }
}

// ============================================================================
// GOAL PROJECTION ENGINE
// ============================================================================

export interface GoalProjectionInput {
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  annualReturnRate?: number; // decimal, e.g. 0.05
  startDate?: Date;
  deadline?: Date;
}

export interface GoalProjectionResult {
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  progressRatio: number;
  monthsToDeadline: number | undefined;
  requiredMonthlyContribution: number;
  projectedValueAtDeadline: number;
  projectedDate: Date;
  shortfall: number;
  onTrack: boolean;
  notes: string;
}

export class GoalProjectionEngine {
  public project(input: GoalProjectionInput): GoalProjectionResult {
    const startDate = input.startDate ?? new Date();
    const annualReturnRate = input.annualReturnRate ?? 0.04;
    const monthlyRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;
    const progressRatio = Math.min(1, input.currentAmount / Math.max(input.targetAmount, 1));
    const monthsToDeadline = input.deadline
      ? this.monthsBetween(startDate, input.deadline)
      : undefined;

    const requiredMonthlyContribution = this.calculateRequiredMonthlyContribution(
      input.currentAmount,
      input.targetAmount,
      monthlyRate,
      monthsToDeadline
    );

    const projectedValueAtDeadline = this.calculateFutureValue(
      input.currentAmount,
      input.monthlyContribution,
      monthlyRate,
      monthsToDeadline ?? 60
    );

    const projectedDate = input.deadline
      ? input.deadline
      : this.estimateCompletionDate(
          input.currentAmount,
          input.targetAmount,
          input.monthlyContribution,
          monthlyRate,
          startDate
        );

    const shortfall = Math.max(0, input.targetAmount - projectedValueAtDeadline);
    const onTrack = input.monthlyContribution >= requiredMonthlyContribution;

    return {
      goalName: input.goalName,
      currentAmount: input.currentAmount,
      targetAmount: input.targetAmount,
      progressRatio,
      monthsToDeadline,
      requiredMonthlyContribution,
      projectedValueAtDeadline: Math.round(projectedValueAtDeadline),
      projectedDate,
      shortfall: Math.round(shortfall),
      onTrack,
      notes: this.buildGoalProjectionNote(onTrack, requiredMonthlyContribution, projectedDate, monthsToDeadline),
    };
  }

  private calculateFutureValue(
    currentAmount: number,
    monthlyContribution: number,
    monthlyRate: number,
    months: number
  ): number {
    if (months <= 0) {
      return currentAmount;
    }

    if (monthlyRate === 0) {
      return currentAmount + monthlyContribution * months;
    }

    const compoundFactor = Math.pow(1 + monthlyRate, months);
    return (
      currentAmount * compoundFactor +
      monthlyContribution * ((compoundFactor - 1) / monthlyRate)
    );
  }

  private calculateRequiredMonthlyContribution(
    currentAmount: number,
    targetAmount: number,
    monthlyRate: number,
    months?: number
  ): number {
    if (months === undefined || months <= 0) {
      return 0;
    }

    const compoundFactor = Math.pow(1 + monthlyRate, months);
    const futureCurrent = currentAmount * compoundFactor;
    const shortfall = Math.max(0, targetAmount - futureCurrent);

    if (shortfall <= 0) {
      return 0;
    }

    if (monthlyRate === 0) {
      return shortfall / months;
    }

    return shortfall * (monthlyRate / (compoundFactor - 1));
  }

  private estimateCompletionDate(
    currentAmount: number,
    targetAmount: number,
    monthlyContribution: number,
    monthlyRate: number,
    startDate: Date
  ): Date {
    if (monthlyContribution <= 0) {
      return new Date(startDate);
    }

    if (monthlyRate === 0) {
      const months = Math.ceil((targetAmount - currentAmount) / monthlyContribution);
      return this.addMonths(startDate, Math.max(months, 0));
    }

    let balance = currentAmount;
    let months = 0;
    while (balance < targetAmount && months < 600) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months += 1;
    }

    return this.addMonths(startDate, months);
  }

  private monthsBetween(start: Date, end: Date): number {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();
    let months = yearDiff * 12 + monthDiff;
    if (dayDiff > 0) {
      months += 1;
    }
    return Math.max(0, months);
  }

  private addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private buildGoalProjectionNote(
    onTrack: boolean,
    requiredMonthlyContribution: number,
    projectedDate: Date,
    monthsToDeadline?: number
  ): string {
    if (monthsToDeadline !== undefined) {
      return onTrack
        ? `At your current contribution, you're on track to reach the target by ${projectedDate.toLocaleDateString()}.`
        : `You need to contribute ₦${requiredMonthlyContribution.toLocaleString()} per month to reach the target by ${projectedDate.toLocaleDateString()}.`;
    }

    return `Projected completion date is ${projectedDate.toLocaleDateString()} at the current contribution rate.`;
  }
}

// ============================================================================
// RISK SCORING SYSTEM
// ============================================================================

export type RiskCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface RiskScoreInput {
  portfolioAllocation: Record<string, number>;
  riskTolerance: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  timeHorizonYears: number;
  incomeStability: number; // 0-1
  debtToIncome?: number; // 0-1
  emergencyFundCoverageMonths?: number;
  savingsRate?: number; // 0-1
}

export interface RiskScoreResult {
  score: number; // 0-100
  category: RiskCategory;
  recommendation: string;
  driverScores: Record<string, number>;
  suggestedEquityAllocation: number;
}

export class RiskScoringSystem {
  public score(input: RiskScoreInput): RiskScoreResult {
    const assetCount = Object.keys(input.portfolioAllocation).length;
    const currentEquity = this.estimateEquityAllocation(input.portfolioAllocation);
    const recommendedEquity = this.recommendedEquity(input.riskTolerance);

    const allocationMatch = 1 - Math.min(Math.abs(currentEquity - recommendedEquity) / 0.5, 1);
    const diversification = Math.min(assetCount / 5, 1);
    const concentration = this.calculateConcentration(input.portfolioAllocation);
    const concentrationScore = 1 - Math.min(Math.max(concentration - 0.25, 0) / 0.75, 1);
    const horizonScore = Math.min(input.timeHorizonYears / 20, 1);
    const stabilityScore = input.incomeStability;
    const debtScore = 1 - Math.min(input.debtToIncome ?? 0, 1);
    const emergencyScore = Math.min((input.emergencyFundCoverageMonths ?? 0) / 6, 1);
    const savingsScore = Math.min((input.savingsRate ?? 0) / 0.2, 1);

    const score = Math.round(
      100 * this.weightedAverage({
        allocationMatch: { value: allocationMatch, weight: 0.22 },
        diversification: { value: diversification, weight: 0.15 },
        concentration: { value: concentrationScore, weight: 0.15 },
        horizon: { value: horizonScore, weight: 0.15 },
        stability: { value: stabilityScore, weight: 0.12 },
        debt: { value: debtScore, weight: 0.08 },
        emergency: { value: emergencyScore, weight: 0.08 },
        savings: { value: savingsScore, weight: 0.05 },
      })
    );

    const category = this.mapScoreToRiskCategory(score, input.riskTolerance);
    const recommendation = this.buildRiskRecommendation(score, category, currentEquity, recommendedEquity);

    return {
      score,
      category,
      recommendation,
      suggestedEquityAllocation: recommendedEquity,
      driverScores: {
        allocationMatch: Math.round(allocationMatch * 100),
        diversification: Math.round(diversification * 100),
        concentration: Math.round(concentrationScore * 100),
        horizon: Math.round(horizonScore * 100),
        stability: Math.round(stabilityScore * 100),
        debt: Math.round(debtScore * 100),
        emergency: Math.round(emergencyScore * 100),
        savings: Math.round(savingsScore * 100),
      },
    };
  }

  private estimateEquityAllocation(allocation: Record<string, number>): number {
    return Object.entries(allocation).reduce((sum, [assetClass, pct]) => {
      const equityTags = ['stocks', 'equities', 'crypto'];
      return equityTags.includes(assetClass.toLowerCase()) ? sum + pct : sum;
    }, 0);
  }

  private recommendedEquity(riskTolerance: RiskScoreInput['riskTolerance']): number {
    const mapping: Record<RiskScoreInput['riskTolerance'], number> = {
      very_low: 0.1,
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      very_high: 0.9,
    };
    return mapping[riskTolerance];
  }

  private calculateConcentration(allocation: Record<string, number>): number {
    return Math.max(...Object.values(allocation), 0);
  }

  private weightedAverage(items: Record<string, { value: number; weight: number }>): number {
    const totalWeight = Object.values(items).reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 0;
    return (
      Object.values(items).reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
    );
  }

  private mapScoreToRiskCategory(score: number, tolerance: RiskScoreInput['riskTolerance']): RiskCategory {
    if (score < 30) return 'very_high';
    if (score < 50) return 'high';
    if (score < 70) return 'medium';
    if (score < 85) return 'low';
    return 'very_low';
  }

  private buildRiskRecommendation(
    score: number,
    category: RiskCategory,
    currentEquity: number,
    recommendedEquity: number
  ): string {
    if (score < 50) {
      return `Your portfolio is too risky for the current profile. Reduce equity exposure to ${Math.round(
        recommendedEquity * 100
      )}% and increase diversification.`;
    }

    if (score < 70) {
      return `Your portfolio is moderately aligned but could benefit from better diversification and an emergency fund.`;
    }

    return `Your risk profile is well aligned. Continue monitoring concentration and maintaining emergency savings.`;
  }
}

// ============================================================================
// INSIGHT ENGINE
// ============================================================================

export type InsightRule = (data: FinancialData) => Insight[];

export interface FinancialInsightEngineOptions {
  rules?: InsightRule[];
}

export class FinancialInsightEngine {
  private rules: InsightRule[];

  constructor(options: FinancialInsightEngineOptions = {}) {
    this.rules = options.rules ?? this.defaultRules();
  }

  public analyze(data: FinancialData): Insight[] {
    const insights = this.rules.flatMap((rule) => rule(data));
    return this.deduplicate(insights).sort((a, b) => b.priority - a.priority);
  }

  public addRule(rule: InsightRule): this {
    this.rules.push(rule);
    return this;
  }

  private defaultRules(): InsightRule[] {
    return [
      this.ruleLowSavingsRate,
      this.ruleEmergencyFundShortfall,
      this.rulePortfolioAllocationMismatch,
      this.ruleGoalOffTrack,
    ];
  }

  private ruleLowSavingsRate(data: FinancialData): Insight[] {
    const minimum = 0.2;
    if (data.savingsRate >= minimum) return [];
    const deficit = minimum - data.savingsRate;
    const amount = Math.round(deficit * data.monthlyIncome);
    return [
      {
        id: 'insight-low-savings',
        type: 'low_savings',
        message: `Your savings rate is ${(data.savingsRate * 100).toFixed(1)}%, below the recommended 20%.`,
        severity: data.savingsRate < 0.1 ? 'high' : 'medium',
        category: 'saving',
        action: `Increase savings by ₦${amount.toLocaleString()} per month.`,
        priority: 9,
        metrics: { currentRate: data.savingsRate, recommendedRate: minimum, amount },
      },
    ];
  }

  private ruleEmergencyFundShortfall(data: FinancialData): Insight[] {
    const required = data.monthlyIncome * 3;
    const current = data.emergencyFundAmount ?? 0;
    if (current >= required) return [];
    const gap = Math.round(required - current);
    return [
      {
        id: 'insight-emergency-fund',
        type: 'emergency_fund',
        message: `Emergency fund is ₦${current.toLocaleString()}, below the recommended ₦${required.toLocaleString()}.`,
        severity: current < data.monthlyIncome ? 'high' : 'medium',
        category: 'planning',
        action: `Save an additional ₦${gap.toLocaleString()} to secure 3 months of expenses.`,
        priority: 8,
        metrics: { current, required, gap },
      },
    ];
  }

  private rulePortfolioAllocationMismatch(data: FinancialData): Insight[] {
    const stocksAllocation = data.portfolioAllocation['stocks'] ?? 0;
    const recommended = { low: 0.3, medium: 0.5, high: 0.7 }[data.userProfile.riskTolerance] ?? 0.5;

    if (Math.abs(stocksAllocation - recommended) <= 0.15) return [];

    return [
      {
        id: 'insight-allocation-mismatch',
        type: 'allocation_mismatch',
        message: `Stocks allocation is ${(stocksAllocation * 100).toFixed(1)}%, versus the recommended ${(recommended * 100).toFixed(1)}% for your risk tolerance.`,
        severity: 'medium',
        category: 'investing',
        action: `Rebalance stocks to ${(recommended * 100).toFixed(0)}% of the portfolio.`,
        priority: 7,
        metrics: { current: stocksAllocation, recommended },
      },
    ];
  }

  private ruleGoalOffTrack(data: FinancialData): Insight[] {
    const now = new Date();
    const insights: Insight[] = [];

    data.goals.forEach((goal) => {
      const daysRemaining = Math.max(1, Math.ceil((goal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const targetRate = goal.targetAmount / daysRemaining;
      const currentRate = goal.currentAmount / Math.max(1, daysRemaining);
      if (currentRate >= targetRate * 0.9) return;

      const monthlyNeeded = Math.round(((goal.targetAmount - goal.currentAmount) / daysRemaining) * 30);
      insights.push({
        id: `insight-goal-offtrack-${goal.id}`,
        type: 'goal_off_track',
        message: `Your ${goal.name} goal is behind schedule.`,
        severity: 'high',
        category: 'goals',
        action: `Increase contributions to ₦${monthlyNeeded.toLocaleString()} monthly.`,
        priority: 8,
        metrics: {
          goal: goal.name,
          monthlyNeeded,
          deadline: goal.deadline.toISOString(),
        },
      });
    });

    return insights;
  }

  private deduplicate(insights: Insight[]): Insight[] {
    const seen = new Map<string, Insight>();
    insights.forEach((insight) => {
      if (!seen.has(insight.id) || seen.get(insight.id)!.severity === 'low') {
        seen.set(insight.id, insight);
      }
    });
    return Array.from(seen.values());
  }
}

// ============================================================================
// SAMPLE USAGE
// ============================================================================

/**
 * Example:
 * const engine = new PortfolioAllocationEngine();
 * const allocation = engine.calculate({ holdings, targets, cashAvailable: 5000 });
 *
 * const rebalance = new RebalancingEngine().createPlan({
 *   currentAllocation: allocation.currentAllocation,
 *   targetAllocation: allocation.targetAllocation,
 *   totalPortfolioValue: allocation.totalValue,
 * });
 *
 * const projection = new GoalProjectionEngine().project({
 *   goalName: 'Buy a home',
 *   currentAmount: 20000,
 *   targetAmount: 100000,
 *   monthlyContribution: 1500,
 *   deadline: new Date('2028-12-31'),
 * });
 *
 * const risk = new RiskScoringSystem().score({
 *   portfolioAllocation: allocation.currentAllocation,
 *   riskTolerance: 'medium',
 *   timeHorizonYears: 10,
 *   incomeStability: 0.8,
 * });
 *
 * const insightEngine = new FinancialInsightEngine();
 * const insights = insightEngine.analyze(financialData);
 */
