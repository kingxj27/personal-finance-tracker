# IMPLEMENTATION CHECKLIST - IFOS Personalization System

## 🚀 READY TO BUILD?

This checklist guides you through implementing the complete Intelligent Financial Operating System.

**Estimated Time: 2-3 weeks** (if working full-time)

---

## 📋 PHASE 1: DATABASE SETUP (Days 1-3)

### Step 1.1: Prepare Prisma Schema
- [ ] Open `src/modules/analysis/profile-logic-examples.ts`
- [ ] Copy the UserProfile model definition
- [ ] Copy the ThresholdOverride model definition
- [ ] Copy the ProfileAuditLog model definition
- [ ] Add these models to `prisma/schema.prisma`
- [ ] Add indexes for userId, personaType, createdAt

### Step 1.2: Create Migration
```bash
npx prisma migrate dev --name add_user_profile_system
```
- [ ] Verify migration created successfully
- [ ] Check `prisma/migrations/` for new folder
- [ ] Verify `npx prisma generate` shows all types

### Step 1.3: Update Prisma Client
```bash
npx prisma generate
```
- [ ] Verify UserProfile type exists in generated types
- [ ] Verify ThresholdOverride type exists
- [ ] Verify ProfileAuditLog type exists
- [ ] Check `src/generated/prisma/` for updated types

### Step 1.4: Verify Database
```bash
# For SQLite (development)
sqlite3 dev.db ".schema UserProfile"

# For other databases
# Use your database client
```
- [ ] UserProfile table exists with all 20+ fields
- [ ] ThresholdOverride table exists
- [ ] ProfileAuditLog table exists
- [ ] Indexes created correctly

---

## 💻 PHASE 2: BACKEND API ENDPOINTS (Days 4-7)

### Step 2.1: Create API Routes File
- [ ] Create `src/api/profiles.ts` (or add to existing server)
- [ ] Import PersonalizationRuleEngine from `src/modules/analysis/personalization-rules.ts`
- [ ] Import persona helpers from `src/modules/personas.ts`
- [ ] Import InsightEngine from `src/modules/analysis/insights.ts`

### Step 2.2: Implement 7 Core Endpoints

#### Endpoint 1: CREATE USER PROFILE
```typescript
POST /api/profiles
Body: { userId, demographics data }
Returns: UserProfile
```
- [ ] Copy pattern from `profile-logic-examples.ts` - `generateUserProfile()`
- [ ] Implement suggestPersona() based on demographics
- [ ] Save UserProfile to database
- [ ] Create ProfileAuditLog entry
- [ ] Return profile with persona suggestion

#### Endpoint 2: GET USER PROFILE
```typescript
GET /api/profiles/:userId
Returns: UserProfile with all customizations
```
- [ ] Fetch UserProfile from database
- [ ] Include related ThresholdOverrides
- [ ] Return complete profile object
- [ ] Handle not-found error (404)

#### Endpoint 3: UPDATE USER PROFILE
```typescript
PUT /api/profiles/:userId
Body: { personaType, riskTolerance, ... }
Returns: Updated UserProfile
```
- [ ] Validate input fields
- [ ] Update UserProfile fields
- [ ] Log change to ProfileAuditLog
- [ ] Return updated profile
- [ ] If persona changed, call reassessment logic

#### Endpoint 4: GENERATE PERSONALIZED INSIGHTS
```typescript
POST /api/insights/personalized
Body: { userId }
Returns: Insight[] (prioritized, deduped)
```
- [ ] Copy pattern from `profile-logic-examples.ts` - `generatePersonalizedInsights()`
- [ ] Fetch user's UserProfile
- [ ] Fetch user's financial data
- [ ] Create InsightEngine instance
- [ ] Apply PersonalizationRuleEngine
- [ ] Return weighted, deduplicated insights

#### Endpoint 5: TRACK INSIGHT ACTION
```typescript
POST /api/insights/:insightId/action
Body: { userId, action: "acted" | "ignored" | "dismissed" }
Returns: Updated engagementScore
```
- [ ] Find insight and user profile
- [ ] Record action (action, timestamp)
- [ ] Update engagementScore calculation:
  - `engagementScore = totalActedOn / totalInsights`
- [ ] If score > 0.8, update:
  - `advancedFeaturesUnlocked = true`
- [ ] Log to ProfileAuditLog
- [ ] Return updated engagement data

#### Endpoint 6: REASSESS PERSONA
```typescript
POST /api/profiles/:userId/reassess
Returns: { oldPersona, newPersona, changed: boolean, reason }
```
- [ ] Copy pattern from `profile-logic-examples.ts` - `assessPersonaChange()`
- [ ] Fetch user's financial history (last 6 months)
- [ ] Analyze behavior changes
- [ ] Call suggestPersona() with current data
- [ ] If persona changed:
  - Update UserProfile.personaType
  - Update rule weights
  - Update thresholds
  - Log to ProfileAuditLog
  - Notify user (email/notification)
- [ ] Return change summary

