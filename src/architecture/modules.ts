/**
 * FINTECH SYSTEM ARCHITECTURE - Module Definitions & API Specification
 * 
 * A modular, scalable backend design for the Intelligent Financial Operating System (IFOS)
 * 
 * Core Modules:
 * 1. Portfolio Tracking Service
 * 2. Cashflow Analysis Service  
 * 3. Goal Planning Service
 * 4. Economic Awareness Service
 * 5. Insight Generation Service (IFOS)
 */

// ============================================================================
// MODULE 1: PORTFOLIO TRACKING SERVICE
// ============================================================================

/**
 * RESPONSIBILITY:
 * - Track user asset holdings (stocks, bonds, real estate, crypto, commodities)
 * - Manage asset allocation and rebalancing
 * - Calculate portfolio valuation and performance metrics
 * - Track portfolio composition changes over time
 * 
 * INPUTS:
 * - Asset purchases/sales transactions
 * - Current market prices
 * - User allocation preferences
 * 
 * OUTPUTS:
 * - Current portfolio state
 * - Asset allocation percentages
 * - Portfolio value & performance
 * - Rebalancing recommendations
 */

export interface PortfolioAsset {
  id: string;
  userId: string;
  assetType: 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'commodities' | 'cash';
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  totalValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface PortfolioSnapshot {
  userId: string;
  timestamp: Date;
  totalValue: number;
  allocation: Record<string, number>; // asset_type: percentage
  dayChangePercentage: number;
  monthChangePercentage: number;
  yearChangePercentage: number;
  assets: PortfolioAsset[];
}

export interface PortfolioTrackingService {
  // Add/update asset holding
  addAsset(userId: string, asset: PortfolioAsset): Promise<PortfolioAsset>;
  
  // Remove asset
  removeAsset(userId: string, assetId: string): Promise<void>;
  
  // Get current portfolio
  getPortfolio(userId: string): Promise<PortfolioSnapshot>;
  
  // Get allocation percentages
  getAllocation(userId: string): Promise<Record<string, number>>;
  
  // Calculate rebalancing needs
  getRebalancingRecommendations(
    userId: string,
    targetAllocation: Record<string, number>
  ): Promise<Array<{ assetType: string; action: 'buy' | 'sell'; amount: number }>>;
  
  // Get performance metrics
  getPerformance(
    userId: string,
    period: 'day' | 'month' | 'year' | 'all'
  ): Promise<{ returnPercentage: number; absoluteReturn: number; volatility: number }>;
}

// ============================================================================
// MODULE 2: CASHFLOW ANALYSIS SERVICE
// ============================================================================

/**
 * RESPONSIBILITY:
 * - Track income streams and employment status
 * - Monitor expense patterns by category
 * - Calculate savings rate and cashflow
 * - Project future cashflow based on trends
 * - Identify spending anomalies
 * 
 * INPUTS:
 * - Bank transactions
 * - Income statements
 * - Expense receipts/categorization
 * 
 * OUTPUTS:
 * - Monthly cashflow summary
 * - Category breakdowns
 * - Savings rate trends
 * - Cashflow forecasts
 */

export interface CashflowTransaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  description: string;
  recurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

export interface MonthlyCashflow {
  userId: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  savingsRate: number;
  categoryBreakdown: Record<string, number>;
  recurringTransactions: number;
}

export interface CashflowForecast {
  userId: string;
  forecastPeriod: string; // "3M", "6M", "12M"
  projectedMonthly: MonthlyCashflow[];
  averageMonthlySavings: number;
  forecastedValue: number;
  confidenceScore: number; // 0-1
}

export interface CashflowAnalysisService {
  // Add transaction
  addTransaction(
    userId: string,
    transaction: CashflowTransaction
  ): Promise<CashflowTransaction>;
  
  // Get monthly summary
  getMonthlyCashflow(userId: string, month: number, year: number): Promise<MonthlyCashflow>;
  
  // Get category breakdown
  getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { spent: number; percentage: number }>>;
  
  // Get savings trends
  getSavingsTrends(userId: string, months: number): Promise<number[]>; // Savings rates
  
  // Forecast cashflow
  forecastCashflow(userId: string, months: number): Promise<CashflowForecast>;
  
  // Detect anomalies
  detectAnomalies(userId: string): Promise<Array<{ category: string; anomaly: string }>>;
  
