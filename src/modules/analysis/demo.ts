#!/usr/bin/env node

/**
 * PERSONALIZATION SYSTEM - RUNNABLE EXAMPLES
 * 
 * This file demonstrates the complete personalization system in action
 * Run with: npx tsx src/modules/analysis/demo.ts
 */

// Mock implementation for demo purposes (no database required)

interface UserProfile {
  personaType: string;
  incomeLevel: number;
  incomeStability: number;
  riskTolerance: string;
  investmentExperience: string;
  debtLevel: number;
  emergencyFundBalance: number;
  monthlyExpenses: number;
  investmentReadinessScore: number;
}

// ============================================================================
// DEMO 1: STUDENT PROFILE
// ============================================================================

function demoStudentProfile() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 1: STUDENT PERSONA');
  console.log('='.repeat(70) + '\n');

  const student: UserProfile = {
    personaType: 'STUDENT',
    incomeLevel: 12000,
    incomeStability: 0.35,
    riskTolerance: 'very_low',
    investmentExperience: 'none',
    debtLevel: 15000,
    emergencyFundBalance: 500,
    monthlyExpenses: 1000,
    investmentReadinessScore: 0.1,
  };

  console.log('📊 PROFILE CHARACTERISTICS');
  console.log(`   Income:              $${student.incomeLevel}/year (${student.incomeStability}x stability)`);
  console.log(`   Debt:                $${student.debtLevel} (student loans)`);
  console.log(`   Employment:          Part-time student`);
  console.log(`   Risk Tolerance:      Very Low`);
  console.log(`   Investment Ready:    No (score: 0.1/1.0)\n`);

  console.log('🎯 SYSTEM PERSONALIZATIONS');
  console.log(`   Emergency Fund Target:       $${student.monthlyExpenses * 2} (2 months)`);
  console.log(`   Savings Rate Goal:           15% (reduced from 25%)`);
  console.log(`   Portfolio Allocation:       100% Cash`);
  console.log(`   Priority Rules:\n`);
  console.log(`     ✓ Emergency fund building (1.5x weight)`);
  console.log(`     ✓ Expense tracking (1.4x weight)`);
  console.log(`     ✓ Debt awareness (1.5x weight)`);
  console.log(`     ✓ Income instability management (1.3x weight)\n`);
  console.log(`   Deemphasized Rules:\n`);
  console.log(`     ✗ Portfolio diversification (0.5x weight)`);
  console.log(`     ✗ Investment recommendations (0.5x weight)\n`);

  console.log('💡 SYSTEM INSIGHTS (Monthly)');
  console.log(`   1. Emergency Fund Alert (HIGH)`);
  console.log(`      "You have $${student.emergencyFundBalance}. Goal: $${student.monthlyExpenses * 2}.`);
  console.log(`      Set aside $250/month to reach target in 8 months."\n`);

  console.log(`   2. Income Instability Alert (HIGH)`);
  console.log(`      "Your income varies ±65%. Adjust expectations for:`);
  console.log(`      • Summer months: Higher income, save 25%`);
  console.log(`      • School months: Lower income, save 5% is OK"\n`);

  console.log(`   3. Debt Repayment Strategy (HIGH)`);
  console.log(`      "With $15k student debt, prioritize repayment over investing.`);
  console.log(`      Current loan cost: ~$150/month. Consider income-driven repayment."\n`);

  console.log(`   4. Expense Category Alert (MEDIUM)`);
  console.log(`      "Food spending: $350/month (normal for students).`);
  console.log(`      Could save $50-75/month with meal planning."\n`);

  console.log('📱 UI/UX ADAPTATIONS');
  console.log('   ✓ Emergency fund prominently displayed');
  console.log('   ✓ Debt tracker with payoff calculator');
  console.log('   ✓ Monthly budget templates for students');
  console.log('   ✗ Investment/trading features hidden');
  console.log('   ✗ Portfolio construction tools disabled\n');
}