#### Endpoint 7: GET AUDIT LOG
```typescript
GET /api/profiles/:userId/audit
Query: ?limit=50&offset=0
Returns: ProfileAuditLog[]
```
- [ ] Fetch audit logs for user
- [ ] Apply pagination
- [ ] Sort by timestamp DESC
- [ ] Return with reasons and changes

### Step 2.3: Error Handling
- [ ] Add try-catch to all endpoints
- [ ] Return meaningful error messages
- [ ] Log errors to console/monitoring
- [ ] Handle database connection errors
- [ ] Validate all inputs

### Step 2.4: Testing
- [ ] Test each endpoint with Postman/Insomnia
- [ ] Test 4 different personas end-to-end
- [ ] Test error cases (missing data, invalid personas)
- [ ] Test personalization rules apply correctly
- [ ] Verify audit logs created

---

## 🎨 PHASE 3: FRONTEND INTEGRATION (Days 8-11)

### Step 3.1: Persona Selection on Registration
- [ ] Create `client/src/components/PersonaSelector.tsx`
- [ ] Build demographic questionnaire:
  - Age range
  - Current income level
  - Employment type (Student, Professional, Self-employed, etc.)
  - Investment experience
  - Financial goals
  - Location (for EM detection)

- [ ] Implement:
  - Question form
  - suggestPersona() call on submit
  - Show suggested persona with explanation
  - Allow user to confirm or override
  - Call POST /api/profiles on submit

### Step 3.2: Profile Management Page
- [ ] Create `client/src/pages/ProfilePage.tsx`
- [ ] Display:
  - Current persona
  - Profile characteristics
  - Engagement score
  - Recent insights acted on
  - Update profile button
  - View audit log

- [ ] Allow:
  - Update basic profile fields
  - Change persona (with warning)
  - View threshold customizations
  - See engagement history

### Step 3.3: Persona-Specific Dashboard
- [ ] Modify `client/src/pages/DashboardPage.tsx`
- [ ] Show different recommendations per persona:
  - **STUDENT**: "Debt Payoff Status", "Emergency Fund Target"
  - **YP**: "Goals Progress", "Savings Rate", "Housing Analysis"
  - **INVESTOR**: "Tax Opportunities", "Portfolio Health"
  - **EM User**: "Currency Protection", "Stablecoin Balance"

- [ ] Display:
  - Top 3 personalized insights
  - Persona-specific metrics
  - Action buttons per insight

### Step 3.4: Insight Component Enhancement
- [ ] Update `client/src/components/InsightCard.tsx`
- [ ] Add buttons:
  - "I'm addressing this" (POST /api/insights/:id/action with "acted")
  - "Not relevant" (POST with "dismissed")
  - "Remind me later" (POST with "ignored")

- [ ] Show:
  - Persona-specific explanation
  - Severity level (HIGH/MEDIUM/LOW)
  - Priority number
  - Related category

### Step 3.5: Behavioral Engagement Tracking
- [ ] Add engagement score display in sidebar/navbar
- [ ] Show progress to 0.8 threshold
- [ ] Notify when advanced features unlock
- [ ] Display engagement history chart (actions over time)

### Step 3.6: Testing
- [ ] Test each persona's dashboard
- [ ] Test insight action tracking
- [ ] Verify API calls working
- [ ] Test error states
- [ ] Mobile responsiveness

---

## 🧠 PHASE 4: BEHAVIORAL LEARNING (Days 12-14)

### Step 4.1: Create Monthly Reassessment Job
- [ ] Create `src/cron/reassessPersonas.ts`
- [ ] Implement:
  ```typescript
  async function reassessAllUsers() {
    // Get all users
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      // Call reassessPersona for each user
      const result = await reassessPersona(user.id);
      
      if (result.changed) {
        // Notify user
        await sendEmail(user.email, {
          subject: `Your Financial Profile Updated!`,
          body: `We've updated your profile from ${result.oldPersona} 
                 to ${result.newPersona} based on your recent behavior.`
        });
      }
    }
  }
  ```

- [ ] Set up cron job (recommend: 1st of each month)
  - Option 1: Use node-cron
  - Option 2: Use AWS EventBridge / Azure Timer
  - Option 3: Use railway.app scheduler

### Step 4.2: Engagement Score Calculation
- [ ] Update profile on every insight action:
  ```typescript
  // After tracking insight action
  const totalInsights = await countInsights(userId, timeframe: "30d");
  const actedOn = await countActions(userId, action: "acted", timeframe: "30d");
  profile.engagementScore = actedOn / totalInsights;
  ```

### Step 4.3: Feature Unlock Logic
- [ ] When engagementScore > 0.8:
  ```typescript
  profile.advancedFeaturesUnlocked = true;
  profile.lastFeatureUnlockDate = now;
  ```

- [ ] Unlock features in frontend:
  - Advanced portfolio analysis
  - Tax optimization tips
  - Custom goal tracking
  - Threshold customization UI

### Step 4.4: Behavioral Data Collection
- [ ] Track in ProfileAuditLog:
  - insightsActedOn count
  - insightsIgnored count
  - insightsDismissed count
  - savingsRateChange (month-to-month)
  - investmentActivityChange
  - debtPaymentAcceleration

- [ ] Use for persona reassessment

