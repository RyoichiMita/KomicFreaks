# AI Quiz Progress Report - Implementation Plan

## 📋 Overview
Add a comprehensive AI-powered progress report to the Quiz Hub that analyzes student performance across all quizzes and provides personalized recommendations for improvement.

---

## 🎯 Feature Requirements

### 1. Quiz Hub Tab Structure
- **Tab 1: Quizzes** (Current view - accordion list of quizzes)
- **Tab 2: Progress Report** (New - AI-powered analysis)

### 2. Progress Report Components

#### A. Overall Performance Summary
- **Total Quizzes Completed** - Count and percentage
- **Average Score** - Across all quizzes
- **Performance Trend** - Improving/Stable/Declining (based on recent scores)
- **Study Streak** - Consecutive days with quiz activity
- **Traffic Light Distribution** - Count of 🟢 Excellent / 🟡 Review / 🔴 Retry

#### B. Lesson-Level Analysis (AI-Powered)
For each lesson/topic, show:
- **Lesson Title** - e.g., "Al-Bayquniyyah - Lesson 5"
- **Quiz Performance** - Score and attempts
- **Weakness Indicators**:
  - Low scores (< 50%)
  - Multiple attempts needed
  - Specific questions failed
- **AI Recommendation** - Personalized suggestion (e.g., "Review the section on Hadith classification")
- **Action Button** - "Review Lesson" or "Retake Quiz"

#### C. Knowledge Gap Detection
AI analyzes quiz chat history to identify:
- **Concepts Not Understood** - Based on incorrect answers and AI feedback
- **Common Mistakes** - Patterns in student responses
- **Topics Needing Review** - Ranked by urgency

#### D. Study Recommendations
AI-generated personalized study plan:
- **Priority Topics** - Top 3-5 lessons to review
- **Suggested Study Order** - Based on prerequisite knowledge
- **Time Estimates** - How long to spend on each topic
- **Next Steps** - Specific actions (e.g., "Retake Quiz 3", "Review transcript for Lesson 7")

---

## 🗄️ Database Schema Changes

### New Table: `quiz_performance_analysis`
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
  
  -- AI Analysis
  weakness_areas JSONB, -- Array of identified weak concepts
  common_mistakes JSONB, -- Patterns in incorrect answers
  ai_recommendation TEXT, -- Personalized recommendation
  priority_level INT, -- 1 (High) to 5 (Low)
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

-- Index for fast lookups
CREATE INDEX idx_quiz_analysis_user ON quiz_performance_analysis(user_id);
CREATE INDEX idx_quiz_analysis_priority ON quiz_performance_analysis(user_id, priority_level);
```

### Update Existing: `ai_quiz_sessions`
Add fields to track more granular data:
```sql
ALTER TABLE ai_quiz_sessions ADD COLUMN IF NOT EXISTS
  question_details JSONB; -- Detailed breakdown of each question's performance

-- Example structure:
-- {
--   "question_1": {
--     "attempts": 2,
--     "score": 8,
--     "max_score": 10,
--     "concept": "Hadith classification",
--     "student_answer": "...",
--     "ideal_answer": "...",
--     "ai_feedback": "..."
--   }
-- }
```

---

## 🤖 AI Analysis Logic

### 1. Data Collection
Gather from existing tables:
- `ai_quiz_sessions` - Quiz scores and completion data
- `lesson_progress` - Quiz chat history and answers
- `ai_quiz_questions` - Question content and ideal answers
- `sub_lessons` - Lesson metadata

### 2. AI Prompt for Analysis
```
Analyze the student's quiz performance and provide recommendations:

Student Performance Data:
- Lesson: {lesson_title}
- Quiz Attempts: {attempts}
- Scores: {score_history}
- Questions Failed: {failed_questions}
- Student Answers: {student_responses}
- AI Feedback Given: {ai_feedback_history}

Based on this data:
1. Identify 2-3 specific concepts the student struggles with
2. Detect patterns in their mistakes
3. Provide a concise, actionable recommendation (2-3 sentences)
4. Assign a priority level (1-5) for reviewing this lesson

