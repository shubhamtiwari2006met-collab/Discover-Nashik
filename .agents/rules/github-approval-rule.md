# Rule: Explicit Human Approval Required for GitHub Actions

This is a permanent GLOBAL RULE for every project and every Antigravity session.

1. **NEVER automatically send code or changes to GitHub.**
   Antigravity MUST NOT perform any of the following unless explicitly and directly authorized by the user for that specific action:
   - `git commit`
   - `git push`
   - `git push --force`
   - `git push --force-with-lease`
   - `git pull`
   - `git sync`
   - `git fetch` (if part of auto-sync)
   - creating/updating remote branches
   - publishing changes
   - creating/updating/merging Pull Requests

2. **EDITING CODE AND PUSHING CODE ARE TWO SEPARATE ACTIONS.**
   When requested to edit, fix, implement, refactor, debug, test, or build, Antigravity is authorized ONLY to work LOCALLY.

3. **WORKFLOW:**
   USER REQUEST → Inspect → Plan → Edit files LOCALLY → Run requested local validation/tests → STOP → WAIT FOR EXPLICIT GITHUB INSTRUCTION.

4. **EXPLICIT APPROVAL MUST BE SPECIFIC.**
   Only direct instructions explicitly mentioning GitHub, commit, or push (e.g., "Push these changes to GitHub", "Commit and push") count as authorization. Generic terms like "Do it", "Complete it", "Fix it", "Proceed", "Looks good" do NOT authorize GitHub actions.

5. **NEVER ASSUME APPROVAL.**
   A previous GitHub authorization does NOT automatically authorize future GitHub actions.

6. **FINAL STATE AFTER EVERY EDITING TASK:**
   When local work is finished, report:
   "Local changes completed. I have NOT committed or pushed anything to GitHub. Waiting for your explicit GitHub authorization."
   Then STOP.

7. **PRIMARY GIT BRANCH NAME:**
   The primary branch for all features, mobile responsive fixes, and commits is `Features-and-Mobile-responsive-fixes` (renamed from `security-hardening`). This applies across all accounts and sessions.
