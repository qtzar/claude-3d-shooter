export enum WeaponType {
  PISTOL = 0,
  SHOTGUN = 1,
  RIFLE = 2,
  SNIPER = 3,
  ROCKET = 4
}

export interface WeaponData {
  type: WeaponType;
  name: string;
  damage: number;
  maxAmmo: number;
  fireRate: number; // seconds between shots
  hitsToKill: number; // how many hits to kill an enemy (100 health)
}

export const WEAPONS: Record<WeaponType, WeaponData> = {
  [WeaponType.PISTOL]: {
    type: WeaponType.PISTOL,
    name: 'Pistol',
    damage: 20,
    maxAmmo: 50,
    fireRate: 0.3,
    hitsToKill: 5
  },
  [WeaponType.SHOTGUN]: {
    type: WeaponType.SHOTGUN,
    name: 'Shotgun',
    damage: 25,
    maxAmmo: 30,
    fireRate: 0.8,
    hitsToKill: 4
  },
  [WeaponType.RIFLE]: {
    type: WeaponType.RIFLE,
    name: 'Rifle',
    damage: 34,
    maxAmmo: 90,
    fireRate: 0.15,
    hitsToKill: 3
  },
  [WeaponType.SNIPER]: {
    type: WeaponType.SNIPER,
    name: 'Sniper',
    damage: 50,
    maxAmmo: 20,
    fireRate: 1.2,
    hitsToKill: 2
  },
  [WeaponType.ROCKET]: {
    type: WeaponType.ROCKET,
    name: 'Rocket Launcher',
    damage: 100,
    maxAmmo: 10,
    fireRate: 2.0,
    hitsToKill: 1
  }
};

export class WeaponInventory {
  private weapons: Map<WeaponType, number> = new Map(); // weaponType -> current ammo
  private currentWeapon: WeaponType = WeaponType.PISTOL;
  private lastShotTime: number = 0;

  constructor() {
    // Start with pistol and some ammo
    this.weapons.set(WeaponType.PISTOL, 50);
  }

  public hasWeapon(type: WeaponType): boolean {
    return this.weapons.has(type);
  }

  public addWeapon(type: WeaponType, ammo: number): void {
    if (this.weapons.has(type)) {
      // Already have weapon, add ammo
      const currentAmmo = this.weapons.get(type)!;
      const maxAmmo = WEAPONS[type].maxAmmo;
      this.weapons.set(type, Math.min(maxAmmo, currentAmmo + ammo));
    } else {
      // New weapon
      this.weapons.set(type, ammo);
    }
  }

  public addAmmo(type: WeaponType, ammo: number): void {
    if (this.weapons.has(type)) {
      const currentAmmo = this.weapons.get(type)!;
      const maxAmmo = WEAPONS[type].maxAmmo;
      this.weapons.set(type, Math.min(maxAmmo, currentAmmo + ammo));
    }
  }

  public switchWeapon(type: WeaponType): boolean {
    if (this.weapons.has(type)) {
      this.currentWeapon = type;
      return true;
    }
    return false;
  }

  public getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }

  public getCurrentWeaponData(): WeaponData {
    return WEAPONS[this.currentWeapon];
  }

  public canShoot(): boolean {
    const currentTime = performance.now() / 1000;
    const weapon = this.getCurrentWeaponData();
    const ammo = this.weapons.get(this.currentWeapon) || 0;

    return ammo > 0 && (currentTime - this.lastShotTime) >= weapon.fireRate;
  }

  public shoot(): number {
    if (this.canShoot()) {
      const ammo = this.weapons.get(this.currentWeapon)!;
      this.weapons.set(this.currentWeapon, ammo - 1);
      this.lastShotTime = performance.now() / 1000;
      return this.getCurrentWeaponData().damage;
    }
    return 0;
  }

  public reload(): void {
    const weapon = this.getCurrentWeaponData();
    this.weapons.set(this.currentWeapon, weapon.maxAmmo);
  }

  public getAmmo(type: WeaponType): number {
    return this.weapons.get(type) || 0;
  }

  public getCurrentAmmo(): number {
    return this.weapons.get(this.currentWeapon) || 0;
  }

  public getMaxAmmo(): number {
    return this.getCurrentWeaponData().maxAmmo;
  }

  public getOwnedWeapons(): WeaponType[] {
    return Array.from(this.weapons.keys());
  }
}
