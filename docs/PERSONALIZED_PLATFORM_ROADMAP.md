# Personalized learning foundation — development plan

## What this branch implements
- Dashboard no longer claims Day 32 is every visitor's completed day.
- Per-browser preference form: display name, self-selected level A2–C1, study minutes, goal, explanation languages.
- Existing, sourced Day 32 content remains as an explicitly labelled **sample lesson**, not a complete course.
- Local practice drafts, optional word hints, sample-answer comparison and JSON export.
- Question-draft interface that clearly says AI support is **not active**.
- No credential collection, API secrets, or misleading automated grading.
- Removes one learner's historical submitted answers from the public JavaScript lesson bundle.

## Important limitations
This is a static GitHub Pages prototype. It does NOT offer user accounts, cross-device progress, dynamic lesson recommendation, AI grading, AI questions, genuine pronunciation assessment, a C1-complete curriculum, or a placement test. Browser storage is per browser profile, not per authenticated user. If multiple people use the same browser, their drafts may be visible to each other.

## Next milestones
1. Define reviewed content schema for vocabulary, exercises, levels, tags, prerequisites and provenance. Expand original authored/verified lessons independently of historical daily records.
2. Add authentication and database with per-user row-level security, backup and deletion/export workflow.
3. Add safe backend for AI grading/Q&A, with input validation, rate limits, privacy controls, cost budgets and educational accuracy evaluation. Never embed the API key in JavaScript shipped to browsers.
4. Add personalized selection, placement diagnostics, spaced repetition, and robust accepted-alternative handling.
5. Add sourced CEFR-aligned reading, listening, writing and speaking activities, QA/editorial review and accessibility testing.

## Test checklist
- Open index.html and check dashboard, five tabs and mobile layout.
- Change preferences; reload and verify persistence, then ensure no global Day 32 completed claim.
- Enter a practice draft, reload and verify persistence, reveal hints and comparison.
- Export JSON and check that it contains only current local learner drafts.
- Verify question draft stays local and does not pretend an AI response has been sent.
- Check browser console for errors, ensure GitHub Pages workflow still publishes web/.
