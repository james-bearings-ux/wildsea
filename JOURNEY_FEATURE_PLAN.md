# Journey Feature - Implementation Plan

## Overview

Journeys are a modal gameplay system in Wildsea (similar to D&D combat initiative) that compress game time and introduce specialized mechanics. This feature integrates into both character sheets and the ship screen.

**Journey Toggle Behavior**: The journey active/inactive toggle on the ship screen controls visibility of ALL journey-related UI across the entire app:
- When OFF: Hides journey clocks, nav bar subtitles, and character role selector
- When ON: Shows all journey UI elements

## Game Mechanics Summary

- **Journey Structure**: Named journey with 4 progress clocks
- **Clocks**: Progress, Risk, Pathfinding, Riot (each with 1-6 ticks)
- **Roles**: Characters assign themselves to roles that may change per "leg" (day)
- **Role Types**: At the helm, On watch, Cartographising, Tending the engine, Watch the weather, Tending the garden
- **Assignment**: Roles are optional but typically all characters have one

## Data Model Changes

### Ship State (`js/state/ship.js` - if exists, or create new module)

```javascript
// New ship state structure
const ship = {
  // Existing ship data...
  journey: {
    active: false,
    name: '',
    clocks: {
      progress: { max: 6, filled: 0 },
      risk: { max: 6, filled: 0 },
      pathfinding: { max: 6, filled: 0 },
      riot: { max: 6, filled: 0 }
    }
  }
};
```

### Character State (`js/state/character.js`)

```javascript
// Add to character object
const character = {
  // Existing properties...
  journeyRole: '' // Selected role for current journey
};
```

### Role Definitions Data

Create new data file or add to `game-constants.json`:

```json
{
  "journeyRoles": [
    {
      "name": "At the helm",
      "instructions": "Navigate the ship through the wilds.\n- Make Cut rolls to steer\n- Respond to obstacles ahead\n- Keep the ship on course"
    },
    {
      "name": "On watch",
      "instructions": "Keep an eye out for danger.\n- Make Sense rolls to spot threats\n- Alert crew to hazards\n- Maintain situational awareness"
    },
    {
      "name": "Cartographising",
      "instructions": "Map the journey and surroundings.\n- Make Study rolls to chart course\n- Record landmarks and discoveries\n- Improve future navigation"
    },
    {
      "name": "Tending the engine",
      "instructions": "Maintain ship's propulsion systems.\n- Make Build rolls to keep engine running\n- Respond to mechanical failures\n- Optimize speed and efficiency"
    },
    {
      "name": "Watch the weather",
      "instructions": "Monitor environmental conditions.\n- Make Sense rolls to predict weather\n- Warn crew of incoming storms\n- Adapt to changing conditions"
    },
    {
      "name": "Tending the garden",
      "instructions": "Manage ship's food production.\n- Make Flourish rolls for cultivation\n- Maintain crew morale through provisions\n- Prevent spoilage and shortages"
    }
  ]
}
```

## UI Components

### 1. Character Sheet Role Selector (Play Mode)

**Location**: Center of play mode action bar

**Visibility**: Only rendered when `ship.journey.active === true`

**Structure**:
```html
<!-- Only render when journey is active -->
${ship.journey.active ? `
<div class="role-selector">
  <label class="text-orange-500 font-semibold">Role:</label>
  <select
    data-action="setJourneyRole"
    class="role-dropdown">
    <option value="">Select a role</option>
    <option value="at-the-helm">At the helm</option>
    <option value="on-watch">On watch</option>
    <!-- ... other roles -->
  </select>
  <button
    data-action="showRoleTooltip"
    class="info-icon"
    aria-label="Role information">
    ⓘ
  </button>
</div>
` : ''}
```

**Tooltip**: Modal/popover that displays role instructions when info icon clicked

### 2. Ship Journey Controls

**Location**: New row above [design elements, fittings, undercrew] in ship play screen

