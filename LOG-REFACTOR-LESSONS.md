# Play Mode Refactor - Lessons & Decisions

## Key Lessons from Front-End Best Practices Review

### 1. **Template Complexity is a Code Smell**

**Observation:** Original function had a 100+ line template literal with embedded logic.

**Lesson:** When a template contains:
- Array operations (`.map()`, `.filter()`, `.sort()`)
- Loops building HTML strings
- Conditional logic
- More than 2 levels of nesting

...it's time to extract helper functions.

**Practical Rule:** Templates should describe structure, not contain business logic.

---

### 2. **Security Escaping Must Be Systematic**

**Original Issue:**
```javascript
// Character fields - escaped ✓
<div>${escapeHtmlContent(character.name)}</div>

// Aspect fields - NOT escaped ✗
<div>${aspect.name}</div>
```

**Lesson:** Inconsistent escaping creates security vulnerabilities. Even "trusted" game data from JSON files should be escaped because:
- Data sources can change (future: user-generated content?)
- Special characters break HTML even without malicious intent
- Defense in depth principle

**Solution:** Escape ALL dynamic content at render time, consistently.

---

### 3. **Helper Functions Enable Testing**

**Before (untestable):**
```javascript
app.innerHTML = `
  ${character.selectedAspects.map(aspect => {
    let trackHTML = '';
    for (let i = 0; i < 8; i++) { ... }
    return trackHTML + content;
  })}
`;
```

**After (testable):**
```javascript
function renderAspectTrack(aspect) { ... }
function renderAspectCard(aspect) { ... }

// Can now unit test:
const mockAspect = { name: 'Test', trackSize: 3, damageStates: [...] };
const html = renderAspectCard(mockAspect);
assert(html.includes('Test'));
```

**Lesson:** Extract complex rendering to named functions = testable units.

---

### 4. **Named Constants > Magic Numbers**

**Before:**
```javascript
for (let i = 0; i < 8; i++) {  // Why 8? What does this mean?
```

**After:**
```javascript
const MAX_ASPECT_TRACK_DISPLAY = 8;  // Clear intent
for (let i = 0; i < MAX_ASPECT_TRACK_DISPLAY; i++) {
```

**Lesson:** Even if a value appears once, naming it:
- Documents intent
- Makes future changes easier (single source of truth)
- Improves searchability

---

### 5. **Data Transformation Should Be Separate**

**Before:**
```javascript
app.innerHTML = `
  ${character.selectedAspects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(...)}
`;
```

**After:**
```javascript
function prepareSortedAspects(character) {
  return character.selectedAspects.slice().sort((a, b) => a.name.localeCompare(b.name));
}

const sortedAspects = prepareSortedAspects(character);
app.innerHTML = `${sortedAspects.map(...)}`;
```

**Benefits:**
1. Template focuses on structure
2. Data prep is named and testable
3. Can optimize (memoize) if needed
4. Clear data flow

**Lesson:** Separate "prepare data" from "render data" concerns.

---

### 6. **Composition Over Monoliths**

**Original Structure:**
```javascript
export function renderPlayMode() {
  app.innerHTML = `[125 lines of HTML]`;
}
```