Return JSON:
{
  "weakness_areas": ["concept1", "concept2"],
  "common_mistakes": ["mistake_pattern1", "mistake_pattern2"],
  "recommendation": "Specific advice here...",
  "priority_level": 2
}
```

### 3. Analysis Triggers
Run AI analysis when:
- Student completes a quiz
- Student views Progress Report (if analysis is > 24 hours old)
- Manually triggered by "Refresh Analysis" button

---

## 🎨 UI/UX Design

### Progress Report Tab Layout

```
┌─────────────────────────────────────────┐
│  Quiz Hub                        [Back] │
├─────────────────────────────────────────┤
│  [Quizzes]  [Progress Report] ← Tabs    │
├─────────────────────────────────────────┤
│                                         │
│  📊 Overall Performance                 │
│  ┌─────────────────────────────────┐   │
│  │ 12/15 Quizzes Completed (80%)   │   │
│  │ Average Score: 78%              │   │
│  │ Trend: 📈 Improving             │   │
│  │ 🟢 5  🟡 4  🔴 3                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🎯 Priority Areas for Review           │
│  ┌─────────────────────────────────┐   │
│  │ 🔴 HIGH PRIORITY                │   │
│  │ Al-Bayquniyyah - Lesson 3       │   │
│  │ Score: 45% (2 attempts)         │   │
│  │                                 │   │
│  │ 💡 AI Recommendation:           │   │
│  │ "Review the section on Hadith   │   │
│  │ narrator reliability. Focus on  │   │
│  │ the difference between Thiqa    │   │
│  │ and Da'if narrators."           │   │
│  │                                 │   │
│  │ Weak Areas:                     │   │
│  │ • Hadith classification         │   │
│  │ • Narrator terminology          │   │
│  │                                 │   │
│  │ [Review Lesson] [Retake Quiz]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🟡 MEDIUM PRIORITY              │   │
│  │ Al-Bayquniyyah - Lesson 7       │   │
│  │ Score: 65% (1 attempt)          │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📚 Study Plan                          │
│  ┌─────────────────────────────────┐   │
│  │ Recommended Study Order:        │   │
│  │ 1. Lesson 3 (30 min)            │   │
│  │ 2. Lesson 7 (20 min)            │   │
│  │ 3. Retake Quiz 3                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Refresh Analysis] [Export Report]     │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

### New Files to Create:
```
lib/presentation/screens/quiz/
  ├── quiz_hub_screen.dart (MODIFY - add TabBar)
  └── progress_report_tab.dart (NEW)

lib/presentation/widgets/progress/
  ├── performance_summary_card.dart (NEW)
  ├── lesson_analysis_card.dart (NEW)
  └── study_plan_card.dart (NEW)

lib/services/
  └── quiz_analysis_service.dart (NEW)

lib/data/repositories/
  └── quiz_analysis_repository.dart (NEW)

lib/domain/models/
  ├── quiz_performance_analysis.dart (NEW)
  └── study_recommendation.dart (NEW)
```

---

## 🔄 Implementation Phases

### Phase 1: Database & Data Layer (Day 1)
- [ ] Create `quiz_performance_analysis` table
- [ ] Update `ai_quiz_sessions` schema
- [ ] Create `QuizAnalysisRepository`
- [ ] Create domain models

### Phase 2: AI Analysis Service (Day 1-2)
- [ ] Create `QuizAnalysisService`
- [ ] Implement data aggregation logic
- [ ] Create AI analysis prompt
- [ ] Test AI recommendations

### Phase 3: UI Components (Day 2-3)
- [ ] Create `ProgressReportTab`
- [ ] Build `PerformanceSummaryCard`
- [ ] Build `LessonAnalysisCard`
- [ ] Build `StudyPlanCard`

### Phase 4: Integration (Day 3)
- [ ] Add TabBar to `QuizHubScreen`
- [ ] Connect Progress Report to data
- [ ] Add loading states
- [ ] Add error handling

### Phase 5: Polish & Testing (Day 4)
- [ ] Add animations
- [ ] Test with real data
- [ ] Add "Refresh Analysis" functionality
- [ ] Add "Export Report" (optional)

---

## 🎨 Design Considerations

### Colors & Visual Hierarchy
- **High Priority** - Red accent (#EF4444)
- **Medium Priority** - Amber accent (#F59E0B)
- **Low Priority** - Green accent (#10B981)
- **AI Recommendations** - Purple accent (#8B5CF6) with lightbulb icon

### Animations
- Fade in cards on load
- Expand/collapse lesson details
- Shimmer effect while AI analyzes

### Empty States
- "No quizzes completed yet - Start your first quiz!"
- "Analysis in progress..." (with loading animation)

---

## 🔐 Security & Privacy

- All analysis data is user-specific (filtered by `user_id`)
- AI recommendations stored in database (not regenerated each time)
- Option to clear analysis history
- No sharing of individual performance data

---

## 📊 Success Metrics

- **Engagement**: % of users who view Progress Report
- **Action Rate**: % who click "Review Lesson" or "Retake Quiz"
- **Improvement**: Score improvement after following recommendations
- **Retention**: Users who return to study based on AI suggestions

---

## 🚀 Future Enhancements (Post-MVP)

- **Comparative Analytics** - Compare with class average
- **Time-based Insights** - "You perform better in morning quizzes"
- **Spaced Repetition** - Remind to review topics at optimal intervals
- **Export to PDF** - Download detailed progress report
- **Teacher Dashboard** - Aggregate student insights for teachers
- **Gamification** - Badges for improvement streaks

---

## ❓ Questions for You

1. **AI Provider**: Use OpenAI or Gemini for analysis? (I recommend Gemini for cost)
2. **Analysis Frequency**: Real-time after each quiz, or batch daily?
3. **Priority Levels**: Should we show all lessons or only top 5 priorities?
4. **Export Format**: PDF, CSV, or both?
5. **Teacher Access**: Should teachers see student progress reports?

---

**Ready to proceed?** Let me know if you want to:
- Add/modify any features
- Change the UI design
- Adjust the AI analysis approach
- Start implementation immediately