**Structure**:
```html
<div class="journey-controls bg-orange-50 p-4 rounded-lg">
  <!-- Journey Toggle -->
  <div class="journey-header flex items-center gap-4 mb-3">
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        data-action="toggleJourney"
        class="journey-toggle">
      <span class="text-orange-500 font-semibold">Journey</span>
    </label>

    <!-- Journey Name (Display/Edit modes) -->
    <span class="journey-name text-lg" data-edit-mode="false">
      [Journey Name]
    </span>
    <input
      type="text"
      class="journey-name-input hidden"
      placeholder="Journey name">

    <button
      data-action="editJourney"
      class="edit-btn text-orange-500">
      Edit
    </button>
  </div>

  <!-- Journey Clocks (visible when active) -->
  <div class="journey-clocks grid grid-cols-4 gap-4 hidden" data-journey-active="true">
    <div class="clock progress-clock">
      <h4 class="text-orange-500 font-semibold mb-2">Progress</h4>
      <!-- Clock ticks display/edit -->
      <div class="clock-ticks" data-clock="progress">
        <!-- 6 tick boxes -->
      </div>
    </div>
    <!-- Repeat for Risk, Pathfinding, Riot -->
  </div>
</div>
```

### 3. Navigation Bar Enhancement

**Modification**:
- Labels styled in bright orange (`#FF8C42`)
- Subtitle text only shown when `ship.journey.active === true`

**Structure**:
```html
<nav class="nav-bar">
  <button data-action="switchToShip">
    <div class="nav-label text-orange-500">Ship</div>
    ${ship.journey.active ? `
      <div class="nav-subtitle text-xs text-gray-500">[journey name]</div>
    ` : ''}
  </button>
  <button data-action="switchToCharacter">
    <div class="nav-label text-orange-500">Character</div>
    ${ship.journey.active ? `
      <div class="nav-subtitle text-xs text-gray-500">[role]</div>
    ` : ''}
  </button>
</nav>
```

## Visual Theme

### Colors
- **Orange accent**: `#FF8C42` (bright orange for labels)
- **Orange background**: `#FFF4E6` (pale orange, Tailwind `orange-50`)
- **Orange text**: Tailwind `text-orange-500` or custom

### CSS Classes
```css
/* Journey theme */
.journey-controls {
  background-color: #FFF4E6;
  border-left: 4px solid #FF8C42;
}

.role-selector label,
.journey-header span,
.clock h4 {
  color: #FF8C42;
}

/* Clock ticks */
.clock-tick {
  width: 24px;
  height: 24px;
  border: 2px solid #FF8C42;
  border-radius: 50%;
  cursor: pointer;
}

.clock-tick.filled {
  background-color: #FF8C42;
}

/* Nav bar */
.nav-label {
  color: #FF8C42;
  font-weight: 600;
}

.nav-subtitle {
  font-size: 0.65rem;
  color: #6B7280;
  margin-top: 2px;
}
```

## State Management

### New Mutation Functions

**Character mutations** (`js/state/character.js`):
```javascript
export function setJourneyRole(role, renderCallback) {
  character.journeyRole = role;
  if (renderCallback) renderCallback();
}
```

**Ship mutations** (`js/state/ship.js` - new file):
```javascript
export function toggleJourney(renderCallback) {
  ship.journey.active = !ship.journey.active;
  if (renderCallback) renderCallback();
}

export function setJourneyName(name, renderCallback) {
  ship.journey.name = name;
  if (renderCallback) renderCallback();
}

export function updateClock(clockType, filled, renderCallback) {
  if (ship.journey.clocks[clockType]) {
    ship.journey.clocks[clockType].filled = filled;
  }
  if (renderCallback) renderCallback();
}

export function setClockMax(clockType, max, renderCallback) {
  if (ship.journey.clocks[clockType]) {
    ship.journey.clocks[clockType].max = Math.max(1, Math.min(6, max));
    // Ensure filled doesn't exceed new max
    ship.journey.clocks[clockType].filled = Math.min(
      ship.journey.clocks[clockType].filled,
      max
    );
  }
  if (renderCallback) renderCallback();
}
```

## Component Functions

### Role Selector Component (`js/components/journey-role.js`)

```javascript
export function renderRoleSelector(currentRole, roleData) {
  const roleOptions = roleData.map(role => {
    const value = role.name.toLowerCase().replace(/ /g, '-');
    const selected = currentRole === value ? 'selected' : '';
    return `<option value="${value}" ${selected}>${role.name}</option>`;
  }).join('');

  return `
    <div class="role-selector flex items-center gap-2">
      <label class="text-orange-500 font-semibold">Role:</label>
      <select
        data-action="setJourneyRole"
        class="role-dropdown border rounded px-2 py-1">
        <option value="">Select a role</option>
        ${roleOptions}
      </select>
      <button
        data-action="showRoleTooltip"
        data-params='${JSON.stringify({ role: currentRole })}'
        class="info-icon text-orange-500 hover:text-orange-600"
        aria-label="Role information">
        ⓘ
      </button>
    </div>
  `;
}

export function renderRoleTooltip(roleData) {
  if (!roleData) return '';

  return `
    <div class="role-tooltip bg-white border-2 border-orange-500 rounded-lg p-4 shadow-lg">
      <h3 class="text-orange-500 font-bold mb-2">${roleData.name}</h3>
      <p class="whitespace-pre-line text-sm">${roleData.instructions}</p>
      <button
        data-action="closeTooltip"
        class="mt-3 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">
        Close
      </button>
    </div>
  `;
}
```

