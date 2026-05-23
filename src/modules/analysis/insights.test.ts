/**
 * IFOS Insight Engine - Test Suite with Mock Data
 * Demonstrates the rule-based system analyzing financial data
 */

import {
  InsightEngine,
  FinancialData,
  Insight,
  createInsightEngine,
} from './insights';

// ============================================================================
// MOCK DATA SCENARIOS
// ============================================================================

/**
 * SCENARIO 1: Young Professional - Good Financial Health
 */
export const mockDataYoungProfessional: FinancialData = {
  transactions: [
    {
      amount: 150000,
      category: 'salary',
      date: new Date('2026-04-01'),
      type: 'income',
    },
    { amount: 45000, category: 'rent', date: new Date('2026-04-05'), type: 'expense' },
    {
      amount: 12000,
      category: 'food',
      date: new Date('2026-04-07'),
      type: 'expense',
    },
    {
      amount: 8000,
      category: 'transportation',
      date: new Date('2026-04-10'),
      type: 'expense',
    },
    {
      amount: 15000,
      category: 'utilities',
      date: new Date('2026-04-15'),
      type: 'expense',
    },
    {
      amount: 30000,
      category: 'investments',
      date: new Date('2026-04-20'),
      type: 'expense',
    },
  ],
  monthlyIncome: 150000,
  totalExpenses: 110000,
  categoryBreakdown: {
    housing: 45000,
    food: 12000,
    transportation: 8000,
    utilities: 15000,
    entertainment: 5000,
    shopping: 3000,
    subscriptions: 2000,
  },
  savingsRate: 0.27, // 27%
  portfolioAllocation: {
    stocks: 0.55,
    bonds: 0.3,
    cash: 0.15,
  },
  goals: [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 500000,
      currentAmount: 400000,
      deadline: new Date('2026-12-31'),
    },
    {
      id: 'goal-2',
      name: 'Vacation',
      targetAmount: 200000,
      currentAmount: 80000,
      deadline: new Date('2026-08-31'),
    },
  ],
  userProfile: {
    type: 'YOUNG_PROFESSIONAL',
    riskTolerance: 'medium',
    incomeStability: 0.85,
  },
  emergencyFundAmount: 400000,
};

/**
 * SCENARIO 2: Student - High Variability
 */
export const mockDataStudent: FinancialData = {
  transactions: [
    {
      amount: 25000,
      category: 'freelance',
      date: new Date('2026-04-01'),
      type: 'income',
    },
    {
      amount: 20000,
      category: 'part-time',
      date: new Date('2026-04-15'),
      type: 'income',
    },
    {
      amount: 15000,
      category: 'tuition',
      date: new Date('2026-04-03'),
      type: 'expense',
    },
    { amount: 18000, category: 'housing', date: new Date('2026-04-05'), type: 'expense' },
    { amount: 8000, category: 'food', date: new Date('2026-04-10'), type: 'expense' },
    {
      amount: 5000,
      category: 'transportation',
      date: new Date('2026-04-12'),
      type: 'expense',
    },
    {
      amount: 3000,
      category: 'entertainment',
      date: new Date('2026-04-20'),
      type: 'expense',
    },
    {
      amount: 2000,
      category: 'subscriptions',
      date: new Date('2026-04-25'),
      type: 'expense',
    },
  ],
  monthlyIncome: 45000,
  totalExpenses: 51000,
  categoryBreakdown: {
    tuition: 15000,
    housing: 18000,
    food: 8000,
    transportation: 5000,
    entertainment: 3000,
    subscriptions: 2000,
  },
  savingsRate: -0.13, // -13% (negative savings!)
  portfolioAllocation: {
    cash: 1.0, // All cash, no investments
  },
  goals: [
    {
      id: 'goal-3',
      name: 'Laptop Fund',
      targetAmount: 100000,
      currentAmount: 15000,
      deadline: new Date('2026-06-30'),
    },
  ],
  userProfile: {
    type: 'STUDENT',
    riskTolerance: 'low',
    incomeStability: 0.35,
  },
  emergencyFundAmount: 5000,
};

/**
 * SCENARIO 3: Investor - Portfolio Heavy
 */
export const mockDataInvestor: FinancialData = {
  transactions: [
    {
      amount: 500000,
      category: 'dividend',
      date: new Date('2026-04-01'),
      type: 'income',
    },
    {
      amount: 300000,
      category: 'capital_gains',
      date: new Date('2026-04-15'),
      type: 'income',
    },
    {
      amount: 120000,
      category: 'living',
      date: new Date('2026-04-05'),
      type: 'expense',
    },
    {
      amount: 50000,
      category: 'investments',
      date: new Date('2026-04-10'),
      type: 'expense',
    },
    {
      amount: 30000,
      category: 'taxes',
      date: new Date('2026-04-20'),
      type: 'expense',
    },
  ],
  monthlyIncome: 800000,
  totalExpenses: 200000,
  categoryBreakdown: {
    living: 120000,
    investments: 50000,
    taxes: 30000,
  },
  savingsRate: 0.75, // 75%
  portfolioAllocation: {
    stocks: 0.65, // CONCENTRATION RISK!
    bonds: 0.15,
    real_estate: 0.12,
    crypto: 0.08,
  },
  goals: [
    {
      id: 'goal-4',
      name: 'Wealth Target',
      targetAmount: 50000000,
      currentAmount: 35000000,
      deadline: new Date('2028-12-31'),
    },
  ],
  userProfile: {
    type: 'INVESTOR',
    riskTolerance: 'high',
    incomeStability: 0.9,
  },
  emergencyFundAmount: 3000000,
};

