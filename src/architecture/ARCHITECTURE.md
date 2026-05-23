# FINTECH SYSTEM ARCHITECTURE - VISUAL GUIDE

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Web Dashboard │ Mobile App │ Notifications │ Webhooks         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS/WebSocket
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Authentication │ Rate Limiting │ Routing │ Request Validation  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Portfolio Svc   │ │  Cashflow Svc    │ │  Goal Svc        │
│  ┌────────────┐  │ │  ┌────────────┐  │ │  ┌────────────┐  │
│  │ Assets     │  │ │  │Transactions│  │ │  │ Goals      │  │
│  │ Allocation │  │ │  │ Categories │  │ │  │ Milestones │  │
│  │ Performance│  │ │  │ Forecast   │  │ │  │ Progress   │  │
│  └────────────┘  │ │  └────────────┘  │ │  └────────────┘  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │ Shared Cache & Message Queue (Redis)   │
        └─────────────────────────────────────────┘
         │                    │
         ↓                    ↓
    ┌─────────────┐    ┌──────────────────┐
    │ Economy Svc │    │ Insight Svc      │
    │ ┌─────────┐ │    │ (IFOS Engine)    │
    │ │Indices  │ │    │ ┌──────────────┐ │
    │ │Economic │ │    │ │ Rules (12)   │ │
    │ │Forecast │ │    │ │ Prioritizer  │ │
    │ └─────────┘ │    │ │ Deduplicator │ │
    └─────────────┘    │ └──────────────┘ │
         │             └──────────────────┘
         └──────────────────┐
                            ↓
        ┌─────────────────────────────────────────┐
        │         PERSISTENCE LAYER               │
        │  ┌───────────────────────────────────┐  │
        │  │ Primary DB (PostgreSQL/SQLite)   │  │
        │  │ ├─ Users                         │  │
        │  │ ├─ Transactions                  │  │
        │  │ ├─ Assets/Portfolio              │  │
        │  │ ├─ Goals                         │  │
        │  │ └─ Insights                      │  │
        │  └───────────────────────────────────┘  │
        │  ┌───────────────────────────────────┐  │
        │  │ Cache (Redis)                    │  │
        │  │ ├─ Market Data                   │  │
        │  │ ├─ User Sessions                 │  │
        │  │ └─ Computed Results              │  │
        │  └───────────────────────────────────┘  │
        └─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
    │ Finnhub API │  │ Alpha VAPI  │  │ Yahoo Finance│
    │ (Stocks)    │  │ (Forex)     │  │ (Data)       │
    └─────────────┘  └─────────────┘  └──────────────┘
