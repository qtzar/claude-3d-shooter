import * as THREE from 'three';
import { Game } from './game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

const startButton = document.getElementById('start-button') as HTMLButtonElement;
const instructions = document.getElementById('instructions') as HTMLDivElement;

startButton.addEventListener('click', () => {
  instructions.classList.add('hidden');
  game.start();
});

// Handle window resize
window.addEventListener('resize', () => {
  game.onWindowResize();
});