/**
 * SCENARIO 4: Overspender - Needs Help
 */
export const mockDataOverspender: FinancialData = {
  transactions: [
    {
      amount: 100000,
      category: 'salary',
      date: new Date('2026-04-01'),
      type: 'income',
    },
    { amount: 35000, category: 'food', date: new Date('2026-04-05'), type: 'expense' },
    {
      amount: 25000,
      category: 'entertainment',
      date: new Date('2026-04-07'),
      type: 'expense',
    },
    {
      amount: 20000,
      category: 'shopping',
      date: new Date('2026-04-10'),
      type: 'expense',
    },
    {
      amount: 18000,
      category: 'subscriptions',
      date: new Date('2026-04-15'),
      type: 'expense',
    },
  ],
  monthlyIncome: 100000,
  totalExpenses: 98000,
  categoryBreakdown: {
    food: 35000,
    entertainment: 25000,
    shopping: 20000,
    subscriptions: 18000,
  },
  savingsRate: 0.02, // Only 2% savings
  portfolioAllocation: {
    cash: 1.0,
  },
  goals: [
    {
      id: 'goal-5',
      name: 'Save for Car',
      targetAmount: 300000,
      currentAmount: 50000,
      deadline: new Date('2026-12-31'),
    },
  ],
  userProfile: {
    type: 'YOUNG_PROFESSIONAL',
    riskTolerance: 'medium',
    incomeStability: 0.8,
  },
  emergencyFundAmount: 50000,
};

// ============================================================================
// TEST RUNNER
// ============================================================================

export interface TestResult {
  scenario: string;
  insights: Insight[];
  summary: {
    totalInsights: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    byCategory: Record<string, number>;
  };
}

/**
 * Run analysis on a scenario and return results
 */
export const analyzeScenario = (
  scenario: string,
  data: FinancialData
): TestResult => {
  const engine = createInsightEngine();
  const insights = engine.analyze(data);

  const summary = {
    totalInsights: insights.length,
    highSeverity: insights.filter((i) => i.severity === 'high').length,
    mediumSeverity: insights.filter((i) => i.severity === 'medium').length,
    lowSeverity: insights.filter((i) => i.severity === 'low').length,
    byCategory: {} as Record<string, number>,
  };

  insights.forEach((insight) => {
    summary.byCategory[insight.category] =
      (summary.byCategory[insight.category] || 0) + 1;
  });

  return { scenario, insights, summary };
};

/**
 * Run all test scenarios
 */
export const runAllTests = (): TestResult[] => {
  console.log('🚀 IFOS Insight Engine - Running All Scenarios\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [
    analyzeScenario('Young Professional', mockDataYoungProfessional),
    analyzeScenario('Student', mockDataStudent),
    analyzeScenario('Investor', mockDataInvestor),
    analyzeScenario('Overspender', mockDataOverspender),
  ];

  results.forEach((result) => {
    console.log(`\n📊 SCENARIO: ${result.scenario}`);
    console.log('-'.repeat(80));

    console.log(`\n📈 Summary:`);
    console.log(
      `   Total Insights: ${result.summary.totalInsights}`
    );
    console.log(
      `   🔴 High Severity: ${result.summary.highSeverity} | 🟡 Medium: ${result.summary.mediumSeverity} | 🟢 Low: ${result.summary.lowSeverity}`
    );
    console.log(`   By Category:`, result.summary.byCategory);

    console.log(`\n💡 Insights (Priority Order):`);
    result.insights.forEach((insight, index) => {
      const severityEmoji =
        insight.severity === 'high'
          ? '🔴'
          : insight.severity === 'medium'
            ? '🟡'
            : '🟢';
      console.log(`\n   ${index + 1}. ${severityEmoji} [${insight.category.toUpperCase()}] ${insight.type}`);
      console.log(`      Message: ${insight.message}`);
      console.log(`      Action: ${insight.action}`);
      console.log(`      Priority: ${insight.priority}/10`);
    });

    console.log('\n' + '='.repeat(80));
  });

  return results;
};

/**
 * Compare two scenarios
 */
export const compareScenarios = (
  scenario1: string,
  data1: FinancialData,
  scenario2: string,
  data2: FinancialData
): void => {
  const result1 = analyzeScenario(scenario1, data1);
  const result2 = analyzeScenario(scenario2, data2);

  console.log(`\n📊 COMPARISON: ${scenario1} vs ${scenario2}`);
  console.log('='.repeat(80));

  console.log(`\n${scenario1}:`);
  console.log(
    `  Insights: ${result1.summary.totalInsights} | High: ${result1.summary.highSeverity} | Medium: ${result1.summary.mediumSeverity}`
  );

  console.log(`\n${scenario2}:`);
  console.log(
    `  Insights: ${result2.summary.totalInsights} | High: ${result2.summary.highSeverity} | Medium: ${result2.summary.mediumSeverity}`
  );

  console.log('\n' + '='.repeat(80));
};

/**
 * Export for console testing
 */
if (typeof window !== 'undefined') {
  (window as any).IFOS = {
    analyzeScenario,
    runAllTests,
    compareScenarios,
    mockDataYoungProfessional,
    mockDataStudent,
    mockDataInvestor,
    mockDataOverspender,
  };
}
