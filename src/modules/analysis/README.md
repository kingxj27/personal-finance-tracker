# IFOS Insight Engine - Documentation

## Overview

The **Intelligent Financial Operating System (IFOS) Insight Engine** is a rule-based system that analyzes user financial data and generates actionable, personalized insights. It answers the question: **"What should the user do next to improve their financial health?"**

## Architecture

### Core Components

1. **InsightEngine** - Main analysis engine that applies financial rules
2. **FinancialData** - Input data structure containing all user financial information
3. **Insight** - Output structure representing a single actionable insight
4. **Rules** - 12 financial analysis rules covering different aspects

## Input Data Structure

```typescript
interface FinancialData {
  transactions: Transaction[];      // All financial transactions
  monthlyIncome: number;             // Total monthly income
  totalExpenses: number;             // Total monthly expenses
  categoryBreakdown: {               // Spending by category
    [category: string]: number;
  };
  savingsRate: number;               // 0-1 (e.g., 0.25 = 25%)
  portfolioAllocation: {             // Asset allocation percentages
    [assetClass: string]: number;
  };
  goals: Goal[];                     // Financial goals
  userProfile: {                     // User characteristics
    type: 'STUDENT' | 'YOUNG_PROFESSIONAL' | 'INVESTOR';
    riskTolerance: 'low' | 'medium' | 'high';
    incomeStability: number;         // 0-1
  };
  emergencyFundAmount?: number;      // Optional emergency fund balance
}
```

## Output Format

```typescript
interface Insight {
  id: string;                  // Unique identifier
  type: string;               // Rule type (e.g., 'overspending')
  message: string;            // Clear, specific insight message
  severity: 'low' | 'medium' | 'high';  // Importance level
  category: InsightCategory;   // spending | saving | investing | risk | goals | income | planning
  action: string;             // Specific, actionable recommendation
  priority: number;           // 1-10, higher = more important
  metrics?: Record<string, number | string>;  // Relevant data
}
```

## Financial Rules (12 Total)

### Rule 1: Overspending in Categories
**Triggers:** When a category exceeds recommended % of income
```
Examples:
- Food > 30% of income
- Entertainment > 15% of income
- Housing > 50% of income
```
**Severity:** Medium-High
**Action:** Specific dollar amount to reduce spending

---

### Rule 2: Low Savings Rate
**Triggers:** Savings rate < 20% (minimum recommended)
```
Calculation: (Monthly Income - Total Expenses) / Monthly Income
```
**Severity:** Medium-High
**Action:** Increase monthly savings to reach 20%+

---

### Rule 3: Category Imbalance
**Triggers:** Single expense category > 40% of total expenses
**Severity:** Medium
**Action:** Diversify spending across categories

---

### Rule 4: Portfolio Concentration Risk
**Triggers:** Single asset class > 60% of portfolio
```
Examples:
- 70% stocks = concentration risk
- 85% real estate = high risk
```
**Severity:** Medium-High
**Action:** Rebalance to specific allocation percentages

---

### Rule 5: Goal Progress Tracking
**Triggers:** Goal off-track relative to deadline
```
Condition: Progress % < Time Remaining % * 0.8
```
**Severity:** High (if off-track)
**Action:** Calculate monthly savings needed to reach goal

---

### Rule 6: Income Instability
**Triggers:** Income stability score < 0.5
**Severity:** High
**Action:** Build 6-month emergency fund (vs 3-month standard)

---

### Rule 7: Emergency Fund
**Triggers:** Emergency fund < 3 months of income
**Severity:** Medium-High (depends on current amount)
**Action:** Specific savings target

---

### Rule 8: Housing Cost Ratio
**Triggers:** Housing cost > 30% of monthly income
**Severity:** Medium-High
**Action:** Find more affordable housing or increase income

---

### Rule 9: Highest Expense Category
**Triggers:** Largest expense category > 30% of total expenses
**Severity:** Low (informational)
**Action:** Review category for optimization opportunities

---

### Rule 10: Portfolio Allocation Mismatch
**Triggers:** Stock allocation misaligned with risk tolerance
```
Risk Profile Recommendations:
- Low: 30% stocks
- Medium: 60% stocks
- High: 80% stocks
```
**Severity:** Medium
**Action:** Rebalance to match risk tolerance

---

### Rule 11: Investment Diversity
**Triggers:** Portfolio has < 3 asset types
**Severity:** Medium
**Action:** Add exposure to different asset classes

---

### Rule 12: Savings Goal for User Profile
**Triggers:** Student/Young Professional with savings rate < 25%
**Severity:** Medium
**Action:** Increase savings rate to 25%

---

## Usage Examples

### Basic Usage

