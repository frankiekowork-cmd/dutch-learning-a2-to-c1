# Recommended lessons and spaced review — prototype

## Implemented
- Four original demonstration lessons, one each at A2/B1/B2/C1.
- Eight original multiple-choice questions, two at each level, with Dutch answers, English explanations and Traditional Chinese/Cantonese explanations.
- Current-level question filtering and selection across levels.
- Rule-based next-lesson suggestion: due review first; otherwise, unacknowledged lesson at user's selected level, favoring their preferred learning goal; otherwise repeat.
- Users must deliberately submit a quiz answer to receive feedback, and must separately acknowledge completion of a lesson. Merely opening a lesson or leaving an incomplete answer does **not** mark progress.
- A wrong MCQ answer resets its review streak and schedules next-day review. Correct answers schedule intervals of 1, 3, 7, 14, and 30 days as streak increases.
- Quiz results, due dates, and new lesson drafts/completion flags are stored in browser-local storage, namespaced by current account. **They do not synchronize with Supabase at this stage.**
- No AI grading of written answers, no CEFR certification, no true diagnostic placement.
- A small sample question set is not enough to accurately assess mastery; results are for navigation and practice only.

## Operational caveats
- Due dates use timestamp intervals rather than school-calendar days and are displayed as UTC dates. Local day scheduling and time-zone preferences require future implementation.
- The system assumes honest self-acknowledgment; it does not infer lesson comprehension from a click.
- The daily study-duration preference is not yet an enforceable lesson time budget.
- Current recommendations are rule-based and based on **four** demonstration lessons, not adaptive mastery modeling.
- Cloud save/reading the legacy Day32 demo is independent from the local new curriculum quiz state.
- All test quizzes and content are separately authored educational examples, not recovered historical Days1–30.
- Avoid using the prototype for high-stakes language examinations or student evaluation.

## Test coverage
- Guest unanswered questions are not counted.
- Submitted MCQs show feedback; results persist across reload.
- Incorrect response resets scheduling; correct streak progressively increases intervals.
- Due reviews take precedence in dashboard suggestion.
- Existing curriculum and mocked Supabase account-isolation browser tests continue in CI.

## Next milestones
1. Extend reviewed curriculum by topic and CEFR descriptors, ensuring coverage of listening, reading, speaking and writing.
2. Add cloud progress tables with per-user RLS, automatic backups, privacy policy, export, account deletion and offline conflict handling.
3. Implement editorial review for accepted alternative Dutch sentences and individualized AI corrections behind a fully secured backend.
4. Add real-time browser tests using consented email test accounts before production merge.
