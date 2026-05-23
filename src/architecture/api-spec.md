# FINTECH SYSTEM - API SPECIFICATION

## Overview

RESTful API structure for the Intelligent Financial Operating System (IFOS). All endpoints are authenticated with JWT tokens and return consistent JSON responses.

**Base URL:** `https://api.ifos.local/v1`  
**Authentication:** Bearer token in `Authorization` header  
**Response Format:** JSON

---

## API Response Standard

### Success Response
```json
{
  "success": true,
  "data": { /* payload */ },
  "timestamp": "2026-04-27T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional */ }
  },
  "timestamp": "2026-04-27T10:30:00Z"
}
```

---

## MODULE 1: PORTFOLIO TRACKING SERVICE

**Base Path:** `/portfolio`  
**Responsibility:** Asset tracking, allocation management, performance metrics

### Endpoints

#### 1.1 Add Asset Holding
```
POST /portfolio/assets
Authorization: Bearer {token}

Request Body:
{
  "assetType": "stocks",
  "symbol": "AAPL",
  "quantity": 50,
  "purchasePrice": 150,
  "purchaseDate": "2026-01-15T00:00:00Z"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "asset-uuid",
    "userId": "user-uuid",
    "assetType": "stocks",
    "symbol": "AAPL",
    "quantity": 50,
    "purchasePrice": 150,
    "currentPrice": 182,
    "totalValue": 9100,
    "costBasis": 7500,
    "gainLoss": 1600,
    "gainLossPercentage": 21.33
  }
}
```

#### 1.2 Get Current Portfolio
```
GET /portfolio
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "timestamp": "2026-04-27T10:30:00Z",
    "totalValue": 500000,
    "allocation": {
      "stocks": 0.55,
      "bonds": 0.30,
      "real_estate": 0.12,
      "cash": 0.03
    },
    "dayChangePercentage": 1.2,
    "monthChangePercentage": 3.5,
    "yearChangePercentage": 12.8,
    "assets": [
      {
        "id": "asset-1",
        "assetType": "stocks",
        "symbol": "AAPL",
        "quantity": 50,
        "currentPrice": 182,
        "totalValue": 9100,
        "gainLossPercentage": 21.33
      }
    ]
  }
}
```

#### 1.3 Get Portfolio Allocation
```
GET /portfolio/allocation
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "stocks": 0.55,
    "bonds": 0.30,
    "real_estate": 0.12,
    "crypto": 0.02,
    "cash": 0.01
  }
}
```

#### 1.4 Get Rebalancing Recommendations
```
POST /portfolio/rebalance-recommendations
Authorization: Bearer {token}

Request Body:
{
  "targetAllocation": {
    "stocks": 0.60,
    "bonds": 0.30,
    "cash": 0.10
  }
}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "assetType": "stocks",
      "action": "buy",
      "amount": 25000
    },
    {
      "assetType": "bonds",
      "action": "hold",
      "amount": 0
    },
    {
      "assetType": "cash",
      "action": "buy",
      "amount": 15000
    }
  ]
}
```

#### 1.5 Get Performance Metrics
```
GET /portfolio/performance?period={day|month|year|all}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "year",
    "returnPercentage": 12.8,
    "absoluteReturn": 64000,
    "volatility": 0.18,
    "sharpeRatio": 0.71,
    "benchmark": "S&P500",
    "benchmarkReturn": 15.2
  }
}
```

#### 1.6 Remove Asset
```
DELETE /portfolio/assets/{assetId}
Authorization: Bearer {token}

Response: 204 No Content
```

#### 1.7 Update Asset Holdings
```
PATCH /portfolio/assets/{assetId}
Authorization: Bearer {token}

Request Body:
{
  "quantity": 75,
  "currentPrice": 185
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated asset */ }
}
```

---

## MODULE 2: CASHFLOW ANALYSIS SERVICE

**Base Path:** `/cashflow`  
**Responsibility:** Income/expense tracking, cashflow forecasting, anomaly detection

