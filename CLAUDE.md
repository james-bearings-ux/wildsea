# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a character sheet application for the Wildsea TTRPG (tabletop role-playing game). It's a single-page application built with vanilla JavaScript that allows players to create, manage, and track their Wildsea characters through three modes: creation, play, and advancement.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Opens the app at http://localhost:8080 with auto-reload disabled and CORS enabled.

**Start server without opening browser:**
```bash
npm start
```
Runs http-server on port 8080 with caching disabled and CORS enabled.

## Application Architecture

### Core Structure

The application consists of three main layers:

1. **Data Layer** (`data/` directory)
   - `game-constants.json` - Core game data (bloodlines, origins, posts, edges, skills, languages)
   - `aspects.json` - Large file (3091 lines) containing all aspects organized by bloodline/origin/post
   - `resources.json` - Starting resources mapped to character types
   - Data is loaded asynchronously on app initialization via `loadGameData()`

2. **State Management** (`js/character-sheet.js`)
   - Single global `character` object holds all character state
   - Character modes: `'creation'`, `'play'`, `'advancement'`
   - State modifications trigger `render()` to update the entire UI
   - No framework used - pure vanilla JS with string-based HTML generation

3. **Rendering System**
   - Three mode-specific render functions:
     - `renderCreationMode()` - Character creation with aspect/edge/skill selection budgets
     - `renderPlayMode()` - Active play view with aspect damage tracking
     - `renderAdvancementMode()` - Character advancement with track expansion
   - Helper rendering functions for reusable components (edges, skills, languages, drives, mires, resources, milestones)
   - All rendering generates HTML strings that are inserted via `innerHTML`

### Character Data Structure

The `character` object contains:
- **Identity**: `name`, `bloodline`, `origin`, `post`, `mode`
- **Aspects**: Array of selected aspects with `trackSize` and `damageStates` arrays
- **Edges**: Array of selected edge names (from 7 available edges)
- **Skills & Languages**: Objects mapping names to rank values (0-3)
- **Drives**: Array of 3 drive strings
- **Mires**: Array of 3 mire objects with text and two checkbox states
- **Milestones**: Array of milestone objects with name, scale, and used state
- **Resources**: Object with 4 types (charts, salvage, specimens, whispers), each containing arrays of resource items

### Key Game Mechanics

**Creation Mode Budgets** (defined in `BUDGETS` constant):
- 4 aspects (from bloodline, origin, and post)
- 3 edges (from 7 available)
- 8 points total for skills and languages (Low Sour language starts at 3)
- Skills and languages max at rank 2 during creation

**Aspect System**:
- Each aspect has a track size (2-5 boxes)
- In play mode: boxes cycle through 3 states: default → marked → burned
- In advancement mode: tracks can be expanded from base size up to 5
- Aspect IDs are constructed as `${source}-${name}` where source is the bloodline/origin/post

**Skills & Languages**:
- 17 skills total
- 9 languages total (Low Sour is default at rank 3)
- Ranks: 0-2 in creation mode, 0-3 in play/advancement modes
- Low Sour cannot be modified in creation mode

### UI Interaction Pattern

All interactive UI elements use inline event handlers calling globally-exposed functions:
- Functions are attached to `window` object (lines 73-98)
- HTML is generated with onclick/onchange attributes as strings
- Special ID escaping for apostrophes: `id.replace(/'/g, "\\'")`
- No event delegation or modern event listeners used

### Import/Export System

- `exportCharacter()` - Downloads character as JSON file with version metadata
- `importCharacter()` - Loads character from JSON file via file input dialog
- Export format: `{ version: '1.0', character: {...} }`

## File Organization

```
/
├── index.html           # Entry point, loads Tailwind CSS, character-sheet.js
├── js/
│   └── character-sheet.js   # Main application (1302 lines)
├── css/
│   └── styles.css           # Custom styles (366 lines)
├── data/
│   ├── game-constants.json  # Core game data
│   ├── aspects.json         # All aspects (3091 lines, very large)
│   └── resources.json       # Starting resources by type
└── package.json
```

## Working with Aspects

The aspects.json file is very large (3091 lines). When working with aspects:
- Use offset/limit parameters when reading the file
- Aspect structure: `{ name, type, track, description }`
- Types: "Trait" or "Gear"
- Track sizes range from 2-5
- Aspects are organized under keys matching bloodlines, origins, and posts

## Styling Approach

- Uses Tailwind CSS CDN for utility classes
- Custom CSS in `styles.css` for component-specific styles
- Color palette: Black (#000000), grays, and red accent (#A91D3A)
- Key custom classes: `.aspect-card`, `.edge-card`, `.track-box`, `.budget-indicator`
- Track box states: `.default`, `.marked`, `.burned`, `.new` (for advancement)

## Common Development Patterns

**Adding new character properties:**
1. Add to initial `character` object (line 36-70)
2. Update relevant render functions
3. Add mutator function and expose on `window`
4. Consider import/export compatibility

**Modifying render logic:**
- Each major section has its own render function (renderEdges, renderSkills, etc.)
- Mode-specific behavior is handled via conditionals checking `character.mode`
- Remember to escape single quotes in dynamic IDs for onclick handlers

**Working with game data:**
- Access via global `GAME_DATA` object after initialization
- Game data is immutable after load - modifications go to `character` state
- Failed data load shows error message instead of rendering app