### Journey Clocks Component (`js/components/journey-clocks.js`)

```javascript
export function renderJourneyClock(clockType, clockData, editMode = false) {
  const { max, filled } = clockData;
  const capitalizedType = clockType.charAt(0).toUpperCase() + clockType.slice(1);

  if (editMode) {
    // Dropdown for setting max ticks
    const options = [1, 2, 3, 4, 5, 6].map(n =>
      `<option value="${n}" ${n === max ? 'selected' : ''}>${n}</option>`
    ).join('');

    return `
      <div class="clock ${clockType}-clock">
        <h4 class="text-orange-500 font-semibold mb-2">${capitalizedType}</h4>
        <select
          data-action="setClockMax"
          data-params='${JSON.stringify({ clockType })}'
          class="clock-max-select border rounded px-2 py-1">
          ${options}
        </select>
      </div>
    `;
  }

  // Display mode: clickable ticks
  const ticks = Array.from({ length: 6 }, (_, i) => {
    const isVisible = i < max;
    const isFilled = i < filled;
    return `
      <div
        class="clock-tick ${isFilled ? 'filled' : ''} ${!isVisible ? 'hidden' : ''}"
        data-action="toggleClockTick"
        data-params='${JSON.stringify({ clockType, tickIndex: i })}'
        ${!isVisible ? 'style="display: none;"' : ''}>
      </div>
    `;
  }).join('');

  return `
    <div class="clock ${clockType}-clock">
      <h4 class="text-orange-500 font-semibold mb-2">${capitalizedType}</h4>
      <div class="clock-ticks flex gap-1">
        ${ticks}
      </div>
    </div>
  `;
}

export function renderJourneyControls(journeyData, editMode = false) {
  const { active, name, clocks } = journeyData;

  return `
    <div class="journey-controls bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 ${!active ? 'journey-inactive' : ''}">
      <div class="journey-header flex items-center gap-4 mb-3">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            ${active ? 'checked' : ''}
            data-action="toggleJourney"
            class="journey-toggle">
          <span class="text-orange-500 font-semibold">Journey</span>
        </label>

        ${editMode ? `
          <input
            type="text"
            value="${name}"
            data-action="updateJourneyName"
            class="journey-name-input border rounded px-2 py-1 flex-grow"
            placeholder="Journey name">
          <button
            data-action="saveJourney"
            class="save-btn px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600">
            Save
          </button>
        ` : `
          <span class="journey-name text-lg font-medium">${name || 'Unnamed Journey'}</span>
          <button
            data-action="editJourney"
            class="edit-btn text-orange-500 hover:text-orange-600">
            Edit
          </button>
        `}
      </div>

      ${active ? `
        <div class="journey-clocks grid grid-cols-4 gap-4">
          ${renderJourneyClock('progress', clocks.progress, editMode)}
          ${renderJourneyClock('risk', clocks.risk, editMode)}
          ${renderJourneyClock('pathfinding', clocks.pathfinding, editMode)}
          ${renderJourneyClock('riot', clocks.riot, editMode)}
        </div>
      ` : ''}
    </div>
  `;
}
```

### Nav Bar Component Update (`js/components/nav-bar.js`)

```javascript
export function renderNavBar(currentView, journeyActive, journeyName, characterRole) {
  return `
    <nav class="nav-bar flex justify-center gap-4 p-4 border-b">
      <button
        class="nav-button ${currentView === 'ship' ? 'active' : ''}"
        data-action="switchToShip">
        <div class="nav-label text-orange-500 font-semibold">Ship</div>
        ${journeyActive ? `
          <div class="nav-subtitle text-xs text-gray-500">
            ${journeyName || ''}
          </div>
        ` : ''}
      </button>

      <button
        class="nav-button ${currentView === 'character' ? 'active' : ''}"
        data-action="switchToCharacter">
        <div class="nav-label text-orange-500 font-semibold">Character</div>
        ${journeyActive ? `
          <div class="nav-subtitle text-xs text-gray-500">
            ${characterRole ? characterRole.replace(/-/g, ' ') : ''}
          </div>
        ` : ''}
      </button>
    </nav>
  `;
}
```