**Refactored Structure:**
```javascript
export function renderPlayMode() {
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

**Benefits:**
- Main function reads like a table of contents
- Each section is a clear, testable unit
- Easy to find specific UI elements
- Can reuse sections across modes if needed

**Lesson:** Compose UIs from small, focused functions with clear names.

---

### 7. **String Building: Declarative > Imperative**

**Imperative Approach (harder to read):**
```javascript
let trackHTML = '<div>';
for (let i = 0; i < max; i++) {
  if (condition) {
    trackHTML += '<div>' + value + '</div>';
  } else {
    trackHTML += '<div class="spacer"></div>';
  }
}
trackHTML += '</div>';
```

**Declarative Approach (clearer intent):**
```javascript
const boxes = Array.from({ length: max }, (_, i) => {
  return i < trackSize
    ? renderTrackBox(i)
    : '<div class="track-spacer"></div>';
});
return `<div>${boxes.join('')}</div>`;
```

**Trade-off:** Refactored version still uses imperative loop because:
- More straightforward in this case
- But extracted to dedicated function
- Could be converted to declarative if complexity grows

**Lesson:** Imperative code is fine when isolated; declarative is often clearer for complex logic.

---

### 8. **createDataParams() for Safety**

**Before (manual JSON in string):**
```javascript
data-params='{"id":"${aspect.id}","index":${i}}'
// Risk: aspect.id could contain quotes, breaking the string
```

**After (using utility):**
```javascript
${createDataParams({ id: aspect.id, index: i })}
// Safe: utility handles escaping automatically
```

**Lesson:** Never manually build JSON strings in HTML attributes. Use escaping utilities.

---

## Decisions & Trade-offs

### Decision 1: File Length vs Function Granularity

**Trade-off:** Refactored file is ~230 lines vs original 127 lines.

**Decision:** Accept longer file for better organization.

**Reasoning:**
- Well-named functions are self-documenting
- IDE folding/navigation makes length manageable
- Each function has clear purpose
- Could split into multiple files if it grows further

---

### Decision 2: Keep Helper Functions in Same File

**Alternative:** Extract helpers to `../components/aspect-card.js`

**Decision:** Keep in same file for now.

**Reasoning:**
- These helpers are specific to play mode rendering
- Not currently reused elsewhere
- Can extract later if needed in other modes
- Avoid premature abstraction

**When to extract:** If creation-mode or advancement-mode needs same aspect rendering.

---

### Decision 3: Performance - Function Calls vs Inline

**Trade-off:** More function calls = theoretical performance cost.

**Decision:** Optimize for readability, not micro-performance.

**Reasoning:**
- Function call overhead is negligible (microseconds)
- Real performance bottleneck is DOM manipulation, not JS
- Maintainability > micro-optimization
- Can profile and optimize later if needed

---

### Decision 4: Still Using String Templates

**Alternative:** Could use DOM APIs (`document.createElement()`) or virtual DOM.

**Decision:** Keep string templates for now.

**Reasoning:**
- Consistent with rest of codebase
- Simple mental model
- Works well with event delegation pattern
- Vite handles hot reload well
- No need for complex diffing (full re-renders are fast enough)

**Future consideration:** If frequent partial updates become performance issue, consider:
- Virtual DOM library
- Direct DOM manipulation for hot paths
- Web Components

---

## Application to Rest of Codebase

### Immediate Applications

1. **creation-mode.js** - Apply same patterns:
   - Extract aspect selection rendering
   - Separate budget calculations
   - Named constants for budget limits

2. **advancement-mode.js** - Similar refactor:
   - Extract track expansion rendering
   - Separate advancement logic

3. **components/*.js** - Review for:
   - Consistent escaping
   - Extract complex inline logic
   - Named constants

### Pattern Template for Future Components

```javascript
// 1. Constants at top
const MAX_ITEMS = 10;

// 2. Data transformation functions
function prepareData(input) { ... }

// 3. Focused rendering helpers
function renderItem(item) { ... }
function renderList(items) { ... }

// 4. Main export - composes helpers
export function renderComponent(data) {
  const prepared = prepareData(data);
  return `
    ${renderHeader()}
    ${renderList(prepared)}
    ${renderFooter()}
  `;
}
```

---

## Front-End Development Plugin Insights

Key patterns emphasized by front-end best practices:

1. **Separation of Concerns** - Data, logic, presentation
2. **Testability** - Small, pure functions
3. **Security by Default** - Systematic escaping
4. **Readability** - Code is read 10x more than written
5. **Maintainability** - Future developers (including you) will thank you
6. **Progressive Enhancement** - Start simple, add complexity when needed

---

## Metrics Comparison

| Metric | Original | Refactored | Change |
|--------|----------|------------|--------|
| Total lines | 127 | 230 | +81% |
| Max function length | 125 lines | 30 lines | -76% |
| Functions | 1 | 9 | +800% |
| Testable units | 0 | 8 | +∞ |
| Cyclomatic complexity (main) | ~15 | ~3 | -80% |
| Lines with escaped content | 4 | 12 | +200% |
| Magic numbers | 1 | 0 | -100% |

**Conclusion:** More code, but much better organized and maintainable.

---

## Next Steps

If adopting this refactored approach:

1. **Test thoroughly** - Ensure identical output to original
2. **Apply to other modes** - creation-mode.js, advancement-mode.js
3. **Extract common patterns** - If aspect rendering reused, move to components/
4. **Add unit tests** - Test helper functions with various inputs
5. **Document patterns** - Update CLAUDE.md with new conventions
6. **Consider TypeScript** - Would catch escaping issues at compile time

---

## Final Reflection

**Core Insight:** The original code worked fine, but refactored code is easier to:
- Understand (clear function names)
- Modify (isolated changes)
- Test (pure functions)
- Secure (systematic escaping)
- Extend (clear patterns)

**When to refactor:**
- Adding new features to a component
- Fixing bugs (improve while you're there)
- When file becomes hard to navigate

**When NOT to refactor:**
- Code works and isn't changing
- Time-sensitive bug fixes
- No tests to verify equivalence