### Endpoints

#### 2.1 Add Transaction
```
POST /cashflow/transactions
Authorization: Bearer {token}

Request Body:
{
  "amount": 15000,
  "category": "food",
  "type": "expense",
  "date": "2026-04-27T00:00:00Z",
  "description": "Grocery shopping",
  "recurring": false
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "txn-uuid",
    "userId": "user-uuid",
    "amount": 15000,
    "category": "food",
    "type": "expense",
    "date": "2026-04-27T00:00:00Z",
    "description": "Grocery shopping"
  }
}
```

#### 2.2 Get Monthly Cashflow Summary
```
GET /cashflow/summary?month=4&year=2026
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "month": 4,
    "year": 2026,
    "totalIncome": 150000,
    "totalExpenses": 110000,
    "netCashflow": 40000,
    "savingsRate": 0.267,
    "categoryBreakdown": {
      "housing": 45000,
      "food": 12000,
      "transportation": 8000,
      "utilities": 15000,
      "entertainment": 5000,
      "shopping": 3000,
      "subscriptions": 2000,
      "other": 20000
    },
    "recurringTransactions": 12
  }
}
```

#### 2.3 Get Category Breakdown
```
GET /cashflow/categories?startDate=2026-01-01&endDate=2026-04-27
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "housing": {
      "spent": 135000,
      "percentage": 30.68,
      "trend": "stable"
    },
    "food": {
      "spent": 45000,
      "percentage": 10.23,
      "trend": "increasing"
    },
    "transportation": {
      "spent": 24000,
      "percentage": 5.45,
      "trend": "stable"
    }
  }
}
```

#### 2.4 Get Savings Trends
```
GET /cashflow/savings-trends?months=12
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "12 months",
    "monthlyRates": [
      0.22, 0.25, 0.28, 0.27, 0.26, 0.24,
      0.25, 0.27, 0.29, 0.28, 0.26, 0.27
    ],
    "averageRate": 0.265,
    "trend": "stable",
    "targetRate": 0.25
  }
}
```

#### 2.5 Forecast Cashflow
```
GET /cashflow/forecast?months=6
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "forecastPeriod": "6 months",
    "confidenceScore": 0.82,
    "projections": [
      {
        "month": 5,
        "year": 2026,
        "projectedIncome": 155000,
        "projectedExpenses": 112000,
        "projectedSavings": 43000
      },
      {
        "month": 6,
        "year": 2026,
        "projectedIncome": 155000,
        "projectedExpenses": 115000,
        "projectedSavings": 40000
      }
    ],
    "averageMonthlySavings": 41500,
    "totalProjectedSavings": 249000
  }
}
```

#### 2.6 Detect Anomalies
```
GET /cashflow/anomalies
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "category": "entertainment",
      "anomaly": "spending 2.5x higher than normal",
      "amount": 12500,
      "normalAmount": 5000,
      "severity": "medium",
      "date": "2026-04-20"
    },
    {
      "category": "food",
      "anomaly": "15 transactions in last 3 days",
      "amount": 8500,
      "severity": "low"
    }
  ]
}
```

#### 2.7 Get Recurring Patterns
```
GET /cashflow/recurring-patterns
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "category": "utilities",
      "pattern": "monthly",
      "averageAmount": 15000,
      "dayOfMonth": 15,
      "confidence": 0.95
    },
    {
      "category": "subscriptions",
      "pattern": "monthly",
      "averageAmount": 3500,
      "dayOfMonth": 1,
      "confidence": 0.99
    }
  ]
}
```

---

## MODULE 3: GOAL PLANNING SERVICE

**Base Path:** `/goals`  
**Responsibility:** Goal creation, progress tracking, prioritization

### Endpoints

