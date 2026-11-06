// Fixed pseudo-random shots for the accuracy-precision scene
export interface Shot {
    x: number;
    y: number;
}

const COUNT = 14;

function unit(k: number) {
    const h = Math.sin(k * 91.3458 + 47.853) * 43758.5453;
    return h - Math.floor(h);
}

// Roughly bell-shaped offsets (Box-Muller), the same every time
export const SPREAD_SHOTS: Shot[] = Array.from({ length: COUNT }, (_, k) => {
    const a = Math.max(unit(2 * k), 1e-6);
    const b = unit(2 * k + 1);
    const radius = Math.sqrt(-2 * Math.log(a));

    return { x: radius * Math.cos(2 * Math.PI * b), y: radius * Math.sin(2 * Math.PI * b) };
});

export function placeShots(bias: number, spread: number, grid: number): Shot[] {
    const angle = (35 * Math.PI) / 180;

    return SPREAD_SHOTS.map((shot) => {
        let x = bias * Math.cos(angle) + spread * shot.x;
        let y = bias * Math.sin(angle) + spread * shot.y;

        if(grid > 0) {
            x = Math.round(x / grid) * grid;
            y = Math.round(y / grid) * grid;
        }

        return { x, y };
    });
}

export function describeShots(shots: Shot[]) {
    const meanX = shots.reduce((sum, s) => sum + s.x, 0) / shots.length;
    const meanY = shots.reduce((sum, s) => sum + s.y, 0) / shots.length;
    const scatter = Math.sqrt(shots.reduce((sum, s) => sum + (s.x - meanX) ** 2 + (s.y - meanY) ** 2, 0) / shots.length);

    return { meanX, meanY, offset: Math.hypot(meanX, meanY), scatter };
}
