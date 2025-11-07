import * as THREE from 'three';
import { Maze } from './maze';

export enum EnemyType {
  BASIC = 0,   // 3 hits with rifle (60 health)
  MEDIUM = 1,  // 5 hits with rifle (100 health)
  HARD = 2     // 10 hits with rifle (200 health)
}

interface EnemyConfig {
  health: number;
  speed: number;
  color: number;
  scale: number;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.BASIC]: {
    health: 60,
    speed: 2,
    color: 0x808080, // Grey
    scale: 0.9
  },
  [EnemyType.MEDIUM]: {
    health: 100,
    speed: 2.5,
    color: 0xff8800, // Orange
    scale: 1.0
  },
  [EnemyType.HARD]: {
    health: 200,
    speed: 3,
    color: 0x880000, // Dark red
    scale: 1.2
  }
};

export class Enemy {
  private mesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private attackCooldown: number = 1; // seconds
  private lastAttackTime: number = 0;
  private scene: THREE.Scene;
  private maze: Maze;
  private collisionRadius: number = 0.5;
  private visionRange: number = 20; // How far enemy can see
  private raycaster: THREE.Raycaster;
  private canSeePlayer: boolean = false;
  private lastKnownPlayerPosition: THREE.Vector3 | null = null;
  private patrolDirection: THREE.Vector3;
  private patrolChangeTimer: number = 0;
  private enemyType: EnemyType;
  private baseColor: number;

  constructor(scene: THREE.Scene, maze: Maze, type: EnemyType = EnemyType.MEDIUM, difficultyMultiplier: number = 1.0) {
    this.scene = scene;
    this.maze = maze;
    this.raycaster = new THREE.Raycaster();
    this.enemyType = type;

    // Get config for this enemy type and apply difficulty scaling
    const config = ENEMY_CONFIGS[type];
    this.health = Math.floor(config.health * difficultyMultiplier);
    this.maxHealth = Math.floor(config.health * difficultyMultiplier);
    this.speed = config.speed * Math.min(difficultyMultiplier, 1.5); // Cap speed at 1.5x
    this.baseColor = config.color;

    // Initialize random patrol direction
    this.patrolDirection = new THREE.Vector3(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5
    ).normalize();

    // Create enemy mesh (simple colored cube/capsule)
    const geometry = new THREE.CapsuleGeometry(0.5 * config.scale, 1 * config.scale, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.7,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add a simple "head" to make it look more character-like
    // Head gets its own material so we can change its color independently
    const headGeometry = new THREE.SphereGeometry(0.3 * config.scale, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.7,
      metalness: 0.3
    });
    this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
    this.headMesh.position.y = 1 * config.scale;
    this.mesh.add(this.headMesh);

    scene.add(this.mesh);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y + 1, z);
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    // Check line of sight to player
    this.checkLineOfSight(playerPosition);

    let direction = new THREE.Vector3();
    let targetPosition: THREE.Vector3;

