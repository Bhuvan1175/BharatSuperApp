---
name: manager-task
description: Take a task description from your manager (pasted text or a ticket link), implement it in BharatAppFrontend and/or bharat-app-backend, test it, self-review the diff as a senior developer would, and produce a status summary to report back. Trigger on "my manager asked for...", "finish this task", "implement this ticket", "here's what needs to get done", or a pasted list of requirements/points to build.
---

# Manager task workflow

Repo root: `D:\BharatSuperApp` (single git repo containing both
`BharatAppFrontend/` — React Native app — and `bharat-app-backend/` —
NestJS API). Commands below assume you `cd` into whichever sub-project
the task touches; if it touches both, do the frontend and backend legs
separately.

This skill is a **process**, not a driver script: there's no GUI to
screenshot here, just a build → test → review → report loop. Follow
the steps in order. Don't skip the review step even for small tasks —
that's the part that catches the stuff tests don't.

## 1. Scope the task

- If given pasted text: read it as the actual requirement, not a
  prompt to improvise around. If it's ambiguous (unclear which screen,
  no acceptance criteria, conflicting with existing behavior), ask the
  user 1-2 clarifying questions before writing code. Guessing wrong on
  a manager's task wastes more time than asking.
- If given a ticket link (Linear/Asana/Jira/Notion): those connectors
  are **not yet authorized** in this environment (see the system
  reminder listing `plugin:operations:asana`,
  `plugin:operations:atlassian`, `plugin:operations:notion` etc. as
  requiring auth). Tell the user to authorize the relevant connector
  via `claude mcp` or `/mcp` in an interactive session, or just paste
  the ticket contents directly — don't try to fetch it yourself.
- Identify which side(s) of the repo are affected: frontend
  (`src/screens`, `src/components`, `src/hooks`, `src/api`, `src/navigation`)
  or backend (`src/**/*.controller.ts`, `*.service.ts`, `*.module.ts`,
  `prisma/schema.prisma`).

## 2. Implement

Standard editing — no special tooling here. Match the existing
patterns in the file/module you're touching rather than introducing a
new convention (this repo has RBAC-based screens, Zustand stores,
NestJS modules with controller/service/dto split — follow whichever
one is already there).

## 3. Test

Run tests scoped to what you touched, not a full-repo pass — see
Gotchas below for why full-repo lint/typecheck/test are currently
noisy independent of your change.

**Frontend** (`cd BharatAppFrontend`):
```
npx jest <path/to/relevant.test.ts>      # targeted; `npx jest` alone runs all
npx eslint <changed files>                # lint only the files you touched
```
If you added new logic with no test coverage, add a test under
`__tests__/` following the existing `aiService.test.ts` /
`helpers.test.ts` pattern.

**Backend** (`cd bharat-app-backend`):
```
npx nest build                            # verified: exits 0 cleanly on a clean tree
npx jest <path/to/relevant.spec.ts>       # targeted
```
If your change touches a controller/service that has a `.spec.ts`
sibling, run that spec and make sure it still passes. If it doesn't
have one and your change is non-trivial, add one.

## 4. Self-review as a senior developer

Before calling it done, review your own diff (`git diff`) as if it
were someone else's PR. Fill in this checklist for real — don't just
assert "looks good":

```
- [ ] Correctness: does it do what the task asked, incl. edge cases
      (empty state, error/loading state, RBAC role checks)?
- [ ] Consistency: matches naming/file placement/patterns already used
      nearby? No new abstraction introduced for a one-off change?
- [ ] Security: no secrets/tokens committed, no unvalidated input into
      Prisma queries or file paths, RBAC guards still applied?
- [ ] Test coverage: is the new/changed logic actually exercised by a
      test, not just "it builds"?
- [ ] Cleanliness: no leftover console.log/commented-out code/TODOs
      you introduced, no unrelated files touched?
- [ ] Lint delta: ran eslint on exactly the changed files (not the
      whole repo — see Gotchas) and it's clean, or any remaining
      errors are pre-existing ones you didn't introduce?
```

If review turns up a real problem, fix it and re-run step 3 before
moving on — don't report a task done with a known issue unmentioned.
(Worked example below: the lint pass caught a real issue mid-review
and it got fixed before reporting, not after.)

## 5. Report back

Default: summarize in chat using this shape — the user relays it to
their manager themselves:

```
Task: <one-line description of what was asked>
Changed: <files touched, grouped by frontend/backend>
Tests: <exact commands run + result, e.g. "8/8 backend suites pass">
Review: <anything the self-review step caught and fixed>
Out of scope / pre-existing: <anything deliberately not touched,
  e.g. repo-wide tsc/eslint debt — see Gotchas>
Status: done / blocked on <X>
```

Do not draft or send a Slack/email message to the manager unless the
user explicitly asks for that in this conversation — sending messages
on someone's behalf requires their explicit go-ahead each time, not a
standing default.

## Worked example (verified 2026-07-18)

Ran this skill end-to-end on a real, self-contained task: fix the 5
pre-existing failing backend Jest suites (see Gotchas history below).

1. **Scope**: read all 5 failures — 4 were NestJS DI errors (spec
   files scaffolded before their controller/service grew constructor
   dependencies), 1 was a stale assertion (`app.controller.spec.ts`
   expected `"Hello World!"` but `AppService.getHello()` intentionally
   returns `"Hello Bhuvan!"`).
2. **Implement**: added `useValue: {}` provider mocks for the missing
   dependencies in `auth.service.spec.ts` (missing `EmailService`),
   `auth.controller.spec.ts` (missing `AuthService`),
   `users.service.spec.ts` (missing `PrismaService` +
   `CloudinaryService`), `users.controller.spec.ts` (missing
   `UsersService`) — following the mocking convention already used in
   `auth.service.spec.ts`. Updated the stale string assertion in
   `app.controller.spec.ts` to match the service's actual (intended)
   return value rather than reverting the service.
3. **Test**: `npx jest` → `Test Suites: 8 passed, 8 total` (up from
   3 passed / 5 failed). `npx nest build` → exit 0.
4. **Review**: ran `npx eslint` on just the 5 touched spec files and
   it caught one real new issue (`Insert ␍⏎` — a stray CRLF introduced
   by the edit) in `auth.service.spec.ts`. Fixed with
   `npx eslint <file> --fix`, then re-ran `npx jest` to confirm the fix
   didn't break the test (still 8/8).
5. **Report**:
   ```
   Task: fix 5 pre-existing failing backend Jest suites
   Changed: bharat-app-backend/src/{app.controller.spec.ts,
     auth/auth.service.spec.ts, auth/auth.controller.spec.ts,
     users/users.service.spec.ts, users/users.controller.spec.ts}
   Tests: npx jest → 8/8 suites pass (was 3/8). npx nest build → exit 0.
   Review: eslint caught a stray CRLF in auth.service.spec.ts, fixed
     with --fix before reporting.
   Out of scope: frontend tsc/eslint repo-wide debt — untouched,
     unrelated to this task (see Gotchas).
   Status: done
   ```

## Gotchas (verified 2026-07-18)

- **Frontend `tsc --noEmit` fails repo-wide**, unrelated to any task:
  `error TS5098: Option 'customConditions' can only be used when
  'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'.`
  This comes from `@react-native/typescript-config` conflicting with
  the `"moduleResolution": "node"` override in
  [tsconfig.json](../../../BharatAppFrontend/tsconfig.json). It fails
  before checking a single file, so there is currently no working
  full-project typecheck command — don't report "typecheck passed,"
  and don't burn time trying to make it pass as part of an unrelated
  task; flag it separately if the user wants it fixed.
- **Frontend `eslint`** currently reports ~880 errors / ~480 warnings
  repo-wide (mostly `prettier/prettier` formatting drift + some
  `curly` warnings), all pre-existing. Lint the files you changed, not
  the whole tree, or you'll drown in unrelated noise.
- **Backend `jest`**: as of 2026-07-18 all 8 suites pass (see Worked
  example above — 5 were previously failing on DI/stale-assertion
  issues and got fixed as this skill's own validation run). If you
  see failures again, don't assume they're pre-existing noise like
  before — check whether your change or a merge introduced them,
  since the baseline is now genuinely green.
- **Backend `nest build`** works cleanly (exit 0) on a clean tree —
  safe to use as a real correctness gate for backend changes.
- **NestJS spec scaffolding trap**: Nest CLI generates `*.spec.ts`
  files with `providers: [ThingUnderTest]` or
  `controllers: [ThingUnderTest]` and nothing else. The moment the
  real class gains a constructor dependency, the generated spec breaks
  with a DI resolution error — it doesn't get updated automatically.
  When adding a constructor param to a service/controller, check its
  sibling `.spec.ts` and add a `{ provide: NewDep, useValue: {} }`
  entry, following the pattern already in `auth.service.spec.ts`.
