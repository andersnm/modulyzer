// This tells TypeScript to accept the ?worker&url import syntax imposed by Vite for workers.

declare module "*?worker&url" {
    const value: string;
    export default value;
}