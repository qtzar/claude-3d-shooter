import * as THREE from 'three';

export class Door {
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;
  private isOpen: boolean = false;
  private position: THREE.Vector3;
  private rotation: number;
  private closedPosition: THREE.Vector3;
  private openPosition: THREE.Vector3;
  private animationProgress: number = 0;
  private animationSpeed: number = 3;

  constructor(scene: THREE.Scene, position: THREE.Vector3, rotation: number) {
    this.scene = scene;
    this.position = position.clone();
    this.rotation = rotation;

    // Create door mesh - make it 4 units wide to fill the corridor
    const doorGeometry = new THREE.BoxGeometry(0.2, 2.5, 4);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2511,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(doorGeometry, doorMaterial);
    this.mesh.position.copy(position);
    this.mesh.position.y = 1.25;
    this.mesh.rotation.y = rotation;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add metal bands
    const bandGeometry = new THREE.BoxGeometry(0.22, 0.1, 4);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8,
    });

    const band1 = new THREE.Mesh(bandGeometry, bandMaterial);
    band1.position.y = 0.8;
    this.mesh.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, bandMaterial);
    band2.position.y = -0.8;
    this.mesh.add(band2);

    // Calculate open/closed positions
    this.closedPosition = position.clone();
    this.closedPosition.y = 1.25;

    // Door slides to the side when opening
    const slideDirection = new THREE.Vector3(
      Math.sin(rotation),
      0,
      Math.cos(rotation)
    );
    this.openPosition = this.closedPosition.clone().add(slideDirection.multiplyScalar(2));

    scene.add(this.mesh);
  }

  public update(delta: number): void {
    // Animate door opening/closing
    if (this.isOpen && this.animationProgress < 1) {
      this.animationProgress = Math.min(1, this.animationProgress + delta * this.animationSpeed);
    } else if (!this.isOpen && this.animationProgress > 0) {
      this.animationProgress = Math.max(0, this.animationProgress - delta * this.animationSpeed);
    }

    // Interpolate position
    this.mesh.position.lerpVectors(this.closedPosition, this.openPosition, this.animationProgress);
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }

  public open(): void {
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    // Only check collision if door is closed (or closing)
    if (this.animationProgress > 0.5) {
      return false; // Door is mostly open, no collision
    }

    const doorPos = this.mesh.position;
    const distX = Math.abs(position.x - doorPos.x);
    const distZ = Math.abs(position.z - doorPos.z);

    // Use a slightly larger collision box for doors
    return distX < 1 + radius && distZ < 1 + radius;
  }

  public getDistanceTo(position: THREE.Vector3): number {
    return this.position.distanceTo(position);
  }
}
