# Ship Play Mode Refactor - Assessment & Approach Log

## Files Analyzed

1. **js/rendering/ship-play-mode.js** (43 lines)
2. **js/components/ship-ratings-play.js** (63 lines)
3. **js/components/ship-inventory-play.js** (179 lines)

## Current State Analysis

### ship-play-mode.js (Main Renderer)

**Status:** ✅ Already quite clean! Good composition pattern.

**Issues Found:**
1. **Line 36:** Manual data-params construction
   ```javascript
   data-params='{"mode":"creation"}'  // Should use createDataParams()
   ```

**Verdict:** This file is actually well-structured. It's only 43 lines and already uses component composition. Just needs one security fix.

---

### ship-ratings-play.js (Ratings Display)

**Issues Found:**

1. **Manual data-params construction (Line 34):**
   ```javascript
   data-params='{"rating":"${ratingName}","index":${i}}'
   ```
   - Doesn't use `createDataParams()`
   - Rating name could contain quotes/special chars (unlikely but possible)
   - Inconsistent with refactored approach

2. **No escaping on dynamic content:**
   - `${ratingName}` (line 27) - displayed without escaping
   - All numeric values safe (ratings, stakes)

3. **Imperative loop for track rendering:**
   - For loop building HTML string (lines 31-35)
   - Could be extracted to helper function

**Severity:** Low-Medium
- Ratings are from fixed game data (unlikely to have special chars)
- But should follow best practices for consistency

---

### ship-inventory-play.js (Inventory Display)

**Issues Found:**

1. **Manual quote escaping (Lines 29-30):**
   ```javascript
   const escapedName = part.name.replace(/"/g, '&quot;');
   html += `data-params='{"undercrewName":"${escapedName}","index":${i}}'`
   ```
   - Reinventing the wheel (we have `createDataParams()`)
   - Only escapes double quotes, misses other special chars
   - Uses single-quoted attribute (inconsistent with our fix)

2. **No escaping on ship part data:**
   - `${part.name}` (lines 37, 30, 29) - NOT escaped
   - `${part.description}` (line 41) - NOT escaped
   - `${special}` (line 57) - NOT escaped
   - `${bonus.rating}` (line 48) - NOT escaped

3. **Large monolithic function:**
   - `renderShipInventoryPlay()` is 107 lines (lines 71-178)
   - Complex nested structure (3 columns, multiple part types)
   - Hard to test specific sections

4. **Data transformation embedded in rendering:**
   - Building `allFittings` array inline (lines 112-125)
   - Building `allUndercrew` array inline (lines 141-152)
   - Should be separate functions

5. **Helper function not reusable:**
   - `renderPartCard()` is internal to this file
   - Could be useful in other ship components
   - Well-structured though!

**Severity:** Medium-High
- Security: Ship part data from JSON could contain special characters
- Maintainability: Large function, embedded logic
- Testability: Can't test sections independently

---

## Refactoring Strategy

### Priority 1: Security Fixes (Critical)

**All Files:**
1. Replace manual data-params with `createDataParams()`
2. Add proper escaping to all dynamic content using `escapeHtmlContent()`

**Affected Areas:**
- Ship part names
- Ship part descriptions
- Undercrew names
- Special abilities text
- Rating names

### Priority 2: Extract Helper Functions (High)

**ship-ratings-play.js:**
```javascript
// Extract:
function renderRatingTrack(ratingName, value, damageArray) { ... }
function renderStakesSection(ship) { ... }
```

**ship-inventory-play.js:**
```javascript
// Extract data preparation:
function collectAllFittings(ship) { ... }
function collectAllUndercrew(ship) { ... }

// Extract rendering sections:
function renderDesignElements(ship) { ... }
function renderFittingsSection(ship) { ... }
function renderUndercrewSection(ship) { ... }
function renderCargoPassengers(ship) { ... }

// Move renderPartCard to module-level for reuse
export function renderPartCard(part, isUndercrew, ship) { ... }
```

### Priority 3: Improve Maintainability (Medium)

1. **Named constants:**
   ```javascript
   const FITTING_TYPES = [
     { key: 'motifs', label: 'Motifs' },
     // ... etc
   ];
   ```

