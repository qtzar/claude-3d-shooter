export class UI {
  private healthElement: HTMLElement;
  private ammoElement: HTMLElement;
  private scoreElement: HTMLElement;
  private score: number = 0;

  constructor() {
    this.healthElement = document.getElementById('health')!;
    this.ammoElement = document.getElementById('ammo')!;
    this.scoreElement = document.getElementById('score')!;
  }

  public updateHealth(health: number): void {
    this.healthElement.textContent = Math.max(0, health).toString();
  }

  public updateAmmo(current: number, max: number): void {
    this.ammoElement.textContent = `${current}/${max}`;
  }

  public addScore(points: number): void {
    this.score += points;
    this.scoreElement.textContent = this.score.toString();
  }

  public getScore(): number {
    return this.score;
  }
}
