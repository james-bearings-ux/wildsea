# Damage Types Feature - Customization & Edge Cases

## Customize Aspect Interaction

### Current Behavior

When a player uses the "Customize an Aspect" feature to modify an aspect's name or description, the **damage types metadata is reparsed from the new description**. This allows players to modify the mechanical properties of aspects along with the narrative text.

### Rationale

Players may want to customize both the narrative and mechanical aspects of their character. By reparsing the description after customization, the system supports:
- Changing damage types to fit custom character concepts
- Removing damage type mechanics by removing keywords from description
- Adding new damage type mechanics by including proper keywords in new description

### Example

**Original Aspect:**
```
Name: Driftwood Core
Description: You're resistant to three damage types, chosen from the following list: Blunt, Spike, Toxin, Frost, Volt.
Selected: [Blunt, Frost, Toxin]
Metadata: { category: "resistance", selectionType: "choose", chooseCount: 3, options: [...] }
```

**After Customization (narrative change only):**
```
Name: Ancient Oak Heart
Description: The gnarled wood of a thousand-year oak protects you from harm. You're resistant to three damage types, chosen from the following list: Blunt, Spike, Toxin, Frost, Volt.
Selected: [Blunt, Frost, Toxin] ← STILL THE SAME
Metadata: { category: "resistance", selectionType: "choose", chooseCount: 3, options: [...] } ← Reparsed, same result
```

**After Customization (changing damage types):**
```
Name: Ancient Oak Heart
Description: Ancient wood grants immunity to Keen damage and resistance to Hewing damage.
Selected: [] ← CLEARED (old selections no longer valid)
Metadata: { category: "immunity", selectionType: "fixed", options: ["Keen"] } ← Reparsed, different mechanics
```

The damage types are reparsed from the new description, allowing full mechanical customization.

### Implementation Details

- `damageTypes` metadata initially comes from the original aspect in `aspects-enhanced.json`
- This metadata is copied when the aspect is selected (stored in `selectedAspects[]`)
- The "Customize Aspect" feature modifies `name` and `description` fields, **then reparses the new description**
- `parseDamageTypesFromDescription()` extracts new damage type metadata from the customized description
- `selectedDamageTypes` are filtered to keep only types still valid in the new metadata
- If the new description has no damage type keywords, metadata is cleared and selections are reset
- This allows full mechanical customization while preserving user selections when compatible

### How It Works

When `customizeAspect()` is called:
1. Name and description are updated on the selected aspect
2. `parseDamageTypesFromDescription(newDescription)` is called
3. If parsing finds damage types:
   - `aspect.damageTypes` is updated with new metadata
   - Existing selections are filtered to keep only still-valid types
   - Empty selections array is initialized if needed
4. If parsing finds no damage types:
   - `aspect.damageTypes` is deleted
   - `aspect.selectedDamageTypes` is cleared

This means players can completely change the mechanics of an aspect through the description field, enabling custom aspects and homebrew content.

---

## Legacy Character Handling

### Issue

Characters created before the damage types feature was implemented will not have:
- `selectedDamageTypes` arrays in their aspects
- Damage type metadata (if they used aspects not in the enhanced subset)

### Current Behavior in Play Mode

**For characters without damage type data:**
- No damage type selectors appear
- No warnings show
- Damage summary section is hidden (no data to display)
- Aspects render normally otherwise

**For characters with some data:**
- Aspects with damage types show normally
- Aspects without damage types render as before
- Summary only shows types from aspects with data

### Backwards Compatibility

The feature is fully backwards compatible:

1. **State initialization:** `toggleAspect()` always initializes `selectedDamageTypes: []`
2. **Render safety:** All components check for existence before rendering
3. **Summary safety:** `renderDamageSummary()` returns empty string if no data
4. **No errors:** Missing data is handled gracefully, not as an error

### Migration Path (Optional)

If you want to add damage types to legacy characters:

1. Enter **Advancement Mode**
2. Deselect and reselect affected aspects
   - This will trigger `toggleAspect()` which initializes damage type arrays
   - If aspect has damage type metadata, selectors will appear
3. Make selections for aspects requiring choices
4. Save character

**Note:** This only works if the aspects exist in `aspects-enhanced.json`. Legacy aspects from the original `aspects.json` won't have metadata.

---

## "X or Y" Damage Types

### Distinction: Choice vs. Options

