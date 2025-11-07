import { WeaponInventory, WeaponType, WEAPONS } from './weapon';
import * as THREE from 'three';
import { Maze } from './maze';

export class UI {
  private healthElement: HTMLElement;
  private healthBarElement: HTMLElement;
  private ammoElement: HTMLElement;
  private scoreElement: HTMLElement;
  private weaponNameElement: HTMLElement;
  private weaponsContainer: HTMLElement;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private score: number = 0;

  constructor() {
    this.healthElement = document.getElementById('health')!;
    this.healthBarElement = document.getElementById('health-bar')!;
    this.ammoElement = document.getElementById('ammo')!;
    this.scoreElement = document.getElementById('score')!;
    this.weaponNameElement = document.getElementById('weapon-name')!;
    this.weaponsContainer = document.getElementById('weapons')!;
    this.minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    this.initializeWeaponSlots();
  }

  private initializeWeaponSlots(): void {
    // Create weapon slots for all 5 weapons
    for (let i = 0; i < 5; i++) {
      const weaponType = i as WeaponType;
      const weaponData = WEAPONS[weaponType];

      const slot = document.createElement('div');
      slot.className = 'weapon-slot locked';
      slot.id = `weapon-${i}`;

      slot.innerHTML = `
        <div class="weapon-number">${i + 1}</div>
        <div class="weapon-name">${weaponData.name}</div>
        <div class="weapon-ammo">---</div>
      `;

      this.weaponsContainer.appendChild(slot);
    }
  }

  public updateWeapons(inventory: WeaponInventory): void {
    const currentWeapon = inventory.getCurrentWeapon();
    const ownedWeapons = inventory.getOwnedWeapons();

    // Update all weapon slots
    for (let i = 0; i < 5; i++) {
      const weaponType = i as WeaponType;
      const slot = document.getElementById(`weapon-${i}`)!;
      const ammoElement = slot.querySelector('.weapon-ammo')!;

      const isOwned = ownedWeapons.includes(weaponType);
      const isActive = weaponType === currentWeapon;

      // Update classes
      slot.classList.toggle('locked', !isOwned);
      slot.classList.toggle('active', isActive);

      // Update ammo display
      if (isOwned) {
        const ammo = inventory.getAmmo(weaponType);
        ammoElement.textContent = ammo.toString();
      } else {
        ammoElement.textContent = '---';
      }
    }

    // Update top-left weapon info
    const weaponData = inventory.getCurrentWeaponData();
    this.weaponNameElement.textContent = weaponData.name;
    this.ammoElement.textContent = `${inventory.getCurrentAmmo()}/${weaponData.maxAmmo}`;
  }

  public updateHealth(health: number): void {
    const clampedHealth = Math.max(0, health);
    this.healthElement.textContent = clampedHealth.toString();

    // Update health bar width (percentage of max health 100)
    const healthPercentage = (clampedHealth / 100) * 100;
    this.healthBarElement.style.width = `${healthPercentage}%`;

    // Update health bar color based on percentage
    // Remove all color classes first
    this.healthBarElement.classList.remove('low', 'medium', 'high');

    // Add appropriate color class
    if (healthPercentage < 20) {
      this.healthBarElement.classList.add('low'); // Red
    } else if (healthPercentage < 50) {
      this.healthBarElement.classList.add('medium'); // Yellow
    } else {
      this.healthBarElement.classList.add('high'); // Green
    }
  }

  public addScore(points: number): void {
    this.score += points;
    this.scoreElement.textContent = this.score.toString();
  }

  public getScore(): number {
    return this.score;
  }

  public updateMinimap(playerPos: THREE.Vector3, playerYaw: number, enemyPositions: THREE.Vector3[], maze: Maze): void {
    const ctx = this.minimapCtx;
    const size = 150;
    const center = size / 2;
    const scale = 3; // pixels per game unit
    const range = 25; // units to show around player

    // Clear with circular clip
    ctx.save();
    ctx.clearRect(0, 0, size, size);

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = 'rgba(20, 40, 20, 0.8)';
    ctx.fillRect(0, 0, size, size);

    // Draw maze walls
    const grid = maze.getGrid();
    const cellSize = maze.getCellSize();
    const mazeSize = maze.getMazeSize();
    const mazeOffset = (mazeSize * cellSize) / 2;

    ctx.fillStyle = 'rgba(80, 80, 80, 0.8)';
    for (let z = 0; z < mazeSize; z++) {
      for (let x = 0; x < mazeSize; x++) {
        if (grid[z][x] === 1) { // 1 = wall
          // Calculate world position of this cell
          const worldX = x * cellSize - mazeOffset + cellSize / 2;
          const worldZ = z * cellSize - mazeOffset + cellSize / 2;

          // Calculate relative position to player
          const relX = worldX - playerPos.x;
          const relZ = worldZ - playerPos.z;

          // Check if cell is within range
          if (Math.abs(relX) > range + cellSize || Math.abs(relZ) > range + cellSize) continue;

          // Rotate relative to player's yaw (so "up" is forward direction)
          const cos = Math.cos(playerYaw);
          const sin = Math.sin(playerYaw);
          const rotX = relX * cos - relZ * sin;
          const rotZ = relX * sin + relZ * cos;

          // Convert to canvas coordinates
          const canvasX = center + rotX * scale;
          const canvasY = center + rotZ * scale;

          // Draw wall cell
          const cellPixelSize = cellSize * scale;
          ctx.fillRect(
            canvasX - cellPixelSize / 2,
            canvasY - cellPixelSize / 2,
            cellPixelSize,
            cellPixelSize
          );
        }
      }
    }

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    for (const enemyPos of enemyPositions) {
      // Calculate relative position to player
      const relX = enemyPos.x - playerPos.x;
      const relZ = enemyPos.z - playerPos.z;

      // Check if enemy is within range
      if (Math.abs(relX) > range || Math.abs(relZ) > range) continue;

      // Rotate relative to player's yaw (so "up" is forward direction)
      const cos = Math.cos(playerYaw);
      const sin = Math.sin(playerYaw);
      const rotX = relX * cos - relZ * sin;
      const rotZ = relX * sin + relZ * cos;

      // Convert to canvas coordinates
      const canvasX = center + rotX * scale;
      const canvasY = center + rotZ * scale;

      // Draw enemy dot
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (cyan triangle pointing forward)
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(center, center - 6); // Forward point
    ctx.lineTo(center - 4, center + 4); // Back left
    ctx.lineTo(center + 4, center + 4); // Back right
    ctx.closePath();
    ctx.fill();

    // Draw center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center, center, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
