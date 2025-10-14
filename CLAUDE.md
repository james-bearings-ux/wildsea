# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a character sheet application for the Wildsea TTRPG (tabletop role-playing game). It's a single-page application built with vanilla JavaScript that allows players to create, manage, and track their Wildsea characters through three modes: creation, play, and advancement.

## Development Commands

**Start development server (Vite - recommended):**
```bash
npm run dev
```
Opens the app at http://localhost:5173 with hot module replacement.

**Build for production:**
```bash
npm run build
```
Builds the app to the `dist/` directory with optimization and minification.

**Preview production build:**
```bash
npm run preview
```
Serves the production build locally for testing.

**Legacy server (http-server):**
```bash
npm start
```
Runs http-server on port 8080 with caching disabled and CORS enabled.

## Application Architecture

### Build System

The application uses **Vite** as its build tool and development server:
- ES6 modules with import/export
- Hot module replacement during development
- Automatic bundling and optimization for production
- No configuration required - zero-config setup

### Core Structure

The application is organized into modular ES6 modules:

1. **Data Layer** (`js/data/`)
   - `loader.js` - Asynchronous loading of game data from JSON files
   - Data files: `game-constants.json`, `aspects.json`, `resources.json`
   - Exports `loadGameData()` and `getGameData()` functions

2. **State Management** (`js/state/`)
   - `character.js` - Character state and all mutation functions
   - Exports `character` object, `BUDGETS` constant, and mutation functions
   - Character modes: `'creation'`, `'play'`, `'advancement'`
   - All mutations accept a `renderCallback` parameter to trigger UI updates

3. **Rendering System** (`js/rendering/`)
   - `creation-mode.js` - Character creation with aspect/edge/skill selection budgets
   - `play-mode.js` - Active play view with aspect damage tracking
   - `advancement-mode.js` - Character advancement with track expansion
   - Each mode imports necessary components and composes the final UI

4. **Component Layer** (`js/components/`)
   - `aspects.js` - Aspect track rendering helpers
   - `edges.js` - Edge selection and display
   - `skills.js` - Skills and languages rendering (mode-aware)
   - `resources.js` - Resource management
   - `milestones.js` - Milestone tracking
   - `drives-mires.js` - Drives and mires rendering
   - All components generate HTML strings via template literals

5. **Utilities** (`js/utils/`)
   - `validation.js` - Character creation validation rules
   - `file-handlers.js` - Import/export functionality

6. **Entry Point** (`js/main.js`)
   - Application initialization
   - Event delegation setup (click and change events)
   - Main render function that delegates to mode-specific renderers
   - Connects all modules together

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

The application uses **event delegation** for all user interactions:
- Single click listener on the `#app` element handles all clicks
- Single change listener on the `#app` element handles all input changes
- UI elements use `data-action` attributes to specify the action
- Parameters passed via `data-params` attributes as JSON strings
- Special ID escaping for apostrophes: `id.replace(/'/g, "\\'")`
- Event handlers in `main.js` route actions to appropriate state mutation functions

### Import/Export System

- `exportCharacter()` - Downloads character as JSON file with version metadata
- `importCharacter()` - Loads character from JSON file via file input dialog
- Export format: `{ version: '1.0', character: {...} }`

## File Organization

```
/
├── index.html                    # Entry point, loads Tailwind CSS and main.js
├── js/
│   ├── main.js                   # Application entry point and event delegation
│   ├── data/
│   │   └── loader.js             # Game data loading utilities
│   ├── state/
│   │   └── character.js          # Character state and mutations
│   ├── rendering/
│   │   ├── creation-mode.js      # Creation mode UI
│   │   ├── play-mode.js          # Play mode UI
│   │   └── advancement-mode.js   # Advancement mode UI
│   ├── components/
│   │   ├── aspects.js            # Aspect rendering helpers
│   │   ├── edges.js              # Edge components
│   │   ├── skills.js             # Skills and languages
│   │   ├── resources.js          # Resources management
│   │   ├── milestones.js         # Milestone tracking
│   │   └── drives-mires.js       # Drives and mires
│   ├── utils/
│   │   ├── validation.js         # Validation logic
│   │   └── file-handlers.js      # Import/export
│   └── character-sheet.js        # LEGACY - kept for reference
├── css/
│   └── styles.css                # Custom styles
├── data/
│   ├── game-constants.json       # Core game data
│   ├── aspects.json              # All aspects (3091 lines)
│   └── resources.json            # Starting resources
├── package.json                  # Dependencies and scripts
└── CLAUDE.md                     # This file
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
1. Add to initial `character` object in `js/state/character.js`
2. Create mutation functions in `js/state/character.js` (they accept a `renderCallback` parameter)
3. Update relevant component rendering functions in `js/components/`
4. Add event handler routing in `js/main.js` event delegation
5. Consider import/export compatibility in `js/utils/file-handlers.js`

**Modifying render logic:**
- Component functions are in `js/components/` (renderEdges, renderSkills, etc.)
- Mode-specific behavior is in `js/rendering/` (creation, play, advancement)
- Components check `character.mode` for conditional rendering
- Remember to escape single quotes in dynamic IDs for onclick handlers

**Working with game data:**
- Import `getGameData()` from `js/data/loader.js` where needed
- Game data is immutable after load - modifications go to character state
- Failed data load shows error message in `main.js` init function

**Module structure best practices:**
- Each module should have a clear, single responsibility
- Use named exports for better code search and refactoring
- Import only what you need from each module
- Avoid circular dependencies (pass functions as parameters if needed)
- Components return HTML strings, state modules mutate data
