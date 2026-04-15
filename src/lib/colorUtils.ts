/**
 * RYB to RGB conversion approximation.
 * RYB is a subtractive color model used in art.
 * RGB is an additive color model used in screens.
 */

export function rybToRgb(r: number, y: number, b: number): [number, number, number] {
  // Normalize inputs to 0-1
  let r0 = r / 255;
  let y0 = y / 255;
  let b0 = b / 255;

  // Simple interpolation based on RYB cube
  // This is a common heuristic for RYB -> RGB
  
  const f000 = [1, 1, 1];
  const f100 = [1, 0, 0];
  const f010 = [1, 1, 0];
  const f001 = [0, 0, 1];
  const f110 = [1, 0.5, 0];
  const f011 = [0, 0.5, 0];
  const f101 = [0.5, 0, 0.5];
  const f111 = [0.2, 0.2, 0.2];

  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    rgb[i] = 
      f000[i] * (1 - r0) * (1 - y0) * (1 - b0) +
      f100[i] * r0 * (1 - y0) * (1 - b0) +
      f010[i] * (1 - r0) * y0 * (1 - b0) +
      f001[i] * (1 - r0) * (1 - y0) * b0 +
      f110[i] * r0 * y0 * (1 - b0) +
      f011[i] * (1 - r0) * y0 * b0 +
      f101[i] * r0 * (1 - y0) * b0 +
      f111[i] * r0 * y0 * b0;
  }

  return [
    Math.round(rgb[0] * 255),
    Math.round(rgb[1] * 255),
    Math.round(rgb[2] * 255)
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function calculateAccuracy(ryb1: [number, number, number], ryb2: [number, number, number]): number {
  const dist = Math.sqrt(
    Math.pow(ryb1[0] - ryb2[0], 2) +
    Math.pow(ryb1[1] - ryb2[1], 2) +
    Math.pow(ryb1[2] - ryb2[2], 2)
  );
  // Max distance is sqrt(255^2 * 3) approx 441.67
  const maxDist = Math.sqrt(255 * 255 * 3);
  return Math.max(0, Math.round((1 - dist / maxDist) * 100));
}