```

---

## 2. Service-Level Architecture (Detailed)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SERVICE COMMUNICATION PATTERNS                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SYNCHRONOUS (REST/RPC)                                                 │
│  ├─→ Portfolio Service → Market Data (for pricing)                      │
│  ├─→ Cashflow Service → Insight Service (request insights)              │
│  ├─→ Goal Service → Cashflow Service (get monthly savings available)    │
│  └─→ Client → Any Service (on-demand data)                             │
│                                                                          │
│  ASYNCHRONOUS (Event-Driven)                                            │
│  ├─→ Transaction added → Portfolio Service updates → Insight triggered  │
│  ├─→ Portfolio changed → Insight Service regenerates recommendations    │
│  ├─→ Goal milestone reached → Notification sent to user                │
│  ├─→ Market alert → Push notification to users                        │
│  └─→ Economic update → Portfolio review triggered                      │
│                                                                          │
│  MESSAGE QUEUE (RabbitMQ/Redis)                                         │
│  ├─ portfolio.updated                                                   │
│  ├─ cashflow.analyzed                                                   │
│  ├─ goal.milestone_reached                                              │
│  ├─ insight.generated                                                   │
│  └─ market.alert_triggered                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow - Daily Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DAILY SYSTEM OPERATIONS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 00:00 - START OF DAY                                                   │
│  ├─ [Scheduled] Fetch market data from external APIs                  │
│  ├─ [Scheduled] Calculate daily performance metrics                   │
│  ├─ [Scheduled] Update portfolio valuations                           │
│  └─ [Scheduled] Analyze economic indicators                           │
│                                                                         │
│ 06:00 - DAILY INSIGHTS GENERATION                                      │
│  ├─ Portfolio Service: Recalculate allocations                        │
│  ├─ Cashflow Service: Update monthly summaries                        │
│  ├─ Goal Service: Check milestone progress                           │
│  ├─ Economy Service: Assess market conditions                        │
│  └─ Insight Engine: Generate daily insights (12 rules applied)       │
│      ├─ Run deduplication                                            │
│      ├─ Apply prioritization                                         │
│      └─ Store in database                                            │
│                                                                         │
│ USER TRANSACTION (Real-time)                                           │
│  ├─ User adds expense transaction                                      │
│  ├─ Cashflow Service: Records transaction                             │
│  ├─ Cashflow Service: Updates monthly category breakdown              │
│  ├─ Cashflow Service: Detects anomalies                               │
│  ├─ Event: "cashflow.updated" published                               │
│  ├─ Insight Service: Triggered to regenerate insights                 │
│  ├─ Database: New insights stored                                     │
│  └─ User: Receives real-time notification                             │
│                                                                         │
│ WEEKLY ANALYSIS (Every Monday)                                         │
│  ├─ Goal Service: Analyze goal progress vs timeline                   │
│  ├─ Cashflow Service: Forecast next 12 weeks                          │
│  ├─ Portfolio Service: Check rebalancing needs                        │
│  ├─ Economy Service: Generate weekly outlook                          │
│  └─ Insight Service: Generate weekly summary insights                 │
│                                                                         │
│ MONTHLY RECONCILIATION (1st of month)                                 │
│  ├─ Cashflow Service: Close month, generate summary                   │
│  ├─ Goal Service: Update milestone progress                           │
│  ├─ Portfolio Service: Monthly performance report                     │
│  ├─ Insight Service: Generate comprehensive monthly report            │
│  └─ User: Receives monthly financial summary                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Dependency Graph

```
                          EXTERNAL DATA
                              │
                              ↓
              ┌───────────────────────────┐
              │ Economic Awareness        │
              │ Service                   │
              │ ├─ Market Indices         │
              │ ├─ Economic Indicators    │
              │ └─ Forecasts              │
              └───────────────────────────┘
                         │
                         ↓ provides data
                         │
    ┌────────────────────┼────────────────────┐
    ↓                    ↓                    ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Portfolio    │  │ Cashflow     │  │ Goal         │
│ Tracking     │  │ Analysis     │  │ Planning     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│• Assets      │  │• Income      │  │• Goals       │
│• Allocation  │  │• Expenses    │  │• Progress    │
│• Performance │  │• Forecast    │  │• Milestones  │
└──────────────┘  └──────────────┘  └──────────────┘
    ↓                    ↓                    ↓
    │                    ↓                    │
    │            (uses for savings)          │
    │            rate calculation            │
    │                    ↓                    │
    └────────────────────┼────────────────────┘
                         │
                         ↓ ALL FEED INTO
                    ┌─────────────────────┐
                    │ INSIGHT ENGINE      │
                    │ (IFOS)              │
                    │ ┌─────────────────┐ │
                    │ │ 12 Rules        │ │
                    │ │ Deduplication   │ │
                    │ │ Prioritization  │ │
                    │ └─────────────────┘ │
                    └─────────────────────┘
                         │
                         ↓
                    USER INSIGHTS