2. **Better composition in main function:**
   ```javascript
   export function renderShipInventoryPlay(ship) {
     return `
       <div class="ship-play-container">
         ${renderThreeColumnGrid(ship)}
         <hr class="ship-separator" />
         ${renderCargoPassengers(ship)}
       </div>
     `;
   }
   ```

---

## Expected Benefits

### Security
- **Before:** Ship part names/descriptions vulnerable to XSS/HTML injection
- **After:** All dynamic content properly escaped

### Maintainability
- **Before:** 179-line function with embedded logic
- **After:** ~10 focused functions, each < 30 lines

### Testability
- **Before:** Must render entire ship inventory to test anything
- **After:** Can unit test `collectAllFittings()`, `renderPartCard()`, etc.

### Reusability
- **Before:** `renderPartCard()` locked inside one file
- **After:** Can import and use in other ship components

---

## Files to Modify

### 1. ship-play-mode.js
**Changes:** 1 line
- Line 36: Use `createDataParams({ mode: 'creation' })`

### 2. ship-ratings-play.js
**Changes:** Moderate refactor (~80 lines after)
- Import escaping utilities
- Extract `renderRatingTrack()` helper
- Extract `renderStakesSection()` helper
- Use `createDataParams()` for track boxes
- Escape rating names in display

### 3. ship-inventory-play.js
**Changes:** Significant refactor (~250 lines after)
- Import escaping utilities
- Extract data collection functions
- Extract section rendering functions
- Export `renderPartCard()` for reuse
- Add escaping to all ship part data
- Use `createDataParams()` for undercrew tracks
- Compose main function from helpers

---

## Trade-offs

### File Size
- **ship-ratings-play.js:** 63 → ~100 lines (+60%)
- **ship-inventory-play.js:** 179 → ~280 lines (+56%)

**Justification:** Better organization worth the lines

### Performance
- **Impact:** Negligible (few extra function calls)
- **Bottleneck:** DOM manipulation, not JS execution

### Complexity
- **Before:** One large function per file
- **After:** Multiple small functions
- **Net:** Easier to understand (clear names reveal intent)

---

## Implementation Order

1. ✅ **Quick wins first** - ship-play-mode.js (1 line fix)
2. 🔨 **Medium complexity** - ship-ratings-play.js (extract 2 helpers)
3. 🔨 **Larger refactor** - ship-inventory-play.js (extract 6+ helpers)

---

## Comparison to Character Play Mode

| Aspect | Character Play | Ship Play |
|--------|----------------|-----------|
| **Main renderer** | 127 lines monolith | 43 lines ✅ clean |
| **Components** | Inline logic | Some inline, some extracted |
| **Security** | Inconsistent escaping | No escaping ⚠️ |
| **Testability** | Low | Low |
| **Verdict** | Needed refactor | Partial refactor needed |

**Key Insight:** Ship play mode is better structured at the top level, but components need work.

---

## Next Steps After Refactor

1. Apply same patterns to ship-creation-mode.js
2. Apply same patterns to ship-upgrade-mode.js
3. Consider extracting common ship card rendering to shared module
4. Add unit tests for helper functions
5. Update CLAUDE.md with ship component patterns

---

## Risk Assessment

**Low Risk:**
- Security fixes (escaping) don't change behavior
- Helper extraction preserves exact same HTML output
- Can test equivalence visually

**How to Mitigate:**
- Test ship play mode thoroughly after refactor
- Check all ship part types render correctly
- Verify damage tracking still works
- Test with ships containing special characters in names

---

## Front-End Development Plugin Insights

Key patterns to apply:

1. **Consistent escaping** - Defense in depth, even for "trusted" data
2. **Data transformation separation** - Collect data, THEN render
3. **Small helper functions** - Max ~30 lines, single responsibility
4. **Named exports for reuse** - Components should be importable
5. **Composition over monoliths** - Build from focused functions
6. **Constants for clarity** - Self-documenting code

Same principles as character refactor, but ship components show how important it is to apply these patterns EVERYWHERE, not just in big files.
