import * as THREE from 'three';

export class Door {
  private doorMesh: THREE.Mesh;
  private frameGroup: THREE.Group;
  private scene: THREE.Scene;
  private isOpen: boolean = false;
  private position: THREE.Vector3;
  private rotation: number;
  private animationProgress: number = 0;
  private animationSpeed: number = 3;
  private closedRotation: number = 0;
  private openRotation: number = Math.PI / 2; // 90 degrees

  constructor(scene: THREE.Scene, position: THREE.Vector3, rotation: number) {
    this.scene = scene;
    this.position = position.clone();
    this.rotation = rotation;

    // Create main group for the entire door assembly
    this.frameGroup = new THREE.Group();
    this.frameGroup.position.copy(position);
    this.frameGroup.rotation.y = rotation;

    // Create door frame (jamb)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2817,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x1a1208,
      emissiveIntensity: 0.2
    });

    // Left jamb
    const leftJamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      frameMaterial
    );
    leftJamb.position.set(-2.15, 1.5, 0);
    leftJamb.castShadow = true;
    leftJamb.receiveShadow = true;
    this.frameGroup.add(leftJamb);

    // Right jamb
    const rightJamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      frameMaterial
    );
    rightJamb.position.set(2.15, 1.5, 0);
    rightJamb.castShadow = true;
    rightJamb.receiveShadow = true;
    this.frameGroup.add(rightJamb);

    // Top jamb (header)
    const topJamb = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.3, 0.3),
      frameMaterial
    );
    topJamb.position.set(0, 3, 0);
    topJamb.castShadow = true;
    topJamb.receiveShadow = true;
    this.frameGroup.add(topJamb);

    // Create door panel
    const doorGeometry = new THREE.BoxGeometry(0.15, 2.6, 3.8);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3a1e,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x2a1508,
      emissiveIntensity: 0.3
    });

    this.doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    this.doorMesh.position.set(-2.05, 1.45, 0); // Position at left edge (hinges on left)
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;

    // Add metal bands to door
    const bandGeometry = new THREE.BoxGeometry(0.16, 0.1, 3.8);
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.9,
    });

    const band1 = new THREE.Mesh(bandGeometry, bandMaterial);
    band1.position.y = 0.8;
    this.doorMesh.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, bandMaterial);
    band2.position.y = -0.8;
    this.doorMesh.add(band2);

    // Add door handle
    const handleGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
    const handle = new THREE.Mesh(handleGeometry, bandMaterial);
    handle.position.set(0, 0, 1.5); // Right side of door
    this.doorMesh.add(handle);

    this.frameGroup.add(this.doorMesh);
    scene.add(this.frameGroup);
  }

  public update(delta: number): void {
    // Animate door opening/closing
    if (this.isOpen && this.animationProgress < 1) {
      this.animationProgress = Math.min(1, this.animationProgress + delta * this.animationSpeed);
    } else if (!this.isOpen && this.animationProgress > 0) {
      this.animationProgress = Math.max(0, this.animationProgress - delta * this.animationSpeed);
    }

    // Interpolate rotation - door swings open around its hinge (left edge)
    const currentRotation = THREE.MathUtils.lerp(this.closedRotation, this.openRotation, this.animationProgress);
    this.doorMesh.rotation.y = currentRotation;
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
    return this.doorMesh;
  }

  public checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    // Only check collision if door is closed (or mostly closed)
    if (this.animationProgress > 0.3) {
      return false; // Door is mostly open, no collision
    }

    const doorPos = this.position;
    const distX = Math.abs(position.x - doorPos.x);
    const distZ = Math.abs(position.z - doorPos.z);

    // Use a slightly larger collision box for doors
    return distX < 2 + radius && distZ < 2 + radius;
  }

  public getDistanceTo(position: THREE.Vector3): number {
    return this.position.distanceTo(position);
  }
}
