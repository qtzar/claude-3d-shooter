# 3D Shooter Game

A browser-based first-person shooter game built with Three.js and TypeScript.

## Features

- First-person camera controls with mouse look
- WASD movement with wall sliding
- Point-and-click shooting mechanics
- Advanced enemy AI with:
  - Line-of-sight detection (enemies only chase when they can see you)
  - Patrol behavior when idle
  - Investigation of last known player position
  - Visual states (red glow when alerted, yellow when searching)
- Health and ammo system
- Ammo and health pickups that drop from enemies
- Score tracking
- Automatic enemy respawning
- Procedurally generated maze with collision detection
- 3D dungeon environment with:
  - Procedural stone wall textures
  - Textured ground (dirt/stone)
  - Abundant torch lighting throughout the maze
  - Random decorations (barrels, pillars)
  - Interactive doors (press E to open/close)
  - Dark atmospheric lighting and fog
  - Dynamic shadows

## Controls

- **WASD** or **Arrow Keys**: Move
- **Mouse**: Look around
- **Left Click**: Shoot
- **E**: Open/Close nearby doors
- **R**: Reload
- **ESC**: Release mouse/pause

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Game

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

3. Click the "Click to Start" button to begin playing

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Game Mechanics

- **Health**: You start with 100 health. Enemies deal 10 damage when they get close
- **Ammo**: You have 30 bullets per magazine. Press R to reload
- **Enemies**: Red capsule-shaped enemies with intelligent behavior:
  - Each enemy takes 3 shots to kill
  - **Normal state**: Patrol randomly at half speed
  - **Alert state** (red glow): Chase you when they have line of sight (20 unit range)
  - **Search state** (yellow glow): Move to your last known position when sight is lost
  - Use walls for cover to break line of sight and escape
- **Score**: Earn 100 points for each enemy defeated
- **Respawning**: New enemies spawn automatically when one is defeated
- **Pickups**:
  - Yellow/gold boxes restore 30 ammo (30% drop chance)
  - Red/pink boxes with white cross restore 50 health (20% drop chance)
- **Maze**: Procedurally generated maze that regenerates each game
- **Doors**: Interactive wooden doors in corridors
  - Press E when near a door (within 3 units) to toggle open/closed
  - Doors slide to the side when opening
  - Enemies cannot open doors but can pass through open doors
  - Use doors strategically to block enemy paths
- **Collision**: Both player and enemies cannot pass through walls or closed doors but can slide along them

## Technology Stack

- **Three.js**: 3D graphics library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server

## Project Structure

```
src/
  ├── main.ts           # Entry point
  ├── game.ts           # Main game loop and scene setup
  ├── player.ts         # Player controls and state with collision
  ├── enemy.ts          # Enemy AI and behavior with collision
  ├── maze.ts           # Procedural maze generation and collision detection
  ├── ammo-pickup.ts    # Ammo pickup items
  ├── health-pickup.ts  # Health pickup items
  ├── input.ts          # Input handling
  └── ui.ts             # UI updates
```

## Future Enhancements

- Add different weapon types
- Implement power-ups
- Add sound effects and music
- Create multiple levels
- Add more enemy types
- Implement a proper game over screen
- Add difficulty levels
- Multiplayer support
