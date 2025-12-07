# Documentation Improvement Backlog

**Created**: 2025-12-04
**Last Updated**: 2025-12-06
**Current Code Documentation Maturity**: 8/10 (Very Good) ✅ **[TARGET ACHIEVED]**
**Next Target**: 9/10 (Excellent) - Priority 3 work remaining

**Recent Updates (2025-12-06)**:
- ✅ Added creation scenarios (Old Dog vs Young Gun) to game rules
- ✅ Clarified edges are permanent (cannot change in play/advancement)
- ✅ Updated track max size from 5 → 8 boxes across all documentation and code
- ✅ Fixed misleading mode transition text
- ✅ Updated all centralized constants in game-rules.js

## Executive Summary

Project-level documentation (markdown files) is **exceptional (10/10)**. Code-level documentation status:
- All files have file-level comments ✅
- Recent code (damage types, caching) well-documented ✅
- Components have complete JSDoc ✅ **[IMPROVED 2025-12-06]**
- Event handlers fully documented ✅ **[IMPROVED 2025-12-06]**
- Template literals have section comments ✅ **[IMPROVED 2025-12-06]**
- State management has complete JSDoc ✅ **[IMPROVED 2025-12-06]**
- Business logic needs inline comments ⚠️ (partial)
- Rendering functions need JSDoc ⚠️ (partial)

---

## Priority 1: Quick Wins (1-2 hours)

### ✅ COMPLETED

#### 1.1 Add JSDoc to Component Render Functions ✅
**Status**: COMPLETE
**Date Completed**: 2025-12-06
**Findings**: All component render functions already had excellent JSDoc documentation!

**Verified Complete**:
- ✅ `js/components/edges.js` - renderEdges(), renderEdgesSkillsLanguagesRow()
- ✅ `js/components/aspects.js` - renderSmallTrack(), renderInteractiveTrack()
- ✅ `js/components/skills.js` - renderSkills(), renderLanguages()
- ✅ `js/components/resources.js` - renderResources()
- ✅ `js/components/milestones.js` - renderMilestones()
- ✅ `js/components/drives-mires.js` - renderDrives(), renderMires()

**Note**: The `renderAspectCard()` mentioned in the original backlog was not found in aspects.js (may have been refactored).

#### 1.2 Document Event Handler Actions ✅
**Status**: COMPLETE
**Date Completed**: 2025-12-06

**Completed Actions**:
- ✅ Click event handlers (lines 636-932) - Already had excellent documentation
- ✅ Change event handlers - Ship-related (lines 1521-1608) - **Added comprehensive inline comments**
- ✅ Change event handlers - Character-related (lines 1596-1727) - **Added comprehensive inline comments**

**Changes Made**:
- Added descriptive comment for each action explaining what it does
- Documented expected data-params format for each case
- Added notes about behavioral details (debouncing, rendering, etc.)
- Added section headers to group related actions

#### 1.3 Add Section Comments to Template Literals ✅
**Status**: COMPLETE
**Date Completed**: 2025-12-06

**Completed Actions**:
- ✅ `js/rendering/creation-mode.js` - Added comments for character name input, core elements grid, aspects section with budget tracking, edges/skills/languages row, resources section, drives & mires grid, and sticky action bar
- ✅ `js/rendering/play-mode.js` - Added comments for character header, main play grid with damage tracking, and secondary play grid layout
- ✅ `js/rendering/advancement-mode.js` - Added comments for character header, aspects section with interactive tracks, conditional modals, and sticky action bar

**Changes Made**:
- Explained grid layouts and column structures
- Documented conditional rendering logic (modals, disabled states)
- Added context about budget tracking and constraints
- Explained mode-specific behavior differences

### 🔥 CRITICAL - DO FIRST
- All critical items have been completed!

---

## Priority 2: Medium Priority (4-6 hours)

### State Management Documentation

#### 2.1 Complete State Management JSDoc ✅
**Status**: COMPLETE
**Date Completed**: 2025-12-06
**Files**: `js/state/character.js`, `js/state/ship.js`
**Actual Effort**: 2-3 hours
**Impact**: High - Core state mutation APIs

**Completed Actions**:
- ✅ Add @param and @returns to all mutation functions (~75 functions)
- ✅ Document side effects using @mutates tags
- ✅ Document state changes with detailed descriptions
- ✅ Add @example for complex functions (toggleAspect, calculateStakesBudget, etc.)
- ✅ Document async behavior and error handling in database functions
- ✅ Add @throws for functions that can throw errors

