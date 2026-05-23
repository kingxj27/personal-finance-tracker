/**
 * Analysis Module - IFOS (Intelligent Financial Operating System)
 * Provides financial analysis, allocation calculations, and insight generation
 */

export {
  calculateAllocation,
  type Asset,
  type AllocationResult,
} from '../analysis';

export {
  InsightEngine,
  createInsightEngine,
  type FinancialData,
  type Insight,
  type UserProfile,
  type Goal,
  type Transaction,
  type InsightSeverity,
  type InsightCategory,
} from './insights';

export {
  analyzeScenario,
  runAllTests,
  compareScenarios,
  mockDataYoungProfessional,
  mockDataStudent,
  mockDataInvestor,
  mockDataOverspender,
} from './insights.test';

export {
  PersonalizationRuleEngine,
  DEFAULT_RULES,
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
  type PersonalizationRule,
  type PersonalizationContext,
  type PersonalizationAction,
} from './personalization-rules';

export {
  PortfolioAllocationEngine,
  RebalancingEngine,
  GoalProjectionEngine,
  RiskScoringSystem,
  FinancialInsightEngine,
  type PortfolioHolding,
  type AllocationTarget,
  type PortfolioAllocationInput,
  type PortfolioAllocationResult,
  type RebalanceRequest,
  type RebalancePlan,
  type RebalanceTrade,
  type GoalProjectionInput,
  type GoalProjectionResult,
  type RiskScoreInput,
  type RiskScoreResult,
  type RiskCategory,
  type InsightRule,
} from './financial-engines';
