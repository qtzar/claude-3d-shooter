import * as THREE from 'three';
import { Player } from './player';
import { Enemy, EnemyType } from './enemy';
import { InputHandler } from './input';
import { UI } from './ui';
import { AmmoPickup } from './ammo-pickup';
import { HealthPickup } from './health-pickup';
import { Maze } from './maze';
import { WeaponPickup } from './weapon-pickup';
import { WeaponType } from './weapon';
import { SoundManager } from './sound';
import { KeyPickup } from './key-pickup';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: Player;
  private enemies: Enemy[] = [];
  private ammoPickups: AmmoPickup[] = [];
  private healthPickups: HealthPickup[] = [];
  private weaponPickups: WeaponPickup[] = [];
  private inputHandler: InputHandler;
  private ui: UI;
  private soundManager: SoundManager;
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private raycaster: THREE.Raycaster;
  private canvas: HTMLCanvasElement;
  private ammoDropChance: number = 0.3; // 30% chance to drop ammo when enemy dies
  private healthDropChance: number = 0.2; // 20% chance to drop health when enemy dies
  private maze: Maze;
  private keyPickup: KeyPickup | null = null;
  private level: number = 1;
  private difficultyMultiplier: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 15, 60);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.y = 1.6; // Eye level

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize game objects
    this.maze = new Maze(this.scene);
    this.player = new Player(this.camera, this.maze);
    this.inputHandler = new InputHandler(this.canvas);
    this.ui = new UI();
    this.soundManager = new SoundManager();

    // Setup scene
    this.setupLights();
    this.setupEnvironment();
    this.spawnEnemies();
    this.spawnAmmoCaches();
    this.spawnKey();
    this.ui.updateLevel(this.level);
  }

  private setupLights(): void {
    // Ambient light (dim for atmosphere, torches will provide main lighting)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Directional light (dim overhead light)
    const directionalLight = new THREE.DirectionalLight(0x888888, 0.5);
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupEnvironment(): void {
    // Ground with texture
    const groundSize = this.maze.getMazeSize() * this.maze.getCellSize() + 20;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);

    // Create ground texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirt/stone color
    ctx.fillStyle = '#3a3a2a';
    ctx.fillRect(0, 0, 512, 512);

    // Add dirt variation
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 3;
      const brightness = Math.floor(Math.random() * 40) - 20;
      const r = 58 + brightness;
      const g = 58 + brightness;
      const b = 42 + brightness;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, size, size);
    }

    // Add darker patches
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 40 + 10;
      ctx.fillStyle = 'rgba(20, 20, 15, 0.3)';
      ctx.fillRect(x, y, size, size);
    }

    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);

    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private spawnEnemies(): void {
    for (let i = 0; i < 5; i++) {
      const enemy = this.spawnRandomEnemy();
      this.enemies.push(enemy);
    }
  }

  private spawnRandomEnemy(): Enemy {
    // Spawn probabilities: 50% basic, 35% medium, 15% hard
    const rand = Math.random();
    let type: EnemyType;

    if (rand < 0.5) {
      type = EnemyType.BASIC;
    } else if (rand < 0.85) {
      type = EnemyType.MEDIUM;
    } else {
      type = EnemyType.HARD;
    }

    const enemy = new Enemy(this.scene, this.maze, type, this.difficultyMultiplier);

    // Find a safe spawn position (away from doors and player)
    let spawnPos: THREE.Vector3;
    let attempts = 0;
    const maxAttempts = 30;

    do {
      spawnPos = this.maze.getSafeSpawnPosition();
      const distanceToPlayer = spawnPos.distanceTo(this.player.getPosition());
      attempts++;

      // Make sure enemy spawns at least 10 units away from player
      if (distanceToPlayer > 10) {
        break;
      }
    } while (attempts < maxAttempts);

    enemy.setPosition(spawnPos.x, 0, spawnPos.z);
    return enemy;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.inputHandler.lockPointer();
    await this.soundManager.resume(); // Resume audio context
    this.soundManager.startBackgroundMusic();
    this.animate();
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Update player
    this.player.update(delta, this.inputHandler);

    // Handle weapon switching
    if (this.inputHandler.weaponSwitch !== -1) {
      this.player.switchWeapon(this.inputHandler.weaponSwitch as WeaponType);
      this.inputHandler.weaponSwitch = -1;
    }

    // Handle shooting
    if (this.inputHandler.isMouseDown && this.player.canShoot()) {
      this.shoot();
      const damage = this.player.shoot();

      // Play weapon sound based on current weapon
      if (damage > 0) {
        const weaponType = this.player.getWeaponInventory().getCurrentWeapon();
        switch (weaponType) {
          case WeaponType.PISTOL:
            this.soundManager.playPistolShoot();
            break;
          case WeaponType.SHOTGUN:
            this.soundManager.playShotgunShoot();
            break;
          case WeaponType.RIFLE:
            this.soundManager.playRifleShoot();
            break;
          case WeaponType.SNIPER:
            this.soundManager.playSniperShoot();
            break;
          case WeaponType.ROCKET:
            this.soundManager.playRocketShoot();
            break;
        }
      }
    }

    // Handle reload
    if (this.inputHandler.isReloading) {
      this.player.reload();
      this.soundManager.playReload();
      this.inputHandler.isReloading = false;
    }

    // Handle door interaction
    if (this.inputHandler.isInteracting) {
      this.interactWithNearbyDoor();
      this.inputHandler.isInteracting = false;
    }

    // Update doors
    this.maze.updateDoors(delta);

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta, this.player.getPosition());

      if (!enemy.isAlive()) {
        const enemyPosition = enemy.getPosition();
        const enemyType = enemy.getType();
        this.enemies.splice(i, 1);

        // Award points based on enemy type
        const score = enemyType === EnemyType.BASIC ? 50 :
                     enemyType === EnemyType.MEDIUM ? 100 : 200;
        this.ui.addScore(score);

        // Play death sound
        this.soundManager.playEnemyDeath();

        // Always drop a random weapon
        this.spawnWeaponPickup(enemyPosition);

        // Chance to drop ammo
        if (Math.random() < this.ammoDropChance) {
          this.spawnAmmoPickup(enemyPosition);
        }

        // Chance to drop health
        if (Math.random() < this.healthDropChance) {
          this.spawnHealthPickup(enemyPosition);
        }

        // Spawn new enemy
        const newEnemy = this.spawnRandomEnemy();
        this.enemies.push(newEnemy);
      } else {
        // Check if enemy hits player
        const distance = enemy.getPosition().distanceTo(this.player.getPosition());
        if (distance < 2 && enemy.canAttack()) {
          this.player.takeDamage(10);
          this.ui.updateHealth(this.player.getHealth());
          this.soundManager.playPlayerHit();
          enemy.attack();

          if (this.player.getHealth() <= 0) {
            this.gameOver();
          }
        }
      }
    }

    // Update ammo pickups
    for (let i = this.ammoPickups.length - 1; i >= 0; i--) {
      const pickup = this.ammoPickups[i];
      pickup.update(delta);

      // Check if player collected the pickup
      const distance = pickup.getPosition().distanceTo(this.player.getPosition());
      if (distance < 1.5) {
        // Add ammo to current weapon
        const inventory = this.player.getWeaponInventory();
        const currentWeapon = inventory.getCurrentWeapon();
        inventory.addAmmo(currentWeapon, 30);
        this.soundManager.playPickup();
        pickup.destroy();
        this.ammoPickups.splice(i, 1);
      }
    }

    // Update health pickups
    for (let i = this.healthPickups.length - 1; i >= 0; i--) {
      const pickup = this.healthPickups[i];
      pickup.update(delta);

      // Check if player collected the pickup
      const distance = pickup.getPosition().distanceTo(this.player.getPosition());
      if (distance < 1.5) {
        this.player.heal(50);
        this.ui.updateHealth(this.player.getHealth());
        this.soundManager.playPickup();
        pickup.destroy();
        this.healthPickups.splice(i, 1);
      }
    }

    // Update weapon pickups
    for (let i = this.weaponPickups.length - 1; i >= 0; i--) {
      const pickup = this.weaponPickups[i];
      pickup.update(delta);

      // Check if player collected the pickup
      const distance = pickup.getPosition().distanceTo(this.player.getPosition());
      if (distance < 1.5) {
        const weaponType = pickup.getWeaponType();
        const inventory = this.player.getWeaponInventory();

        // If player already has the weapon, add ammo; otherwise add the weapon
        if (inventory.getOwnedWeapons().includes(weaponType)) {
          const weaponData = inventory.getCurrentWeaponData();
          inventory.addAmmo(weaponType, weaponData.maxAmmo);
        } else {
          const weaponData = inventory.getCurrentWeaponData();
          this.player.addWeapon(weaponType, weaponData.maxAmmo);
        }

        this.soundManager.playPickup();
        pickup.destroy();
        this.weaponPickups.splice(i, 1);
      }
    }

    // Check key collision
    if (this.keyPickup) {
      this.keyPickup.update(delta);
      const distance = this.keyPickup.getPosition().distanceTo(this.player.getPosition());
      if (distance < 1.5) {
        this.soundManager.playPickup();
        this.nextLevel();
      }
    }

    // Update UI
    this.ui.updateWeapons(this.player.getWeaponInventory());

    // Update minimap
    const enemyPositions = this.enemies.map(e => e.getPosition());
    const keyPos = this.keyPickup?.getPosition();
    this.ui.updateMinimap(this.player.getPosition(), this.player.getYaw(), enemyPositions, this.maze, keyPos);

    this.renderer.render(this.scene, this.camera);
  };

  private shoot(): void {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // Check all objects in the scene that could be hit
    const walls = this.maze.getWalls();
    const doors = this.maze.getDoors().map(d => d.getMesh());
    const enemies = this.enemies.map(e => e.getMesh());
    const allObjects = [...walls, ...doors, ...enemies];

    const intersects = this.raycaster.intersectObjects(allObjects, false);

    if (intersects.length > 0) {
      // Check what we hit first
      const hitObject = intersects[0].object;

      // Only damage enemy if it's the first thing we hit (not blocked by wall/door)
      const hitEnemy = this.enemies.find(e => e.getMesh() === hitObject);
      if (hitEnemy) {
        // Get damage from current weapon
        const damage = this.player.getWeaponInventory().getCurrentWeaponData().damage;
        hitEnemy.takeDamage(damage);
        this.soundManager.playEnemyHit();
      }
      // If we hit a wall or door first, bullet is blocked (no damage)
    }
  }

  private spawnAmmoPickup(position: THREE.Vector3): void {
    const pickup = new AmmoPickup(this.scene, position);
    this.ammoPickups.push(pickup);
  }

  private spawnHealthPickup(position: THREE.Vector3): void {
    const pickup = new HealthPickup(this.scene, position);
    this.healthPickups.push(pickup);
  }

  private spawnWeaponPickup(position: THREE.Vector3): void {
    // Randomly select a weapon type
    const weaponTypes = [
      WeaponType.PISTOL,
      WeaponType.SHOTGUN,
      WeaponType.RIFLE,
      WeaponType.SNIPER,
      WeaponType.ROCKET
    ];
    const randomWeapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const pickup = new WeaponPickup(this.scene, position, randomWeapon);
    this.weaponPickups.push(pickup);
  }

  private spawnAmmoCaches(): void {
    // Spawn 8-12 random ammo pickups throughout the maze
    const ammoCount = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < ammoCount; i++) {
      const position = this.maze.getRandomWalkablePosition();
      position.y = 0.5; // Slightly above ground
      this.spawnAmmoPickup(position);
    }
  }

  private spawnKey(): void {
    // Spawn key far from player spawn position
    const playerPos = this.player.getPosition();
    let keyPos: THREE.Vector3;
    let maxAttempts = 50;
    let bestPos: THREE.Vector3 | null = null;
    let maxDistance = 0;

    // Find the furthest walkable position from player
    for (let i = 0; i < maxAttempts; i++) {
      const pos = this.maze.getRandomWalkablePosition();
      const distance = pos.distanceTo(playerPos);

      if (distance > maxDistance) {
        maxDistance = distance;
        bestPos = pos;
      }
    }

    keyPos = bestPos || this.maze.getRandomWalkablePosition();
    keyPos.y = 1.5; // Float above ground
    this.keyPickup = new KeyPickup(this.scene, keyPos);
  }

  private nextLevel(): void {
    // Increment level
    this.level++;
    this.difficultyMultiplier = 1.0 + (this.level - 1) * 0.1;

    // Clear current game state
    this.enemies.forEach(enemy => enemy.isAlive() && this.scene.remove(enemy.getMesh()));
    this.enemies = [];
    this.ammoPickups.forEach(pickup => pickup.remove());
    this.ammoPickups = [];
    this.healthPickups.forEach(pickup => pickup.remove());
    this.healthPickups = [];
    this.weaponPickups.forEach(pickup => pickup.remove());
    this.weaponPickups = [];
    if (this.keyPickup) {
      this.keyPickup.remove();
      this.keyPickup = null;
    }

    // Regenerate maze
    this.scene.remove(this.maze.getWalls()[0]?.parent || this.maze.getWalls()[0]);
    this.maze.getWalls().forEach(wall => this.scene.remove(wall));
    this.maze.getDoors().forEach(door => door.remove());

    this.maze = new Maze(this.scene);

    // Respawn player at new safe position
    const newPlayerPos = this.maze.getSafeSpawnPosition();
    this.player.setPosition(newPlayerPos.x, newPlayerPos.z);

    // Respawn enemies and pickups
    this.spawnEnemies();
    this.spawnAmmoCaches();
    this.spawnKey();

    // Update UI
    this.ui.updateLevel(this.level);
    this.soundManager.playPickup(); // Play sound for level completion
  }

  private interactWithNearbyDoor(): void {
    const playerPos = this.player.getPosition();
    const doors = this.maze.getDoors();

    // Find closest door within interaction range
    let closestDoor = null;
    let closestDistance = 3; // Interaction range

    for (const door of doors) {
      const distance = door.getDistanceTo(playerPos);
      if (distance < closestDistance) {
        closestDoor = door;
        closestDistance = distance;
      }
    }

    if (closestDoor) {
      closestDoor.toggle();
      this.soundManager.playDoorOpen();
    }
  }

  private gameOver(): void {
    this.isRunning = false;
    alert(`Game Over! Final Score: ${this.ui.getScore()}`);
    window.location.reload();
  }

  public onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
