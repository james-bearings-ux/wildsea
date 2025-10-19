# Damage Types Feature - Implementation Summary

## Phase 1A Complete: Constants & Enhanced Data

### Files Created

1. **`js/constants/damage-types.js`** - Complete damage type system constants
2. **`public/data/aspects-enhanced.json`** - Enhanced aspects subset (Ketra/Ridgeback/Crash)

---

## Enhanced Aspects Summary

### Ketra (16 aspects, 5 enhanced)

**Aspects with damage type metadata:**
1. **Gelatinous Form** - Weakness: Salt
2. **Voltaic Mantle** - Deals: CQ Volt (fixed)
3. **Driftwood Core** - Resistance: Choose 3 from [Blunt, Spike, Toxin, Frost, Volt]
4. **Rebreather Mask** - Resistance: bad air, airborne spores (fixed)
5. **Driving-Chain** - Deals: CQ/LR Blunt (fixed, dual range)
6. **Old Ore Piercings** - Immunity: crezzerin effects (fixed)

### Ridgeback (17 aspects, 7 enhanced)

**Aspects with damage type metadata:**
1. **Thick Skin** - Resistance: Choose 3 from [Blunt, Toxin, Frost, Salt, Volt]
2. **Crushing Blows** - Deals: CQ Blunt + Salt (fixed)
3. **Archaeodermis** - Immunity: Keen, bites and stings (fixed)
4. **Great Beast Horns** - Deals: CQ Spike (fixed)
5. **Shamanic Idol** - Deals: LR Salt (fixed)
6. **Swift Hawk** - Deals: LR Keen (fixed)
7. **Mountain Snouter** - Deals: CQ Spike (fixed)

### Crash (18 aspects, 6 enhanced)

**Aspects with damage type metadata:**
1. **Cannonball Dreams** - Deals: LR Blunt (fixed)
2. **Padded Boilersuit** - Resistance: Choose 3 from [Blunt, Spike, Hewing, Blast, Volt]
3. **Crash Mask** - Resistance: airborne spores, bad air (fixed)
4. **Baby Bombs** - Deals: LR Blast (fixed)
5. **Demolisher** - Deals: Choose 1 from [Blunt, Spike] at CQ
6. **Wrecker's Globe** - Deals: CQ Blunt (fixed)
7. **Torpedo Mallet** - Deals: Choose 1 from [Blunt, Blast] at CQ

---

## Damage Types Metadata Structure

Each enhanced aspect with damage types includes a `damageTypes` object:

```json
{
  "category": "resistance|dealing|immunity|weakness",
  "selectionType": "fixed|choose",
  "chooseCount": 3,  // Only if selectionType is "choose"
  "options": ["Blunt", "Spike", "Toxin"],
  "range": "CQ"  // Only for "dealing" category
}
```

### Categories Found in Subset

- **Resistance** (3 aspects requiring choices, 3 fixed)
- **Dealing** (2 aspects requiring choices, 9 fixed)
- **Immunity** (2 aspects, both fixed)
- **Weakness** (1 aspect, fixed)

### Selection Patterns

- **Fixed (no choice needed):** 14 aspects
- **Choose 3 from list:** 3 aspects (all resistances)
- **Choose 1 from list:** 2 aspects (weapons with damage options)

---

## Test Character Potential

A character with **Ketra/Ridgeback/Crash** bloodline/origin/post could have:

**Maximum resistances (if all 3 "choose 3" aspects selected):**
- Driftwood Core: 3 resistances
- Thick Skin: 3 resistances
- Padded Boilersuit: 3 resistances
- **Total: Up to 9 different resistance types**

**Potential overlaps:**
- Blunt appears in all 3 resistance lists
- Volt appears in 2 lists
- Spike appears in 2 lists
- Toxin appears in 2 lists

This creates interesting strategic choices during character creation!

---

## Next Steps

### Phase 1B: Character State ✅ COMPLETE
- ✅ Modify `toggleAspect()` to initialize `selectedDamageTypes: []`
- ✅ Add mutation functions for damage type selection
- ✅ Add aggregation functions for summary display

### Phase 2A: UI Components (Ready to implement)
- Create damage type selector component
- Add warning pill for incomplete selections
- Implement description highlighting
- Build popover for play mode failsafe

### Phase 3: Summary Display (Ready to implement)
- Aggregate resistances/immunities/weaknesses
- Simple display at end of play mode
- Test with various combinations

### Phase 4: Tooltips (Backlog)
- Add damage type descriptions to tooltips
- Implement hover/click tooltips for damage types
- See: DAMAGE-TYPE-TOOLTIPS.md for full specification

---

## Constants Reference

### All Damage Types
Acid, Blast, Blunt, Flame, Frost, Hewing, Keen, Salt, Serrated, Spike, Toxin, Volt

**Note:** "Cold" appears as a synonym in some aspects but is normalized to "Frost" during parsing.

### Hazard/Condition Types
bad air, airborne spores, bites and stings, crezzerin effects, diseases, hallucinations, infections, mesmerics, mental compulsions, poisons, sickness, traps

### Range Types
- **CQ** - Close Quarters
- **LR** - Long Range
- **UR** - Undercrew (rare)

---

## Notes & Observations

1. **Cold vs Frost**: Consolidated on "Frost" as the canonical name. The parsing function `normalizeDamageType()` automatically converts "cold" to "Frost" when encountered in aspect descriptions.

2. **Dual-range weapons**: Driving-Chain can deal damage at CQ or LR. Current structure stores this as `"range": "CQ/LR"`.

3. **Hazard resistances**: Some aspects provide resistance to non-damage hazards (bad air, spores, etc.). These are tracked separately but use the same structure.

4. **Multiple damage types**: Some aspects deal multiple damage types (e.g., Crushing Blows deals both Blunt and Salt). These are stored in the options array.

5. **Backwards compatibility**: Aspects without `damageTypes` metadata remain unchanged and will function normally.

---

## Implementation Date
Created: 2025-10-18
