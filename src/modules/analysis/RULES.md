# IFOS Insight Engine - 12 Financial Rules Quick Reference

## Summary Table

| # | Rule | Trigger | Severity | Category | Action |
|---|------|---------|----------|----------|--------|
| 1 | **Overspending in Categories** | Food>30%, Entertainment>15%, Housing>50% of income | Medium-High | Spending | Reduce category by specific ₦ amount |
| 2 | **Low Savings Rate** | Savings < 20% | Medium-High | Saving | Increase savings to ₦X monthly |
| 3 | **Category Imbalance** | Single category > 40% of expenses | Medium | Spending | Diversify spending across categories |
| 4 | **Portfolio Concentration Risk** | Single asset > 60% | Medium-High | Risk | Rebalance to X% per asset |
| 5 | **Goal Progress Off-Track** | Progress % < Time Remaining % × 0.8 | High | Goals | Save ₦X monthly to reach goal |
| 6 | **Income Instability** | Income stability < 0.5 | High | Income | Build 6-month emergency fund |
| 7 | **Emergency Fund Low** | Fund < 3 months income | Medium-High | Saving | Build to ₦X (3 months) |
| 8 | **Housing Cost High** | Housing > 30% of income | Medium-High | Spending | Reduce housing ratio or increase income |
| 9 | **Largest Expense Alert** | Top category > 30% of expenses | Low | Spending | Review category for optimization |
| 10 | **Portfolio Mismatch** | Stock allocation ≠ risk tolerance (>15% diff) | Medium | Investing | Rebalance stocks to Y% |
| 11 | **Low Diversity** | < 3 asset types in portfolio | Medium | Risk | Add bonds/commodities/real estate |
| 12 | **Savings Goal (Profile-Specific)** | Student/YP with savings < 25% | Medium | Saving | Increase savings rate to 25% |

---

## Detailed Rule Specifications

### RULE 1: Overspending in Categories
```
Category Thresholds (% of Monthly Income):
├─ Food: 30% (triggers if exceeded)
├─ Entertainment: 15%
├─ Utilities: 15%
├─ Transportation: 20%
├─ Shopping: 15%
└─ Other: Configurable

Severity:
├─ High if: percentage > threshold × 1.5
└─ Medium if: percentage > threshold

Output:
├─ Current: "You spent ₦45,000 (30%) on food"
├─ Recommended: "Recommended is 30% = ₦45,000"
├─ Action: "Reduce food spending by ₦X"
└─ Priority: 8/10
```

---

### RULE 2: Low Savings Rate
```
Condition: savingsRate < 0.20 (20%)

Calculation:
  Savings Rate = (Monthly Income - Total Expenses) / Monthly Income

Severity:
├─ High if: savingsRate < 0.10
└─ Medium if: 0.10 ≤ savingsRate < 0.20

Output:
├─ Current: "Your savings rate is 12%"
├─ Target: "Recommended is 20%"
├─ Action: "Increase savings by ₦X monthly"
└─ Priority: 9/10
```

---

### RULE 3: Category Imbalance
```
Condition: (Category Amount / Total Expenses) > 0.40

Analysis:
├─ Calculates each category's % of total expenses
├─ Triggers if any exceeds 40%
└─ Flags concentration in expense categories

Severity:
├─ High if: percentage > 60%
└─ Medium if: 40% ≤ percentage ≤ 60%

Output:
├─ Alert: "Housing is 45% of your expenses"
├─ Recommendation: "Diversify spending"
└─ Priority: 7/10
```

---

### RULE 4: Portfolio Concentration Risk
```
Condition: (Asset Amount / Total Portfolio) > 0.60

Max Allocations:
├─ Single Asset: 60% (triggers alert)
├─ High Risk: > 80% (HIGH severity)
└─ Medium Risk: 60-80% (MEDIUM severity)

Output:
├─ Alert: "Stocks are 75% of your portfolio"
├─ Risk Level: "High concentration risk"
├─ Action: "Reduce stocks to 60%, add bonds"
└─ Priority: 10/10 (if HIGH severity)
```