// ============================================================================
// DEMO 2: YOUNG PROFESSIONAL PROFILE
// ============================================================================

function demoYoungProfessionalProfile() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 2: YOUNG PROFESSIONAL PERSONA');
  console.log('='.repeat(70) + '\n');

  const yp: UserProfile = {
    personaType: 'YOUNG_PROFESSIONAL',
    incomeLevel: 85000,
    incomeStability: 0.75,
    riskTolerance: 'medium',
    investmentExperience: 'beginner',
    debtLevel: 35000,
    emergencyFundBalance: 12000,
    monthlyExpenses: 3500,
    investmentReadinessScore: 0.65,
  };

  console.log('📊 PROFILE CHARACTERISTICS');
  console.log(`   Income:              $${yp.incomeLevel}/year (${yp.incomeStability}x stability)`);
  console.log(`   Debt:                $${yp.debtLevel} (loans + car)`);
  console.log(`   Employment:          Full-time salaried`);
  console.log(`   Risk Tolerance:      Medium`);
  console.log(`   Investment Ready:    Yes (score: 0.65/1.0)\n`);

  console.log('🎯 SYSTEM PERSONALIZATIONS');
  console.log(`   Emergency Fund Target:       $${yp.monthlyExpenses * 3} (3 months)`);
  console.log(`   Savings Rate Goal:           25% ($21,250/year)`);
  console.log(`   Portfolio Allocation:       60% Stocks / 30% Bonds / 10% Cash`);
  console.log(`   Priority Rules:\n`);
  console.log(`     ✓ Goal progress tracking (1.4x weight)`);
  console.log(`     ✓ Savings rate monitoring (1.2x weight)`);
  console.log(`     ✓ Housing cost optimization (1.3x weight)`);
  console.log(`     ✓ Portfolio balance (1.2x weight)\n`);

  console.log('💡 SYSTEM INSIGHTS (Monthly)');
  console.log(`   1. Goal Progress Dashboard (HIGH)`);
  console.log(`      ✓ Home down payment: $32k / $50k (64%)`);
  console.log(`      ✓ Retirement (401k): $18k / $100k (18%)`);
  console.log(`      ✓ Emergency fund: $12k / $10.5k (115%) ✓ COMPLETE\n`);

  console.log(`   2. Housing Cost Alert (MEDIUM)`);
  console.log(`      "Rent is $1,200/month (34% of income). Optimal: ≤28%.`);
  console.log(`      Potential savings: $2,160/year (move, negotiate, roommate)."\n`);

  console.log(`   3. Debt Payoff Strategy (MEDIUM)`);
  console.log(`      "Pay off $35k debt in ~7 years at current rate.`);
  console.log(`      Increase payments by $200/month to finish in 5 years."\n`);

  console.log(`   4. Investment Readiness Alert (MEDIUM)`);
  console.log(`      "You meet investment criteria:`);
  console.log(`      ✓ Emergency fund: $12k (adequate)`);
  console.log(`      ✓ Income stability: 0.75 (good)`);
  console.log(`      ✓ Investment experience: beginner (learning)`);
  console.log(`      Ready to open Roth IRA or brokerage account."\n`);

  console.log('📱 UI/UX ADAPTATIONS');
  console.log('   ✓ Goal tracking as primary dashboard');
  console.log('   ✓ Milestone celebrations (e.g., "Down payment halfway!")');
  console.log('   ✓ Suggested investment allocations');
  console.log('   ✓ Debt payoff calculator');
  console.log('   ✓ Monthly budget templates');
  console.log('   ✗ Advanced tax strategies (not needed)\n');
}

// ============================================================================
// DEMO 3: INVESTOR PROFILE
// ============================================================================

