import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { placeShots, describeShots } from './lib/shots';

const CX = 190;
const CY = 190;
const UNIT = 52;

export default defineScene({
    label: 'A target with fourteen fixed shots. Sliders move the whole group off center, widen the scatter, and snap every shot to a coarse grid.',
    duration: 0,
    height: 380,
    params: [
        { key: 'bias', label: 'bias (off center)', min: 0, max: 2.5, step: 0.05, value: 0, digits: 2 },
        { key: 'spread', label: 'spread', min: 0.05, max: 1.2, step: 0.05, value: 0.5, digits: 2 },
        { key: 'grid', label: 'resolution step', min: 0, max: 1, step: 0.1, value: 0, digits: 1 },
    ],
    build({ draw }) {
        for(const ring of [1, 2, 3]) {
            draw.circle(CX, CY, ring * UNIT, { color: color.rule, width: 1.5 });
        }
        draw.circle(CX, CY, 3, { fill: color.target });

        const gridLines: ReturnType<typeof draw.line>[] = [];
        for(let i = -35; i <= 35; i++) {
            gridLines.push(draw.line(0, 0, 0, 0, { color: color.rule, width: 1 }));
            gridLines.push(draw.line(0, 0, 0, 0, { color: color.rule, width: 1 }));
        }

        const dots = draw.path('', { color: color.value, width: 9 });
        const scatterRing = draw.circle(CX, CY, 10, { color: color.dim, width: 1.5, dash: '4 4' });
        const offset = draw.line(CX, CY, CX, CY, { color: color.error, width: 2.5 });
        const mean = draw.path('', { color: color.focus, width: 2.5 });

        draw.text('center = the true value', CX, 372, { color: color.target, size: 13, anchor: 'middle' });

        draw.text('Accuracy', 400, 120, { size: 15, color: color.error });
        const accuracy = draw.text('', 400, 144, { size: 14 });
        draw.text('Precision', 400, 200, { size: 15, color: color.dim });
        const precision = draw.text('', 400, 224, { size: 14 });
        draw.text('Resolution', 400, 280, { size: 15 });
        const resolution = draw.text('', 400, 304, { size: 14 });

        return ({ p }) => {
            const shots = placeShots(p.bias, p.spread, p.grid);
            const stats = describeShots(shots);

            // The grid only shows when it is coarse enough to matter
            let line = 0;
            for(let i = -35; i <= 35; i++) {
                const visible = p.grid > 0;
                const pos = (i + 0.5) * p.grid * UNIT;
                const half = 3.4 * UNIT;
                gridLines[line].show(visible && Math.abs(pos) < half).to(CX + pos, CY - half, CX + pos, CY + half);
                gridLines[line + 1].show(visible && Math.abs(pos) < half).to(CX - half, CY + pos, CX + half, CY + pos);
                line += 2;
            }

            let points = '';
            for(const shot of shots) {
                points += `M${(CX + shot.x * UNIT).toFixed(1)} ${(CY - shot.y * UNIT).toFixed(1)}l0 0`;
            }
            dots.d(points);

            const mx = CX + stats.meanX * UNIT;
            const my = CY - stats.meanY * UNIT;
            mean.d(`M${mx - 7} ${my} L${mx + 7} ${my} M${mx} ${my - 7} L${mx} ${my + 7}`);
            offset.to(CX, CY, mx, my);
            scatterRing.set({ cx: mx, cy: my, r: Math.max(stats.scatter * UNIT, 3) });

            accuracy.text(`average sits ${stats.offset.toFixed(2)} from center`);
            precision.text(`shots scatter ${stats.scatter.toFixed(2)} around their average`);
            resolution.text(p.grid > 0 ? `positions only come in steps of ${p.grid.toFixed(1)}` : 'fine steps, no visible rounding');
        };
    },
});
