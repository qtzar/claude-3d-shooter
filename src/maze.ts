import * as THREE from 'three';
import { Door } from './door';

export class Maze {
  private scene: THREE.Scene;
  private cellSize: number = 4;
  private mazeSize: number = 15; // 15x15 maze
  private wallHeight: number = 3;
  private walls: THREE.Mesh[] = [];
  private grid: number[][] = [];
  private doors: Door[] = [];
  private decorations: THREE.Object3D[] = [];
  private lights: THREE.Light[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateMaze();
    this.buildWalls();
  }

  private generateMaze(): void {
    // Initialize grid with all walls
    this.grid = [];
    for (let i = 0; i < this.mazeSize; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.mazeSize; j++) {
        this.grid[i][j] = 1; // 1 = wall
      }
    }

    // Recursive backtracking maze generation
    const stack: [number, number][] = [];
    const startX = 1;
    const startZ = 1;

    this.grid[startZ][startX] = 0; // 0 = path
    stack.push([startX, startZ]);

    const directions = [
      [0, -2], // North
      [2, 0],  // East
      [0, 2],  // South
      [-2, 0]  // West
    ];

    while (stack.length > 0) {
      const [currentX, currentZ] = stack[stack.length - 1];

      // Shuffle directions
      const shuffledDirections = directions.sort(() => Math.random() - 0.5);
      let foundPath = false;

      for (const [dx, dz] of shuffledDirections) {
        const newX = currentX + dx;
        const newZ = currentZ + dz;

        // Check if new position is valid and unvisited
        if (
          newX > 0 && newX < this.mazeSize - 1 &&
          newZ > 0 && newZ < this.mazeSize - 1 &&
          this.grid[newZ][newX] === 1
        ) {
          // Carve path
          this.grid[newZ][newX] = 0;
          this.grid[currentZ + dz / 2][currentX + dx / 2] = 0;
          stack.push([newX, newZ]);
          foundPath = true;
          break;
        }
      }

      if (!foundPath) {
        stack.pop();
      }
    }