function demoInvestorProfile() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 3: INVESTOR PERSONA');
  console.log('='.repeat(70) + '\n');

  const investor: UserProfile = {
    personaType: 'INVESTOR',
    incomeLevel: 500000,
    incomeStability: 0.92,
    riskTolerance: 'high',
    investmentExperience: 'advanced',
    debtLevel: 0,
    emergencyFundBalance: 150000,
    monthlyExpenses: 15000,
    investmentReadinessScore: 0.95,
  };

  console.log('📊 PROFILE CHARACTERISTICS');
  console.log(`   Income:              $${investor.incomeLevel.toLocaleString()}/year`);
  console.log(`   Debt:                $0 (fully paid)`);
  console.log(`   Employment:          Executive / Established`);
  console.log(`   Risk Tolerance:      High`);
  console.log(`   Investment Ready:    Excellent (score: 0.95/1.0)\n`);

  console.log('🎯 SYSTEM PERSONALIZATIONS');
  console.log(`   Emergency Fund Target:       $${investor.monthlyExpenses * 6} (6 months)`);
  console.log(`   Savings Rate Goal:           50% ($250k/year)`);
  console.log(`   Portfolio Allocation:       40% Stocks / 20% Bonds / 20% RE / 10% Crypto`);
  console.log(`   Priority Rules:\n`);
  console.log(`     ✓ Portfolio concentration (1.5x weight - EMPHASIZED)`);
  console.log(`     ✓ Tax optimization (1.4x weight)`);
  console.log(`     ✓ Rebalancing (1.3x weight)`);
  console.log(`     ✓ Dividend tracking (1.4x weight)\n`);
  console.log(`   Deemphasized Rules:\n`);
  console.log(`     ✗ Emergency fund alerts (0.5x weight)`);
  console.log(`     ✗ Savings rate warnings (0.5x weight)\n`);

  console.log('💡 SYSTEM INSIGHTS (Monthly)');
  console.log(`   1. Tax-Loss Harvesting Opportunity (HIGH)`);
  console.log(`      "Q2 review: Realized gains $18k, unrealized losses $2.3k.`);
  console.log(`      Strategy: Sell losing positions, rebalance into similar assets.`);
  console.log(`      Tax savings: ~$690 (at 30% rate)."\n`);

  console.log(`   2. Portfolio Concentration Alert (HIGH)`);
  console.log(`      "Tech stocks now 38% of portfolio (threshold: 35%).`);
  console.log(`      Consider rebalancing into Healthcare (8%) or Finance (12%)."\n`);

  console.log(`   3. Dividend Income Report (MEDIUM)`);
  console.log(`      "Quarterly dividend income: $4,250`);
  console.log(`      YTD passive income: $16,800`);
  console.log(`      DRIP reinvestment: On (compounds growth)."\n`);

  console.log(`   4. Rebalancing Recommendation (MEDIUM)`);
  console.log(`      "Portfolio drift detected:`);
  console.log(`      • Target: 40% stocks | Current: 42%`);
  console.log(`      • Target: 20% bonds | Current: 18%`);
  console.log(`      Action: Redirect $2k dividends to bonds."\n`);

  console.log('📱 UI/UX ADAPTATIONS');
  console.log('   ✓ Advanced analytics dashboard');
  console.log('   ✓ Tax optimization recommendations');
  console.log('   ✓ Sector exposure analysis');
  console.log('   ✓ Dividend tracking and DRIP');
  console.log('   ✓ Tax-loss harvesting calculator');
  console.log('   ✓ Rebalancing strategy simulator');
  console.log('   ✗ Emergency fund reminders (dismissed)\n');
}

// ============================================================================
// DEMO 4: EMERGING MARKET PROFILE
// ============================================================================