#### 3.1 Create Goal
```
POST /goals
Authorization: Bearer {token}

Request Body:
{
  "name": "Emergency Fund",
  "type": "emergency_fund",
  "targetAmount": 500000,
  "deadline": "2026-12-31T00:00:00Z",
  "priority": "high",
  "monthlyContribution": 50000
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "goal-uuid",
    "userId": "user-uuid",
    "name": "Emergency Fund",
    "type": "emergency_fund",
    "targetAmount": 500000,
    "currentAmount": 50000,
    "deadline": "2026-12-31T00:00:00Z",
    "monthlyContribution": 50000,
    "status": "in_progress",
    "priority": "high",
    "createdAt": "2026-04-27T10:30:00Z"
  }
}
```

#### 3.2 Get All Goals
```
GET /goals
Authorization: Bearer {token}

Query Params:
  status={planned|in_progress|on_track|off_track|completed}
  priority={low|medium|high}
  type={emergency_fund|retirement|vacation|...}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "goal-1",
      "name": "Emergency Fund",
      "type": "emergency_fund",
      "targetAmount": 500000,
      "currentAmount": 400000,
      "deadline": "2026-12-31T00:00:00Z",
      "status": "on_track",
      "priority": "high"
    },
    {
      "id": "goal-2",
      "name": "Vacation",
      "type": "vacation",
      "targetAmount": 200000,
      "currentAmount": 80000,
      "deadline": "2026-08-31T00:00:00Z",
      "status": "off_track",
      "priority": "medium"
    }
  ]
}
```

#### 3.3 Get Goal Analysis
```
GET /goals/{goalId}/analysis
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "goal": { /* goal object */ },
    "progressPercentage": 80,
    "timeRemainingDays": 248,
    "monthlyNeeded": 41666.67,
    "isOnTrack": true,
    "projectedCompletionDate": "2026-12-15T00:00:00Z",
    "recommendedAction": "You're on track! Maintain current savings rate."
  }
}
```

#### 3.4 Update Goal Progress
```
PATCH /goals/{goalId}/progress
Authorization: Bearer {token}

Request Body:
{
  "amount": 50000
}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "goal-uuid",
    "currentAmount": 450000,
    "progressPercentage": 90,
    "status": "on_track"
  }
}
```

#### 3.5 Get Goal Recommendations
```
GET /goals/recommendations
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "recommendation": "Create an emergency fund",
      "targetAmount": 300000,
      "timelineMonths": 6,
      "requiredMonthly": 50000,
      "rationale": "You have no emergency fund. Recommended: 3-6 months of expenses"
    },
    {
      "recommendation": "Increase retirement savings",
      "targetAmount": 1000000,
      "timelineMonths": 240,
      "requiredMonthly": 15000,
      "rationale": "Retirement savings should be 10x annual income by age 65"
    }
  ]
}
```

#### 3.6 Prioritize Goals
```
GET /goals/prioritize
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "goalId": "goal-1",
      "name": "Emergency Fund",
      "priority": "high",
      "urgency": "critical",
      "reason": "Essential foundation for financial health"
    },
    {
      "rank": 2,
      "goalId": "goal-3",
      "name": "Debt Payoff",
      "priority": "high",
      "urgency": "high",
      "reason": "High interest debt; payoff saves money"
    }
  ]
}
```

#### 3.7 Calculate Required Savings
```
POST /goals/calculate-savings
Authorization: Bearer {token}

Request Body:
{
  "targetAmount": 500000,
  "deadline": "2026-12-31T00:00:00Z"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "targetAmount": 500000,
    "timelineMonths": 8,
    "monthlyAmount": 62500,
    "weeklyAmount": 14423.08,
    "dailyAmount": 2060.44
  }
}
```

#### 3.8 Get Milestone Status
```
GET /goals/{goalId}/milestones
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "milestone-1",
      "name": "Save ₦100K",
      "targetAmount": 100000,
      "targetDate": "2026-05-31T00:00:00Z",
      "completed": true,
      "completedDate": "2026-05-25T00:00:00Z"
    },
    {
      "id": "milestone-2",
      "name": "Save ₦250K",
      "targetAmount": 250000,
      "targetDate": "2026-07-31T00:00:00Z",
      "completed": false,
      "progress": 200000
    }
  ]
}
```

