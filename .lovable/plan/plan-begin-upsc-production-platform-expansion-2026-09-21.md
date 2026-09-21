# Plan: BEGIN UPSC production platform expansion

## Goal
Turn the existing BEGIN UPSC foundation into a working learner platform with real authentication, database-backed learning workflows, admin-only content management, responsive layouts, and a more distinctive UPSC aspirant visual direction.

## What will be built
1. **Data and security foundation**
   - Add admin roles, expanded profile/onboarding fields, hierarchical syllabus topics, MCQs, tests, answers, current affairs, mains questions/submissions, planner tasks, bookmarks, resources, notifications, and activity records.
   - Add indexes, constraints, timestamps, seed UPSC content, and strict access rules so users only manage their own data while admins manage content.

2. **Authentication and onboarding**
   - Keep email/password and Google sign-in.
   - Add separate login, signup, forgot-password, reset-password friendly routes while preserving the existing auth flow.
   - Create/update user profiles after signup and add onboarding for target year, preparation stage, preferred areas, and daily study goal.

3. **Premium public website**
   - Redesign the landing page for BEGIN UPSC with a distinctive academic Indian education feel, avoiding the current white/blue look.
   - Add responsive navigation, sections requested by the brief, clear CTAs, and a cinematic visual background inspired by LBSNAA/UPSC aspirations using safe generated or project-served imagery rather than hotlinked media.

4. **Learner application**
   - Build the main protected areas: dashboard, syllabus/topics, subjects, current affairs, practice/tests/results, mains answer writing, planner, bookmarks, global search, analytics, resources, profile, and AI assistant.
   - Make actions database-backed: progress updates, bookmarks, study tasks, test attempts, answer submissions, resource reads, and analytics summaries.

5. **Admin application**
   - Add a protected admin section with role checks.
   - Build management screens for users, questions, current affairs, syllabus, resources, mains questions, and settings.
   - Ordinary users will not be able to edit platform content.

6. **Quality pass**
   - Add page metadata for content routes.
   - Validate key flows: auth redirects, progress CRUD, planner CRUD, bookmarks, tests, mains submission, admin authorization, and responsive layouts.

## Implementation notes
- This will be delivered incrementally because the requested scope is a full product, not a single-page update.
- The first build milestone will prioritize the database/RLS upgrade, role model, responsive app shell, richer landing page, onboarding, and core learner CRUD routes.
- The AI assistant will use the existing secure server-side AI key and will clearly label responses as AI-assisted, not official UPSC guidance.
- Real photos/videos of UPSC winners or LBSNAA cannot be used unless you provide rights-cleared media. I will use generated/owned visual assets or a safe media treatment instead.
