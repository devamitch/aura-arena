# Contributing to AURA ARENA

We welcome contributions! This document explains coding standards, workflow, and review expectations.

---

## Code Standards

### Non-Negotiable Rules

1. **Zero class components** — all React components must be functional
2. **Zero class-based services** — all services must be functional modules
3. **Strict TypeScript** — `strict: true`, no `@ts-ignore` in production code
4. **Granular Zustand selectors** — no component may subscribe to the full store
5. **No `setInterval` in render paths** — use `requestAnimationFrame` for detection loops
6. **Framer Motion only for transform/opacity** — never animate layout properties

### Naming Conventions

```ts
// Components: PascalCase
const ProfilePage = () => { ... }

// Hooks: camelCase, always 'use' prefix
const usePersonalization = () => { ... }

// Store selectors: exported from store/index.ts as 'use' + noun
export const useXP = () => useStore(s => s.xp);

// Constants: SCREAMING_SNAKE_CASE
export const TIERS = [...];

// Types: PascalCase, interfaces preferred over type aliases for objects
interface SessionData { ... }

// Utility functions: camelCase verbs
export const calcFrameScore = () => { ... }
```

### File Organization

- **Components**: One component per file. Filename matches component name.
- **Hooks**: One hook per file. Filename is the hook name.
- **Store slices**: One slice per file in `store/slices/`.
- **Pages**: Named `<Context>Page.tsx` (e.g., `DashboardPage.tsx`, `TrainingPage.tsx`).
- **Utilities**: Pure functions only in `lib/utils.ts` and related lib files.

---

## Architecture Rules

### State Management
- UI state → Zustand store
- Server state → TanStack Query
- Component-local transient state → `useState`
- Never sync server state into Zustand manually

### Imports
- Always use path aliases: `@/components/...`, `@/store`, `@/lib/...`
- Never use relative paths that go up more than one level: ❌ `../../store`
- Barrel exports through `index.ts` files

### Performance
- Wrap expensive list rows in `React.memo()`
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive derivations (not for simple calculations)

---

## Development Workflow

### Branching

```
main         Production-ready code
dev          Integration branch
feat/xxx     Feature branches (from dev)
fix/xxx      Bug fix branches (from dev)
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(reels): add double-tap like with heart animation
fix(store): convert Set serialization for persist middleware
perf(training): move detection loop to rAF, remove setInterval
docs(api): add useAchievements hook documentation
refactor(scoring): extract discipline weight tables to constants
```

### Pull Request Checklist

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] New features have at least smoke-test coverage
- [ ] No full store subscriptions in new components
- [ ] No class-based code introduced
- [ ] Framer Motion variants only use `transform` / `opacity`
- [ ] All new strings that appear in UI are legible at smallest supported font size (320px viewport)
- [ ] Camera/MediaPipe code uses `requestAnimationFrame`, not `setInterval`

---

## Testing

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI browser interface
```

### Test Conventions
- Tests live adjacent to source: `useAI.test.ts` next to `useAI.ts`
- Use `@testing-library/react` for component tests
- Mock Supabase with `vi.mock('@/lib/supabase/client')`
- Mock Gemini with `vi.mock('@/lib/gemini')`
- Test IDs: use `data-testid` sparingly, prefer accessible role queries

### Coverage Targets
- Hooks: 80%+
- Score engine: 90%+
- Achievement service: 90%+
- UI components: 60%+

---

## Adding a New Discipline

1. Add type to `DisciplineId` union in `src/types/index.ts`
2. Add the discipline object to `DISCIPLINES` array in `src/constants/disciplines.ts`:
   - Include at least 5 sub-disciplines
   - Include at least 10 drills with proper difficulty/duration
   - Set `coachingTone`, `statLabels`, `challengeNames`, `bgMusic`
   - Set a color that doesn't clash with existing disciplines
3. Add scoring weight profile in `src/lib/scoreEngine.ts` `DISCIPLINE_WEIGHTS` object
4. Update `README.md` discipline table
5. Update `docs/FEATURES.md` discipline list

---

## Adding a New Achievement

1. Add the achievement object to `ACHIEVEMENTS` array in `src/constants/gamification.ts`
2. Add the unlock condition in `src/services/achievementService.ts` under the appropriate trigger
3. Test the condition in `src/services/achievementService.test.ts`
4. Update `docs/FEATURES.md` achievements section

---

## Questions?

Open an issue with the `question` label. For large architectural changes, open an RFC issue first for discussion before submitting a PR.
