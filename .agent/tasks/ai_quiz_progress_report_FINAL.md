# AI Quiz Progress Report - FINAL Implementation Plan

## 🎯 Confirmed Features

### Core Features
✅ 2-tab structure (Quizzes | Progress Report)
✅ AI analysis after each quiz completion
✅ All lessons shown, grouped by traffic light status
✅ Teacher dashboard access
✅ Both OpenAI and Gemini support

### Selected Enhancements
⭐ **Smart Retry Suggestions** - Spaced repetition timing
⭐ **Comparative Insights** - Class averages and percentile rankings
⭐ **Progress Tree/Map** - Visual lesson dependencies
⭐ **AI Study Buddy Chat** - Interactive progress discussion

---

## 🗄️ Database Schema (Updated)

### 1. `quiz_performance_analysis`
```sql
CREATE TABLE quiz_performance_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  lesson_id UUID REFERENCES sub_lessons(id) NOT NULL,
  
  -- Performance Metrics
  total_attempts INT DEFAULT 0,
  best_score INT,
  average_score DECIMAL(5,2),
  last_attempt_at TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ,
  
  -- AI Analysis
  weakness_areas JSONB, -- ["Hadith classification", "Narrator terminology"]
  common_mistakes JSONB, -- ["Confuses Thiqa with Da'if", "Misses chain breaks"]
  ai_recommendation TEXT,
  priority_level INT, -- 1 (High/Red) to 3 (Low/Green)
  
  -- Smart Retry (Spaced Repetition)
  next_optimal_retry_at TIMESTAMPTZ, -- AI-calculated best retry time
  retry_interval_days INT, -- Current interval (1, 3, 7, 14, 30...)
  is_ready_for_retry BOOLEAN DEFAULT FALSE,
  
  -- Comparative Stats
  class_average_score DECIMAL(5,2), -- Cached for performance
  percentile_rank INT, -- 0-100
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_quiz_analysis_user ON quiz_performance_analysis(user_id);
CREATE INDEX idx_quiz_analysis_priority ON quiz_performance_analysis(user_id, priority_level);
CREATE INDEX idx_quiz_analysis_retry ON quiz_performance_analysis(user_id, is_ready_for_retry);
```

### 2. `lesson_dependencies` (NEW - for Progress Tree)
```sql
CREATE TABLE lesson_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES sub_lessons(id) NOT NULL,
  prerequisite_lesson_id UUID REFERENCES sub_lessons(id) NOT NULL,
  dependency_type TEXT DEFAULT 'recommended', -- 'required' or 'recommended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lesson_id, prerequisite_lesson_id)
);

CREATE INDEX idx_lesson_deps ON lesson_dependencies(lesson_id);
```

### 3. `ai_study_chat_history` (NEW - for Study Buddy)
```sql
CREATE TABLE ai_study_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message_type TEXT NOT NULL, -- 'student' or 'ai'
  content TEXT NOT NULL,
  context JSONB, -- Related lesson_id, quiz_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_chat_user ON ai_study_chat_history(user_id, created_at DESC);
```

### 4. Update `ai_quiz_sessions`
```sql
ALTER TABLE ai_quiz_sessions ADD COLUMN IF NOT EXISTS
  question_details JSONB, -- Detailed per-question breakdown
  analyzed BOOLEAN DEFAULT FALSE; -- Has this session been analyzed?
```

---

## 🧠 AI Analysis Logic

### 1. Spaced Repetition Algorithm
```dart
// Calculate next optimal retry time based on performance
Duration calculateRetryInterval(int bestScore, int attemptCount) {
  if (bestScore < 50) {
    // Red - Retry soon
    return attemptCount == 1 
      ? Duration(days: 1)  // First fail: retry tomorrow
      : Duration(days: 3); // Multiple fails: wait 3 days
  } else if (bestScore < 80) {
    // Amber - Medium interval
    return Duration(days: 7);
  } else {
    // Green - Long interval
    return Duration(days: 30);
  }
}

// Example: Student scores 45% → retry in 1 day
//          Student scores 65% → retry in 7 days
//          Student scores 90% → retry in 30 days
```

