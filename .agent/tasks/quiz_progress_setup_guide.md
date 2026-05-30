# Quiz Progress Report - Setup & Testing Guide

## 🎯 Current Status
- ✅ All code implemented (Foundation + UI)
- ⏳ Database migration ready to run
- ⏳ Integration with quiz completion pending

---

## 📋 Step-by-Step Setup

### Step 1: Run Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/manual_migration_quiz_progress.sql`
4. Copy and paste the entire content
5. Click **Run**
6. You should see: "Migration completed successfully!"

**Option B: Via Supabase CLI**
```bash
cd /Users/zakariyayahiaoui/Development/projects/App\ 2/an_nakhlah_hub_v3
supabase db reset  # Only if you want to reset everything
# OR
supabase db push --include-all  # Push all pending migrations
```

---

### Step 2: Register Services in Dependency Injection

Add the new services to your DI container (likely in `lib/core/di/injection.dart` or similar):

```dart
// Add these imports
import 'package:an_nakhlah_hub_v3/services/spaced_repetition_service.dart';
import 'package:an_nakhlah_hub_v3/services/quiz_analysis_service.dart';
import 'package:an_nakhlah_hub_v3/data/repositories/quiz_analysis_repository.dart';
import 'package:an_nakhlah_hub_v3/data/repositories/lesson_dependency_repository.dart';
import 'package:an_nakhlah_hub_v3/data/repositories/study_chat_repository.dart';

// Register in your DI setup (if not using @injectable auto-generation)
getIt.registerLazySingleton(() => SpacedRepetitionService());
getIt.registerLazySingleton(() => QuizAnalysisRepository(getIt()));
getIt.registerLazySingleton(() => LessonDependencyRepository(getIt()));
getIt.registerLazySingleton(() => StudyChatRepository(getIt()));
getIt.registerLazySingleton(() => QuizAnalysisService(
  getIt(),
  getIt(),
  getIt(),
));
```

**If using @injectable (recommended):**
Just run:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

---

### Step 3: Trigger Analysis After Quiz Completion

Find where quiz completion is handled (likely in `AIQuizTab` or `StandaloneAIQuizScreen`) and add analysis trigger.

**Location to modify:** `lib/presentation/screens/lessons/ai_quiz_tab.dart`

**Add this method:**
```dart
Future<void> _triggerQuizAnalysis() async {
  try {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final analysisService = GetIt.I<QuizAnalysisService>();
    
    // Calculate total score
    final totalScore = _scores.values.fold<int>(0, (sum, score) => sum + score);
    final maxScore = widget.questions.fold<int>(0, (sum, q) => sum + q.points);
    
    // Build question details
    final questionDetails = <String, dynamic>{};
    for (var i = 0; i < widget.questions.length; i++) {
      final question = widget.questions[i];
      final score = _scores[question.id] ?? 0;
      questionDetails[question.id] = {
        'score': score,
        'max_score': question.points,
        'concept': question.concept ?? 'General',
        'attempts': _attemptNumber,
      };
    }

    // Trigger analysis
    await analysisService.analyzeQuizSession(
      userId: userId,
      lessonId: widget.lessonId,
      lessonTitle: 'Quiz ${widget.lessonId.substring(0, 8)}', // TODO: Get actual title
      score: totalScore,
      maxScore: maxScore,
      questions: widget.questions,
      questionDetails: questionDetails,
    );

    print('✅ Quiz analysis completed!');
  } catch (e) {
    print('❌ Quiz analysis failed: $e');
  }
}
```

**Call it when quiz completes:**
```dart
// In the _finishQuiz method or wherever quiz completion is handled
void _finishQuiz() {
  // ... existing completion logic ...
  
  // Trigger analysis
  _triggerQuizAnalysis();
  
  // ... rest of completion logic ...
}
```

---

### Step 4: Test the Feature

1. **Hot Restart** your app (press `R` in Flutter terminal)

2. **Complete a Quiz:**
   - Navigate to Quiz Hub
   - Take any quiz
   - Complete all questions
   - Submit the quiz

3. **View Progress Report:**
   - Go to Quiz Hub
   - Tap "Progress Report" tab
   - You should see:
     - Performance Summary Card (completion %, avg score, traffic lights)
     - Lesson Analysis Cards grouped by priority
     - Retry timers
     - AI recommendations (if AI analysis succeeded)

4. **Expected Behavior:**
   - First quiz: Shows in appropriate priority level (Red/Amber/Green)
   - Score < 50%: Red (High Priority - Retry Needed)
   - Score 50-79%: Amber (Medium Priority - Review Recommended)
   - Score 80%+: Green (Excellent - Keep It Up!)
   - Retry timer shows "Retry in X days" based on score

---

## 🐛 Troubleshooting

### Issue: "No Quiz Data Yet" after completing quiz
**Solution:**
- Check console for analysis errors
- Verify database migration ran successfully
- Ensure `_triggerQuizAnalysis()` is being called
- Check Supabase logs for any RLS policy issues

### Issue: Analysis cards show but no AI recommendations
**Solution:**
- This is expected initially - AI analysis is a fallback
- The cards will still show scores, retry timers, and class comparisons
- AI recommendations will appear once the AI service is properly integrated

### Issue: Class comparison not showing
**Solution:**
- Class averages require multiple students to have completed the same quiz
- Complete the same quiz with different accounts to test
- Or manually insert test data into `quiz_performance_analysis`

---

## 📊 Test Data (Optional)

To test with sample data, run this in Supabase SQL Editor:

```sql
-- Insert sample analysis for testing
INSERT INTO quiz_performance_analysis (
  user_id,
  lesson_id,
  total_attempts,
  best_score,
  average_score,
  last_attempt_at,
  first_attempt_at,
  weakness_areas,
  common_mistakes,
  ai_recommendation,
  priority_level,
  next_optimal_retry_at,
  retry_interval_days,
  is_ready_for_retry
) VALUES (
  auth.uid(), -- Your current user ID
  (SELECT id FROM sub_lessons LIMIT 1), -- First lesson
  2,
  45,
  42.5,
  NOW(),
  NOW() - INTERVAL '2 days',
  '["Hadith classification", "Narrator terminology"]'::jsonb,
  '["Confuses Thiqa with Da''if", "Misses chain breaks"]'::jsonb,
  'Review Hadith narrator reliability. Focus on Thiqa vs Da''if distinction.',
  1, -- High priority (Red)
  NOW() + INTERVAL '1 day',
  1,
  false
);
```

---

## 🎯 Next Features to Implement

1. **Progress Tree Visualization** - Show lesson dependencies
2. **AI Study Buddy Chat** - Interactive Q&A about progress
3. **Teacher Dashboard** - Class-wide analytics
4. **Notification System** - Remind students when ready to retry

---

## ✅ Checklist

- [ ] Run database migration
- [ ] Register services in DI
- [ ] Add analysis trigger to quiz completion
- [ ] Hot restart app
- [ ] Complete a test quiz
- [ ] View Progress Report tab
- [ ] Verify cards display correctly
- [ ] Test retry timer logic
- [ ] Test with multiple quizzes

---

**Need Help?** Check the implementation files:
- Database: `supabase/migrations/20260202_quiz_progress_analysis.sql`
- Services: `lib/services/quiz_analysis_service.dart`
- UI: `lib/presentation/screens/quiz/progress_report_tab.dart`