```

---

## 5. Request Flow - Get Insights

```
                        USER
                         │
                         ↓
            ┌─────────────────────────┐
            │  GET /insights?limit=10 │
            │  Authorization: Bearer  │
            └─────────────────────────┘
                         │
                         ↓
            ┌─────────────────────────┐
            │   API GATEWAY           │
            │ ├─ Verify JWT Token     │
            │ ├─ Rate limit check     │
            │ ├─ Request validation   │
            │ └─ Route to Service     │
            └─────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │  INSIGHT SERVICE               │
        │  ├─ Check cache first          │
        │  ├─ If cache miss:             │
        │  │   ├─ Call Portfolio Svc     │
        │  │   ├─ Call Cashflow Svc      │
        │  │   ├─ Call Goal Svc          │
        │  │   ├─ Call Economy Svc       │
        │  │   ├─ Compile Financial Data │
        │  │   ├─ Run 12 Rules           │
        │  │   ├─ Deduplicate            │
        │  │   ├─ Prioritize             │
        │  │   ├─ Store in DB            │
        │  │   └─ Cache result (1 hour)  │
        │  ├─ Sort by priority           │
        │  ├─ Apply limit                │
        │  └─ Format response            │
        └────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │  RESPONSE                      │
        │  ┌─ insight-1 (priority: 10)   │
        │  ├─ insight-2 (priority: 9)    │
        │  ├─ insight-3 (priority: 8)    │
        │  ├─ insight-4 (priority: 7)    │
        │  ├─ insight-5 (priority: 6)    │
        │  ├─ ...                        │
        │  └─ insight-10 (priority: 1)   │
        └────────────────────────────────┘
                         │
                         ↓
                    USER DASHBOARD
```

---

## 6. Data Model Relationships

```
USER
├─ id (PK)
├─ email
├─ password
├─ persona (STUDENT|YOUNG_PROFESSIONAL|INVESTOR)
├─ riskTolerance
└─ incomeStability

USER ─┬─→ PORTFOLIO_ASSETS (1:N)
      │   ├─ id
      │   ├─ assetType
      │   ├─ quantity
      │   ├─ currentPrice
      │   └─ totalValue
      │
      ├─→ TRANSACTIONS (1:N)
      │   ├─ id
      │   ├─ amount
      │   ├─ category
      │   ├─ type (income|expense)
      │   └─ date
      │
      ├─→ GOALS (1:N)
      │   ├─ id
      │   ├─ targetAmount
      │   ├─ currentAmount
      │   ├─ deadline
      │   ├─ status
      │   └─ MILESTONES (1:N)
      │       ├─ id
      │       ├─ targetAmount
      │       ├─ targetDate
      │       └─ completed
      │
      ├─→ MONTHLY_CASHFLOW (1:N)
      │   ├─ month
      │   ├─ year
      │   ├─ totalIncome
      │   ├─ totalExpenses
      │   └─ savingsRate
      │
      └─→ INSIGHTS (1:N)
          ├─ id
          ├─ type
          ├─ message
          ├─ severity
          ├─ category
          ├─ action
          └─ priority
```

---

## 7. Scalability Considerations

```
                    CURRENT (Single Service)
                              │
                    SCALING TIER 1 (Services)
    ┌─────────────────────────┼─────────────────────────┐
    ↓                         ↓                         ↓
Portfolio Service      Cashflow Service        Goal Service
(Replicas: 3)         (Replicas: 5)           (Replicas: 2)
Load Balancer         Load Balancer            Load Balancer
                    
                    SCALING TIER 2 (Data)
    ┌─────────────────────────┼─────────────────────────┐
    ↓                         ↓                         ↓
Primary DB (Write)    Read Replicas (3)     Cache Layer (Redis)
PostgreSQL            PostgreSQL            Cluster (3 nodes)
WAL Replication       Streaming Replication


                    SCALING TIER 3 (Queue)
    ┌─────────────────────────┼─────────────────────────┐
    ↓                         ↓                         ↓