## Event Handlers

### New Actions in `js/main.js`

```javascript
// In click event delegation
case 'setJourneyRole': {
  const role = event.target.value;
  setJourneyRole(role, render);
  break;
}

case 'showRoleTooltip': {
  const params = JSON.parse(event.target.dataset.params || '{}');
  // Show tooltip modal with role instructions
  showRoleTooltipModal(params.role);
  break;
}

case 'toggleJourney': {
  toggleJourney(render);
  break;
}

case 'editJourney': {
  // Toggle edit mode for journey controls
  setJourneyEditMode(true, render);
  break;
}

case 'saveJourney': {
  setJourneyEditMode(false, render);
  break;
}

case 'updateJourneyName': {
  // On input change
  const name = event.target.value;
  setJourneyName(name, render);
  break;
}

case 'setClockMax': {
  const params = JSON.parse(event.target.dataset.params);
  const max = parseInt(event.target.value);
  setClockMax(params.clockType, max, render);
  break;
}

case 'toggleClockTick': {
  const params = JSON.parse(event.target.dataset.params);
  // Toggle tick filled state
  toggleClockTick(params.clockType, params.tickIndex, render);
  break;
}
```

## File Structure Updates

### New Files to Create

1. `js/state/ship.js` - Ship state management (if doesn't exist)
2. `js/components/journey-role.js` - Role selector component
3. `js/components/journey-clocks.js` - Journey clocks component
4. `js/components/nav-bar.js` - Enhanced nav bar component (if doesn't exist)
5. `js/utils/journey-helpers.js` - Journey-specific utilities

### Files to Modify

1. `js/state/character.js` - Add journeyRole property
2. `js/rendering/play-mode.js` - Add role selector to action bar
3. `js/main.js` - Add new event handlers
4. `js/utils/file-handlers.js` - Include journey data in import/export
5. `data/game-constants.json` - Add journey roles data
6. `css/styles.css` - Add journey theme styles

## Implementation Steps

### Phase 1: Data Model & State Management
1. Create `js/state/ship.js` with journey state structure
2. Add journey role property to `js/state/character.js`
3. Add journey roles data to `data/game-constants.json`
4. Implement ship state mutation functions
5. Implement character journeyRole mutation function

### Phase 2: Core Components
1. Create `js/components/journey-role.js` with role selector
2. Create `js/components/journey-clocks.js` with clock rendering
3. Create/update nav bar component with subtitles
4. Add journey styles to `css/styles.css`

### Phase 3: Integration
1. Integrate role selector into play mode action bar
2. Add journey controls to ship screen
3. Update nav bar in main layout
4. Wire up event handlers in `js/main.js`

### Phase 4: Polish
1. Add tooltip/modal for role instructions
2. Implement edit mode toggle for journey controls
3. Test state persistence in import/export
4. Responsive design adjustments
5. Accessibility improvements (ARIA labels, keyboard nav)

### Phase 5: Testing
1. Test journey toggle functionality
2. Test clock tick interactions
3. Test role selection and tooltip
4. Test edit mode transitions
5. Test import/export with journey data
6. Test nav bar subtitle updates

## Technical Considerations

### State Synchronization
- Journey state lives at ship level (shared across characters)
- Character roles are individual
- Nav bar must aggregate data from both ship and character state

### Edit Mode Management
- Need edit mode state flag (possibly in ship.journey object)
- Toggle between display and edit for journey name and clocks
- Consider "dirty state" for unsaved changes

### Tooltip Implementation
- Modal overlay vs inline tooltip
- Position calculation for tooltip
- Click outside to close behavior
- Mobile-friendly interaction

### Persistence
- Journey data should persist in ship save/load
- Character role should persist in character save/load
- Consider localStorage for active journey state

### Edge Cases
- What happens when journey is inactive? (Hide all controls)
- Empty journey name handling
- Role not selected state
- Clock ticks: should clicking always increment, or toggle?
- Multiple characters with same role (allowed or prevent?)

## Future Enhancements

- Journey log/history tracking
- Role assignment overview (see all character roles at once)
- Journey templates or presets
- Clock automation or calculations
- Integration with milestone system
- Journey-specific resources or events
