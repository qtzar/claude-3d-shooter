import * as THREE from 'three';
import { WeaponType, WEAPONS } from './weapon';

export class WeaponPickup {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private weaponType: WeaponType;
  private rotationSpeed: number = 2;
  private bobSpeed: number = 2;
  private bobAmount: number = 0.3;
  private initialY: number;
  private time: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, weaponType: WeaponType) {
    this.scene = scene;
    this.weaponType = weaponType;
    this.initialY = position.y;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);

    // Create weapon visual based on type
    this.createWeaponModel();

    // Add a glow ring
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: this.getWeaponColor(),
      emissive: this.getWeaponColor(),
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.mesh.add(ring);

    scene.add(this.mesh);
  }

  private getWeaponColor(): number {
    switch (this.weaponType) {
      case WeaponType.PISTOL: return 0x888888; // Grey
      case WeaponType.SHOTGUN: return 0x8B4513; // Brown
      case WeaponType.RIFLE: return 0x4169E1; // Blue
      case WeaponType.SNIPER: return 0x9400D3; // Purple
      case WeaponType.ROCKET: return 0xFF4500; // Red-Orange
      default: return 0xFFFFFF;
    }
  }

  private createWeaponModel(): void {
    const color = this.getWeaponColor();
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.7
    });

    // Create a simple weapon representation
    switch (this.weaponType) {
      case WeaponType.PISTOL:
        // Small handgun shape
        const pistolHandle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.15), material);
        pistolHandle.position.y = -0.1;
        this.mesh.add(pistolHandle);

        const pistolBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.15), material);
        pistolBarrel.position.y = 0.15;
        this.mesh.add(pistolBarrel);
        break;

      case WeaponType.SHOTGUN:
        // Shotgun with long barrel
        const shotgunStock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), material);
        shotgunStock.position.y = -0.2;
        this.mesh.add(shotgunStock);

        const shotgunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), material);
        shotgunBarrel.position.y = 0.2;
        this.mesh.add(shotgunBarrel);
        break;

      case WeaponType.RIFLE:
        // Rifle with magazine
        const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.15), material);
        this.mesh.add(rifleBody);

        const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.12), material);
        rifleMag.position.y = -0.15;
        this.mesh.add(rifleMag);
        break;

      case WeaponType.SNIPER:
        // Sniper with scope
        const sniperBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.12), material);
        this.mesh.add(sniperBody);

        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), material);
        scope.rotation.z = Math.PI / 2;
        scope.position.y = 0.2;
        scope.position.z = 0.1;
        this.mesh.add(scope);
        break;

      case WeaponType.ROCKET:
        // Rocket launcher - tube shape
        const rocketTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), material);
        this.mesh.add(rocketTube);

        const rocketHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.2), material);
        rocketHandle.position.y = -0.15;
        this.mesh.add(rocketHandle);
        break;
    }
  }

  public update(delta: number): void {
    this.time += delta;

    // Rotate the pickup
    this.mesh.rotation.y += this.rotationSpeed * delta;

    // Bob up and down
    this.mesh.position.y = this.initialY + Math.sin(this.time * this.bobSpeed) * this.bobAmount;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public getWeaponType(): WeaponType {
    return this.weaponType;
  }

  public destroy(): void {
    this.scene.remove(this.mesh);
  }
}
