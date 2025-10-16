# Wildsea Multiplayer Migration Plan

## Overview
Migrating the Wildsea character sheet application from localStorage to Supabase for real-time multiplayer support.

## Current Status (Phases 1-3 Complete)

### ✅ Completed
1. **Infrastructure Setup**
   - Supabase client library installed (`@supabase/supabase-js`)
   - Environment configuration (`.env` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
   - Supabase client wrapper (`js/supabaseClient.js`)
   - `.gitignore` updated to exclude `.env` files

2. **Database Schema**
   - Created in Supabase via `supabase-schema.sql`
   - Tables: `sessions`, `characters`, `ships`, `session_characters` (junction)
   - Row Level Security (RLS) enabled with permissive policies for development
   - Real-time enabled on all tables
   - Indexes created for performance

3. **Session State Migration**
   - `js/state/session.js` fully migrated to Supabase
   - All functions now async (createSession, loadSession, saveSession, etc.)
   - Junction table handling for character associations
   - localStorage used only to remember current session ID

4. **Character State Migration (COMPLETE)**
   - `js/state/character.js` fully migrated to Supabase
   - Load/save/delete/create functions converted to Supabase
   - Database column name mapping (snake_case ↔ camelCase)
   - Removed global `character` object
   - All mutation functions cleaned - removed optional `char` parameters
   - Removed obsolete `replaceCharacter()` and `getCharacter()` exports

5. **Ship State Migration (COMPLETE)**
   - `js/state/ship.js` fully migrated to Supabase
   - All CRUD functions converted to async Supabase operations
   - Database column name mapping implemented
   - convertFromDB() helper added for data conversion

---

## Phase 2: Complete Character Migration ✅

### Files Updated

#### 1. `js/state/character.js`
**Status:** ✅ COMPLETE

**Completed Tasks:**
- ✅ Removed all `char = null` default parameters from mutation functions
- ✅ Removed all `const targetChar = char || character` fallbacks
- ✅ Updated all functions to require `char` parameter
- ✅ Removed `replaceCharacter()` and `getCharacter()` exports
- ✅ Cleaned up all 22 mutation functions

**Cleaned Functions:**
- ✅ `cycleAspectDamage`
- ✅ `expandAspectTrack`
- ✅ `customizeAspect`
- ✅ `resetAspectCustomization`
- ✅ `toggleEdge`
- ✅ `toggleAspect`
- ✅ `adjustSkill`
- ✅ `adjustLanguage`
- ✅ `updateDrive`
- ✅ `updateMire`
- ✅ `toggleMireCheckbox`
- ✅ `addMilestone`
- ✅ `updateMilestoneName`
- ✅ `updateMilestoneScale`
- ✅ `toggleMilestoneUsed`
- ✅ `deleteMilestone`
- ✅ `addResource`
- ✅ `updateResourceName`
- ✅ `removeResource`
- ✅ `populateDefaultResources`
- ✅ `setMode`
- ✅ `generateRandomCharacter`
- ✅ `getAvailableAspects`

---

## Phase 3: Ship State Migration ✅

### Files Updated

#### 1. `js/state/ship.js`
**Status:** ✅ COMPLETE

**Completed Tasks:**
- ✅ Imported supabase client
- ✅ Updated `createShip()` to insert into Supabase with sessionId parameter
- ✅ Updated `loadShip()` to query Supabase
- ✅ Updated `saveShip()` to update Supabase
- ✅ Updated `deleteShip()` to delete from Supabase
- ✅ Updated `getAllShips()` to accept sessionId parameter
- ✅ Added `convertFromDB()` helper for column name mapping
- ✅ All ship functions now async

**Database Mapping Implemented:**
```javascript
// Database columns → App properties
anticipated_crew_size → anticipatedCrewSize
additional_stakes → additionalStakes
rating_damage → ratingDamage
general_additions → generalAdditions
bounteous_additions → bounteousAdditions
undercrew_damage → undercrewDamage
```

---

## Phase 4: Main Application Updates ✅

### Files Updated

#### 1. `js/main.js`
**Status:** ✅ COMPLETE

**Completed Tasks:**
- ✅ Made `init()` function handle async session/character loading with loading state
- ✅ Made `render()` function async
- ✅ Updated all click event handlers to use async/await (wrapped in async IIFE)
- ✅ Updated all change event handlers to use async/await (wrapped in async IIFE)
- ✅ Added error handling for failed database operations
- ✅ All `saveCharacter()`, `saveShip()`, `saveSession()` calls now await
- ✅ All `loadCharacter()`, `loadShip()`, `loadSession()` calls now await
- ✅ All `render()` calls now await
- ✅ Session management actions (create, switch, remove character) now async
- ✅ Ship management actions (create, select parts, damage tracking) now async

**Key Changes Needed:**

```javascript
// BEFORE (synchronous)
function init() {
  session = loadSession();
  if (!session) {
    session = createSession('My Crew');
    const character = createCharacter();
    saveCharacter(character);
    addCharacterToSession(session, character.id);
    saveSession(session);
  }
  setupEventDelegation();
  render();
}

// AFTER (asynchronous)
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = '<div style="padding: 20px;">Loading...</div>';

  try {
    session = await loadSession();
    if (!session) {
      session = await createSession('My Crew');
      const character = await createCharacter(session.id);
      await addCharacterToSession(session, character.id);
    }
    setupEventDelegation();
    await render();
  } catch (error) {
    console.error('Failed to initialize:', error);
    app.innerHTML = '<div style="padding: 20px; color: red;">Failed to load. Please refresh.</div>';
  }
}
```

**Event Handler Pattern:**
```javascript
// All case statements need to become async
case 'toggleAspect':
  if (character) {
    toggleAspect(parsedParams.id, render, character);
    await saveCharacter(character);  // Now async!
    await render();  // Now async!
  }
  break;
```

**Render Function:**
```javascript
// BEFORE
function render() {
  const character = loadCharacter(session.activeCharacterId);
  // ...
}

// AFTER
async function render() {
  const character = await loadCharacter(session.activeCharacterId);
  // ...
}
```

---

## Phase 5: Real-Time Subscriptions

### Files to Create/Update

#### 1. Create `js/realtime.js`
**Status:** Not started

**Purpose:** Handle Supabase real-time subscriptions for live updates

**Tasks:**
- [ ] Create subscription management system
- [ ] Subscribe to session changes
- [ ] Subscribe to character changes
- [ ] Subscribe to ship changes
- [ ] Handle updates from other users
- [ ] Merge remote changes with local state
- [ ] Trigger re-renders on updates

**Example Implementation:**
```javascript
import { supabase } from './supabaseClient.js';

let subscriptions = [];

export function subscribeToSession(sessionId, onUpdate) {
  const subscription = supabase
    .channel(`session-${sessionId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      (payload) => {
        console.log('Session changed:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  subscriptions.push(subscription);
  return subscription;
}

export function subscribeToCharacters(sessionId, onUpdate) {
  const subscription = supabase
    .channel(`characters-${sessionId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'characters', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        console.log('Character changed:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  subscriptions.push(subscription);
  return subscription;
}

export function unsubscribeAll() {
  subscriptions.forEach(sub => sub.unsubscribe());
  subscriptions = [];
}
```

#### 2. Update `js/main.js` to use real-time
**Tasks:**
- [ ] Import real-time module
- [ ] Setup subscriptions in `init()`
- [ ] Handle incoming updates
- [ ] Cleanup subscriptions on page unload

---

## Phase 6: Import/Export Migration

### Files to Update

#### 1. `js/utils/file-handlers.js`
**Status:** Not checked yet

**Tasks:**
- [ ] Check if import/export uses Supabase operations
- [ ] Update `importCharacter()` to create in Supabase
- [ ] Update `importShip()` to create in Supabase
- [ ] Ensure exports still work correctly

---

## Phase 7: Testing & Validation

### Test Scenarios

#### 1. Single User Tests
- [ ] Create new session
- [ ] Create new character
- [ ] Edit character properties
- [ ] Save/load character
- [ ] Switch between characters
- [ ] Create ship
- [ ] Edit ship properties
- [ ] Delete character
- [ ] Delete ship

#### 2. Multi-User Tests (Open 2+ browser windows)
- [ ] Both users can see the same session
- [ ] Character changes in window 1 appear in window 2
- [ ] Ship changes in window 1 appear in window 2
- [ ] Creating character in window 1 appears in window 2
- [ ] Deleting character in window 1 updates window 2
- [ ] No data loss or corruption with concurrent edits

#### 3. Edge Cases
- [ ] Offline behavior (what happens when connection lost?)
- [ ] Refresh while editing
- [ ] Multiple tabs of same user
- [ ] Session not found
- [ ] Character not found

---

## Phase 8: Authentication & Security (Future)

**Note:** Currently using permissive RLS policies for development.

### Future Tasks
- [ ] Implement Supabase authentication
- [ ] Create user accounts
- [ ] Update RLS policies to restrict access
- [ ] Add session ownership/permissions
- [ ] Add invite/share functionality
- [ ] Add user management UI

---

## Migration Checklist

### Before Each Session
- [ ] Pull latest code from git
- [ ] Check `.env` file is configured
- [ ] Test Supabase connection
- [ ] Review previous session's work

### After Each Session
- [ ] Commit changes with descriptive message
- [ ] Update this document with progress
- [ ] Note any blocking issues
- [ ] Test basic functionality still works

---

## Known Issues & Decisions

### Issue 1: Async/Await Refactor
**Problem:** Entire app was synchronous, now needs to be async.
**Impact:** Requires updating every function that touches state.
**Decision:** Make all state operations async, add loading states.

### Issue 2: Real-Time Conflict Resolution
**Problem:** What happens when two users edit the same character simultaneously?
**Impact:** Could lose data if not handled properly.
**Decision:** Last-write-wins for now. Add optimistic locking later if needed.

### Issue 3: Session Identification
**Problem:** How do users join the same session?
**Current:** Store session ID in localStorage (single user).
**Future:** Need shareable session URL or invite code.

---

## Quick Reference

### Supabase Client Usage
```javascript
// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: value }])
  .select()
  .single();

// Update
const { error } = await supabase
  .from('table_name')
  .update({ column: value })
  .eq('id', id);

// Delete
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);

// Select
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)
  .single();
```

### Environment Variables
```bash
VITE_SUPABASE_URL=https://vhbyfoolesfxmfnchsav.supabase.co
VITE_SUPABASE_ANON_KEY=<your-key-here>
```

### Database Access
- Dashboard: https://vhbyfoolesfxmfnchsav.supabase.co
- SQL Editor: Project > SQL Editor
- Table Editor: Project > Table Editor

---

## Next Session Priorities

1. **HIGH:** Complete character.js cleanup (remove all `char = null` parameters)
2. **HIGH:** Update main.js init() and render() to be async
3. **MEDIUM:** Migrate ship.js to Supabase
4. **MEDIUM:** Update main.js event handlers to handle async saves
5. **LOW:** Implement basic real-time subscriptions
6. **LOW:** Test with multiple browser windows

---

## Notes

- Keep localStorage as fallback for session ID only
- UUIDs are generated by Supabase (no need for generateId())
- Column names use snake_case in DB, camelCase in app
- All timestamps handled by Supabase (created_at, updated_at)
- JSONB columns store complex objects (aspects, resources, etc.)