### 2. AI Analysis Prompt (Enhanced)
```
Analyze student quiz performance and provide comprehensive insights:

STUDENT DATA:
- Name: {student_name}
- Lesson: {lesson_title}
- Quiz Attempts: {attempts}
- Scores: {score_history}
- Time Between Attempts: {time_gaps}
- Questions Failed: {failed_questions_with_context}
- Student Answers vs Ideal: {comparison}
- AI Feedback History: {feedback_given}

CLASS DATA (for comparison):
- Class Average: {class_avg}
- Top Score: {class_max}
- Student Percentile: {percentile}

ANALYSIS REQUIRED:
1. Identify 2-3 specific weak concepts
2. Detect patterns in mistakes (what keeps going wrong?)
3. Compare to class performance (is this a common struggle?)
4. Provide actionable recommendation (2-3 sentences)
5. Assign priority (1=High/Red, 2=Medium/Amber, 3=Low/Green)
6. Suggest specific study actions (e.g., "Review transcript at 12:30")

Return JSON:
{
  "weakness_areas": ["concept1", "concept2"],
  "common_mistakes": ["pattern1", "pattern2"],
  "recommendation": "Specific advice...",
  "priority_level": 1,
  "study_actions": [
    {"type": "review_transcript", "timestamp": "12:30", "topic": "..."},
    {"type": "retake_quiz", "when": "after_review"}
  ],
  "class_comparison": "You scored below class average. This topic is challenging for many students."
}
```

### 3. Study Buddy Chat Prompt
```
You are an AI study advisor helping a student understand their quiz performance.

STUDENT CONTEXT:
- Overall Progress: {summary}
- Weak Areas: {weakness_areas}
- Recent Quizzes: {recent_performance}

CONVERSATION HISTORY:
{chat_history}

STUDENT QUESTION: {user_message}

Respond as a supportive tutor:
- Be encouraging but honest
- Reference specific quiz performance when relevant
- Suggest concrete next steps
- Use Islamic terminology appropriately
- Keep responses concise (2-3 sentences)
```

---

## 🎨 UI Design (Detailed)

### Progress Report Tab Structure

```
┌─────────────────────────────────────────────────┐
│  Quiz Hub                              [Back]   │
├─────────────────────────────────────────────────┤
│  [Quizzes]  [Progress Report] ← Tabs            │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Overall Performance                         │
│  ┌───────────────────────────────────────────┐ │
│  │ 12/15 Quizzes (80%)  |  Avg: 78%          │ │
│  │ Trend: 📈 Improving  |  Streak: 5 days    │ │
│  │                                           │ │
│  │ 🟢 5 Excellent  🟡 4 Review  🔴 3 Retry   │ │
│  │                                           │ │
│  │ Class Comparison:                         │ │
│  │ You: 78%  |  Class Avg: 72%  📈 +6%       │ │
│  │ Percentile: Top 35%                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🗺️ Progress Map                 [View Tree]   │
│  ┌───────────────────────────────────────────┐ │
│  │  Al-Bayquniyyah: 8/12 (67%)               │ │
│  │  ████████░░░░ [Progress Bar]              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🔴 HIGH PRIORITY (Retry Needed)                │
│  ┌───────────────────────────────────────────┐ │
│  │ ⏰ Ready to Retry! [Badge]                │ │
│  │                                           │ │
│  │ Al-Bayquniyyah - Lesson 3                 │ │
│  │ Best Score: 45% (2 attempts)              │ │
│  │ Last Attempt: 2 days ago                  │ │
│  │                                           │ │
│  │ 📊 Class Comparison:                      │ │
│  │ You: 45%  |  Class: 68%  📉 -23%          │ │
│  │ This is a common struggle topic           │ │
│  │                                           │ │
│  │ 💡 AI Recommendation:                     │ │
│  │ "Review Hadith narrator reliability.     │ │
│  │ Focus on Thiqa vs Da'if distinction.     │ │
│  │ Watch transcript at 12:30-15:45."        │ │
│  │                                           │ │
│  │ Weak Areas:                               │ │
│  │ • Hadith classification                   │ │
│  │ • Narrator terminology                    │ │
│  │                                           │ │
│  │ Common Mistakes:                          │ │
│  │ • Confuses Thiqa with Da'if               │ │
│  │ • Misses chain breaks                     │ │
│  │                                           │ │
│  │ [Review Lesson] [Retake Quiz Now]         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🟡 MEDIUM PRIORITY (Review Recommended)        │
│  ┌───────────────────────────────────────────┐ │
│  │ ⏳ Retry in 5 days                        │ │
│  │ Al-Bayquniyyah - Lesson 7                 │ │
│  │ Best Score: 65% (1 attempt)               │ │
│  │ Class Avg: 70% 📉 -5%                     │ │
│  │ ...                                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  🟢 EXCELLENT (Keep It Up!)                     │
│  ┌───────────────────────────────────────────┐ │
│  │ ⏳ Review in 28 days                      │ │
│  │ Al-Bayquniyyah - Lesson 1                 │ │
│  │ Best Score: 95% (1 attempt)               │ │
│  │ Class Avg: 82% 📈 +13%                    │ │
│  │ Top 10% in this topic! 🎉                 │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  💬 AI Study Buddy                              │
│  ┌───────────────────────────────────────────┐ │
│  │ Ask me about your progress...             │ │
│  │ [Chat Input]                    [Send]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Refresh Analysis] [View Progress Tree]        │
└─────────────────────────────────────────────────┘
```

