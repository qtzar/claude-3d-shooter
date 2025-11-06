import * as THREE from 'three';

export class AmmoPickup {
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;
  private rotationSpeed: number = 2;
  private bobSpeed: number = 2;
  private bobAmount: number = 0.3;
  private initialY: number;
  private time: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.initialY = position.y;

    // Create ammo box mesh - a yellow/gold box
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add a visual indicator - a rotating ring
    const ringGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.mesh.add(ring);

    scene.add(this.mesh);
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

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public destroy(): void {
    this.scene.remove(this.mesh);
  }
}
