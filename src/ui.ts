import { WeaponInventory, WeaponType, WEAPONS } from './weapon';

export class UI {
  private healthElement: HTMLElement;
  private ammoElement: HTMLElement;
  private scoreElement: HTMLElement;
  private weaponNameElement: HTMLElement;
  private weaponsContainer: HTMLElement;
  private score: number = 0;

  constructor() {
    this.healthElement = document.getElementById('health')!;
    this.ammoElement = document.getElementById('ammo')!;
    this.scoreElement = document.getElementById('score')!;
    this.weaponNameElement = document.getElementById('weapon-name')!;
    this.weaponsContainer = document.getElementById('weapons')!;

    this.initializeWeaponSlots();
  }

  private initializeWeaponSlots(): void {
    // Create weapon slots for all 5 weapons
    for (let i = 0; i < 5; i++) {
      const weaponType = i as WeaponType;
      const weaponData = WEAPONS[weaponType];

      const slot = document.createElement('div');
      slot.className = 'weapon-slot locked';
      slot.id = `weapon-${i}`;

      slot.innerHTML = `
        <div class="weapon-number">${i + 1}</div>
        <div class="weapon-name">${weaponData.name}</div>
        <div class="weapon-ammo">---</div>
      `;

      this.weaponsContainer.appendChild(slot);
    }
  }

  public updateWeapons(inventory: WeaponInventory): void {
    const currentWeapon = inventory.getCurrentWeapon();
    const ownedWeapons = inventory.getOwnedWeapons();

    // Update all weapon slots
    for (let i = 0; i < 5; i++) {
      const weaponType = i as WeaponType;
      const slot = document.getElementById(`weapon-${i}`)!;
      const ammoElement = slot.querySelector('.weapon-ammo')!;

      const isOwned = ownedWeapons.includes(weaponType);
      const isActive = weaponType === currentWeapon;

      // Update classes
      slot.classList.toggle('locked', !isOwned);
      slot.classList.toggle('active', isActive);

      // Update ammo display
      if (isOwned) {
        const ammo = inventory.getAmmo(weaponType);
        ammoElement.textContent = ammo.toString();
      } else {
        ammoElement.textContent = '---';
      }
    }

    // Update top-left weapon info
    const weaponData = inventory.getCurrentWeaponData();
    this.weaponNameElement.textContent = weaponData.name;
    this.ammoElement.textContent = `${inventory.getCurrentAmmo()}/${weaponData.maxAmmo}`;
  }

  public updateHealth(health: number): void {
    this.healthElement.textContent = Math.max(0, health).toString();
  }

  public addScore(points: number): void {
    this.score += points;
    this.scoreElement.textContent = this.score.toString();
  }

  public getScore(): number {
    return this.score;
  }
}
