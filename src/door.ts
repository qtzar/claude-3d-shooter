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
  private openRotation: number = -Math.PI / 2; // -90 degrees (swings inward)

  constructor(scene: THREE.Scene, position: THREE.Vector3, rotation: number) {
    this.scene = scene;
    this.position = position.clone();
    this.rotation = rotation;

    // Create main group for the entire door assembly
    this.frameGroup = new THREE.Group();
    this.frameGroup.position.copy(position);
    this.frameGroup.rotation.y = rotation;

    // Frame material - darker wood for frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2817,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x1a1208,
      emissiveIntensity: 0.2
    });

    // Corridor is 4 units wide
    // Layout: 1 unit frame | 2 unit door opening | 1 unit frame

    // Left frame (1 unit wide, full height)
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 0.2),
      frameMaterial
    );
    leftFrame.position.set(-1.5, 1.5, 0); // Centered at -1.5 (left side)
    leftFrame.castShadow = true;
    leftFrame.receiveShadow = true;
    this.frameGroup.add(leftFrame);

    // Right frame (1 unit wide, full height)
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 0.2),
      frameMaterial
    );
    rightFrame.position.set(1.5, 1.5, 0); // Centered at 1.5 (right side)
    rightFrame.castShadow = true;
    rightFrame.receiveShadow = true;
    this.frameGroup.add(rightFrame);

    // Top frame (header) - spans the full 4 units
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 0.2),
      frameMaterial
    );
    topFrame.position.set(0, 3, 0);
    topFrame.castShadow = true;
    topFrame.receiveShadow = true;
    this.frameGroup.add(topFrame);

    // Door material - lighter wood for door
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3a1e,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x2a1508,
      emissiveIntensity: 0.3
    });

    // Door panel - 2 units wide (fills the opening), 2.7 units tall
    // Position it so the hinge is on the LEFT frame edge
    const doorGeometry = new THREE.BoxGeometry(2, 2.7, 0.15);
    this.doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);

    // Position door at the left edge of the opening (x = -1)
    // The door's pivot will be at its left edge
    this.doorMesh.position.set(-1, 1.5, 0);
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;

    // Offset the door geometry so rotation happens around left edge
    doorGeometry.translate(1, 0, 0); // Move geometry 1 unit to the right so left edge is at pivot

    // Add metal bands to door
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.9,
    });

    const bandGeometry = new THREE.BoxGeometry(2, 0.1, 0.16);

    const band1 = new THREE.Mesh(bandGeometry, bandMaterial);
    band1.position.y = 0.7;
    this.doorMesh.add(band1);

    const band2 = new THREE.Mesh(bandGeometry, bandMaterial);
    band2.position.y = -0.7;
    this.doorMesh.add(band2);

    // Add door handle on the right side (away from hinge)
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
    const handle = new THREE.Mesh(handleGeometry, bandMaterial);
    handle.position.set(0.9, 0, 0.1); // Right side, slightly forward
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

    // Interpolate rotation - door swings inward (negative rotation)
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
    // Only check collision if door is closed or mostly closed
    if (this.animationProgress > 0.3) {
      return false; // Door is mostly open, no collision
    }

    // Transform position to door's local space
    const localPos = position.clone();
    localPos.sub(this.position);

    // Rotate to door's coordinate system
    const cosR = Math.cos(-this.rotation);
    const sinR = Math.sin(-this.rotation);
    const rotatedX = localPos.x * cosR - localPos.z * sinR;
    const rotatedZ = localPos.x * sinR + localPos.z * cosR;

    // Check if in the doorway area (center 2 units of the 4-unit corridor)
    const inDoorway = Math.abs(rotatedX) < 1 + radius && Math.abs(rotatedZ) < 0.5 + radius;

    return inDoorway;
  }

  public getDistanceTo(position: THREE.Vector3): number {
    return this.position.distanceTo(position);
  }

  public remove(): void {
    this.scene.remove(this.frameGroup);
  }
}
