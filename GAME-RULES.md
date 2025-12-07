# Wildsea Game Rules & Mechanics

**Purpose**: This document explains the game rules and mechanics implemented in the Wildsea character sheet application. All "magic numbers" and business logic constraints are documented here with their rationale.

**Source**: Wildsea TTRPG Core Rulebook

---

## Table of Contents

1. [Character Creation](#character-creation)
2. [Character Advancement](#character-advancement)
3. [Aspect Mechanics](#aspect-mechanics)
4. [Damage Types](#damage-types)
5. [Ship Creation](#ship-creation)
6. [Journey Mechanics](#journey-mechanics)
7. [Mode Transitions](#mode-transitions)

---

## Character Creation

### Overview
Characters are built by selecting aspects, edges, skills, languages, drives, mires, and resources. The creation process uses **budgets** to ensure balanced characters.

### Creation Scenarios

The Wildsea TTRPG provides two different character creation scenarios with different starting budgets. These scenarios apply **only during character creation** - once characters enter play mode, all characters use the same advancement rules regardless of their starting scenario.

#### Old Dog (Experienced Character)

**Rule**: The default creation scenario for seasoned characters.

**Budgets**:
- **4 Aspects** (from bloodline, origin, post)
- **3 Edges** (from 7 available)
- **8 Skill/Language Points** (Low Sour doesn't count)
- **6 Resources** (charts, salvage, specimens, whispers)
- **3 Drives**
- **3 Mires**

**Rationale**: Represents a character with more experience and equipment, ready for challenging adventures.

#### Young Gun (Inexperienced Character)

**Rule**: An alternative scenario for less experienced characters starting their journey.

**Budgets**:
- **4 Aspects** (from bloodline, origin, post)
- **3 Edges** (from 7 available)
- **8 Skill/Language Points** (Low Sour doesn't count)
- **4 Resources** (charts, salvage, specimens, whispers) - **2 fewer than Old Dog**
- **3 Drives**
- **3 Mires**

**Rationale**: Represents a younger or less prepared character with fewer resources but the same core capabilities. The reduced resource count reflects less accumulated gear and connections.

**Important**: These scenarios only affect initial character creation. Once a character transitions to play mode, both Old Dog and Young Gun characters follow identical advancement rules and have the same opportunities for growth.

---

### Aspects (4 Required)

**Rule**: Characters must select exactly **4 aspects** during creation.

**Selection Sources**:
- At least 1 from **Bloodline** (e.g., Tzelicrae, Mottled, Ardent)
- At least 1 from **Origin** (e.g., Ridgeback, Cove, Shanty)
- At least 1 from **Post** (e.g., Mesmer, Alchemist, Scrivener)

**Rationale**:
- Defines core character identity and capabilities
- Ensures characters are competent but not overpowered
- Forces meaningful choices about character concept

**Track Sizes**:
- Each aspect has a track of 2-8 boxes (defined by the aspect data)
- Represents how much damage the aspect can sustain
- Cannot be modified during creation (only in advancement)

**Advancement**:
- Characters can gain up to **3 additional aspects** through play
- Maximum total: **7 aspects**

**Aspect Types**:
- **Trait**: Innate characteristics or learned skills
- **Gear**: Equipment, tools, or possessions

---

### Edges (3 from 7)

**Rule**: Choose exactly **3 edges** from 7 available options during character creation.

**Available Edges**:
1. **Grace** - Agility, finesse, acrobatics
2. **Iron** - Strength, endurance, toughness
3. **Tides** - Intuition, empathy, understanding
4. **Teeth** - Ferocity, intimidation, aggression
5. **Sharps** - Precision, intellect, analysis
6. **Instinct** - Reflexes, awareness, survival
7. **Veils** - Stealth, deception, subtlety

**Constraints**:
- No duplicates allowed
- Must select exactly 3 (not more, not less)
- **Permanent choice**: Edges cannot be changed during play or advancement

**Rationale**:
- Represents fundamental aspects of special training and natural talents
- Creates distinct character archetypes
- 35 possible combinations ensure variety
- Permanence reflects core character identity that doesn't change with experience

---

### Skills & Languages (8 Points Shared)

**Rule**: Distribute **8 points total** between skills and languages.

**Skills** (17 available):
- Break, Build, Cook, Delve, Develop, Flourish, Hack, Harvest, Hunt, Rattle, Rattlestack, Scavenge, Sense, Study, Tend, Tornash, Vault

**Languages** (9 available):
- Brasstongue, Chthonic, Gaudimot, Highvin, Knockside, Low Sour, Raka Spit, Saprekk, Signalling

**Rank Limits**:
- **Creation mode**: Maximum rank **2** per skill/language
- **Play/Advancement mode**: Maximum rank **3** per skill/language

**Special Case - Low Sour**:
- **Default trade language** of the Wildsea
- All characters start with **rank 3** in Low Sour
- **Cannot be modified** during creation (locked at 3)
- **Does not count** toward the 8-point budget
- **Can be decreased** in play/advancement mode if desired

**Rationale**:
- Forces meaningful specialization choices
- Prevents jack-of-all-trades characters
- Low Sour ensures all characters can communicate
- Rank limits prevent overpowered starting characters

**Point Distribution Examples**:
- 4 skills at rank 2 = 8 points ✅
- 2 skills at rank 2, 2 languages at rank 2 = 8 points ✅
- 8 skills at rank 1 = 8 points ✅
- 1 skill at rank 2, 6 languages at rank 1 = 8 points ✅

---

### Resources (6 Maximum)

**Rule**: Maximum **6 starting resources**.

**Resource Types**:
- **Charts**: Maps, navigation tools, geographic knowledge
- **Salvage**: Scrap materials, useful junk, trade goods
- **Specimens**: Biological samples, rare plants, creatures
- **Whispers**: Rumors, secrets, information, contacts

**Selection**:
- Each bloodline, origin, and post provides suggested resources
- Player can select up to 6 total from the combined suggestions
- **Deduplication**: If the same resource appears in multiple sources, it only counts once

**Rationale**:
- Provides starting equipment and narrative hooks
- Limits prevent characters from being too well-equipped
- Suggestions tie resources to character background

---

### Drives (3 Required)

**Rule**: Define **3 drives** (character motivations/goals).

**Format**: Free-form text describing what the character wants to achieve.

**Examples**:
- "Discover the fate of the lost expedition"
- "Prove myself worthy of my family name"
- "Find a cure for the rot spreading through the trees"

**Rationale**:
- Provides character motivation and roleplay hooks
- Guides decision-making during play
- Can be fulfilled or changed during advancement

---

### Mires (3 Required)

**Rule**: Define **3 mires** (character problems/complications).

**Format**: Free-form text with **2 checkboxes** for tracking severity.

**Examples**:
- "Haunted by nightmares of drowning"
- "Owe a dangerous debt to the Brackish Company"
- "Addicted to a rare spore that grows only in the Deep Wild"

**Checkboxes**:
- Used to track escalation or resolution of the problem
- Gameplay mechanic for complications

**Rationale**:
- Adds character depth and vulnerabilities
- Creates narrative tension and obstacles
- Checkbox mechanics tie into core game system

---

## Character Advancement

### Triggering Advancement

**How**: Spend accumulated **milestones** to improve character.

**Milestones**:
- **Minor milestone**: Smaller achievements
- **Major milestone**: Significant accomplishments
- Earned through gameplay and storytelling

**Mode Transition**: Play → Advancement → Play

---

### Advancement Capabilities

**In advancement mode, characters can**:

1. **Add up to 3 more aspects** (max 7 total)
   - Can select from **any** bloodline, origin, or post
   - Not limited to character's own bloodline/origin/post
   - Represents learning new skills or acquiring new gear

2. **Increase skill/language ranks** to 3
   - Creation capped at rank 2
   - Advancement allows reaching rank 3 (expert level)
   - Low Sour can be decreased if desired

3. **Expand aspect track sizes** (up to 5)
   - Start at base size (2-5)
   - Can expand using +/- buttons
   - Represents training or reinforcing the aspect
   - Maximum size is 5 boxes

4. **Customize aspect names and descriptions**
   - Personalize aspects to match character development
   - System automatically reparses damage types from custom descriptions
   - Can reset to original at any time

5. **Add/modify milestones**
   - Create new goals
   - Mark milestones as used
   - Track character progression

---

## Aspect Mechanics

### Damage Tracking (Play Mode)

**Damage States**: Aspects cycle through 3 states when clicked.

1. **Default** (empty box): Undamaged, fully functional
2. **Marked** (/ symbol): Lightly damaged, still usable but impaired
3. **Burned** (X symbol): Severely damaged, compromised or unusable

**Cycling**: Click a box to advance through states in order:
```
Default → Marked → Burned → Default (cycles back)
```

**Track Size**: Determines how much damage an aspect can take (2-8 boxes).

**Rationale**:
- Represents wear, injury, or depletion
- Burned aspects may have reduced effectiveness or require repair
- Provides tactical decision-making (which aspect to damage)

---

### Track Size Expansion (Advancement Mode)

**Rule**: Aspect tracks can be expanded from their **base size** up to **maximum of 8**.

**Base Size**:
- Set by the aspect definition (typically 2-4)
- Cannot go below base size

**Maximum Size**: 8 boxes (hard limit)

**Interface**: +/- buttons to expand or contract tracks

**Rationale**:
- Represents training, reinforcement, or improvement
- Allows characters to become more resilient in specific areas
- Hard cap of 8 prevents infinite scaling

---

## Damage Types

### Overview

Aspects can have **damage types** that determine how they interact with threats and enemies.

**Categories**:
1. **Dealing** - Damage the aspect can inflict
2. **Resistance** - Damage types the aspect resists
3. **Immunity** - Damage types the aspect is immune to
4. **Weakness** - Damage types the aspect is vulnerable to

---

### Dealing Damage Categories

**Range Categories**:
- **CQ** (Close Quarters): Melee, hand-to-hand
- **LR** (Long Range): Ranged weapons, thrown objects
- **UR** (Utterly Removed): Extreme range, indirect attacks

**Damage Types** (examples):
- Physical: blunt, edged, serrated, spike
- Elemental: fire, frost, salt, volt
- Special: blast, hewing, keen, toxin

---

### Selection Types

**Fixed** - Automatically applied, no choice required.
```
Example: "Deals CQ blunt damage"
Result: Automatically grants CQ blunt
```

**Choose** - Player must select from options.
```
Example: "Choose 2: fire, frost, salt, volt"
Interface: Checkboxes appear for each option
Validation: Must select exactly 2 before completing creation
```

**Format in Descriptions**:
- Damage types are parsed from aspect descriptions using special syntax
- `[CQ blunt]` = Fixed dealing damage
- `[Resistance: choose 2 from fire, frost, salt]` = Choose-type resistance

---

### Damage Type Validation

**Creation Mode**:
- All "choose" type damage types **must be selected** before character can transition to play mode
- Warning indicators appear on aspects with incomplete selections

**Advancement Mode**:
- Damage types can be modified
- Custom aspect descriptions are automatically parsed for damage type syntax
- Invalid selections are cleared when descriptions change

---

### Damage Type Summary Table

**Play Mode Feature**:
- Aggregates all damage types from all aspects
- Shows character's total offensive and defensive capabilities
- **Dealing**: Organized by range (CQ, LR, UR)
- **Resistance**: Counts resistances (2+ resistances create immunity in some systems)
- **Immunity**: Complete protection against damage type
- **Weakness**: Vulnerability to damage type

---

## Ship Creation

### Stakes Budget System

**Formula**: `6 (base) + (3 × anticipated crew size) + additional stakes`

**Base Stakes**: Every ship starts with **6 stakes**

**Crew Size Multiplier**:
- **+3 stakes per crew member**
- Anticipated crew size set by player (typically 2-6)
- Example: Crew of 3 = 6 + (3 × 3) = **15 stakes**

**Additional Stakes**:
- Optional bonus stakes from circumstances
- Can be positive or negative
- Example: Patron support = +3 stakes

**Budget Examples**:
- Crew of 2: 6 + 6 = **12 stakes**
- Crew of 3: 6 + 9 = **15 stakes**
- Crew of 4: 6 + 12 = **18 stakes**
- Crew of 5 (+2 bonus): 6 + 15 + 2 = **23 stakes**

---

### Ship Parts (Mandatory)

**Must Select**:
1. **Size** (single-select) - Determines base ship characteristics
2. **Frame** (single-select) - Structural design and capabilities

**Optional Multi-Select**:
3. **Hull** (multi-select) - Hull modifications and armor
4. **Bite** (multi-select) - Offensive capabilities
5. **Engine** (multi-select) - Propulsion systems

**Selection Rules**:
- Size and Frame: Can only select one (replaces previous selection)
- Hull, Bite, Engine: Can select multiple (toggle on/off)
- Each part costs **stakes** (tracked against budget)

---

### Ship Fittings (Optional)

**Fitting Categories** (all multi-select):
- **Motifs**: Aesthetic and cultural elements
- **General Additions**: Miscellaneous ship upgrades
- **Bounteous Additions**: Cargo and resource enhancements
- **Rooms**: Specialized chambers and spaces
- **Armaments**: Weapons and defensive systems

**Selection**: Toggle on/off, each costs stakes

---

### Undercrew

**Types**:
- **Officers**: Skilled crew with specific roles
- **Gangs**: Groups of workers
- **Packs**: Animal companions or swarms

**Track Parsing**:
- Undercrew with tracks have size in name: `"Navigator [3-Track]"`
- System automatically parses track size from `[#-Track]` format
- Tracks work like aspect tracks (damage states: default → burned)

---

### Ship Ratings

**Six Ratings** (all start at 1):
1. **Armour** - Physical protection
2. **Seals** - Environmental protection
3. **Speed** - Movement and maneuverability
4. **Saws** - Cutting through obstacles
5. **Stealth** - Avoiding detection
6. **Tilt** - Unusual or specialized capabilities

**Calculation**:
- Base: All ratings start at **1**
- Bonuses: Ship parts/fittings/undercrew provide +/- bonuses
- Formula: `Rating = 1 + sum(all bonuses for that rating)`

**Example**:
```
Speed Rating Calculation:
Base: 1
Large Sails: +2 Speed
Streamlined Hull: +1 Speed
Heavy Cargo: -1 Speed
Total: 1 + 2 + 1 - 1 = 3 Speed
```

---

### Rating Damage Tracking

**Damage States**: Simpler than aspects (only 2 states).

1. **Default** (empty): Fully functional
2. **Burned** (X): Damaged, rating temporarily reduced

**Cycling**: Click to toggle between default ↔ burned

**Effect**: Each burned box **reduces the effective rating by 1** during play.

---

## Journey Mechanics

### Journey Structure

**Active Journey**:
- Toggle on/off
- Has a **name** (destination or goal)
- Tracked by **4 progress clocks**

**Journey Clocks**:
1. **Progress**: How close to destination
2. **Risk**: Accumulated danger/threats
3. **Pathfinding**: Navigation challenges
4. **Riot**: Crew morale and unrest

---

### Clock Mechanics

**Clock Properties**:
- **Max ticks**: 1-6 (adjustable, default 6)
- **Filled ticks**: 0 to max (current progress)

**Interaction**:
- **Click individual ticks**: Toggle filled/unfilled
  - Click before current: Unfill to that position
  - Click at/after current: Fill to that position + 1
- **Direct input**: Set filled value numerically
- **Adjust max**: Change clock size, filled adjusts if exceeds new max

**Visual**: Clock displays as segmented circles with filled/unfilled segments

**Rationale**:
- Tracks journey progress and complications
- Creates narrative tension through multiple factors
- Flexible clock sizes allow short/long journeys

---

## Mode Transitions

### Creation → Play

**Requirements** (all must be met):
- ✅ Name provided (not "Unnamed Character")
- ✅ Exactly 4 aspects selected
- ✅ Exactly 3 edges selected
- ✅ Skills + languages ≤ 8 points (excluding Low Sour)
- ✅ All "choose" damage types selected

**Validation UI**:
- "Create Character" button
- Disabled if requirements not met (could be implemented)
- Warnings shown for incomplete aspects

**Effect**:
- Character enters play mode
- Damage tracking enabled on aspects
- Can no longer modify bloodline/origin/post
- Cannot add/remove aspects in play mode (but can add aspects later in advancement mode)
- **Edges become permanent** - cannot be changed in play or advancement mode

---

### Play → Advancement

**Trigger**: Click "Advance Character" button

**Requirements**: None (can enter advancement anytime)

**Purpose**: Spend milestones and improve character

**Effect**:
- Unlocks aspect expansion controls (+/- buttons)
- Enables aspect customization
- Allows selecting additional aspects (up to 7 total)
- Skill/language cap raises to rank 3
- **Skill/language point budget is not enforced** - can freely increase ranks without point limits

---

### Advancement → Play

**Trigger**: Click "Save Changes" button

**Effect**:
- Saves all modifications
- Returns to play mode
- Improvements are permanent
- Damage states preserved

**Cancel Option**:
- "Cancel" button discards changes
- Returns to play mode without saving

---

### Play ↔ Play (Mode Persistence)

**Per-User Mode Storage**:
- Character mode saved to **localStorage** per user
- Allows different users to view same character in different modes
- Example: Player views in play mode, GM views in advancement mode simultaneously

**Database vs. LocalStorage**:
- **Database**: Stores canonical mode (creation/play)
- **LocalStorage**: Overrides display mode for current user
- Synced on mode changes via UI buttons

---

## Special Mechanics

### Aspect Customization

**Available In**: Advancement mode only

**Capabilities**:
- **Rename**: Change aspect name
- **Rewrite description**: Modify aspect text
- **Damage type reparsing**: System automatically extracts damage types from new description
- **Selection preservation**: Valid damage type selections preserved, invalid ones cleared
- **Reset option**: Restore original name/description at any time

**Use Cases**:
- Personalizing generic aspects
- Reflecting character development
- Adjusting mechanical effects through description changes

---

### Resource Management

**Operations**:
- Add new resources (empty name)
- Edit resource names
- Mark resources as used (checkbox)
- Remove resources

**Used State**:
- Indicates consumed or lost resources
- Can be toggled on/off (reversible)
- Visual indication (strikethrough or grayed out)

---

### Milestone Tracking

**Milestone Properties**:
- **Name**: Description of achievement
- **Scale**: Minor or Major
- **Used**: Boolean state (spent/unspent)

**Operations**:
- Add new milestones
- Edit name and scale
- Toggle used state
- Delete milestones

**Purpose**:
- Track character achievements
- Gate advancement (narrative permission)
- Record character story progression

---

### Task Tracking (Progress Clocks)

**Task Properties**:
- **Name**: Task description
- **Max ticks**: 1-6 (clock size)
- **Current ticks**: Progress toward completion
- **Editing**: Toggle edit mode for name/max changes

**Operations**:
- Click clock to advance ticks (cycles 0 → max → 0)
- Edit task name and max ticks
- Delete completed/abandoned tasks

**Use Cases**:
- Long-term goals
- Investigation progress
- Relationship building
- Threat escalation

---

## Validation & Error Prevention

### Budget Validation

**Skills/Languages**:
- Tracked in real-time
- Prevents spending beyond 8 points
- Increase buttons disabled when budget exhausted

**Aspects**:
- Add buttons disabled when budget full
- Unselected aspects grayed out when budget full
- Clear visual indication of selected count vs. limit

**Edges**:
- Selection count visible
- Add buttons disabled when 3 selected
- Unselected edges grayed out when limit reached

**Ship Stakes**:
- Current spend vs. budget displayed
- Can overspend (warning could be added)
- Real-time calculation of remaining stakes

---

### Mode Guards

**Function-Level Checks**:
- Many functions check `char.mode` or `ship.mode`
- Operations restricted to appropriate modes
- Example: Aspect expansion only works in advancement mode

**Purpose**:
- Prevents invalid state changes
- Ensures game rule compliance
- Protects data integrity

---

## Implementation Notes

### Damage Type Parsing

**Format**:
- Damage types embedded in aspect descriptions
- Parsed via regex in `parseDamageTypesFromDescription()`
- Returns array of damage type metadata objects

**Example Syntax**:
```
"Deals CQ blunt damage" → Fixed CQ blunt
"Resistance: choose 2 from fire, frost, salt" → Choose-type resistance
"Immune to edged damage" → Fixed immunity to edged
```

**Metadata Structure**:
```javascript
{
  category: "Dealing" | "Resistance" | "Immunity" | "Weakness",
  range: "CQ" | "LR" | "UR" (for dealing only),
  selectionType: "fixed" | "choose",
  chooseCount: number (for choose type),
  options: string[] (for choose type),
  types: string[] (for fixed type)
}
```

---

### Migration & Backwards Compatibility

**Damage Types Format Migration**:
- Old format: `selectedDamageTypes` as array
- New format: `selectedDamageTypes` as object keyed by category
- `convertFromDB()` handles migration automatically

**Track Expansion**:
- Old characters may have `track` but no `trackSize`
- System initializes `trackSize = track` on load

**Ship Parts Multi-Select**:
- Old format: Single object
- New format: Array of objects
- System converts on load if needed

---

## Summary of Magic Numbers

| Constant | Value | Rule | Source |
|----------|-------|------|--------|
| Aspects (creation) | 4 | Exactly 4 required | Rulebook |
| Aspects (max) | 7 | Maximum after advancement | Rulebook |
| Edges | 3 of 7 | Choose 3 from 7 available (permanent) | Rulebook |
| Skill points | 8 | Shared budget for skills + languages (creation only) | Rulebook |
| Skill rank (creation) | 2 | Maximum rank during creation | Rulebook |
| Skill rank (play) | 3 | Maximum rank after advancement | Rulebook |
| Low Sour rank | 3 | Default language, locked in creation | Rulebook |
| Resources (Old Dog) | 6 | Maximum starting resources (experienced) | Rulebook |
| Resources (Young Gun) | 4 | Maximum starting resources (inexperienced) | Rulebook |
| Track size (min) | 2 | Minimum aspect track size | Rulebook |
| Track size (max) | 8 | Maximum aspect track size | Rulebook |
| Drives | 3 | Required character motivations | Rulebook |
| Mires | 3 | Required character problems | Rulebook |
| Ship base stakes | 6 | Every ship starts with 6 | Rulebook |
| Ship stakes per crew | 3 | +3 stakes per crew member | Rulebook |
| Ship rating base | 1 | All ratings start at 1 | Rulebook |
| Clock max ticks | 6 | Default journey clock size | Rulebook |

---

## Glossary

**Aspect**: A character trait or piece of gear with a damage track

**Bloodline**: Character species/ancestry (e.g., Tzelicrae, Mottled)

**Budget**: Limited points for character creation choices

**Burned**: Severely damaged state for aspects/ratings

**Edge**: Special ability or training area (Grace, Iron, etc.)

**Mire**: Character problem or complication with checkboxes

**Drive**: Character motivation or goal

**Origin**: Where character comes from (e.g., Ridgeback, Shanty)

**Post**: Character profession or role (e.g., Mesmer, Scrivener)

**Stakes**: Ship creation currency/points

**Track**: Damage boxes on aspects, undercrew, or ratings

**Wildsea**: Post-apocalyptic ocean of trees setting

---

**Document Version**: 1.0
**Last Updated**: 2025-12-06
**Maintained By**: Development Team
