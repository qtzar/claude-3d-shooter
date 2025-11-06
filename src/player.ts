import * as THREE from 'three';
import { InputHandler } from './input';
import { Maze } from './maze';
import { WeaponInventory, WeaponType } from './weapon';

export class Player {
  private camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3;
  private position: THREE.Vector3;
  private health: number = 100;
  private maxHealth: number = 100;
  private weapons: WeaponInventory;
  private moveSpeed: number = 5;
  private mouseSensitivity: number = 0.002;
  private collisionRadius: number = 0.5;

  private yaw: number = 0;
  private pitch: number = 0;
  private maze: Maze;

  constructor(camera: THREE.PerspectiveCamera, maze: Maze) {
    this.camera = camera;
    this.maze = maze;
    this.velocity = new THREE.Vector3();
    this.weapons = new WeaponInventory();

    // Spawn in a walkable position
    const spawnPos = maze.getRandomWalkablePosition();
    this.position = new THREE.Vector3(spawnPos.x, 1.6, spawnPos.z);
    this.camera.position.copy(this.position);
  }

  public update(delta: number, input: InputHandler): void {
    // Handle mouse movement
    this.yaw -= input.mouseDelta.x * this.mouseSensitivity;
    this.pitch -= input.mouseDelta.y * this.mouseSensitivity;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

    input.mouseDelta.set(0, 0);

    // Update camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Handle movement
    const moveDirection = new THREE.Vector3();

    if (input.keys.forward) moveDirection.z -= 1;
    if (input.keys.backward) moveDirection.z += 1;
    if (input.keys.left) moveDirection.x -= 1;
    if (input.keys.right) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      // Apply camera rotation to movement direction
      moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.velocity.x = moveDirection.x * this.moveSpeed;
      this.velocity.z = moveDirection.z * this.moveSpeed;

      // Calculate new position
      const newPosition = this.position.clone();
      newPosition.x += this.velocity.x * delta;
      newPosition.z += this.velocity.z * delta;

      // Check collision before moving (walls and doors)
      const wallCollision = this.maze.checkCollision(newPosition, this.collisionRadius);
      const doorCollision = this.maze.checkDoorCollision(newPosition, this.collisionRadius);

      if (!wallCollision && !doorCollision) {
        this.position.copy(newPosition);
      } else {
        // Try sliding along walls - check X and Z separately
        const newPosX = this.position.clone();
        newPosX.x += this.velocity.x * delta;
        if (!this.maze.checkCollision(newPosX, this.collisionRadius) &&
            !this.maze.checkDoorCollision(newPosX, this.collisionRadius)) {
          this.position.x = newPosX.x;
        }

        const newPosZ = this.position.clone();
        newPosZ.z += this.velocity.z * delta;
        if (!this.maze.checkCollision(newPosZ, this.collisionRadius) &&
            !this.maze.checkDoorCollision(newPosZ, this.collisionRadius)) {
          this.position.z = newPosZ.z;
        }
      }

      // Update camera position
      this.camera.position.copy(this.position);
    }
  }

  public canShoot(): boolean {
    return this.weapons.canShoot();
  }

  public shoot(): number {
    return this.weapons.shoot();
  }

  public reload(): void {
    this.weapons.reload();
  }

  public switchWeapon(type: WeaponType): boolean {
    return this.weapons.switchWeapon(type);
  }

  public addWeapon(type: WeaponType, ammo: number): void {
    this.weapons.addWeapon(type, ammo);
  }

  public getWeaponInventory(): WeaponInventory {
    return this.weapons;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public getHealth(): number {
    return this.health;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }
}
