# Damage Type Tooltips - Implementation Guide

## Overview

Each damage type has a descriptive tooltip that can be shown when users hover over or click on damage type names. This helps players understand the mechanical and narrative effects of each damage type.

---

## Data Structure

### Location: `js/constants/damage-types.js`

```javascript
export const DAMAGE_TYPE_DESCRIPTIONS = {
  'Blunt': {
    subtitle: 'Crushing damage',
    description: 'Good at stunning and breaking. This might come from a club...'
  },
  // ... all 12 damage types
};
```

### Helper Function

```javascript
import { getDamageTypeDescription } from './constants/damage-types.js';

const info = getDamageTypeDescription('Frost');
console.log(info.subtitle);    // "Cold damage"
console.log(info.description); // "Good at slowing and freezing..."
```

---

## All Damage Type Descriptions

### Physical Damage

**Blunt** - Crushing damage
Good at stunning and breaking. This might come from a club, hammer, or tail swipe, or impact with an object or the ground at high speed. It could cause bruising or leave a target with broken bones.

**Keen** - Cutting damage
Good at slicing and bleeding. This might come from a cutlass, claw, or sharp-edged leaf, and will likely leave wounds that need bandaging to prevent heavy blood loss.

**Spike** - Piercing damage
Good at penetrating and impaling. This might come from a spearhead, arrow, or bite, or high-speed impact with a sturdy branch at the wrong angle. Lasting damage to internal organs is a real possibility.

**Hewing** - Chopping damage
Good at splitting and breaking. This might come from an axe or the claws of a particularly powerful creature, and hewing injuries are likely to come in the form of lost limbs and bone breaks.

**Serrated** - Sawing damage
Good at ripping and tearing. This might come from a jagserry, sawtooth prow, or any other kind of serrated edge, and will leave ragged-edged wounds that scar prominently.

### Elemental Damage

**Toxin** - Poison damage
Good at sickening and confusing. This might come from tainted food or plant venom, and will usually cause illnesses and short-term loss of senses.

**Acid** - Corrosive damage
Good at melting and searing. This might come from... well, acid (and other caustic or corrosive substances). It's likely to disfigure or blind, even if only temporarily, or dull and damage nerves.

**Blast** - Explosive damage
Good at stunning and shattering. This might come from gunshots, massive sounds, or the impact of nearby detonations, such as from cannon fire. Likely to leave a sufferer dazed, confused, deafened, and staggering, and can definitely break bones.

**Volt** - Electrical damage
Good at shocking and paralysing. This might come from lightning strikes or electrically charged weapons, and is likely to temporarily knock an individual out as well as leaving burns.

**Frost** - Cold damage
Good at slowing and freezing. This is most likely to be an environmental threat, caused by winter winds and exposure, but some creatures can manipulate cryonic glands as a weapon. Causes shivering, numbness, and invites future illnesses.

### Special Damage

**Salt** - Crystalline damage
Good at drying and banishing. This might come from spirits or dessicants, and can leave weird and arcane complications or rough, tender skin.

**Flame** - Forbidden damage that burns, melts, and inspires fear
Comes from fire, or occasionally searing liquids.

---

## UI Implementation Options

### Option 1: CSS-Only Hover Tooltip (Desktop)

**HTML:**
```html
<span class="damage-type-tooltip" data-type="Frost">
  Frost
  <span class="tooltip-content">
    <strong>Cold damage</strong><br>
    Good at slowing and freezing. This is most likely to be an environmental threat...
  </span>
</span>
```

**CSS:**
```css
.damage-type-tooltip {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted currentColor;
}

.damage-type-tooltip .tooltip-content {
  visibility: hidden;
  position: absolute;
  z-index: 1000;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  background-color: #1a1a1a;
  color: #fff;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.4;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.damage-type-tooltip .tooltip-content::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #1a1a1a transparent transparent transparent;
}

.damage-type-tooltip:hover .tooltip-content {
  visibility: visible;
}
```