  // Identify recurring patterns
  getRecurringPatterns(userId: string): Promise<CashflowTransaction[]>;
}

// ============================================================================
// MODULE 3: GOAL PLANNING SERVICE
// ============================================================================

/**
 * RESPONSIBILITY:
 * - Create and manage financial goals
 * - Track goal progress
 * - Calculate required savings rates
 * - Provide milestone recommendations
 * - Priority ranking of goals
 * 
 * INPUTS:
 * - Goal definitions (target, timeline)
 * - Current savings/progress
 * - Monthly cashflow data
 * 
 * OUTPUTS:
 * - Goal status & progress
 * - Required monthly savings
 * - Goal priorities
 * - Milestone recommendations
 */

export enum GoalType {
  EMERGENCY_FUND = 'emergency_fund',
  RETIREMENT = 'retirement',
  VACATION = 'vacation',
  HOME_PURCHASE = 'home_purchase',
  EDUCATION = 'education',
  VEHICLE = 'vehicle',
  DEBT_PAYOFF = 'debt_payoff',
  WEALTH_BUILDING = 'wealth_building',
  OTHER = 'other',
}

export enum GoalStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  ON_TRACK = 'on_track',
  OFF_TRACK = 'off_track',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  monthlyContribution: number;
  status: GoalStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate: Date;
  completed: boolean;
}

export interface GoalAnalysis {
  goal: FinancialGoal;
  progressPercentage: number;
  timeRemainingDays: number;
  monthlyNeeded: number;
  isOnTrack: boolean;
  projectedCompletionDate: Date;
  recommendedAction: string;
}

export interface GoalPlanningService {
  // Create goal
  createGoal(userId: string, goal: FinancialGoal): Promise<FinancialGoal>;
  
  // Get all goals
  getGoals(userId: string): Promise<FinancialGoal[]>;
  
  // Get goal analysis
  analyzeGoal(userId: string, goalId: string): Promise<GoalAnalysis>;
  
  // Update goal progress
  updateGoalProgress(
    userId: string,
    goalId: string,
    amount: number
  ): Promise<FinancialGoal>;
  
  // Get goal recommendations
  getGoalRecommendations(userId: string): Promise<FinancialGoal[]>;
  
  // Prioritize goals
  prioritizeGoals(userId: string): Promise<FinancialGoal[]>;
  
  // Calculate required savings
  calculateRequiredSavings(
    userId: string,
    targetAmount: number,
    deadline: Date
  ): Promise<{ monthlyAmount: number; totalDueDate: Date }>;
  
  // Get milestone status
  getMilestoneStatus(userId: string, goalId: string): Promise<Milestone[]>;
}

// ============================================================================
// MODULE 4: ECONOMIC AWARENESS SERVICE
// ============================================================================

/**
 * RESPONSIBILITY:
 * - Track market indices and trends
 * - Monitor inflation rates and economic indicators
 * - Provide economic forecasts
 * - Alert on significant market events
 * - Suggest allocation adjustments based on economy
 * 
 * INPUTS:
 * - Market data APIs (external)
 * - Economic indicators (external)
 * - User portfolio preferences
 * 
 * OUTPUTS:
 * - Market analysis
 * - Economic outlook
 * - Risk alerts
 * - Tactical recommendations
 */

export interface MarketIndicator {
  id: string;
  name: string;
  symbol: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  timestamp: Date;
  category: 'equity' | 'bond' | 'commodity' | 'currency' | 'crypto';
}

export interface EconomicIndicator {
  id: string;
  name: string;
  value: number;
  unit: string;
  date: Date;
  forecast?: number;
  historicalTrend: number[]; // Last 12 values
}

export interface MarketAnalysis {
  timestamp: Date;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  volatilityIndex: number; // 0-100
  trendStrength: number; // -1 to 1
  keyMovers: Array<{ indicator: string; change: number; impact: string }>;
  risks: string[];
}

export interface EconomicOutlook {
  period: string; // "Q2 2026", "2026", etc
  inflationForecast: number;
  gdpGrowth: number;
  unemploymentRate: number;
  keyRisks: string[];
  keyOpportunities: string[];
  recommendedTacticalShift?: string;
}

export interface EconomicAwarenessService {
  // Get market indices
  getMarketIndices(): Promise<MarketIndicator[]>;
  
  // Get economic indicators
  getEconomicIndicators(): Promise<EconomicIndicator[]>;
  
  // Analyze market conditions
  analyzeMarket(): Promise<MarketAnalysis>;
  
  // Get economic outlook
  getEconomicOutlook(months: number): Promise<EconomicOutlook>;
  
  // Get asset class performance
  getAssetClassPerformance(period: 'day' | 'week' | 'month' | 'year'): Promise<Record<string, number>>;
  
  // Alert on significant changes
  getMarketAlerts(): Promise<Array<{ severity: 'low' | 'medium' | 'high'; message: string }>>;
  
  // Suggest portfolio adjustments
  suggestAllocationAdjustments(
    currentAllocation: Record<string, number>
  ): Promise<Array<{ assetType: string; suggestedPercentage: number; reason: string }>>;
}

// ============================================================================
// MODULE 5: INSIGHT GENERATION SERVICE (IFOS)
// ============================================================================

/**
 * RESPONSIBILITY:
 * - Aggregate data from all modules
 * - Apply financial rules and analysis
 * - Generate personalized, actionable insights
 * - Prioritize recommendations
 * - Provide next-action guidance
 * 
 * INPUTS:
 * - Portfolio data
 * - Cashflow data
 * - Goal data
 * - Economic data
 * - User profile
 * 
 * OUTPUTS:
 * - Prioritized insights
 * - Specific recommendations
 * - Risk alerts
 * - Opportunity notifications
 */

