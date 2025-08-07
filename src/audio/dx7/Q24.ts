const Q24 = 1 << 24;

export function fromQ24(x: number): number {
  return x / Q24;
}

export function toQ24(x: number): number {
  return Math.floor(x * Q24);
}