function demoEmergingMarketProfile() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 4: EMERGING MARKET USER PERSONA');
  console.log('='.repeat(70) + '\n');

  const em: UserProfile = {
    personaType: 'EMERGING_MARKET_USER',
    incomeLevel: 8000,
    incomeStability: 0.38,
    riskTolerance: 'very_low',
    investmentExperience: 'none',
    debtLevel: 500,
    emergencyFundBalance: 400,
    monthlyExpenses: 600,
    investmentReadinessScore: 0.15,
  };

  console.log('📊 PROFILE CHARACTERISTICS');
  console.log(`   Income:              $${em.incomeLevel}/year (≈ ₦${(em.incomeLevel * 500).toLocaleString()}/year)`);
  console.log(`   Currency:            NGN (Nigerian Naira)`);
  console.log(`   Region:              Nigeria`);
  console.log(`   Debt:                $${em.debtLevel} (small informal)`);
  console.log(`   Employment:          Self-employed`);
  console.log(`   Risk Tolerance:      Very Low`);
  console.log(`   Investment Ready:    No (score: 0.15/1.0)\n`);

  console.log('🎯 SYSTEM PERSONALIZATIONS');
  console.log(`   Emergency Fund Target:       $${em.monthlyExpenses * 1} (1 month only)`);
  console.log(`   Savings Rate Goal:           10% (vs 25% global default)`);
  console.log(`   Portfolio Allocation:       70% NGN Savings / 20% Stablecoins / 10% Naira Stocks`);
  console.log(`   Currency Display:            NGN throughout app`);
  console.log(`   Payment Methods:             M-Pesa, bank transfers`);
  console.log(`   Priority Rules:\n`);
  console.log(`     ✓ Currency volatility management (EMPHASIZED)`);
  console.log(`     ✓ Stablecoin recommendations`);
  console.log(`     ✓ Emergency fund building`);
  console.log(`     ✓ Income instability coping\n`);
  console.log(`   Deemphasized Rules:\n`);
  console.log(`     ✗ Portfolio diversification (limited options)`);
  console.log(`     ✗ Investment recommendations\n`);

  console.log('💡 SYSTEM INSIGHTS (Monthly)');
  console.log(`   1. Currency Protection Alert (HIGH)`);
  console.log(`      "Naira volatility: ±8% this month.`);
  console.log(`      Recommendation: Hold 20% in USDC stablecoins.`);
  console.log(`      You could have protected ₦160k this month."\n`);

  console.log(`   2. Emergency Fund Status (HIGH)`);
  console.log(`      "Current: ₦200k (~$400). Goal: ₦300k (~$600).`);
  console.log(`      Save ₦30k/month for 4 months to reach target."\n`);

  console.log(`   3. Income Stability Alert (MEDIUM)`);
  console.log(`      "Income varies ±62% month-to-month.`);
  console.log(`      High months (₦400k): Save 15%`);
  console.log(`      Low months (₦200k): Save 5% is acceptable."\n`);

  console.log(`   4. Savings Strategy (MEDIUM)`);
  console.log(`      "Recommended allocation:`);
  console.log(`      • 70% Local NGN savings (daily access)`);
  console.log(`      • 20% USDC stablecoins (protection)`);
  console.log(`      • 10% Naira stocks (growth)\n`);

  console.log('📱 UI/UX ADAPTATIONS');
  console.log('   ✓ All amounts displayed in NGN');
  console.log('   ✓ Exchange rate calculator (NGN ↔ USD)');
  console.log('   ✓ Stablecoin education module');
  console.log('   ✓ M-Pesa integration for transfers');
  console.log('   ✓ Regional payment options');
  console.log('   ✓ Local economic indicators');
  console.log('   ✗ US stock market features (not applicable)');
  console.log('   ✗ Complex derivative strategies\n');
}

// ============================================================================
// DEMO 5: BEHAVIORAL LEARNING
// ============================================================================