    // Create some openings for better gameplay
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      const z = Math.floor(Math.random() * (this.mazeSize - 2)) + 1;
      this.grid[z][x] = 0;
    }
  }

  private buildWalls(): void {
    const wallGeometry = new THREE.BoxGeometry(this.cellSize, this.wallHeight, this.cellSize);

    // Create procedural stone texture using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base stone color
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 0, 512, 512);

    // Add stone variation
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 30 + 5;
      const brightness = Math.floor(Math.random() * 60) - 30;
      const gray = 90 + brightness;
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, size, size);
    }

    // Add cracks and details
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.stroke();
    }

    const stoneTexture = new THREE.CanvasTexture(canvas);
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.repeat.set(2, 2);

    // Create darker variation
    const canvas2 = document.createElement('canvas');
    canvas2.width = 512;
    canvas2.height = 512;
    const ctx2 = canvas2.getContext('2d')!;
    ctx2.fillStyle = '#3a3a3a';
    ctx2.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 30 + 5;
      const brightness = Math.floor(Math.random() * 60) - 30;
      const gray = 58 + brightness;
      ctx2.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx2.fillRect(x, y, size, size);
    }
    ctx2.strokeStyle = '#1a1a1a';
    ctx2.lineWidth = 2;
    for (let i = 0; i < 50; i++) {
      ctx2.beginPath();
      ctx2.moveTo(Math.random() * 512, Math.random() * 512);
      ctx2.lineTo(Math.random() * 512, Math.random() * 512);
      ctx2.stroke();
    }

    const darkStoneTexture = new THREE.CanvasTexture(canvas2);
    darkStoneTexture.wrapS = THREE.RepeatWrapping;
    darkStoneTexture.wrapT = THREE.RepeatWrapping;
    darkStoneTexture.repeat.set(2, 2);

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: stoneTexture,
      roughness: 0.9,
      metalness: 0.1,
    });

    const darkWallMaterial = new THREE.MeshStandardMaterial({
      map: darkStoneTexture,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Center the maze around origin
    const offsetX = (this.mazeSize * this.cellSize) / 2;
    const offsetZ = (this.mazeSize * this.cellSize) / 2;

    for (let z = 0; z < this.mazeSize; z++) {
      for (let x = 0; x < this.mazeSize; x++) {
        if (this.grid[z][x] === 1) {
          const material = Math.random() > 0.7 ? darkWallMaterial : wallMaterial;
          const wall = new THREE.Mesh(wallGeometry, material);

          wall.position.set(
            x * this.cellSize - offsetX + this.cellSize / 2,
            this.wallHeight / 2,
            z * this.cellSize - offsetZ + this.cellSize / 2
          );

          wall.castShadow = true;
          wall.receiveShadow = true;
          this.walls.push(wall);
          this.scene.add(wall);
        }
      }
    }

    // Add decorations
    this.addDecorations(offsetX, offsetZ);

    // Add doors to some corridors
    this.addDoors(offsetX, offsetZ);
  }

  private addDecorations(offsetX: number, offsetZ: number): void {
    // Add torches and decorations to walkable cells
    // We need to limit torches to avoid exceeding WebGL texture limit
    let torchCount = 0;
    const maxTorches = 12; // Limit to stay under WebGL limits

    for (let z = 1; z < this.mazeSize - 1; z++) {
      for (let x = 1; x < this.mazeSize - 1; x++) {
        if (this.grid[z][x] === 0) {
          const posX = x * this.cellSize - offsetX + this.cellSize / 2;
          const posZ = z * this.cellSize - offsetZ + this.cellSize / 2;

          // Add torches but limit total count
          if (torchCount < maxTorches && Math.random() < 0.15) {
            const torchAdded = this.addTorch(x, z, posX, posZ, offsetX, offsetZ);
            if (torchAdded) torchCount++;
          }

          // 8% chance for other decorations in each walkable cell
          const rand = Math.random();
          if (rand < 0.08) {
            const decorationType = Math.random();

            if (decorationType < 0.5) {
              // Add barrel
              this.addBarrel(posX, posZ);
            } else {
              // Add small pillar
              this.addPillar(posX, posZ);
            }
          }
        }
      }
    }
    console.log('Added torches:', torchCount);
  }

  private addTorch(x: number, z: number, posX: number, posZ: number, offsetX: number, offsetZ: number): boolean {
    // Check if adjacent to a wall
    let torchPos: THREE.Vector3 | null = null;

    if (this.grid[z - 1]?.[x] === 1) {
      torchPos = new THREE.Vector3(posX, 2, posZ - this.cellSize / 2 + 0.3);
    } else if (this.grid[z + 1]?.[x] === 1) {
      torchPos = new THREE.Vector3(posX, 2, posZ + this.cellSize / 2 - 0.3);
    } else if (this.grid[z]?.[x - 1] === 1) {
      torchPos = new THREE.Vector3(posX - this.cellSize / 2 + 0.3, 2, posZ);
    } else if (this.grid[z]?.[x + 1] === 1) {
      torchPos = new THREE.Vector3(posX + this.cellSize / 2 - 0.3, 2, posZ);
    }

    if (torchPos) {
      // Torch stick
      const stickGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
      const stickMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
      const stick = new THREE.Mesh(stickGeometry, stickMaterial);
      stick.position.copy(torchPos);
      stick.castShadow = true;
      this.scene.add(stick);
      this.decorations.push(stick);

      // Flame
      const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 1.0,
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.copy(torchPos);
      flame.position.y += 0.3;
      this.scene.add(flame);
      this.decorations.push(flame);

      // Point light for torch
      const light = new THREE.PointLight(0xff8844, 0.8, 10);
      light.position.copy(flame.position);
      light.castShadow = false; // Disable shadows on torch lights to save performance
      this.scene.add(light);
      this.lights.push(light);

      return true;
    }
    return false;
  }

  private addBarrel(posX: number, posZ: number): void {
    const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.2,
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(posX + (Math.random() - 0.5), 0.3, posZ + (Math.random() - 0.5));
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    this.scene.add(barrel);
    this.decorations.push(barrel);

    // Add metal rings
    const ringGeometry = new THREE.TorusGeometry(0.32, 0.03, 8, 12);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8,
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.position.copy(barrel.position);
    ring1.position.y += 0.2;
    ring1.rotation.x = Math.PI / 2;
    this.scene.add(ring1);
    this.decorations.push(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring2.position.copy(barrel.position);
    ring2.position.y -= 0.2;
    ring2.rotation.x = Math.PI / 2;
    this.scene.add(ring2);
    this.decorations.push(ring2);
  }

  private addPillar(posX: number, posZ: number): void {
    const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(posX + (Math.random() - 0.5), 0.75, posZ + (Math.random() - 0.5));
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.scene.add(pillar);
    this.decorations.push(pillar);

    // Add capital (top decoration)
    const capitalGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.1, 8);
    const capital = new THREE.Mesh(capitalGeometry, pillarMaterial);
    capital.position.copy(pillar.position);
    capital.position.y += 0.8;
    capital.castShadow = true;
    this.scene.add(capital);
    this.decorations.push(capital);
  }

  public checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    // Check collision with any wall
    for (const wall of this.walls) {
      const wallPos = wall.position;
      const halfSize = this.cellSize / 2;

      // AABB collision detection
      const distX = Math.abs(position.x - wallPos.x);
      const distZ = Math.abs(position.z - wallPos.z);

      if (distX < halfSize + radius && distZ < halfSize + radius) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  public getWalls(): THREE.Mesh[] {
    return this.walls;
  }

  public getCellSize(): number {
    return this.cellSize;
  }

  public getMazeSize(): number {
    return this.mazeSize;
  }

  public getGrid(): number[][] {
    return this.grid;
  }

  private addDoors(offsetX: number, offsetZ: number): void {
    // Find corridor positions and add doors (15% chance)
    for (let z = 2; z < this.mazeSize - 2; z++) {
      for (let x = 2; x < this.mazeSize - 2; x++) {
        if (this.grid[z][x] === 0 && Math.random() < 0.15) {
          // Check if this is a horizontal or vertical corridor
          const isHorizontalCorridor =
            this.grid[z][x - 1] === 0 &&
            this.grid[z][x + 1] === 0 &&
            this.grid[z - 1][x] === 1 &&
            this.grid[z + 1][x] === 1;

          const isVerticalCorridor =
            this.grid[z - 1][x] === 0 &&
            this.grid[z + 1][x] === 0 &&
            this.grid[z][x - 1] === 1 &&
            this.grid[z][x + 1] === 1;

          if (isHorizontalCorridor || isVerticalCorridor) {
            const posX = x * this.cellSize - offsetX + this.cellSize / 2;
            const posZ = z * this.cellSize - offsetZ + this.cellSize / 2;
            // Door frame spans along X axis by default
            // Horizontal corridor (runs left-right) needs rotation = 90° to span across
            // Vertical corridor (runs up-down) needs rotation = 0° (no rotation)
            const rotation = isHorizontalCorridor ? Math.PI / 2 : 0;

            const door = new Door(
              this.scene,
              new THREE.Vector3(posX, 0, posZ),
              rotation
            );
            this.doors.push(door);
          }
        }
      }
    }
  }

  public updateDoors(delta: number): void {
    if (!this.doors) return;
    for (const door of this.doors) {
      if (door) {
        door.update(delta);
      }
    }
  }

  public getDoors(): Door[] {
    return this.doors || [];
  }

  public checkDoorCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    if (!this.doors || this.doors.length === 0) {
      return false;
    }
    for (const door of this.doors) {
      if (door && door.checkCollision(position, radius)) {
        return true;
      }
    }
    return false;
  }

  // Get a random walkable position in the maze
  public getRandomWalkablePosition(): THREE.Vector3 {
    let x, z;
    const offsetX = (this.mazeSize * this.cellSize) / 2;
    const offsetZ = (this.mazeSize * this.cellSize) / 2;

    do {
      x = Math.floor(Math.random() * this.mazeSize);
      z = Math.floor(Math.random() * this.mazeSize);
    } while (this.grid[z][x] === 1);

    return new THREE.Vector3(
      x * this.cellSize - offsetX + this.cellSize / 2,
      0,
      z * this.cellSize - offsetZ + this.cellSize / 2
    );
  }

  // Get a safe spawn position (away from doors)
  public getSafeSpawnPosition(): THREE.Vector3 {
    let position: THREE.Vector3;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      position = this.getRandomWalkablePosition();
      attempts++;

      // Check if position is far enough from all doors
      let isSafe = true;
      for (const door of this.doors) {
        const distance = door.getDistanceTo(position);
        if (distance < 5) { // Must be at least 5 units away from any door
          isSafe = false;
          break;
        }
      }

      if (isSafe) {
        return position;
      }
    } while (attempts < maxAttempts);

    // If we can't find a safe position after many attempts, just return a walkable position
    return this.getRandomWalkablePosition();
  }

  public cleanup(): void {
    // Remove all walls
    this.walls.forEach(wall => this.scene.remove(wall));
    this.walls = [];

    // Remove all doors
    this.doors.forEach(door => door.remove());
    this.doors = [];

    // Remove all decorations (torches, barrels, pillars)
    this.decorations.forEach(decoration => this.scene.remove(decoration));
    this.decorations = [];

    // Remove all lights
    this.lights.forEach(light => this.scene.remove(light));
    this.lights = [];
  }
}