---

## MODULE 4: ECONOMIC AWARENESS SERVICE

**Base Path:** `/economy`  
**Responsibility:** Market data, economic indicators, alerts

### Endpoints

#### 4.1 Get Market Indices
```
GET /economy/market-indices
Authorization: Bearer {token}

Query Params:
  category={equity|bond|commodity|currency|crypto}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "index-sp500",
      "name": "S&P 500",
      "symbol": "SPX",
      "currentValue": 4500.32,
      "previousValue": 4450.50,
      "changePercentage": 1.12,
      "timestamp": "2026-04-27T16:00:00Z",
      "category": "equity"
    },
    {
      "id": "index-btc",
      "name": "Bitcoin",
      "symbol": "BTC",
      "currentValue": 65000,
      "previousValue": 63500,
      "changePercentage": 2.36,
      "timestamp": "2026-04-27T16:00:00Z",
      "category": "crypto"
    }
  ]
}
```

#### 4.2 Get Economic Indicators
```
GET /economy/indicators
Authorization: Bearer {token}

Query Params:
  type={inflation|gdp|unemployment|interest_rate}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "indicator-inflation",
      "name": "Inflation Rate",
      "value": 3.2,
      "unit": "%",
      "date": "2026-03-31T00:00:00Z",
      "forecast": 3.1,
      "historicalTrend": [3.5, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 3.1, 3.3, 3.4, 3.5, 3.2]
    },
    {
      "id": "indicator-gdp",
      "name": "GDP Growth",
      "value": 2.5,
      "unit": "%",
      "date": "2026-Q1",
      "forecast": 2.6
    }
  ]
}
```

#### 4.3 Analyze Market
```
GET /economy/market-analysis
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "timestamp": "2026-04-27T16:00:00Z",
    "sentiment": "neutral",
    "volatilityIndex": 18.5,
    "trendStrength": 0.45,
    "keyMovers": [
      {
        "indicator": "S&P 500",
        "change": 1.12,
        "impact": "positive"
      },
      {
        "indicator": "Tech Sector",
        "change": 2.35,
        "impact": "positive"
      }
    ],
    "risks": [
      "Fed interest rate uncertainty",
      "Geopolitical tensions",
      "Corporate earnings concerns"
    ],
    "opportunities": [
      "Defensive sectors gaining strength",
      "Value stocks undervalued"
    ]
  }
}
```

#### 4.4 Get Economic Outlook
```
GET /economy/outlook?period=6
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "Q2-Q3 2026",
    "inflationForecast": 3.1,
    "gdpGrowth": 2.5,
    "unemploymentRate": 4.1,
    "keyRisks": [
      "Sticky inflation",
      "Aggressive Fed policy",
      "Geopolitical escalation"
    ],
    "keyOpportunities": [
      "Value stocks recovery",
      "Dividend yields attractive",
      "Tech valuations improving"
    ],
    "recommendedTacticalShift": "Consider rotating from growth to value; increase fixed income allocation"
  }
}
```

#### 4.5 Get Asset Class Performance
```
GET /economy/asset-performance?period={day|week|month|year}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": "month",
    "returns": {
      "stocks": 3.45,
      "bonds": -0.82,
      "commodities": 2.15,
      "real_estate": 1.23,
      "cash": 0.35,
      "crypto": 8.92
    },
    "bestPerformer": "crypto",
    "worstPerformer": "bonds"
  }
}
```

#### 4.6 Get Market Alerts
```
GET /economy/alerts
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "alert-1",
      "severity": "high",
      "message": "Tech sector down 3% - consider rebalancing if overweight",
      "timestamp": "2026-04-27T15:30:00Z",
      "actionable": true
    },
    {
      "id": "alert-2",
      "severity": "medium",
      "message": "Inflation above forecast - Fed may raise rates",
      "timestamp": "2026-04-27T10:00:00Z",
      "actionable": true
    }
  ]
}
```