function demoBehavioralLearning() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO 5: BEHAVIORAL LEARNING OVER TIME');
  console.log('='.repeat(70) + '\n');

  console.log('👤 TIMELINE: Young Professional');
  console.log('   Starting: 27 year old with $75k salary\n');

  console.log('📅 MONTH 1: Profile Created');
  console.log('   • Persona: YOUNG_PROFESSIONAL');
  console.log('   • Engagement Score: undefined (new user)');
  console.log('   • System shows: 5-7 insights/week (balanced)');
  console.log('   • Features enabled: Basic\n');

  console.log('📅 MONTHS 2-3: User Engages Frequently');
  console.log('   • User acts on 12 insights, ignores 2');
  console.log('   • Engagement Score: 0.86 (12 ÷ 14)');
  console.log('   • System detects: High engagement pattern\n');

  console.log('📅 MONTH 4: System Response');
  console.log('   ⚠️  Trigger: engagementScore > 0.8');
  console.log('   ✓ Action: Unlock advanced features');
  console.log('   ✓ Action: Enable portfolio adjustments');
  console.log('   ✓ Action: Show predictive insights');
  console.log('   Profile updated: allowPortfolioAdjustments = true\n');

  console.log('📅 MONTHS 5-6: Behavior Changes');
  console.log('   • Savings rate: 25% → 45% (large increase)');
  console.log('   • Debt: $35k → $25k (paying down fast)');
  console.log('   • Portfolio: Started investing ($30k invested)');
  console.log('   • Engagement: Still high (0.83 this period)\n');

  console.log('📅 MONTH 7: Persona Re-assessment Runs');
  console.log('   System checks: Should persona change?');
  console.log('   Metrics analyzed:');
  console.log('   • Income stability: 0.75 → 0.82 (stable)');
  console.log('   • Savings rate: 45% (high - investor-like)');
  console.log('   • Investment portfolio: $30k (growing)');
  console.log('   • Debt ratio: Improved\n');
  console.log('   🎯 Recommendation: INVESTOR persona\n');

  console.log('📅 MONTH 8: Persona Switch');
  console.log('   ✓ System notifies: "Based on your financial progress,');
  console.log('     you\'ve moved to an INVESTOR profile!"');
  console.log('   ✓ Profile updated: personaType = INVESTOR');
  console.log('   ✓ Rule weights recalculated');
  console.log('   ✓ Thresholds updated');
  console.log('   ✓ UI refreshed with new features\n');

  console.log('📅 MONTH 9+: INVESTOR Experience');
  console.log('   Rule emphasis changed:');
  console.log('   ✗ Goal tracking (was 1.4x, now standard)');
  console.log('   ✓ Tax optimization (now 1.4x weight)');
  console.log('   ✓ Portfolio concentration (now 1.5x weight)');
  console.log('   ✓ Diversification (now 1.5x weight)');
  console.log('   ✓ Dividend tracking (enabled)');
  console.log('   ✗ Emergency fund alerts (now deemphasized)\n');

  console.log('📊 Insights Changed:');
  console.log('   OLD (Young Professional):');
  console.log('   • Goal progress tracking');
  console.log('   • Housing cost optimization');
  console.log('   • Budget recommendations\n');
  console.log('   NEW (Investor):');
  console.log('   • Tax-loss harvesting opportunities');
  console.log('   • Portfolio rebalancing');
  console.log('   • Sector exposure analysis');
  console.log('   • Dividend income tracking\n');
}

// ============================================================================
// MAIN DEMO
// ============================================================================

function main() {
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  USER PERSONA & PERSONALIZATION SYSTEM - COMPLETE DEMO'.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  demoStudentProfile();
  demoYoungProfessionalProfile();
  demoInvestorProfile();
  demoEmergingMarketProfile();
  demoBehavioralLearning();

  console.log('\n' + '═'.repeat(70));
  console.log('END OF DEMO');
  console.log('═'.repeat(70));
  console.log('\n📖 For implementation details, see:');
  console.log('   • src/modules/personas.ts - Persona configurations');
  console.log('   • src/modules/analysis/personalization-rules.ts - Rules');
  console.log('   • src/modules/analysis/PERSONAS.md - Complete documentation\n');
}

main();
