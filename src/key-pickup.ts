import * as THREE from 'three';

export class KeyPickup {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private rotationSpeed: number = 2;
  private floatSpeed: number = 2;
  private floatAmount: number = 0.3;
  private time: number = 0;
  private initialY: number;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.initialY = position.y;

    // Create silver key
    // Key shaft
    const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, // Silver
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    });
    const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
    shaft.rotation.z = Math.PI / 2;
    this.mesh.add(shaft);

    // Key head (circular)
    const headGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const head = new THREE.Mesh(headGeometry, keyMaterial);
    head.position.x = -0.75;
    this.mesh.add(head);

    // Key teeth (3 rectangular protrusions)
    for (let i = 0; i < 3; i++) {
      const toothGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.08);
      const tooth = new THREE.Mesh(toothGeometry, keyMaterial);
      tooth.position.x = 0.4 + i * 0.2;
      tooth.position.y = -0.15;
      this.mesh.add(tooth);
    }

    // Add glowing ring effect
    const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.mesh.add(ring);

    this.mesh.position.copy(position);
    this.mesh.castShadow = true;

    scene.add(this.mesh);
  }

  public update(delta: number): void {
    this.time += delta;

    // Rotate the key
    this.mesh.rotation.y += this.rotationSpeed * delta;

    // Float up and down
    const floatOffset = Math.sin(this.time * this.floatSpeed) * this.floatAmount;
    this.mesh.position.y = this.initialY + floatOffset;
  }

  public checkCollision(position: THREE.Vector3, radius: number): boolean {
    const distance = this.mesh.position.distanceTo(position);
    return distance < radius + 0.5;
  }

  public remove(): void {
    this.scene.remove(this.mesh);
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}