### Option 2: JavaScript Tooltip (Mobile-Friendly)

**Component: `js/components/damage-type-tooltip.js`**
```javascript
import { getDamageTypeDescription } from '../constants/damage-types.js';

export function renderDamageTypeWithTooltip(type) {
  const info = getDamageTypeDescription(type);

  if (!info) {
    return `<span class="damage-type">${type}</span>`;
  }

  return `
    <span
      class="damage-type has-tooltip"
      data-tooltip-type="${type}"
      onclick="toggleDamageTypeTooltip(event, '${type}')"
    >
      ${type}
      <span class="info-icon">ⓘ</span>
    </span>
  `;
}

// Global function for event handler
window.toggleDamageTypeTooltip = function(event, type) {
  event.stopPropagation();
  const info = getDamageTypeDescription(type);

  // Show tooltip modal or popover
  showTooltipPopover(event.target, info);
};
```

### Option 3: Native `title` Attribute (Simple Fallback)

**HTML:**
```html
<span
  class="damage-type"
  title="Cold damage - Good at slowing and freezing. This is most likely..."
>
  Frost
</span>
```

**Pros:** Works everywhere, no JavaScript
**Cons:** Limited styling, inconsistent across browsers

---

## Recommended Implementation

### Hybrid Approach: Tailwind + Click-to-Show

**Component Structure:**
```javascript
export function renderDamageTypeChip(type, selected = false) {
  const info = getDamageTypeDescription(type);
  const tooltipId = `tooltip-${type.toLowerCase()}`;

  return `
    <button
      class="dt-chip ${selected ? 'selected' : ''} group relative"
      data-action="toggleDamageType"
      data-params='{"type": "${type}"}'
    >
      ${type}
      ${selected ? '<span class="ml-1">✓</span>' : ''}

      ${info ? `
        <span
          class="info-badge"
          onclick="event.stopPropagation(); toggleTooltip('${tooltipId}')"
        >
          ⓘ
        </span>

        <div id="${tooltipId}" class="tooltip-popup hidden">
          <div class="tooltip-header">${info.subtitle}</div>
          <div class="tooltip-body">${info.description}</div>
        </div>
      ` : ''}
    </button>
  `;
}
```

**CSS (Tailwind):**
```css
.dt-chip {
  @apply relative px-2 py-1 text-xs rounded border border-gray-300
         bg-white hover:bg-gray-50 cursor-pointer transition-colors;
}

.info-badge {
  @apply ml-1 inline-flex items-center justify-center w-4 h-4
         text-xs text-gray-400 hover:text-blue-600
         rounded-full border border-gray-300 cursor-help;
}

.tooltip-popup {
  @apply absolute bottom-full left-1/2 -translate-x-1/2 mb-2
         w-64 bg-gray-900 text-white text-xs rounded-lg
         shadow-lg p-3 z-50;
}

.tooltip-popup.hidden {
  @apply invisible opacity-0;
}

.tooltip-header {
  @apply font-bold mb-1 text-gray-300;
}

.tooltip-body {
  @apply text-gray-100 leading-relaxed;
}
```

---

## Usage in Different Contexts

### 1. Damage Type Selector (Creation/Advancement Mode)

Show tooltip when hovering over damage type options:

```javascript
<div class="damage-type-selector">
  <p class="text-sm mb-2">Choose 3 damage types:</p>
  <div class="flex flex-wrap gap-2">
    ${aspect.damageTypes.options.map(type =>
      renderDamageTypeChip(type, selected.includes(type))
    ).join('')}
  </div>
</div>
```

### 2. Summary Display (Play Mode)

Show tooltips on resistance/immunity badges:

```javascript
<div class="damage-summary">
  <span class="label">Resistant to:</span>
  ${resistances.map(type => `
    <span class="badge with-tooltip" title="${getDamageTypeDescription(type).subtitle}">
      ${type}
    </span>
  `).join(' ')}
</div>
```

