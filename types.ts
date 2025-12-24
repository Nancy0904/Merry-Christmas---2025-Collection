export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface OrnamentConfig {
  count: number;
  color: string;
  type: 'box' | 'sphere';
  scale: number;
  weight: number; // Heaviness factor (affects interpolation speed)
}

export interface UserPhoto {
  id: string;
  url: string;
  aspectRatio: number;
}

export const THEME = {
  colors: {
    emerald: '#004225',
    gold: '#FFD700',
    goldDark: '#B8860B',
    silver: '#C0C0C0',
    burgundy: '#800020',
    whiteWarm: '#FFFDD0'
  }
};