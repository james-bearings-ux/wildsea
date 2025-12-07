# Wildsea Rules Quick Reference

**For detailed rationale and explanations, see [GAME-RULES.md](./GAME-RULES.md)**

## Character Creation Scenarios

**Old Dog (Experienced)**: Default scenario with 6 resources
**Young Gun (Inexperienced)**: Alternative scenario with 4 resources

These scenarios **only affect character creation**. Once in play mode, all characters follow the same advancement rules.

## Character Creation Budgets

| Resource | Old Dog | Young Gun | Advancement | Notes |
|----------|---------|-----------|-------------|-------|
| **Aspects** | 4 (required) | 4 (required) | 7 (max) | Must have 1+ from bloodline, origin, post |
| **Edges** | 3 (required) | 3 (required) | **3 (permanent)** | Choose from 7 available, cannot change |
| **Skill Points** | 8 (total) | 8 (total) | No budget | Shared between skills & languages (creation only) |
| **Resources** | 6 (max) | **4 (max)** | No limit | 4 types: charts, salvage, specimens, whispers |
| **Drives** | 3 (required) | 3 (required) | 3 (fixed) | Character motivations |
| **Mires** | 3 (required) | 3 (required) | 3 (fixed) | Character problems (2 checkboxes each) |

## Skill & Language Ranks

| Mode | Min Rank | Max Rank | Budget |
|------|----------|----------|--------|
| **Creation** | 0 | 2 | 8 points (skills + languages) |
| **Play** | 0 | 3 | No limit |
| **Advancement** | 0 | 3 | No limit |

**Special Rule**: Low Sour language starts at rank 3, is locked in creation mode, and doesn't count toward skill point budget.

## Aspect Mechanics

### Track Sizes
- **Minimum**: 2 boxes
- **Maximum**: 8 boxes
- **Default**: Defined in aspect data (varies 2-8)
- **Expansion**: Only in advancement mode (up to max 8)

### Damage States (Play Mode)

| State | Cycle Order | Description |
|-------|-------------|-------------|
| `default` | 1st | Undamaged |
| `marked` | 2nd | Damaged |
| `burned` | 3rd | Destroyed/unusable |

Click to cycle: default → marked → burned → default

## Damage Types

### Categories
- **Dealing**: What damage the aspect can inflict
- **Resistance**: Damage types the aspect resists
- **Immunity**: Damage types with no effect
- **Weakness**: Damage types that deal extra damage

### Selection Types
- `Choose 1`: Player picks 1 type from all options
- `Choose 2`: Player picks 2 types from all options
- `Choose 3`: Player picks 3 types from all options
- `Choose 1 from`: Player picks 1 from limited options (2-3 choices)

### Standard Damage Types
Blunt, Keen, Serrated, Salt, Frost, Volt, Toxin, Spike

## Ship Creation

### Stakes Budget Formula
```
Total Stakes = 6 (base) + (3 × crew size) + additional stakes
```

**Examples**:
- Crew 0: 6 stakes
- Crew 1: 9 stakes
- Crew 2: 12 stakes
- Crew 3: 15 stakes
- Crew 4: 18 stakes

### Ship Parts Categories

| Part Type | Selection | Typical Cost |
|-----------|-----------|--------------|
| **Size** | Single | 0-2 stakes |
| **Frame** | Single | 0-2 stakes |
| **Hull** | Multi | 1-3 stakes each |
| **Bite** | Multi | 1-3 stakes each |
| **Engine** | Multi | 1-3 stakes each |

### Ship Fittings Categories

| Fitting Type | Selection | Typical Cost |
|--------------|-----------|--------------|
| **Motifs** | Multi | 1-2 stakes each |
| **General Additions** | Multi | 1-3 stakes each |
| **Bounteous Additions** | Multi | 1-2 stakes each |
| **Rooms** | Multi | 1-3 stakes each |
| **Armaments** | Multi | 2-4 stakes each |

### Ship Undercrew Categories