### 3. Aspect Description (All Modes)

Inline tooltips in aspect descriptions:

```javascript
function enhanceDescriptionWithTooltips(description) {
  const damageTypePattern = /\b(Blunt|Keen|Spike|Hewing|Serrated|Toxin|Acid|Blast|Volt|Frost|Salt|Flame)\b/gi;

  return description.replace(damageTypePattern, (match) => {
    const normalized = normalizeDamageType(match);
    return renderDamageTypeWithTooltip(normalized);
  });
}
```

---

## Mobile Considerations

### Touch-Friendly Implementation

For mobile devices, tooltips should be triggered by tap, not hover:

```javascript
let currentTooltip = null;

window.toggleTooltip = function(tooltipId) {
  const tooltip = document.getElementById(tooltipId);

  // Close current tooltip if different
  if (currentTooltip && currentTooltip !== tooltip) {
    currentTooltip.classList.add('hidden');
  }

  // Toggle new tooltip
  tooltip.classList.toggle('hidden');
  currentTooltip = tooltip.classList.contains('hidden') ? null : tooltip;
};

// Close tooltips when clicking outside
document.addEventListener('click', (e) => {
  if (currentTooltip && !e.target.closest('.info-badge')) {
    currentTooltip.classList.add('hidden');
    currentTooltip = null;
  }
});
```

---

## Accessibility

### ARIA Attributes

```html
<button
  class="dt-chip"
  aria-describedby="tooltip-frost"
  aria-label="Frost damage type"
>
  Frost
  <span
    class="info-badge"
    role="button"
    aria-label="Show damage type information"
    tabindex="0"
  >
    ⓘ
  </span>
</button>

<div
  id="tooltip-frost"
  role="tooltip"
  class="tooltip-popup hidden"
>
  <!-- tooltip content -->
</div>
```

### Keyboard Navigation

```javascript
// Allow Enter/Space to trigger tooltip
infoIcon.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleTooltip(tooltipId);
  }
});

// Allow Escape to close tooltip
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentTooltip) {
    currentTooltip.classList.add('hidden');
    currentTooltip = null;
  }
});
```

---

## Testing Checklist

- [ ] Tooltips display on hover (desktop)
- [ ] Tooltips display on click (mobile)
- [ ] Only one tooltip visible at a time
- [ ] Clicking outside closes tooltip
- [ ] Escape key closes tooltip
- [ ] Tooltips don't overflow viewport
- [ ] Info icon is visible and clickable
- [ ] ARIA attributes work with screen readers
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Tooltips work in all three modes (creation, play, advancement)
- [ ] Tooltips work in selector, summary, and description contexts

---

## Files to Create/Modify

### Phase: Add Damage Type Tooltips

**New Files:**
- `js/components/damage-type-tooltip.js` - Tooltip rendering component

**Modified Files:**
- `js/constants/damage-types.js` - ✅ Already added DAMAGE_TYPE_DESCRIPTIONS
- `js/components/damage-type-selector.js` - Add tooltips to chips
- `js/components/damage-summary.js` - Add tooltips to badges
- `css/styles.css` - Add tooltip styles

**New CSS Classes:**
- `.damage-type-tooltip` - Wrapper for tooltip
- `.tooltip-content` - Tooltip popup container
- `.info-badge` - Info icon (ⓘ)
- `.tooltip-popup` - Mobile-friendly popup
- `.tooltip-header` - Subtitle text
- `.tooltip-body` - Description text

---

## Priority

This feature should be implemented **after** the core damage type selection and display features are working. Suggested order:

1. ✅ Phase 1A: Constants & Data
2. ✅ Phase 1B: Character State
3. Phase 2A: UI Components (selector, warning, highlighting)
4. Phase 3: Summary Display
5. **Phase 4: Tooltips** (this feature)
6. Phase 5: Testing & Polish

---

## Implementation Date
Added to backlog: 2025-10-18