#### 4.7 Get Allocation Recommendations
```
POST /economy/allocation-recommendations
Authorization: Bearer {token}

Request Body:
{
  "currentAllocation": {
    "stocks": 0.55,
    "bonds": 0.30,
    "cash": 0.15
  }
}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "assetType": "stocks",
      "suggestedPercentage": 0.50,
      "reason": "Tech valuations high; reduce exposure"
    },
    {
      "assetType": "bonds",
      "suggestedPercentage": 0.35,
      "reason": "Fixed income attractive at current rates"
    },
    {
      "assetType": "cash",
      "suggestedPercentage": 0.15,
      "reason": "Maintain dry powder for opportunities"
    }
  ]
}
```

---

## MODULE 5: INSIGHT GENERATION SERVICE

**Base Path:** `/insights`  
**Responsibility:** Generate and serve personalized financial insights

### Endpoints

#### 5.1 Generate Insights
```
GET /insights
Authorization: Bearer {token}

Query Params:
  category={spending|saving|investing|risk|goals|income|planning}
  severity={low|medium|high}
  limit=10

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "insight-1",
      "type": "overspending",
      "message": "You spent ₦45,000 (30%) on food this month, exceeding the recommended 30%.",
      "severity": "high",
      "category": "spending",
      "action": "Reduce food spending by ₦3,000 to stay within budget.",
      "priority": 8,
      "metrics": {
        "amount": 45000,
        "percentageOfIncome": 0.30,
        "threshold": 0.30
      }
    },
    {
      "id": "insight-2",
      "type": "low_savings",
      "message": "Your savings rate is 15%, which is below the recommended 20%.",
      "severity": "medium",
      "category": "saving",
      "action": "Increase monthly savings to ₦30,000.",
      "priority": 9,
      "metrics": {
        "currentRate": 0.15,
        "targetRate": 0.20
      }
    }
  ]
}
```

#### 5.2 Get Urgent Insights
```
GET /insights/urgent
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "insight-critical-1",
      "type": "income_instability",
      "severity": "high",
      "message": "Your income is unstable. Build a 6-month emergency fund.",
      "action": "Save ₦300,000 for emergency fund.",
      "priority": 10
    }
  ]
}
```

#### 5.3 Get Insights by Category
```
GET /insights/category/{category}
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    { /* insights array for category */ }
  ]
}
```

#### 5.4 Mark Insight as Acted
```
POST /insights/{insightId}/acted
Authorization: Bearer {token}

Request Body:
{
  "actionTaken": "Reduced food spending by ₦3,000"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "insightId": "insight-1",
    "status": "acted",
    "actedate": "2026-04-27T10:30:00Z"
  }
}
```

#### 5.5 Get Insight History
```
GET /insights/history?days=30
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "date": "2026-04-27",
      "insights": [ /* insights from that day */ ]
    },
    {
      "date": "2026-04-26",
      "insights": [ /* insights from that day */ ]
    }
  ]
}
```

---

## ERROR CODES

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | User lacks permission for this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## RATE LIMITING

- **Free Tier:** 100 requests/hour per endpoint
- **Pro Tier:** 1000 requests/hour per endpoint
- **Enterprise:** Unlimited

Headers returned:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1619518800
```

---

## WEBHOOK EVENTS

Services can register webhooks to receive real-time updates:

```
POST /webhooks
Authorization: Bearer {token}

Request Body:
{
  "url": "https://yourapp.com/webhooks/portfolio",
  "events": ["portfolio.updated", "insight.generated", "goal.milestone_reached"],
  "active": true
}
```

**Event Types:**
- `portfolio.updated` - Asset allocation changed
- `portfolio.rebalanced` - Portfolio rebalanced
- `cashflow.anomaly_detected` - Unusual spending detected
- `goal.milestone_reached` - Goal milestone completed
- `insight.generated` - New insight available
- `market.alert` - Market alert triggered
- `economic.update` - Economic indicators updated

---

**API Version:** 1.0  
**Last Updated:** April 27, 2026  
**Status:** Production Ready ✅