Message Queue         Event Stream          Worker Nodes
(RabbitMQ Cluster)    (Kafka/Pub-Sub)      (20+ nodes)
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ EDGE LAYER                                              │
│ ├─ DDoS Protection (Cloudflare)                         │
│ ├─ WAF (Web Application Firewall)                       │
│ └─ Rate Limiting                                        │
│                                                         │
│ API LAYER                                               │
│ ├─ HTTPS/TLS 1.3                                        │
│ ├─ JWT Authentication                                   │
│ ├─ API Keys (for service-to-service)                    │
│ ├─ CORS Policy                                          │
│ └─ Request Validation                                   │
│                                                         │
│ SERVICE LAYER                                           │
│ ├─ Role-Based Access Control (RBAC)                     │
│ ├─ Service-to-Service Authentication (mTLS)            │
│ ├─ Audit Logging                                        │
│ └─ Input Sanitization                                   │
│                                                         │
│ DATA LAYER                                              │
│ ├─ Encryption at Rest (AES-256)                         │
│ ├─ Encryption in Transit (TLS)                          │
│ ├─ Row-Level Security (RLS)                             │
│ ├─ PII Masking                                          │
│ └─ Database Access Control                              │
│                                                         │
│ OPERATIONAL LAYER                                       │
│ ├─ Secrets Management (Vault)                           │
│ ├─ Network Segmentation                                 │
│ ├─ Intrusion Detection                                  │
│ ├─ Log Aggregation (ELK Stack)                          │
│ └─ Security Monitoring (SIEM)                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Deployment Pipeline

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Developer│   │   Git    │   │   CI     │   │   QA     │   │  Prod    │
│  Commits │──→│ Repo     │──→│ Pipeline │──→│ Deploy   │──→│  Deploy  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                ↓                   ↓                   ↓
            ┌────────────┐  ┌────────────┐  ┌────────────┐
            │ Unit Tests │  │Linting &   │  │Build Docker│
            │            │  │Formatting  │  │ Image      │
            └────────────┘  └────────────┘  └────────────┘
                │                   │              │
                └───────────────────┼──────────────┘
                                    ↓
                        ┌──────────────────────┐
                        │  Container Registry  │
                        │  (Docker Hub/ECR)    │
                        └──────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
            ┌────────────┐  ┌────────────┐  ┌────────────┐
            │Kubernetes  │  │Integration │  │E2E Tests   │
            │Deployment  │  │ Tests      │  │            │
            └────────────┘  └────────────┘  └────────────┘
                │               │               │
                └───────────────┬┴───────────────┘
                                ↓
                        ┌──────────────────────┐
                        │  Production Deploy   │
                        │  (Blue-Green / Canary│
                        └──────────────────────┘
```

---

## 10. Module Interaction Sequence Diagram

```
User              Frontend        API Gateway       Services           DB
 │                  │                 │        Insight  Cashflow      │
 │ 1. View Insights │                 │        Engine   Service       │
 ├──────────────────→│                 │                               │
 │                  │ 2. GET /insights│                               │
 │                  ├────────────────→│                               │
 │                  │                 │ 3. Route to Insight Service   │
 │                  │                 │                               │
 │                  │                 │ 4. Get financial data         │
 │                  │                 ├──────────┐                    │
 │                  │                 │           │ Call Cashflow Svc │
 │                  │                 │           │ Get monthly       │
 │                  │                 │ ┌─────────┴──────────────────→│
 │                  │                 │ │        5. Query transactions│
 │                  │                 │ │←────────────────────────────│
 │                  │                 │←────────────────────────────┐ │
 │                  │                 │     6. Get all data         │ │
 │                  │                 │                             │ │
 │                  │                 │ 7. Apply 12 Rules           │ │
 │                  │                 │ 8. Deduplicate             │ │
 │                  │                 │ 9. Prioritize              │ │
 │                  │                 │ 10. Format Response        │ │
 │                  │                 │                             │ │
 │                  │ 11. JSON Array  │                             │ │
 │                  │←────────────────┤                             │ │
 │                  │                 │ 12. Cache Result (1h)       │ │
 │                  │                 ├────────────────────────────→│ │
 │                  │                 │                             │ │
 │ 13. Display      │                 │                             │ │
 │←─────────────────┤                 │                             │ │
 │                  │                 │                             │ │
```

---

**Architecture Version:** 1.0  
**Last Updated:** April 27, 2026  
**Status:** Production Ready ✅