---

### RULE 5: Goal Progress Off-Track
```
Condition:
  Progress % < (Time Remaining % × 0.8)

Example:
├─ Goal: ₦1M by Dec 31 (250 days)
├─ Current: ₦400K (40% progress)
├─ Expected: 20% progress (80 days passed)
├─ Status: OFF-TRACK (40% > 20%)
└─ Monthly Needed: ₦2,400/day = ₦72,000/month

Severity: HIGH (if off-track)

Output:
├─ Alert: "You're off-track for 'Vacation Fund'"
├─ Target: "₦200K by Aug 31"
├─ Current: "₦80K (40% complete)"
├─ Action: "Save ₦X monthly to reach goal"
└─ Priority: 9/10
```

---

### RULE 6: Income Instability
```
Condition: userProfile.incomeStability < 0.5

Risk Levels:
├─ < 0.3: Very High Variability (Students)
├─ 0.3-0.5: High Variability
├─ 0.5-0.7: Medium Variability
├─ 0.7-0.9: Low Variability (YP)
└─ > 0.9: Very Low Variability (Investors)

Action for < 0.5:
├─ Emergency Fund Target: 6 months (vs 3 for stable)
├─ Example: ₦50K monthly → Build ₦300K fund
└─ Reasoning: Buffer against income drops

Severity: HIGH
Priority: 10/10
```

---

### RULE 7: Emergency Fund Low
```
Minimum Requirements by Stability:
├─ Unstable Income: 6 months expenses
├─ Stable Income: 3 months expenses
└─ Very Stable: 2 months expenses

Calculation:
  Required = Monthly Income × Months
  Shortfall = Required - Current Fund

Example:
├─ Monthly Income: ₦100K
├─ Required (Stable): ₦300K
├─ Current: ₦100K
├─ Shortfall: ₦200K
└─ Action: "Build emergency fund by ₦200K"

Severity:
├─ High if: Fund < 1 month income
├─ Medium if: 1-3 months
└─ Low if: 3+ months
```

---

### RULE 8: Housing Cost Ratio
```
Benchmark: Housing Cost ≤ 30% of Monthly Income

Calculation:
  Housing Ratio = Housing Cost / Monthly Income

Example:
├─ Income: ₦150K
├─ Housing: ₦50K
├─ Ratio: 33.3% (EXCEEDS 30%)
└─ Action: "Reduce housing cost to ₦45K"

Severity:
├─ High if: Ratio > 50%
├─ Medium if: 30% < Ratio ≤ 50%
└─ Low if: Ratio ≤ 30%

Priority: 8/10
```

---

### RULE 9: Largest Expense Category Alert
```
Condition: Highest Category > 30% of Total Expenses

Purpose: Informational - raises awareness of spending patterns

Example:
├─ Total Expenses: ₦100K
├─ Highest: Housing ₦45K (45% of expenses)
├─ Alert: "Your largest expense is housing"
└─ Action: "Review housing costs for optimization"

Severity: LOW (informational only)
Priority: 5/10
```

---

### RULE 10: Portfolio Allocation Mismatch
```
Recommended Stock Allocation by Risk Tolerance:
├─ Low Risk: 30% stocks / 70% bonds+cash
├─ Medium Risk: 60% stocks / 40% bonds+cash
└─ High Risk: 80% stocks / 20% bonds+cash

Trigger: |Current Allocation - Recommended| > 15%

Example:
├─ Risk: Medium (Target 60% stocks)
├─ Current: 45% stocks
├─ Difference: 15% (EXACTLY at threshold)
├─ Recommendation: "Increase stocks to 60%"
└─ Action: "Rebalance: Buy stocks with ₦X"

Severity: MEDIUM
Priority: 7/10
```

---