| Undercrew Type | Selection | Track Size |
|----------------|-----------|------------|
| **Officers** | Multi | Parsed from name (e.g., `[3-Track]`) |
| **Gangs** | Multi | Parsed from name |
| **Packs** | Multi | Parsed from name |

## Ship Ratings

### Default Values
All ratings start at **1** (baseline ship capability).

### Rating Types
- **Armour**: Resistance to damage
- **Seals**: Resistance to leaks/breaches
- **Speed**: Ship velocity
- **Saws**: Cutting/breaking capability
- **Stealth**: Ability to avoid detection
- **Tilt**: Stability/balance

### Damage States

| State | Cycle Order | Description |
|-------|-------------|-------------|
| `default` | 1st | Undamaged |
| `burned` | 2nd | Damaged/reduced |

Click to cycle: default ↔ burned (simpler than aspect damage)

## Journey Mechanics

### Clock Types
- **Progress**: Movement toward destination
- **Risk**: Accumulating danger/complications
- **Pathfinding**: Navigation challenges
- **Riot**: Crew unrest/mutiny

### Clock Constraints
- **Minimum segments**: 1
- **Maximum segments**: 6
- **Default segments**: 4

## Mode Transitions

```
CREATION → PLAY → ADVANCEMENT → PLAY → ADVANCEMENT → ...
```

- **Creation**: Character building with budgets
- **Play**: Active gameplay with damage tracking
- **Advancement**: Character growth and track expansion

## Magic Numbers Summary

| Constant | Value | Usage |
|----------|-------|-------|
| `BUDGETS.aspects` | 4 | Max aspects in creation |
| `BUDGETS.edges` | 3 | Required edges (permanent) |
| `BUDGETS.skillPoints` | 8 | Total skill/language points (creation only) |
| `BUDGETS.resourcesOldDog` | 6 | Max resources (Old Dog scenario) |
| `BUDGETS.resourcesYoungGun` | 4 | Max resources (Young Gun scenario) |
| `BUDGETS.maxAspectsAdvancement` | 7 | Max aspects in advancement |
| `LOW_SOUR_DEFAULT_RANK` | 3 | Default Low Sour rank |
| `TRACK_MIN_SIZE` | 2 | Minimum aspect track size |
| `TRACK_MAX_SIZE` | 8 | Maximum aspect track size |
| `SKILL_MAX_CREATION` | 2 | Max skill rank in creation |
| `SKILL_MAX_PLAY` | 3 | Max skill rank in play/advancement |
| `SHIP_BASE_STAKES` | 6 | Base stakes for all ships |
| `SHIP_STAKES_PER_CREW` | 3 | Stakes added per crew member |
| `SHIP_RATING_BASE` | 1 | Starting value for all ratings |
| `JOURNEY_CLOCK_MIN` | 1 | Min clock segments |
| `JOURNEY_CLOCK_MAX` | 6 | Max clock segments |

## Quick Code References

### Import Constants
```javascript
import {
  CHARACTER_BUDGETS,
  RANK_LIMITS,
  TRACK_CONSTRAINTS,
  SHIP_BUDGETS
} from './js/constants/game-rules.js';
```

### Check Character Completion
```javascript
import { isCharacterComplete } from './js/constants/game-rules.js';

const validation = isCharacterComplete(character);
if (!validation.isValid) {
  console.log(validation.errors);
}
```

### Check Ship Stakes
```javascript
import {
  calculateShipStakesBudget,
  calculateShipStakesSpent
} from './js/constants/game-rules.js';

const budget = calculateShipStakesBudget(ship.anticipatedCrewSize, ship.additionalStakes);
const spent = calculateShipStakesSpent(ship.selectedParts, ship.selectedFittings, ship.selectedUndercrew);
const remaining = budget - spent;
```

### Check Skill Adjustment
```javascript
import { canAdjustSkill } from './js/constants/game-rules.js';

const result = canAdjustSkill(character, 'Grace', +1, false);
if (!result.allowed) {
  console.log(result.reason);
}
```

---

**For detailed explanations, rationale, and game design context, see [GAME-RULES.md](./GAME-RULES.md)**