### Progress Tree Modal
```
┌─────────────────────────────────────────────────┐
│  Learning Path - Al-Bayquniyyah        [Close]  │
├─────────────────────────────────────────────────┤
│                                                 │
│           Lesson 1 (✅ 95%)                     │
│                 │                               │
│        ┌────────┴────────┐                      │
│   Lesson 2 (✅ 88%)  Lesson 3 (🔴 45%)          │
│        │                 │                      │
│        └────────┬────────┘                      │
│           Lesson 4 (🔒 Locked)                  │
│                 │                               │
│           Lesson 5 (🔒 Locked)                  │
│                                                 │
│  Legend:                                        │
│  ✅ Completed (80%+)                            │
│  🟡 In Progress (50-79%)                        │
│  🔴 Needs Work (<50%)                           │
│  🔒 Locked (complete prerequisites first)       │
│                                                 │
│  Tip: Complete Lesson 3 to unlock Lesson 4     │
└─────────────────────────────────────────────────┘
```

---

## 📁 Implementation Structure

### New Files

```
lib/presentation/screens/quiz/
  ├── quiz_hub_screen.dart (MODIFY - add TabBar)
  ├── progress_report_tab.dart (NEW)
  └── progress_tree_modal.dart (NEW)

lib/presentation/widgets/progress/
  ├── performance_summary_card.dart (NEW)
  ├── lesson_analysis_card.dart (NEW)
  ├── retry_timer_badge.dart (NEW)
  ├── class_comparison_widget.dart (NEW)
  └── ai_study_chat_widget.dart (NEW)

lib/services/
  ├── quiz_analysis_service.dart (NEW)
  └── spaced_repetition_service.dart (NEW)

lib/data/repositories/
  ├── quiz_analysis_repository.dart (NEW)
  └── lesson_dependency_repository.dart (NEW)

lib/domain/models/
  ├── quiz_performance_analysis.dart (NEW)
  ├── lesson_dependency.dart (NEW)
  └── study_chat_message.dart (NEW)
```

---

## 🔄 Implementation Phases

### Phase 1: Foundation (Day 1)
- [x] Create database tables
- [ ] Create domain models
- [ ] Create repositories
- [ ] Create `QuizAnalysisService`
- [ ] Implement spaced repetition logic

### Phase 2: Core UI (Day 2)
- [ ] Add TabBar to Quiz Hub
- [ ] Create `ProgressReportTab`
- [ ] Create `PerformanceSummaryCard`
- [ ] Create `LessonAnalysisCard`
- [ ] Implement traffic light grouping

### Phase 3: Smart Features (Day 3)
- [ ] Implement retry timer logic
- [ ] Add "Ready to Retry" badges
- [ ] Calculate class averages
- [ ] Add percentile rankings
- [ ] Create `ClassComparisonWidget`

### Phase 4: Advanced Features (Day 4)
- [ ] Create lesson dependency system
- [ ] Build Progress Tree visualization
- [ ] Implement AI Study Buddy chat
- [ ] Add chat history persistence

### Phase 5: Teacher Dashboard (Day 5)
- [ ] Create teacher view of student progress
- [ ] Add class-wide analytics
- [ ] Implement at-risk student detection
- [ ] Add export functionality

### Phase 6: Polish & Testing (Day 6)
- [ ] Add animations
- [ ] Test with real data
- [ ] Add loading states
- [ ] Error handling
- [ ] Notification system for retry reminders

---

## 🚀 Ready to Start?

I'll begin with **Phase 1: Foundation**. This includes:
1. Database table creation (SQL migration)
2. Domain models
3. Repositories
4. Core analysis service

Should I proceed? 🎯
