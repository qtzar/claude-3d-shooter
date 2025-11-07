# 3D Shooter Game

A browser-based first-person shooter game built with Three.js and TypeScript.

## Features

- First-person camera controls with mouse look
- WASD movement with wall sliding
- Point-and-click shooting mechanics
- **5 Weapon Types** with different stats:
  - Pistol (20 damage, 50 ammo)
  - Shotgun (30 damage, 24 ammo, 1s cooldown)
  - Rifle (20 damage, 90 ammo, 0.1s cooldown)
  - Sniper (80 damage, 15 ammo, 1.5s cooldown)
  - Rocket Launcher (100 damage, 10 ammo, 2s cooldown)
- **Advanced enemy AI** with three difficulty levels:
  - Basic (60 HP, grey, 50% spawn rate)
  - Medium (100 HP, orange, 35% spawn rate)
  - Hard (200 HP, dark red, 15% spawn rate)
  - Line-of-sight detection (enemies only chase when they can see you)
  - Patrol behavior when idle
  - Investigation of last known player position
  - **Head-only alert indicators** (only head turns red/yellow, body keeps color for easy identification)
- **Complete sound system** with procedural audio:
  - Unique weapon sounds for each gun
  - Enemy hit and death sounds
  - Player damage feedback
  - Pickup and door sounds
  - Ambient background music
- **Visual HUD** with:
  - Color-coded health bar (green 50-100%, yellow 20-49%, red 0-19%)
  - Weapon inventory display showing all 5 weapons
  - Active weapon indicator
  - Ammo counter for each weapon
  - Score tracking
  - Circular mini-map in lower right corner
- **Circular Mini-Map**:
  - Shows 25-unit radius around player
  - Displays maze walls as gray blocks
  - Enemy positions as red dots
  - Rotates with player view direction (forward is always up)
- Weapon and ammo pickups that drop from enemies
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

- **WASD**: Move
- **Mouse**: Look around
- **Left Click**: Shoot
- **1-5 Keys**: Switch weapons (Pistol, Shotgun, Rifle, Sniper, Rocket)
- **R**: Reload current weapon
- **E**: Open/Close nearby doors
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
  - Visual health bar changes color based on health level
  - Green (50-100%), Yellow (20-49%), Red (0-19%)
- **Weapons**: Start with a pistol, collect other weapons from defeated enemies
  - Each weapon has unique damage, ammo capacity, and fire rate
  - Weapon pickups always drop from enemies (100% chance)
  - If you already own a weapon, pickup gives you max ammo for that weapon
- **Ammo**: Each weapon has its own ammo pool. Press R to reload
  - Ammo pickups restore 30 rounds to current weapon (30% drop chance)
- **Enemies**: Capsule-shaped enemies with color-coded difficulty:
  - **Basic** (Grey): 60 HP, requires 3 pistol shots or 1 sniper shot
  - **Medium** (Orange): 100 HP, requires 5 pistol shots or 2 sniper shots
  - **Hard** (Dark Red): 200 HP, requires 10 pistol shots or 3 sniper shots
  - **Normal state**: Patrol randomly at half speed
  - **Alert state** (red head): Chase you when they have line of sight (20 unit range)
  - **Search state** (yellow head): Move to your last known position when sight is lost
  - Only the head changes color, body stays the same for easy identification
  - Use walls for cover to break line of sight and escape
- **Score**: Earn points for each enemy defeated
  - Basic: 50 points
  - Medium: 100 points
  - Hard: 200 points
- **Respawning**: New enemies spawn automatically when one is defeated
- **Pickups**:
  - Weapon pickups (colored boxes): Always drop from enemies
  - Yellow/gold ammo boxes: 30 ammo for current weapon (30% drop chance)
  - Red/pink health boxes: Restore 50 health (20% drop chance)
- **Maze**: Procedurally generated 15x15 maze that regenerates each game
- **Doors**: Interactive wooden doors in corridors
  - Press E when near a door (within 3 units) to toggle open/closed
  - Doors swing open to the side
  - Enemies cannot open doors but can pass through open doors
  - Use doors strategically to block enemy paths
- **Mini-Map**: Circular radar in lower right corner
  - Shows 25-unit radius around your position
  - Gray blocks represent walls
  - Red dots show enemy positions
  - Map rotates with your view direction
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
  ├── enemy.ts          # Enemy AI with three difficulty levels
  ├── maze.ts           # Procedural maze generation and collision detection
  ├── door.ts           # Interactive door system
  ├── weapon.ts         # Weapon system with 5 weapon types
  ├── ammo-pickup.ts    # Ammo pickup items
  ├── health-pickup.ts  # Health pickup items
  ├── weapon-pickup.ts  # Weapon pickup items
  ├── sound.ts          # Procedural sound system
  ├── input.ts          # Input handling
  └── ui.ts             # UI updates and mini-map rendering
```

## Future Enhancements

- Add explosion effects for rocket launcher
- Implement special power-ups (speed boost, invincibility, etc.)
- Create multiple levels with increasing difficulty
- Add boss enemies
- Implement a proper game over screen with restart option
- Add difficulty settings (easy/normal/hard)
- Save high scores locally
- Add more weapon types (grenades, flamethrower, etc.)
- Multiplayer support
