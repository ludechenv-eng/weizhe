export interface ThemeConfig {
  leafPrimary: string;
  leafSecondary: string;
  decoration: string;
  gemHighlight: string;
  bg: string;
  star: string;
  ribbon: string;
  snow: string;
  particleCount: number;
  bloomIntensity: number;
}

export interface HandRotation {
  x: number;
  y: number;
}

export interface PinchData {
  active: boolean;
  position: [number, number, number];
  content: string;
}