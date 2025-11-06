import * as THREE from 'three';
import { Player } from './player';
import { Enemy } from './enemy';
import { InputHandler } from './input';
import { UI } from './ui';
import { AmmoPickup } from './ammo-pickup';
import { HealthPickup } from './health-pickup';
import { Maze } from './maze';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: Player;
  private enemies: Enemy[] = [];
  private ammoPickups: AmmoPickup[] = [];
  private healthPickups: HealthPickup[] = [];
  private inputHandler: InputHandler;
  private ui: UI;
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private raycaster: THREE.Raycaster;
  private canvas: HTMLCanvasElement;
  private ammoDropChance: number = 0.3; // 30% chance to drop ammo when enemy dies
  private healthDropChance: number = 0.2; // 20% chance to drop health when enemy dies
  private maze: Maze;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

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

    // Setup scene
    this.setupLights();
    this.setupEnvironment();
    this.spawnEnemies();
  }

  private setupLights(): void {
    // Ambient light (darker for dungeon atmosphere)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Directional light (dim overhead light)
    const directionalLight = new THREE.DirectionalLight(0x888888, 0.4);
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
      const enemy = new Enemy(this.scene, this.maze);
      const spawnPos = this.maze.getRandomWalkablePosition();
      enemy.setPosition(spawnPos.x, 0, spawnPos.z);
      this.enemies.push(enemy);
    }
  }

  public start(): void {
    this.isRunning = true;
    this.inputHandler.lockPointer();
    this.animate();
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Update player
    this.player.update(delta, this.inputHandler);

    // Handle shooting
    if (this.inputHandler.isMouseDown && this.player.canShoot()) {
      this.shoot();
      this.player.shoot();
    }

    // Handle reload
    if (this.inputHandler.isReloading) {
      this.player.reload();
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
        this.enemies.splice(i, 1);
        this.ui.addScore(100);

        // Chance to drop ammo
        if (Math.random() < this.ammoDropChance) {
          this.spawnAmmoPickup(enemyPosition);
        }

        // Chance to drop health
        if (Math.random() < this.healthDropChance) {
          this.spawnHealthPickup(enemyPosition);
        }

        // Spawn new enemy
        const newEnemy = new Enemy(this.scene, this.maze);
        const spawnPos = this.maze.getRandomWalkablePosition();
        newEnemy.setPosition(spawnPos.x, 0, spawnPos.z);
        this.enemies.push(newEnemy);
      } else {
        // Check if enemy hits player
        const distance = enemy.getPosition().distanceTo(this.player.getPosition());
        if (distance < 2 && enemy.canAttack()) {
          this.player.takeDamage(10);
          this.ui.updateHealth(this.player.getHealth());
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
        this.player.addAmmo(30);
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
        pickup.destroy();
        this.healthPickups.splice(i, 1);
      }
    }

    // Update UI
    this.ui.updateAmmo(this.player.getAmmo(), this.player.getMaxAmmo());

    this.renderer.render(this.scene, this.camera);
  };

  private shoot(): void {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.enemies.map(e => e.getMesh()),
      false
    );

    if (intersects.length > 0) {
      const hitEnemy = this.enemies.find(e => e.getMesh() === intersects[0].object);
      if (hitEnemy) {
        hitEnemy.takeDamage(34);
      }
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