```typescript
import { createInsightEngine } from './modules/analysis';

// Create engine
const engine = createInsightEngine();

// Prepare financial data
const financialData = {
  transactions: [...],
  monthlyIncome: 150000,
  totalExpenses: 110000,
  categoryBreakdown: { /* ... */ },
  savingsRate: 0.27,
  portfolioAllocation: { /* ... */ },
  goals: [...],
  userProfile: {
    type: 'YOUNG_PROFESSIONAL',
    riskTolerance: 'medium',
    incomeStability: 0.85
  },
  emergencyFundAmount: 400000
};

// Generate insights
const insights = engine.analyze(financialData);

// Insights are already prioritized!
insights.forEach(insight => {
  console.log(`[${insight.severity}] ${insight.message}`);
  console.log(`Action: ${insight.action}`);
});
```

### Testing with Mock Data

```typescript
import { runAllTests, analyzeScenario } from './modules/analysis/insights.test';

// Run all test scenarios
runAllTests();

// Or analyze a specific scenario
const result = analyzeScenario(
  'Young Professional',
  mockDataYoungProfessional
);
```

## Key Features

### 1. Prioritization Logic
Insights are ranked by:
- **Priority score** (1-10, built into each rule)
- **Severity** (high = +3, medium = +2, low = +1)
- **Category importance** (risk, income = 3x, goals, saving = 2x)

**Higher scores appear first** - Most actionable insights first!

### 2. Deduplication
- Prevents duplicate insights (e.g., multiple "overspending" rules)
- Keeps highest severity version of similar insights
- Reduces noise while maintaining coverage

### 3. Specificity
Every insight includes:
- ✅ Specific numbers/percentages
- ✅ Current vs. recommended values
- ✅ Exact action to take
- ✅ Relevant metrics attached

### 4. Persona-Aware
Rules adapt to user type:
- **Student:** Focus on emergency fund (6 months)
- **Young Professional:** Balanced investing, 25% savings goal
- **Investor:** Portfolio concentration, diversification

## Integration Points

### With Backend
```typescript
// In your API endpoint
POST /api/insights
{
  "financialData": { ... }
}

// Returns prioritized insights
```

### With Asset Allocation Module
```typescript
import { calculateAllocation } from './modules/analysis';

// Get allocation percentages
const allocations = calculateAllocation(assets);

// Pass to insights engine
const portfolioAllocation = allocations;
```

### With User Personas
```typescript
import { getPersonaConfig } from './modules/personas';

// Get persona-specific recommendations
const config = getPersonaConfig('STUDENT');
// Suggests emergency fund strategy specific to students
```

## Performance Considerations

- **Time Complexity:** O(n) where n = number of rules (12)
- **Space Complexity:** O(m) where m = number of insights generated (typically 5-8)
- **Typical Runtime:** < 1ms for full analysis

## Future Enhancements

1. **Machine Learning:** Predict future spending patterns
2. **Comparative Insights:** "You spend 20% more on food than similar users"
3. **Temporal Analysis:** Track insight effectiveness over time
4. **Custom Rules:** Allow users to create personal financial rules
5. **Integration:** Connect with banking APIs for real-time data
6. **Notifications:** Alert users when new high-priority insights appear

## Testing

### Run All Tests
```bash
# In browser console
import { runAllTests } from './modules/analysis/insights.test'
runAllTests()
```

### Test Output Structure
```
📊 SCENARIO: Young Professional
├─ 📈 Summary
│  ├─ Total Insights: 3
│  ├─ High/Medium/Low: 0/2/1
│  └─ By Category: { spending: 1, saving: 1, ... }
└─ 💡 Insights (Priority Order)
   ├─ 1. 🟡 [SAVING] low_savings
   │  ├─ Message: ...
   │  └─ Action: ...
   └─ 2. 🟢 [PLANNING] ...
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No insights generated | Check if all required fields in FinancialData are populated |
| Insights seem generic | Add more transaction details for category breakdown |
| Wrong severity levels | Verify thresholds match your currency and region |
| Missing category | Check if category exists in threshold configurations |

## API Reference

### Main Class: InsightEngine

```typescript
class InsightEngine {
  // Main method
  analyze(data: FinancialData): Insight[]
  
  // Private helper methods (for internal use)
  private checkOverspendingInCategories(data: FinancialData): void
  private checkLowSavingsRate(data: FinancialData): void
  private checkCategoryImbalance(data: FinancialData): void
  // ... and 9 more rule methods
  
  private deduplicateInsights(insights: Insight[]): Insight[]
  private prioritizeInsights(insights: Insight[]): Insight[]
}
```

### Factory Function

```typescript
export const createInsightEngine = (): InsightEngine
```

---

**Version:** 1.0.0  
**Last Updated:** April 27, 2026  
**Status:** Production Ready ✅