export interface InsightGenerationService {
  // Generate insights (main method)
  generateInsights(userId: string): Promise<Insight[]>;
  
  // Get specific insight category
  getInsightsByCategory(
    userId: string,
    category: InsightCategory
  ): Promise<Insight[]>;
  
  // Get high-priority insights only
  getUrgentInsights(userId: string): Promise<Insight[]>;
  
  // Get insights by type
  getInsightsByType(userId: string, type: string): Promise<Insight[]>;
  
  // Track insight engagement
  markInsightAsActed(userId: string, insightId: string): Promise<void>;
  
  // Get insight history
  getInsightHistory(userId: string, days: number): Promise<Insight[]>;
}

// ============================================================================
// MODULE INTERACTION PATTERNS
// ============================================================================

/**
 * Data Flow Architecture:
 * 
 * Frontend
 *   ↓
 * API Gateway
 *   ↓
 * ┌─────────────────────────────────────────────┐
 * │  SERVICE LAYER                              │
 * ├─────────────────────────────────────────────┤
 * │                                             │
 * │  ┌─────────────────────────────────────┐   │
 * │  │ Portfolio Tracking Service          │   │
 * │  │ └─→ Asset Manager                   │   │
 * │  │ └─→ Allocation Calculator           │   │
 * │  │ └─→ Performance Engine               │   │
 * │  └─────────────────────────────────────┘   │
 * │              ↓                              │
 * │  ┌─────────────────────────────────────┐   │
 * │  │ Cashflow Analysis Service           │   │
 * │  │ └─→ Transaction Processor           │   │
 * │  │ └─→ Category Analyzer               │   │
 * │  │ └─→ Forecast Engine                 │   │
 * │  └─────────────────────────────────────┘   │
 * │              ↓                              │
 * │  ┌─────────────────────────────────────┐   │
 * │  │ Goal Planning Service               │   │
 * │  │ └─→ Goal Manager                    │   │
 * │  │ └─→ Progress Tracker                │   │
 * │  │ └─→ Milestone Engine                │   │
 * │  └─────────────────────────────────────┘   │
 * │              ↓                              │
 * │  ┌─────────────────────────────────────┐   │
 * │  │ Economic Awareness Service          │   │
 * │  │ └─→ Market Data Aggregator          │   │
 * │  │ └─→ Trend Analyzer                  │   │
 * │  │ └─→ Risk Assessor                   │   │
 * │  └─────────────────────────────────────┘   │
 * │              ↓                              │
 * │  ┌─────────────────────────────────────┐   │
 * │  │ Insight Generation Service (IFOS)   │   │
 * │  │ └─→ Rule Engine                     │   │
 * │  │ └─→ Prioritization Engine           │   │
 * │  │ └─→ Recommendation Generator        │   │
 * │  └─────────────────────────────────────┘   │
 * │                                             │
 * └─────────────────────────────────────────────┘
 *   ↓
 * Data Layer (Database)
 *   ↓
 * External APIs (Market Data, Economic Data)
 */

/**
 * Inter-Service Communication:
 * 
 * SYNC (REST API):
 * - Portfolio → Goal Planning: Check allocation vs goals
 * - Cashflow → Goal Planning: Calculate required savings
 * - Economic → Portfolio: Suggest rebalancing
 * 
 * ASYNC (Event-Driven):
 * - Portfolio updated → Trigger Insights regeneration
 * - Cashflow analyzed → Update forecast
 * - Goal completed → Generate celebration insight
 * - Market alert → Trigger portfolio review
 */

export interface ModuleDependencies {
  insightGeneration: {
    dependencies: [
      'portfolioTracking',
      'cashflowAnalysis',
      'goalPlanning',
      'economicAwareness',
    ];
    frequency: 'on-demand' | 'daily' | 'weekly';
    priority: 'high';
  };
  goalPlanning: {
    dependencies: ['cashflowAnalysis'];
    frequency: 'daily';
    priority: 'high';
  };
  portfolioTracking: {
    dependencies: ['economicAwareness'];
    frequency: 'real-time';
    priority: 'high';
  };
  cashflowAnalysis: {
    dependencies: [];
    frequency: 'on-transaction';
    priority: 'medium';
  };
  economicAwareness: {
    dependencies: [];
    frequency: 'daily';
    priority: 'low';
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type InsightCategory =
  | 'spending'
  | 'saving'
  | 'investing'
  | 'risk'
  | 'goals'
  | 'income'
  | 'planning';

export type InsightSeverity = 'low' | 'medium' | 'high';

export interface Insight {
  id: string;
  type: string;
  message: string;
  severity: InsightSeverity;
  category: InsightCategory;
  action: string;
  priority: number;
}