### RULE 11: Investment Diversity
```
Minimum Asset Types: 3

Examples:
├─ Good: [Stocks, Bonds, Cash]
├─ Good: [Stocks, Real Estate, Bonds]
└─ Poor: [Cash only] or [Stocks, Bonds]

Suggestions for Diversification:
├─ Stocks (growth)
├─ Bonds (stable income)
├─ Real Estate (tangible assets)
├─ Commodities (inflation hedge)
└─ Crypto (alternative exposure)

Severity: MEDIUM
Priority: 6/10
Action: "Add ₦X to [suggested asset class]"
```

---

### RULE 12: Savings Goal (Profile-Specific)
```
Applies to: STUDENT or YOUNG_PROFESSIONAL profiles

Target Savings Rate: 25% (vs 20% general)

Reasoning:
├─ Students: Build wealth foundation early
├─ YP: Maximize compound growth years
└─ Both: 25% enables aggressive goal setting

Trigger: currentRate < 25% AND currentRate > 0%

Example:
├─ Profile: YOUNG_PROFESSIONAL
├─ Income: ₦150K
├─ Current Savings: ₦30K (20%)
├─ Target: ₦37.5K (25%)
├─ Action: "Save additional ₦7.5K monthly"

Severity: MEDIUM
Priority: 7/10
```

---

## Prioritization Algorithm

```
Insight Score = 
  (Priority × 10) 
  + (Severity Weight × 5) 
  + (Category Weight × 1)

Severity Weights:
├─ High: 3
├─ Medium: 2
└─ Low: 1

Category Weights:
├─ Risk: 3
├─ Income: 3
├─ Goals: 2
├─ Saving: 2
├─ Spending: 1
├─ Investing: 1
└─ Planning: 1

Higher Score = Higher Priority (appears first in list)
```

---

## Example Output

```json
[
  {
    "id": "income-instability",
    "type": "income_instability",
    "message": "Your income is unstable (stability: 35%). Build a larger emergency fund to weather income fluctuations.",
    "severity": "high",
    "category": "income",
    "action": "Build an emergency fund of ₦300,000 (6 months of income).",
    "priority": 10,
    "metrics": {
      "incomeStability": 0.35,
      "recommendedFund": 300000,
      "monthlyIncome": 50000
    }
  },
  {
    "id": "low-savings-rate",
    "type": "low_savings",
    "message": "Your savings rate is 8%, which is below the recommended 20%. You need to save ₦6,000 more monthly.",
    "severity": "high",
    "category": "saving",
    "action": "Increase monthly savings to ₦12,000.",
    "priority": 9,
    "metrics": {
      "currentRate": 0.08,
      "target": 0.2,
      "monthlyIncome": 60000
    }
  },
  {
    "id": "overspend-food",
    "type": "overspending",
    "message": "You spent ₦18,000 (36.0%) on food this month, exceeding the recommended 30%.",
    "severity": "high",
    "category": "spending",
    "action": "Reduce food spending by ₦3,000 to stay within budget.",
    "priority": 8,
    "metrics": {
      "amount": 18000,
      "percentageOfIncome": 0.36,
      "threshold": 0.3
    }
  }
]
```

---

## Testing Scenarios

### Scenario 1: Young Professional ✅ Good Health
- 27% savings rate
- Balanced portfolio (55/30/15)
- Income stability: 0.85
- Emergency fund: 8x monthly income
- **Insights Generated:** 2-3 (mostly informational)

### Scenario 2: Student ⚠️ Needs Help
- -13% savings (overspending)
- Only cash (no investments)
- Income stability: 0.35
- Emergency fund: 0.1x monthly income
- **Insights Generated:** 6-8 (mostly high severity)

### Scenario 3: Investor 📈 Advanced
- 75% savings rate
- Concentrated in stocks (65%)
- Income stability: 0.90
- Diversified assets (4 types)
- **Insights Generated:** 3-4 (rebalancing focus)

### Scenario 4: Overspender ❌ Critical
- 2% savings rate
- High food/entertainment spending
- No emergency fund
- All cash, no portfolio
- **Insights Generated:** 8-10 (all high/medium severity)

---

**Document Version:** 1.0  
**Last Updated:** April 27, 2026  
**Status:** Complete ✅
