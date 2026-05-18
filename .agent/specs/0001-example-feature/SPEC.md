# Spec: Example Feature

> This is a worked example so you can see the shape of a real spec.
> Delete this folder once you've created your first real one.

## Problem

New users hit the app cold and have no obvious next step after signup.
Activation drops 40% between account creation and first meaningful action.

## Outcome

After signing up, a user lands on a personalized welcome screen that
surfaces three suggested first actions based on their stated role.

## Behavioral requirements

1. On successful signup, the user is redirected to `/welcome` (not `/`).
2. The welcome screen shows exactly three suggestions.
3. Suggestions are chosen from a configured list based on the role selected
   during signup.
4. Dismissing a suggestion never shows it again to that user.
5. Visiting `/welcome` after all three are dismissed redirects to `/`.

## Non-goals

- Personalization beyond role-based filtering (no ML, no behavioral signals)
- Editing the suggestion list via UI (it's a config file for now)
- Onboarding analytics dashboard

## Open questions

- None remaining — resolved during grilling on 2026-05-10.
