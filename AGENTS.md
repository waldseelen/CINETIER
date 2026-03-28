# AGENTS.md - Agent Workflow Guide for CineTier

This document describes when and how to use Claude AI agents for CineTier development.

---

## Quick Reference

| Task | Agent | Trigger | Time to Use |
|------|-------|---------|-----------|
| **Feature/Refactor Planning** | `planner` | New features, major refactoring | BEFORE coding |
| **Code Review** | `code-reviewer` | After writing/modifying code | AFTER coding |
| **New Feature with Tests** | `tdd-guide` | Bug fixes, new features | BEFORE implementation |
| **Build/Type Errors** | `build-error-resolver` | `npm run build` fails | IMMEDIATELY |
| **E2E Testing** | `e2e-runner` | Critical user flows | AFTER feature complete |
| **Architecture Decision** | `architect` | System design, scalability | BEFORE major changes |
| **Dead Code Cleanup** | `refactor-cleaner` | Code maintenance | AFTER features stable |

---

## Detailed Agent Guide

### 1. Planner Agent - Implementation Planning

**Use When:**
- Planning a new complex feature (tier list builder, anime support, etc.)
- Major refactoring (API layer redesign, database schema change)
- Multi-step initiatives (auth system, notification system)
- Architectural decisions needed

**How to Invoke:**
```
I'm adding support for [feature]. Please create an implementation plan.
```

**Outputs:**
- Step-by-step implementation phases
- Critical files to modify
- Identified risks and dependencies
- Task breakdown

**Example - Anime Support:**
```
"I want to add MyAnimeList support to the search and tier lists.
Please create an implementation plan."
```

The planner will identify:
1. Create Jikan API wrapper
2. Add anime fields to database
3. Update unified search endpoint
4. Modify tier list builder for anime
5. Add anime detail page

---

### 2. Code Reviewer Agent - Quality Assurance

**Use When:**
- ✅ Right after writing code
- ✅ Before committing to git
- ✅ When you want security/performance review
- ✅ Cross-checking logic

**How to Invoke:**
```
I just updated [files]. Please review the code.
```

**What It Checks:**
- TypeScript type safety
- Error handling completeness
- Security vulnerabilities (SQL injection, XSS, etc.)
- Performance issues
- Code quality & readability
- Immutability patterns

**Mandatory For:**
- API endpoints (security)
- Database queries (SQL injection, RLS)
- Authentication logic
- User input handling

---

### 3. TDD Guide Agent - Test-Driven Development

**Use When:**
- Implementing a new feature
- Fixing a bug
- Ensuring test coverage ≥ 80%

**Workflow:**
1. Agent writes tests FIRST
2. You implement to pass tests
3. Agent reviews implementation
4. Coverage verified (80%+)

**How to Invoke:**
```
I need to add [feature]. Use TDD: write tests first, then implementation.
```

**Example - Adding VS Mode:**
```
"Use TDD to implement the VS mode rating calculation.
Start with tests for the Elo algorithm."
```

The agent will:
1. Write test cases for Elo calculation
2. Create mock data for matches
3. Test leaderboard updates
4. Verify edge cases

**Key Files:**
- Tests: `tests/lib/elo.test.js`
- Implementation: `lib/elo/calculate.ts`

---

### 4. Build Error Resolver - Compilation Fixes

**Use When:**
- `npm run build` fails with errors
- TypeScript compilation errors
- ESLint warnings (when they block build)

**How to Invoke:**
(Automatic - just run `npm run build` and share error output)

**Handles:**
- Type mismatches
- Import/export issues
- Missing dependencies
- Module resolution errors
- ESLint config issues

**Recent Example - Rating Badges:**
```
Build failed: RatingBadges component received wrong props
Fix: Changed individual props to single `ratings` object prop
```

---

### 5. E2E Runner Agent - Integration Testing

**Use When:**
- Feature implementation complete
- Testing critical user flows
- Before deployment
- Regression testing

**Critical User Flows in CineTier:**
1. **Create & Share Tier List**
   - Create new list → Add films → Arrange tiers → Share

2. **VS Mode Ranking**
   - Start VS match → Compare 2 films → Submit result → Check Elo update

3. **Search & Rate**
   - Search film → Open details → Rate actor → See profile update

4. **Anime Integration**
   - Search anime → Open MyAnimeList → Add to tier list

**How to Invoke:**
```
Test the [flow] end-to-end. Start from [page], verify [outcome].
```

**Example:**
```
"Create an E2E test for the tier list creation flow:
1. Start from /create page
2. Search for 'Inception'
3. Add to tier list
4. Move to S tier
5. Verify save and share button works"
```

---

### 6. Architect Agent - System Design

**Use When:**
- Major architectural decisions
- Database schema redesign
- API layer restructuring
- Performance optimization strategy

**Recent Architecture Decisions:**
- Unified search across TMDB + Jikan
- Elo rating system for VS mode
- OG image generation for sharing
- Real-time notifications via Supabase

