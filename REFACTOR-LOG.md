# Play Mode Refactor - Approach Log

## Current State Analysis

**File:** `js/rendering/play-mode.js`
**Lines of Code:** 127
**Main Issues Identified:**

1. **Monolithic template literal** - Entire UI built as one massive template string
2. **Logic embedded in templates** - Complex aspect rendering logic (lines 55-83) inline
3. **Inconsistent escaping** - Character fields escaped, aspect/game data not escaped
4. **Manual string concatenation** - Track HTML built with `+=` operators
5. **Magic numbers** - `maxDisplayBoxes = 8` hardcoded
6. **Poor testability** - Cannot unit test rendering logic separately
7. **Difficult to maintain** - Changes require navigating nested template strings

## Refactoring Strategy

### 1. Extract Complex Rendering Logic
**Before:** Aspect rendering logic embedded in template (30+ lines)
**After:** Separate helper functions for aspect tracks and cards

**Benefits:**
- Testable in isolation
- Reusable across modes
- Easier to debug
- Clear single responsibility

### 2. Create Named Constants
**Before:** `const maxDisplayBoxes = 8;`
**After:** `const MAX_ASPECT_TRACK_DISPLAY = 8;` at module level

**Benefits:**
- Self-documenting code
- Single source of truth
- Easier to find and update

### 3. Consistent Security Practices
**Before:** Character fields escaped, aspect/game data not
**After:** All user/game data consistently escaped using escaping utilities

**Benefits:**
- Prevents XSS vulnerabilities
- Consistent security posture
- Future-proof against data source changes

### 4. Improve Data Transformation
**Before:** `.slice().sort()` inline in template
**After:** Separate `prepareSortedAspects()` function

**Benefits:**
- Template focuses on structure, not logic
- Data transformation testable
- Performance - can memoize if needed

### 5. Component Composition
**Before:** Single 125-line template function
**After:** Smaller, focused rendering functions composed together

**Benefits:**
- Each function has clear purpose
- Easier to locate specific UI sections
- Better code navigation

### 6. Declarative Structure
**Before:** Imperative loop building HTML string
**After:** Declarative mapping with helper functions

**Benefits:**
- More readable
- Functional programming style
- Clearer intent

## High-Level Changes

### A. Extract Constants (Top of File)
```javascript
const MAX_ASPECT_TRACK_DISPLAY = 8;
const DAMAGE_STATE_SYMBOLS = {
  marked: '/',
  burned: '✕',
  default: ''
};
```

### B. Create Helper Functions

**`renderAspectTrack(aspect)`**
- Builds track boxes with proper state and interactivity
- Handles spacers for unused slots
- Returns complete track HTML

**`renderAspectCard(aspect)`**
- Composes track + content into aspect card
- Applies proper escaping to aspect properties
- Handles damage type highlighting

**`prepareSortedAspects(character)`**
- Extracts and sorts aspects
- Single responsibility for data transformation
- Returns ready-to-render array

**`renderCharacterHeader(character)`**
- Builds header section
- Ensures consistent escaping
- Clearer separation from main layout

**`renderActionBar(character, ship)`**
- Builds sticky footer
- Handles conditional role selector
- Isolated from main content

### C. Simplify Main Function

Main `renderPlayMode()` becomes a clean composition:
```javascript
export function renderPlayMode(app, character, gameData, showAddTaskForm, ship) {
  const sortedAspects = prepareSortedAspects(character);

  app.innerHTML = `
    ${renderCharacterHeader(character)}
    <div class="content-wrapper">
      ${renderMainGrid(character, gameData, sortedAspects)}
      <hr />
      ${renderSecondaryGrid(character, showAddTaskForm)}
    </div>
    ${renderActionBar(character, ship)}
  `;
}
```

## Expected Outcomes

### Maintainability
- **Before:** Find aspect rendering → scroll through 125 lines → locate inline logic
- **After:** Jump to `renderAspectCard()` → focused 10-line function

### Testing
- **Before:** Cannot test aspect rendering without full component render
- **After:** Unit test `renderAspectTrack()`, `prepareSortedAspects()` independently

### Security
- **Before:** Mixed escaping - some fields safe, others vulnerable
- **After:** Consistent escaping via helper functions, clear security boundary

### Readability
- **Before:** Nested template strings with inline logic
- **After:** Clear function names revealing intent, declarative composition

### Performance
- **Before:** Data transformation happens during template evaluation
- **After:** Data prep separated, could be memoized if needed

## Trade-offs Considered

### More Functions vs Simplicity
**Decision:** Accept more functions for better maintainability
**Reasoning:** As app grows, refactored approach scales better

### Performance Overhead
**Decision:** Minimal - function calls negligible vs DOM operations
**Reasoning:** Readability and maintainability worth microseconds

### File Length
**Decision:** Longer file (200+ lines) but more organized
**Reasoning:** Well-named functions easier to navigate than condensed code

## Notes for Implementation

- Import `escapeHtmlAttr, escapeHtmlContent, createDataParams` from escaping utils
- Ensure aspect properties (name, source, type, description) properly escaped
- Consider extracting grid sections to separate files if file becomes too large
- Apply same patterns to creation-mode.js and advancement-mode.js for consistency
