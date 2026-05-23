/**
 * COMPLETE INTEGRATION EXAMPLE
 * 
 * Demonstrates how user profiles, personalization rules, and the insight engine work together
 * to create an intelligent, adaptive financial system
 */

import {
  InsightEngine,
  PersonalizationRuleEngine,
  PersonalizationContext,
  DEFAULT_RULES,
} from './analysis';

import {
  PersonaType,
  UserProfile,
  getPersonalizedThreshold,
  getRuleWeightMultiplier,
  getEmergencyFundTarget,
  isUserReadyForInvestments,
  personaConfigs,
  getRecommendedAllocation,
} from './personas';

// ============================================================================
// SCENARIO 1: STUDENT USER
// ============================================================================

/**
 * New student user signs up
 * System creates profile and adapts behavior accordingly
 */
export async function onboardStudentUser() {
  // 1. Create user profile
  const studentProfile: UserProfile = {
    id: 'profile_student_001',
    userId: 'user_student_001',
    personaType: PersonaType.STUDENT,
    riskTolerance: 'very_low',
    spendingBehavior: 'moderate',
    
    // Financial characteristics
    incomeLevel: 12000, // $12k/year from part-time work
    incomeStability: 0.35,
    age: 21,
    region: 'US',
    currency: 'USD',
    
    // Situation
    financialGoals: ['emergency_fund', 'save_for_laptop'],
    investmentExperience: 'none',
    debtLevel: 15000, // Student loans
    employmentStatus: 'student',
    familySize: 1,
    
    // System settings
    emergencyFundPriority: true,
    automateInsights: true,
    allowPortfolioAdjustments: false,
    
    // Personalization
    riskAversionMultiplier: 1.0,
    savingsGoalMultiplier: 0.8,
    investmentReadinessScore: 0.1,
    
    // Behavioral data (initial)
    insightsActionedCount: 0,
    insightsIgnoredCount: 0,
    engagementScore: undefined,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 2. System generates initial insights using personalized rules
  console.log('=== STUDENT ONBOARDING ===\n');
  console.log(`Student Profile: ${studentProfile.personaType}`);
  console.log(`Income: $${studentProfile.incomeLevel}/year (stability: ${studentProfile.incomeStability})`);
  console.log(`Debt: $${studentProfile.debtLevel}`);

  // 3. Determine emergency fund target (personalized)
  const emergencyFundTarget = getEmergencyFundTarget(studentProfile, 500); // $500/month expenses
  console.log(`\nEmergency Fund Target: $${emergencyFundTarget} (2 months)`);
  console.log(`  Base for all users: 3 months`);
  console.log(`  Student adjustment: 2 months (because of variable income)`);

  // 4. Get recommended allocation (student = 100% cash)
  const allocation = getRecommendedAllocation(studentProfile);
  console.log(`\nRecommended Allocation: ${JSON.stringify(allocation)}`);
  console.log('  (All cash - no stocks for students)');

  // 5. Check investment readiness
  const canInvest = isUserReadyForInvestments(
    studentProfile,
    500, // Current emergency fund
    500 // Monthly expenses
  );
  console.log(`\nInvestment Ready: ${canInvest}`);
  console.log(`  Reason: Insufficient emergency fund ($500 < $1000 target)`);

  // 6. Apply personalization rules
  console.log(`\nApplying Personalization Rules:\n`);
  const ruleEngine = new PersonalizationRuleEngine(DEFAULT_RULES);
  const ruleWeights = {
    emergency_fund_low: getRuleWeightMultiplier(studentProfile, 'emergency_fund_low'),
    low_savings_rate: getRuleWeightMultiplier(studentProfile, 'low_savings_rate'),
    income_instability: getRuleWeightMultiplier(
      studentProfile,
      'income_instability'
    ),
    portfolio_concentration: getRuleWeightMultiplier(
      studentProfile,
      'portfolio_concentration'
    ),
  };

  console.log(`Rule Emphasis for Student:`);
  console.log(`  emergency_fund_low:      ${ruleWeights.emergency_fund_low}x (EMPHASIZED)`);
  console.log(`  low_savings_rate:        ${ruleWeights.low_savings_rate}x (EMPHASIZED)`);
  console.log(`  income_instability:      ${ruleWeights.income_instability}x (EMPHASIZED)`);
  console.log(`  portfolio_concentration: ${ruleWeights.portfolio_concentration}x (DEEMPHASIZED)`);

  // 7. System messages
  console.log(`\nSystem Messages:`);
  console.log('  ✓ Focus on building emergency fund (2-month target)');
  console.log('  ✓ Prioritize debt repayment over investments');
  console.log('  ✓ Adjust savings targets for variable income');
  console.log('  ✗ Hide advanced investment features');
}

// ============================================================================
// SCENARIO 2: YOUNG PROFESSIONAL USER
// ============================================================================

/**
 * Young professional creates profile
 * System emphasizes goal tracking and savings optimization
 */
export async function onboardYoungProfessional() {
  const ypProfile: UserProfile = {
    id: 'profile_yp_001',
    userId: 'user_yp_001',
    personaType: PersonaType.YOUNG_PROFESSIONAL,
    riskTolerance: 'medium',
    spendingBehavior: 'moderate',
    
    // Financial characteristics
    incomeLevel: 85000, // $85k/year salary
    incomeStability: 0.75,
    age: 28,
    region: 'US',
    currency: 'USD',
    
    // Situation
    financialGoals: ['home', 'retirement', 'emergency_fund'],
    investmentExperience: 'beginner',
    debtLevel: 35000, // Student loans + car loan
    employmentStatus: 'employed',
    familySize: 1,
    
    // System settings
    emergencyFundPriority: true,
    automateInsights: true,
    allowPortfolioAdjustments: false,
    
    // Personalization
    riskAversionMultiplier: 1.0,
    savingsGoalMultiplier: 1.2, // Wants to save more
    investmentReadinessScore: 0.65,
    
    // Behavioral data
    insightsActionedCount: 0,
    insightsIgnoredCount: 0,
    engagementScore: undefined,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('\n\n=== YOUNG PROFESSIONAL ONBOARDING ===\n');
  console.log(`Profile: ${ypProfile.personaType}`);
  console.log(`Income: $${ypProfile.incomeLevel}/year (stability: ${ypProfile.incomeStability})`);
  console.log(`Financial Goals: ${ypProfile.financialGoals.join(', ')}`);

  // Emergency fund target
  const monthlyExpenses = 3500;
  const emergencyFundTarget = getEmergencyFundTarget(ypProfile, monthlyExpenses);
  console.log(`\nEmergency Fund Target: $${emergencyFundTarget} (3 months)`);

  // Recommended allocation
  const allocation = getRecommendedAllocation(ypProfile);
  console.log(
    `\nRecommended Allocation: 60% Stocks, 30% Bonds, 10% Cash`
  );

  // Savings rate target
  const savingsTarget = ypProfile.incomeLevel * 0.25 * ypProfile.savingsGoalMultiplier;
  console.log(
    `\nAnnual Savings Target: $${savingsTarget.toLocaleString()} (25% * 1.2x multiplier)`
  );

  // Rule emphasis
  console.log(`\nEmphasized Rules:`);
  console.log('  ✓ Goal progress tracking (daily dashboard)');
  console.log('  ✓ Housing cost optimization (30% of income)');
  console.log('  ✓ Savings rate monitoring');
  console.log('  ✓ Portfolio balance recommendations');

  // Investment readiness
  const canInvest = isUserReadyForInvestments(
    ypProfile,
    10000, // Current emergency fund
    monthlyExpenses
  );
  console.log(`\nInvestment Ready: ${canInvest}`);

  console.log(`\nSystem Personalizations:`);
  console.log('  ✓ Goal tracking prominent on dashboard');
  console.log('  ✓ Monthly milestones celebration');
  console.log('  ✓ Budget category suggestions');
  console.log('  ✓ Debt payoff strategy recommendations');
}

// ============================================================================
// SCENARIO 3: INVESTOR USER
// ============================================================================

/**
 * High-net-worth investor
 * System emphasizes tax optimization and portfolio diversification
 */
export async function onboardInvestor() {
  const investorProfile: UserProfile = {
    id: 'profile_inv_001',
    userId: 'user_inv_001',
    personaType: PersonaType.INVESTOR,
    riskTolerance: 'high',
    spendingBehavior: 'conservative',
    
    // Financial characteristics
    incomeLevel: 500000, // $500k/year
    incomeStability: 0.92,
    age: 45,
    region: 'US',
    currency: 'USD',
    
    // Situation
    financialGoals: ['wealth_optimization', 'early_retirement', 'dividend_income'],
    investmentExperience: 'advanced',
    debtLevel: 0,
    employmentStatus: 'employed',
    familySize: 2,
    
    // System settings
    emergencyFundPriority: false, // Has plenty of cash
    automateInsights: true,
    allowPortfolioAdjustments: true,
    
    // Personalization
    riskAversionMultiplier: 1.0,
    savingsGoalMultiplier: 1.5,
    investmentReadinessScore: 0.95,
    
    // Behavioral data
    insightsActionedCount: 0,
    insightsIgnoredCount: 0,
    engagementScore: undefined,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('\n\n=== INVESTOR ONBOARDING ===\n');
  console.log(`Profile: ${investorProfile.personaType}`);
  console.log(`Income: $${investorProfile.incomeLevel.toLocaleString()}/year`);
  console.log(`Investment Experience: ${investorProfile.investmentExperience}`);

  // Portfolio allocation
  const allocation = getRecommendedAllocation(investorProfile);
  console.log(`\nRecommended Allocation:`);
  console.log(`  40% Stocks`);
  console.log(`  20% Bonds`);
  console.log(`  20% Real Estate`);
  console.log(`  10% Crypto`);
  console.log(`  8% Commodities`);
  console.log(`  2% Cash`);

  // Emphasis rules
  console.log(`\nEmphasized Rules:`);
  console.log('  ✓ Portfolio concentration risk (alert at 35%)');
  console.log('  ✓ Tax-loss harvesting (quarterly)');
  console.log('  ✓ Rebalancing opportunities');
  console.log('  ✓ Dividend income tracking');

  // Deemphasized rules
  console.log(`\nDeemphasized Rules:`);
  console.log('  ✗ Emergency fund alerts (has $200k+)');
  console.log('  ✗ Low savings rate warnings (saves $300k+/year)');

  // Investment readiness
  const canInvest = isUserReadyForInvestments(
    investorProfile,
    150000, // Current emergency fund
    15000 // Monthly expenses
  );
  console.log(`\nInvestment Ready: ${canInvest}`);

  console.log(`\nSystem Personalizations:`);
  console.log('  ✓ Advanced analytics dashboard');
  console.log('  ✓ Tax optimization recommendations');
  console.log('  ✓ Quarterly rebalancing analysis');
  console.log('  ✓ Economic indicators and sector exposure');
}

// ============================================================================
// SCENARIO 4: EMERGING MARKET USER
// ============================================================================

/**
 * User in emerging market (Nigeria example)
 * System adapts for currency volatility, stablecoins, limited investment options
 */
export async function onboardEmergingMarketUser() {
  const emProfile: UserProfile = {
    id: 'profile_em_001',
    userId: 'user_em_001',
    personaType: PersonaType.EMERGING_MARKET_USER,
    riskTolerance: 'very_low',
    spendingBehavior: 'aggressive',
    
    // Financial characteristics
    incomeLevel: 8000, // ₦4M/month ≈ $8k/year average
    incomeStability: 0.38,
    age: 32,
    region: 'NG', // Nigeria
    currency: 'NGN',
    
    // Situation
    financialGoals: ['emergency_fund', 'stable_savings', 'currency_protection'],
    investmentExperience: 'none',
    debtLevel: 500, // Small informal debt
    employmentStatus: 'self_employed',
    familySize: 3,
    
    // System settings
    emergencyFundPriority: true,
    automateInsights: true,
    allowPortfolioAdjustments: false,
    
    // Personalization
    riskAversionMultiplier: 1.2, // More conservative
    savingsGoalMultiplier: 0.6, // Lower savings target (limited surplus)
    investmentReadinessScore: 0.15,
    
    // Behavioral data
    insightsActionedCount: 0,
    insightsIgnoredCount: 0,
    engagementScore: undefined,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('\n\n=== EMERGING MARKET USER ONBOARDING ===\n');
  console.log(`Profile: ${emProfile.personaType}`);
  console.log(`Region: Nigeria (NGN currency)`);
  console.log(`Income: ₦${(emProfile.incomeLevel * 500).toLocaleString()}/year`);
  console.log(`Employment: ${emProfile.employmentStatus}`);
  console.log(`Family Size: ${emProfile.familySize}`);

  // Emergency fund target
  const monthlyExpenses = 600; // ₦300k ≈ $600/month
  const emergencyFundTarget = getEmergencyFundTarget(emProfile, monthlyExpenses);
  console.log(`\nEmergency Fund Target: ${monthlyExpenses} (1 month only)`);
  console.log(`  Reasoning: Limited investment options, cash accessibility priority`);

  // Portfolio allocation (localized)
  console.log(`\nRecommended Allocation:`);
  console.log(`  70% NGN Savings (local currency accessibility)`);
  console.log(`  20% Stablecoins (USDC/USDT - currency protection)`);
  console.log(`  10% Naira Stocks (growth potential)`);

  // Personalized thresholds
  const savingsThreshold = getPersonalizedThreshold(
    emProfile,
    'low_savings_alert',
    0.25
  );
  console.log(`\nPersonalized Thresholds:`);
  console.log(`  Low Savings Alert: ${(savingsThreshold * 100).toFixed(0)}% (vs 25% for others)`);
  console.log(`  Portfolio Concentration: Very high allowed (60%+ in cash OK)`);

  // Rules emphasis
  console.log(`\nEmphasized Rules:`);
  console.log('  ✓ Currency volatility management');
  console.log('  ✓ Stablecoin allocation recommendations');
  console.log('  ✓ Cash savings prioritization');
  console.log('  ✓ Income instability coping');

  // Deemphasized
  console.log(`\nDeemphasized Rules:`);
  console.log('  ✗ Portfolio diversification (limited options)');
  console.log('  ✗ Investment recommendations (not ready)');

  console.log(`\nSystem Personalizations:`);
  console.log('  ✓ NGN currency display throughout');
  console.log('  ✓ Stablecoin education and setup');
  console.log('  ✓ Monthly savings strategy (adjust for seasonality)');
  console.log('  ✓ Local payment integration (M-Pesa, bank transfers)');
}

// ============================================================================
// SCENARIO 5: BEHAVIORAL LEARNING
// ============================================================================

/**
 * System learns from user behavior and adapts over time
 * User actions on insights update profile, which changes future recommendations
 */
export async function demonstrateBehavioralLearning() {
  console.log('\n\n=== BEHAVIORAL LEARNING EXAMPLE ===\n');

  // Start with young professional
  let profile = personaConfigs[PersonaType.YOUNG_PROFESSIONAL];

  console.log('MONTH 1: User Profile Created');
  console.log(
    `  Initial engagementScore: undefined (new user)`
  );
  console.log(`  System shows: Balanced insights (5-7 per week)`);

  // User acts on insights consistently
  console.log('\nMONTH 2-3: User Engages with Insights');
  console.log('  User actions on insights:');
  console.log('    ✓ Acted on: 12 insights');
  console.log('    ✗ Ignored: 2 insights');
  console.log(`  Calculated engagementScore: 0.86 (12/14)`);

  console.log('\nMONTH 4: System Response to High Engagement');
  console.log('  engagementScore > 0.8, so:');
  console.log('    ✓ Unlock advanced features');
  console.log('    ✓ Enable portfolio adjustments');
  console.log('    ✓ Show predictive insights (forecasting)');
  console.log('    ✓ Recommend optimization strategies');

  // User changes behavior
  console.log('\nMONTH 5-6: User Behavior Changes');
  console.log('  Financial metrics change:');
  console.log('    • Savings rate increases to 45% (was 25%)');
  console.log('    • Builds investment portfolio');
  console.log('    • Debt decreases significantly');

  console.log('\nMONTH 7: Persona Re-assessment');
  console.log('  System detects: Changed to Investor characteristics?');
  console.log('  Assessment shows:');
  console.log('    • Income stable: 0.82');
  console.log('    • Savings rate: 45% (high)');
  console.log('    • Investment experience: "intermediate" (improved)');
  console.log('    • Recommended new persona: INVESTOR');

  console.log('\nMONTH 8+: New Persona Applied');
  console.log('  System adjusts:');
  console.log('    ✓ Rule weights change (emphasize diversification)');
  console.log('    ✓ Thresholds update (stricter concentration alert)');
  console.log('    ✓ Insights refocused (tax optimization, rebalancing)');
  console.log('    ✓ Features enabled (advanced analytics, tax reports)');
}

// ============================================================================
// RUN ALL SCENARIOS
// ============================================================================

export async function runAllIntegrationExamples() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    USER PROFILE SYSTEM - COMPLETE INTEGRATION EXAMPLES        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  await onboardStudentUser();
  await onboardYoungProfessional();
  await onboardInvestor();
  await onboardEmergingMarketUser();
  await demonstrateBehavioralLearning();

  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        END OF EXAMPLES                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIntegrationExamples().catch(console.error);
}