**How to Invoke:**
```
We need to [add/change/improve] [system].
What's the best architecture?
```

**Example:**
```
"Users want real-time notifications for new comments on their tier lists.
What's the best architecture - polling, subscriptions, webhooks?"
```

---

### 7. Refactor Cleaner - Code Maintenance

**Use When:**
- Removing unused code/dependencies
- Consolidating duplicate logic
- Cleaning up technical debt
- After major features are stable

**Identifies:**
- Dead code (unused functions, imports)
- Duplicate code
- Unused dependencies
- Over-engineering

**How to Invoke:**
```
Clean up dead code in [module/directory].
```

**Example:**
```
"Scan lib/tmdb/ for unused functions and dependencies.
Remove anything not used by current features."
```

---

## Recommended Workflow for CineTier

### Adding a New Feature (e.g., Anime Support)

```
1. PLAN
   └─ Use planner: "Create implementation plan for anime support"

2. TEST-FIRST
   └─ Use tdd-guide: "Write tests for Jikan API wrapper"

3. IMPLEMENT
   └─ Create lib/jikan/client.ts
   └─ Create app/api/anime/route.ts
   └─ Update components/search/

4. REVIEW
   └─ Use code-reviewer: "Review all anime-related code"

5. BUILD
   └─ Run: npm run build
   └─ If fails → Use build-error-resolver

6. TEST E2E
   └─ Use e2e-runner: "Test searching and adding anime to tier lists"

7. COMMIT
   └─ git commit -m "feat: add anime support via Jikan API"
```

### Fixing a Bug (e.g., Rating Badge Error)

```
1. REPRODUCE
   └─ npm run build (if build error)
   └─ Test manually (if runtime error)

2. FIX
   └─ Identify root cause
   └─ Apply minimal fix

3. REVIEW
   └─ Use code-reviewer: "Review the bug fix"

4. TEST
   └─ Verify fix works
   └─ Check for regressions

5. COMMIT
   └─ git commit -m "fix: [issue description]"
```

### Performance Optimization

```
1. ANALYZE
   └─ Use architect: "How can we improve [performance metric]?"

2. PLAN
   └─ Get detailed optimization strategy

3. IMPLEMENT
   └─ Apply optimizations incrementally

4. REVIEW
   └─ Measure improvement
   └─ Use code-reviewer to validate changes

5. COMMIT
   └─ git commit -m "perf: [improvement description]"
```

---

## Agent-Specific Guidelines

### When Using Planner
- Be specific about requirements
- Mention constraints (performance, compatibility)
- Ask for risk analysis
- Request task breakdown

**Example Query:**
```
I want to add a leaderboard showing top VS mode players with Elo ratings.
- Show top 100 players
- Real-time ranking updates
- Cache for performance
- Mobile responsive
Plan the implementation.
```

### When Using Code Reviewer
- Provide context about changes
- Mention files modified
- Ask about specific concerns
- Share error messages if any

**Example Query:**
```
I added a new Supabase RLS policy for tier lists.
Files: db/migrations/006_tier_list_access.sql
Concerns: Security, performance impact
Review for vulnerabilities.
```

### When Using TDD Guide
- Start with test writing
- Provide implementation context
- Focus on edge cases
- Aim for 80%+ coverage

**Example Query:**
```
Use TDD to implement vote counting for VS matches.
Requirements:
- Count votes per option
- Handle tie-breaking
- Update leaderboard
Write tests first.
```

### When Using Build Error Resolver
- Share full error message
- Provide file context
- Mention what you changed
- Include error stack trace

**Example Query:**
```
npm run build failed with:
Type error: Property 'imdbRating' does not exist on type 'RatingBadgesProps'
File: app/media/[type]/[tmdbId]/page.tsx:246
I just added rating badges to the media detail page.
```

---

## Do's and Don'ts

### ✅ DO
- Use agents for complex tasks
- Invoke agents early (planning phase)
- Review agent suggestions before implementing
- Run full build/tests after agent work
- Use code-reviewer after writing code
- Combine multiple agents for major features

### ❌ DON'T
- Use agents for trivial single-line fixes
- Skip testing between agent invocations
- Blindly accept agent suggestions without understanding
- Use planner for existing patterns you know
- Ignore agent warnings about security/performance
- Commit without code review

---

## Integration with CLAUDE.md

This document works with **CLAUDE.md** which covers:
- Code patterns and best practices
- File organization
- API design
- Database patterns
- Testing requirements

**AGENTS.md** covers:
- When to use which agent
- How to invoke agents effectively
- Workflow recommendations
- Agent-specific guidelines

---

## Quick Command Reference

```bash
# Run build (triggers build-error-resolver if fails)
npm run build

# Run tests
node tests/run-all.js

# Check environment
npm run check:env

# Type generation
npm run db:generate
```

---

## Questions?

Refer to:
- **CLAUDE.md** - Code patterns & best practices
- **ARCHITECTURE.md** - System design & data flow
- **README.md** - Project overview & setup