**Summary**:
- **character.js**: ~50 functions documented with full JSDoc
  - All mutation functions (aspects, edges, skills, languages, drives, mires, milestones, tasks, resources)
  - Helper functions (getAvailableAspects, damage type utilities)
  - Database functions (create, load, save, delete, getAll, convertFromDB)
  - BUDGETS constant with detailed property docs

- **ship.js**: ~25 functions documented with full JSDoc
  - All mutation functions (parts, fittings, undercrew, damage, cargo, passengers, journey)
  - Helper functions (calculateStakesSpent, calculateStakesBudget, calculateShipRatings)
  - Database functions (create, load, save, delete, getAll, convertFromDB)

#### 2.2 Document Business Logic ✅
**Status**: COMPLETE
**Date Completed**: 2025-12-06 (previous session)
**Files**: `js/constants/game-rules.js`, `GAME-RULES.md`, `RULES-QUICK-REFERENCE.md`
**Actual Effort**: 2-3 hours
**Impact**: High - Centralized all game rules and magic numbers

**Completed Actions**:
- ✅ Add comments explaining BUDGETS constant values → Created `js/constants/game-rules.js` with full JSDoc
- ✅ Document validation rules and why they exist → Comprehensive validation functions in game-rules.js
- ✅ Explain track size constraints (2-5) → TRACK_CONSTRAINTS constant with docs
- ✅ Document skill/language rank limits by mode → RANK_LIMITS constant by mode
- ✅ Comment on Low Sour special behavior → LOW_SOUR_DEFAULT_RANK and LOW_SOUR_LOCKED_IN_CREATION constants

**Work Completed**:
- Created centralized game rules constants module (464 lines)
- Created comprehensive game rules documentation (779 lines)
- Created developer quick reference guide (215 lines)
- All business logic now documented in single source of truth

#### 2.3 Document Data Transformations ✅
**Status**: COMPLETE
**Date Started**: 2025-12-06
**Date Completed**: 2025-12-06
**Files**: `js/state/character.js`, `js/state/ship.js`
**Actual Effort**: 45 minutes
**Impact**: Medium - Critical for database work

**Completed Actions**:
- ✅ Document convertFromDB format transformations (both character.js and ship.js)
- ✅ Document convertToDB format transformations (inline in save functions)
- ✅ Explain column name mappings (snake_case ↔ camelCase)
- ✅ Document data normalization strategies (defaults, migrations)
- ✅ Add examples of before/after transformations (JSDoc examples)

**Changes Made**:
- **character.js convertFromDB()**: Added comprehensive JSDoc with examples, section headers explaining data migration (selectedDamageTypes format), and detailed inline comments for column mapping and default initialization
- **character.js saveCharacter()**: Added mapping table and inline comments explaining camelCase → snake_case transformation
- **ship.js convertFromDB()**: Added comprehensive JSDoc with examples and detailed inline comments for all column mappings and defaults
- **ship.js saveShip()**: Added mapping table and inline comments explaining camelCase → snake_case transformation

---

## Priority 3: Long-term Improvements (8+ hours)

### 3.1 Generate API Documentation
**Effort**: 2-3 hours setup + ongoing maintenance
**Impact**: High - Enables autodocumentation

**Actions**:
- [ ] Install JSDoc tooling (`npm install --save-dev jsdoc`)
- [ ] Create jsdoc.json configuration
- [ ] Add npm script: `"docs": "jsdoc -c jsdoc.json"`
- [ ] Configure output directory (e.g., `docs/api/`)
- [ ] Generate initial documentation
- [ ] Add to .gitignore or commit generated docs
- [ ] Create README section linking to API docs

### 3.2 Create Developer Guide
**Effort**: 3-4 hours
**Impact**: Medium - Onboarding aid

**Actions**:
- [ ] Create DEVELOPER-GUIDE.md
- [ ] Extract common patterns from CLAUDE.md
- [ ] Add troubleshooting section
- [ ] Document common development tasks:
  - Adding a new character property
  - Creating a new component
  - Adding an event handler
  - Working with aspects data
  - Testing locally vs production
- [ ] Add debugging tips
- [ ] Document local development workflow

### 3.3 Add TypeScript/JSDoc Type Checking
**Effort**: 4-6 hours
**Impact**: High - Catch type errors early

**Actions**:
- [ ] Create jsconfig.json for VS Code
- [ ] Enable checkJs in jsconfig
- [ ] Add @typedef for complex objects:
  - Character
  - Aspect
  - Ship
  - GameData