**CHOICE (requires selection during character creation):**
```
"You're resistant to three damage types, chosen from the following list: Blunt, Spike, Toxin"
```
- Keyword: "chosen"
- Requires: Player must select 3 permanently
- Storage: `selectedDamageTypes: ["Blunt", "Spike", "Toxin"]`
- UI: Shows selector in creation/advancement mode

**OPTIONS (both available during play):**
```
"Deals CQ Blunt or Spike damage"
```
- Keyword: "or" (without "chosen")
- Meaning: Both damage types are available
- Storage: Both stored in `options`, no selection needed
- UI: Both shown in summary, no selector needed
- Play: Player chooses which to use each time in narrative

### Implementation

In `js/constants/damage-types.js`, the parsing logic treats "or" the same as "and":

```javascript
// Both "and" and "or" mean the damage types are available (not a choice)
// "or" means the player can choose which to use during play, but both are inherent to the aspect
const types = typeString.split(/\s+(?:and|or)\s+/).map(normalizeDamageType);

return {
  category: DAMAGE_CATEGORIES.DEALING,
  selectionType: SELECTION_TYPES.FIXED,
  options: types
};
```

### Examples from Test Subset

**Demolisher:**
- Description: "Deals CQ Blunt or Spike damage"
- Metadata: `selectionType: "fixed", options: ["Blunt", "Spike"]`
- Display: Both shown in summary
- Gameplay: Player narrates which type each hit deals

**Driftwood Core:**
- Description: "resistant to three damage types, chosen from the following list: Blunt, Spike, Toxin, Frost, Volt"
- Metadata: `selectionType: "choose", chooseCount: 3, options: [...]`
- Display: Shows selector, requires 3 selections
- Gameplay: Only selected types provide resistance

---

## Testing Edge Cases

### Test Case 1: Customized Aspect with Damage Types
1. Select aspect with damage types (e.g., Driftwood Core)
2. Choose damage types (e.g., Blunt, Frost, Toxin)
3. Customize the aspect (change name/description)
4. Verify: Damage types still selectable and visible
5. Enter play mode
6. Verify: Damage types appear in summary correctly

**Expected:** ✅ Damage types persist through customization

### Test Case 2: Legacy Character in Play Mode
1. Load character created before damage types feature
2. Enter play mode
3. Verify: No errors in console
4. Verify: Summary section hidden (or not shown)
5. Verify: Aspects render normally

**Expected:** ✅ Graceful handling, no errors

### Test Case 3: "Or" Damage Types
1. Select Demolisher (Blunt or Spike)
2. Verify: No selector appears
3. Enter play mode
4. Verify: Both Blunt and Spike show in dealing damage summary

**Expected:** ✅ Both types available, no selection needed

### Test Case 4: Incomplete Selection in Advancement
1. Create character with incomplete damage type selection
2. Enter play mode (warning pill shows)
3. Enter advancement mode
4. Verify: Selector appears for incomplete aspect
5. Complete selection
6. Enter play mode
7. Verify: Warning gone, summary correct

**Expected:** ✅ Can fix incomplete selections in advancement

---

## Known Limitations

1. **Limited scope:** Only Ketra/Ridgeback/Crash aspects have damage type metadata
   - Other bloodlines/origins/posts use original aspects.json (no metadata)
   - Future enhancement: Migrate all aspects

2. **No re-parsing on customization:** Damage types don't update if description changes
   - This is intentional (mechanical vs. narrative)
   - Could add warning in UI

3. **No validation on mode transition:** Characters can enter play mode with incomplete selections
   - Warning pills show in play mode as failsafe
   - Could add stricter validation if desired

4. **No dealing damage selector:** Aspects with "choose damage type to deal" aren't fully supported yet
   - Currently only resistance/immunity/weakness have selectors
   - Example: "Choose to deal Frost or Flame damage" would need separate handling

---

## Future Enhancements

### Phase 5: Full Aspects Migration
- Enhance all aspects in aspects.json with damage type metadata
- Automated parsing script to generate metadata
- Manual review for edge cases
- Migrate original aspects.json to aspects-enhanced.json

### Phase 6: Dealing Damage Selectors
- Support for "choose damage type to deal" aspects
- Different UI pattern (single select instead of multi)
- Update summary to show offensive damage types

### Phase 7: Advanced Customization
- Allow editing damage types in customize modal
- Validation for custom damage type inputs
- Warning when modifying mechanics

### Phase 8: Validation & Warnings
- Stricter validation before mode transitions
- Block play mode if damage types incomplete
- Better user guidance in creation mode

---

## Documentation Date
2025-10-18
