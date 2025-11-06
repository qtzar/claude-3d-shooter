import * as THREE from 'three';

export class InputHandler {
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  public mouseDelta = new THREE.Vector2(0, 0);
  public isMouseDown = false;
  public isReloading = false;
  public isInteracting = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });

    // Mouse events
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === this.canvas) {
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
      }
    });

    document.addEventListener('mousedown', (event) => {
      if (event.button === 0 && document.pointerLockElement === this.canvas) {
        this.isMouseDown = true;
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (event.button === 0) {
        this.isMouseDown = false;
      }
    });

    // Pointer lock events
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.canvas) {
        // Pointer lock lost
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
        this.isMouseDown = false;
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'KeyR':
        this.isReloading = true;
        break;
      case 'KeyE':
        this.isInteracting = true;
        break;
      case 'Escape':
        if (document.pointerLockElement === this.canvas) {
          document.exitPointerLock();
        }
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  }

  public lockPointer(): void {
    this.canvas.requestPointerLock();
  }
}