- [ ] Add @type annotations for variables
- [ ] Fix any type errors discovered
- [ ] Document type definitions in separate file

**Example**:
```javascript
/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {string} name
 * @property {string} bloodline
 * @property {string} origin
 * @property {string} post
 * @property {'creation'|'play'|'advancement'} mode
 * @property {Array<Object>} selectedAspects
 * @property {Array<string>} selectedEdges
 * @property {Object<string, number>} skills
 * @property {Object<string, number>} languages
 */
```

---

## Priority 4: Maintenance & Standards

### 4.1 Establish Documentation Standards
**Effort**: 1 hour
**Impact**: Medium - Ensures consistency

**Actions**:
- [ ] Create DOCUMENTATION-STANDARDS.md
- [ ] Define required JSDoc elements for:
  - Public functions (must have @param, @returns, description)
  - Private functions (can be minimal)
  - Complex functions (should have @example)
  - Async functions (must document promises)
- [ ] Define inline comment standards:
  - When to add comments (complex logic, business rules)
  - What NOT to comment (obvious code)
- [ ] Add examples of good vs bad documentation
- [ ] Reference in CLAUDE.md

### 4.2 Documentation Review Process
**Effort**: Ongoing
**Impact**: High - Maintains quality

**Actions**:
- [ ] Add documentation checklist to PR template
- [ ] Review new functions for JSDoc compliance
- [ ] Periodically audit documentation coverage
- [ ] Update CLAUDE.md when architecture changes

---

## Critical Files Summary

### Highest Priority (Need Immediate Attention)

1. **js/main.js** (1800 lines, Grade: C-)
   - Event delegation system
   - Render lifecycle coordination
   - State management integration

2. **js/components/edges.js** (Grade: C)
   - No JSDoc on public functions
   - Complex template literals
   - No parameter documentation

3. **js/components/aspects.js** (Grade: C)
   - Minimal JSDoc
   - Missing parameter types
   - Complex rendering logic

### High Priority

4. **js/rendering/creation-mode.js**
5. **js/rendering/play-mode.js**
6. **js/rendering/advancement-mode.js**
7. **js/state/character.js** - Complete existing JSDoc
8. **js/state/ship.js** - Complete existing JSDoc

### Medium Priority

9. Data transformation functions
10. Validation logic
11. Component helpers (sections.js, ship-components.js)

---

## Success Metrics

### Target Documentation Coverage

- [ ] 100% of public functions have JSDoc
- [ ] 100% of functions have @param for each parameter
- [ ] 100% of functions have @returns
- [ ] 80% of complex functions have @example
- [ ] 50% reduction in "what does this do?" questions
- [ ] New developer onboarding time < 2 hours

### Quality Indicators

- [ ] JSDoc generates clean API documentation (no warnings)
- [ ] Type checking enabled with minimal errors
- [✅] CLAUDE.md references align with code **[VERIFIED]**
- [✅] All business rules have explanatory comments **[COMPLETE - centralized in game-rules.js + GAME-RULES.md]**
- [✅] Event handlers have clear action documentation **[COMPLETE]**
- [✅] Data transformations documented with examples **[COMPLETE]**

---

## Estimated Total Effort

- **Quick Wins**: ~~1-2 hours~~ → ✅ **COMPLETE** (2025-12-06) → Code maturity 7/10 **[ACHIEVED]**
- **Medium Priority**: ~~4-6 hours~~ → ✅ **COMPLETE** (2025-12-06) → Code maturity 8/10 **[ACHIEVED]**
  - 2.1 State Management JSDoc: ✅ Complete (2-3 hours)
  - 2.2 Business Logic: ✅ Complete (2-3 hours)
  - 2.3 Data Transformations: ✅ Complete (45 minutes)
- **Long-term**: 8+ hours → Code maturity 9/10

**Total**: ~~13-16 hours~~ → **~8 hours remaining** to reach excellent documentation maturity (9/10)
**Completed**: ~8 hours (All Priority 1 + All Priority 2)

---

## Notes

- Recent code (damage types, caching, auth) already meets documentation standards
- Use these as examples when documenting older code
- Project-level markdown documentation is exemplary - maintain this quality
- Focus on developer experience: documentation should answer "what, why, how"
- Prioritize high-traffic code paths and public APIs

---

## Related Files

- CLAUDE.md - Project overview and architecture
- DAMAGE-TYPES-IMPLEMENTATION.md - Example of excellent feature documentation
- PERFORMANCE-OPTIMIZATION.md - Example of technical documentation