### Step 4.5: Testing
- [ ] Simulate 3-month user journey
- [ ] Verify engagement score calculation
- [ ] Test feature unlock at 0.8 threshold
- [ ] Test persona reassessment logic
- [ ] Test email notifications

---

## 📊 PHASE 5: ADVANCED FEATURES (Days 15+)

### Step 5.1: A/B Testing (Optional)
- [ ] Create `src/features/ab-testing.ts`
- [ ] Implement rule variation testing:
  - Variant A: Standard rule thresholds
  - Variant B: Personalized thresholds
  - Measure: engagement, savings rate, retention

### Step 5.2: Threshold Override UI (Optional)
- [ ] Let users customize alert thresholds
- [ ] Store in ThresholdOverride model
- [ ] Apply when generating insights

### Step 5.3: Custom Rule Creation (Optional)
- [ ] Admin UI to create custom personalization rules
- [ ] Test rules on small user segment first
- [ ] Gradual rollout

### Step 5.4: ML Persona Classification (Nice-to-have)
- [ ] Collect 6-month+ of user data
- [ ] Train classifier on:
  - Income level
  - Savings patterns
  - Investment activity
  - Goals
  - Behavior
  
- [ ] Compare ML suggestions vs rule-based

---

## ✅ TESTING & VALIDATION

### Test Scenario 1: Student Onboarding
- [ ] Create profile with $15k income
- [ ] Verify STUDENT persona suggested
- [ ] Generate insights:
  - Should emphasize debt
  - Should suggest 2-month emergency fund
  - Should NOT suggest investments
  - Should have high-priority savings alerts

### Test Scenario 2: Young Professional
- [ ] Create profile with $75k income
- [ ] Verify YP persona suggested
- [ ] Generate insights:
  - Should show goal tracking
  - Should suggest balanced portfolio
  - Should check housing costs
  - Medium-priority savings alerts

### Test Scenario 3: Investor
- [ ] Create profile with $500k income
- [ ] Verify INVESTOR persona suggested
- [ ] Generate insights:
  - Should show tax opportunities
  - Should check diversification
  - Should suggest 6-month emergency fund
  - Low-priority savings alerts

### Test Scenario 4: Emerging Market User
- [ ] Create profile with $20k income + Nigeria location
- [ ] Verify EM_USER persona suggested
- [ ] Generate insights:
  - Should recommend stablecoins
  - Should mention currency protection
  - Should suggest 1-month emergency fund
  - No "too much cash" warnings

### Test Scenario 5: Behavioral Learning
- [ ] Create student user
- [ ] Generate insights monthly for 8 months
- [ ] Simulate actions (income increases, debt decreases)
- [ ] Month 7: Verify persona reassessment triggers
- [ ] Verify switch to YP persona
- [ ] Verify new insights align with YP

### Performance Tests
- [ ] Load test: 1,000 concurrent insight generations
- [ ] Query time < 500ms for average user
- [ ] API response time < 200ms

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Database migrated on production
- [ ] Environment variables configured
- [ ] Error logging enabled
- [ ] Monitoring set up

### Deployment
- [ ] Deploy backend API
- [ ] Deploy database migrations
- [ ] Deploy frontend
- [ ] Test in staging
- [ ] Test in production with small user segment

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor API performance
- [ ] Check engagement scores
- [ ] Verify persona reassessments working
- [ ] Get user feedback

---

## 🎯 SUCCESS CRITERIA

### Week 1-2 (Database & API)
- [ ] Database tables created and populated
- [ ] 7 API endpoints working
- [ ] All tests passing
- [ ] 4 personas generating correct insights

### Week 2-3 (Frontend & Learning)
- [ ] Persona selection in registration
- [ ] Profile management page working
- [ ] Personalized dashboards showing
- [ ] Insight action tracking working
- [ ] Monthly reassessment job running
- [ ] Feature unlock at > 0.8 engagement

### End Result
- [ ] System transforms basic CRUD to intelligent system
- [ ] Different users see different insights
- [ ] System learns from behavior
- [ ] Personas update automatically
- [ ] Engagement > 70%
- [ ] Ready for production

---

## 📞 QUICK REFERENCE

**Database Schema:** `src/modules/analysis/profile-logic-examples.ts` (lines 200-350)

**Backend Patterns:** `src/modules/analysis/profile-logic-examples.ts` (lines 350+)

**Personas:** `src/modules/personas.ts`

**Rules:** `src/modules/analysis/personalization-rules.ts`

**Insights:** `src/modules/analysis/insights.ts`

---

## 🚀 YOU'RE READY!

Print this checklist. Follow it step by step. Reference the documentation as needed.

**Questions?** See:
- Architecture: [ARCHITECTURE_VISUAL.md](ARCHITECTURE_VISUAL.md)
- Patterns: [src/modules/analysis/PERSONAS.md](src/modules/analysis/PERSONAS.md)
- Examples: [src/modules/analysis/profile-logic-examples.ts](src/modules/analysis/profile-logic-examples.ts)

**Time estimate: 2-3 weeks** for full implementation with testing.

**Good luck!** 🎉
