import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { RANGE_MAX, WALL_HALF, wallReading } from './lib/distance';

const SX = 70;
const SY = 225;
const PX = 0.25;

export default defineScene({
    label: 'A top-down robot with a distance sensor facing a flat wall. Sliders set the straight-on distance to the wall and how far the robot is turned. The beam reads the slanted distance, which is longer than the straight-on distance, and when the beam misses the wall the sensor reads 9999.',
    height: 400,
    duration: 0,
    params: [
        { key: 'perp', label: 'straight-on distance to wall (mm)', min: 100, max: 1800, step: 50, value: 1000, digits: 0 },
        { key: 'turn', label: 'robot turned off straight (degrees)', min: -75, max: 75, step: 1, value: 0, digits: 0 },
    ],
    build({ draw }) {
        const reads = draw.text('', 20, 24, { size: 15, mono: true });
        const meant = draw.text('', 20, 46, { size: 14, mono: true, color: color.target });
        const err = draw.text('', 20, 68, { size: 14, mono: true, color: color.focus });

        const wall = draw.line(0, 0, 0, 0, { color: color.ink, width: 4 });
        const straight = draw.line(SX, SY, SX, SY, { color: color.target, width: 2, dash: '6 5' });
        const beam = draw.line(SX, SY, SX, SY, { color: color.value, width: 2 });
        const band = draw.span(0, 0, 0, 0, { color: color.focus, width: 2.5, tick: 5 });
        const bot = robot(draw, { size: 44 });
        const missLabel = draw.text('', 0, 0, { size: 13, color: color.error });

        return ({ p }) => {
            const wallX = SX + p.perp * PX;
            const r = wallReading(p.perp, p.turn);
            const rad = (p.turn * Math.PI) / 180;
            const ux = Math.cos(rad);
            const uy = Math.sin(rad);

            wall.to(wallX, SY - WALL_HALF * PX, wallX, SY + WALL_HALF * PX);
            straight.to(SX, SY, wallX, SY);
            bot.move(SX, SY, p.turn);

            if(r.hit) {
                const len = r.along * PX;
                beam.set({ stroke: color.value, 'stroke-dasharray': '' });
                beam.to(SX, SY, SX + ux * len, SY + uy * len);
                const bandPx = r.band * PX;
                band.show(true);
                band.to(SX + ux * (len - bandPx), SY + uy * (len - bandPx), SX + ux * (len + bandPx), SY + uy * (len + bandPx));
                missLabel.text('');
                reads.set({ fill: color.value });
                reads.text(`sensor reads ${r.reading} mm`);
                err.text(`error band +- ${r.band.toFixed(0)} mm (spec)`);
            } else {
                // Draw the miss only as far as the picture reaches
                const len = Math.min(RANGE_MAX * PX, (WALL_HALF * PX + 5) / Math.max(Math.abs(uy), 0.01));
                beam.set({ stroke: color.error, 'stroke-dasharray': '5 5' });
                beam.to(SX, SY, SX + ux * len, SY + uy * len);
                band.show(false);
                missLabel.at(SX + ux * len + 6, SY + uy * len + (uy > 0 ? 14 : -6));
                missLabel.text('misses');
                reads.set({ fill: color.error });
                reads.text('sensor reads 9999 (nothing detected)');
                err.text('');
            }

            meant.text(`straight-on distance you meant: ${Math.round(p.perp)} mm`);
        };
    },
});