    if (this.canSeePlayer) {
      // Enemy can see player - chase them
      this.lastKnownPlayerPosition = playerPosition.clone();
      direction.subVectors(playerPosition, this.mesh.position);
      direction.y = 0;
      direction.normalize();
      targetPosition = playerPosition;

      // Change head emissive to indicate alert state (keep body at base color)
      const headMaterial = this.headMesh.material as THREE.MeshStandardMaterial;
      headMaterial.emissive.setHex(0xff0000);
      headMaterial.emissiveIntensity = 0.5;
    } else if (this.lastKnownPlayerPosition) {
      // Move to last known position
      direction.subVectors(this.lastKnownPlayerPosition, this.mesh.position);
      direction.y = 0;
      const distanceToLastKnown = direction.length();
      direction.normalize();

      // If reached last known position, forget it and start patrolling
      if (distanceToLastKnown < 1) {
        this.lastKnownPlayerPosition = null;
      }
      targetPosition = this.lastKnownPlayerPosition;

      // Yellow tint for searching (only head)
      const headMaterial = this.headMesh.material as THREE.MeshStandardMaterial;
      headMaterial.emissive.setHex(0xffaa00);
      headMaterial.emissiveIntensity = 0.3;
    } else {
      // Patrol behavior
      this.patrolChangeTimer += delta;

      // Change direction every 3 seconds or when hitting a wall
      if (this.patrolChangeTimer > 3) {
        this.patrolDirection = new THREE.Vector3(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize();
        this.patrolChangeTimer = 0;
      }

      direction.copy(this.patrolDirection);
      targetPosition = this.mesh.position.clone().add(direction);

      // Reset head color for patrol state
      const headMaterial = this.headMesh.material as THREE.MeshStandardMaterial;
      headMaterial.emissive.setHex(0x000000);
      headMaterial.emissiveIntensity = 0;
    }

    // Calculate new position
    const moveSpeed = this.canSeePlayer ? this.speed : this.speed * 0.5; // Slower when patrolling
    const newPosition = this.mesh.position.clone();
    newPosition.x += direction.x * moveSpeed * delta;
    newPosition.z += direction.z * moveSpeed * delta;

    // Check collision before moving (walls and closed doors)
    const wallCollision = this.maze.checkCollision(newPosition, this.collisionRadius);
    const doorCollision = this.maze.checkDoorCollision(newPosition, this.collisionRadius);

    if (!wallCollision && !doorCollision) {
      this.mesh.position.copy(newPosition);
    } else {
      // Hit a wall while patrolling - change direction
      if (!this.canSeePlayer && !this.lastKnownPlayerPosition) {
        this.patrolDirection = new THREE.Vector3(
          Math.random() - 0.5,
          0,
          Math.random() - 0.5
        ).normalize();
        this.patrolChangeTimer = 0;
      } else {
        // Try sliding along walls when chasing
        const newPosX = this.mesh.position.clone();
        newPosX.x += direction.x * moveSpeed * delta;
        if (!this.maze.checkCollision(newPosX, this.collisionRadius) &&
            !this.maze.checkDoorCollision(newPosX, this.collisionRadius)) {
          this.mesh.position.x = newPosX.x;
        }

        const newPosZ = this.mesh.position.clone();
        newPosZ.z += direction.z * moveSpeed * delta;
        if (!this.maze.checkCollision(newPosZ, this.collisionRadius) &&
            !this.maze.checkDoorCollision(newPosZ, this.collisionRadius)) {
          this.mesh.position.z = newPosZ.z;
        }
      }
    }

    // Make enemy look at target
    this.mesh.lookAt(targetPosition);
  }

  private checkLineOfSight(playerPosition: THREE.Vector3): void {
    const enemyPosition = this.mesh.position.clone();
    enemyPosition.y = 1; // Eye level

    const playerPosAdjusted = playerPosition.clone();
    playerPosAdjusted.y = 1.6; // Player eye level

    // Check distance first
    const distance = enemyPosition.distanceTo(playerPosAdjusted);
    if (distance > this.visionRange) {
      this.canSeePlayer = false;
      return;
    }

    // Raycast to check for walls blocking view
    const direction = new THREE.Vector3();
    direction.subVectors(playerPosAdjusted, enemyPosition).normalize();

    this.raycaster.set(enemyPosition, direction);
    this.raycaster.far = distance;

    const intersects = this.raycaster.intersectObjects(this.maze.getWalls(), false);

    // If any wall is between enemy and player, can't see
    this.canSeePlayer = intersects.length === 0;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);

    // Visual feedback when hit (flash head red briefly)
    const headMaterial = this.headMesh.material as THREE.MeshStandardMaterial;
    headMaterial.emissive.setHex(0xff0000);
    headMaterial.emissiveIntensity = 0.8;

    setTimeout(() => {
      headMaterial.emissive.setHex(0x000000);
      headMaterial.emissiveIntensity = 0;
    }, 100);

    if (this.health <= 0) {
      this.die();
    }
  }

  public canAttack(): boolean {
    const currentTime = performance.now() / 1000;
    return (currentTime - this.lastAttackTime) >= this.attackCooldown;
  }

  public attack(): void {
    this.lastAttackTime = performance.now() / 1000;
  }

  private die(): void {
    this.scene.remove(this.mesh);
  }

  public isAlive(): boolean {
    return this.health > 0;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getType(): EnemyType {
    return this.enemyType;
  }
}
