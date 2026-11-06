import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { DURATION, diskPosition, channelA, channelB, edgesUpTo } from './lib/quadrature';

const CX = 110;
const CY = 175;
const RING = 78;
const SLOTS = 12;
const LEFT = 400;
const RIGHT = 700;
const ROWS = { a: 90, b: 160, count: 250 };

// Point on the disk at a given angle in degrees (0 is to the right, counterclockwise on screen)
function pointAt(radius: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];
}

export default defineScene({
    label: 'A slotted disk spins past two light sensors, A and B, placed a quarter slot apart. Both channels draw square waves, and the order in which they change gives the direction of each counted edge.',
    duration: DURATION,
    height: 360,
    params: [{ key: 'swap', label: 'wires swapped (0 = no, 1 = yes)', min: 0, max: 1, step: 1, value: 0, digits: 0 }],
    build({ draw }) {
        const sx = (t: number) => LEFT + (t / DURATION) * (RIGHT - LEFT);

        draw.text('12-slot disk, simplified', CX, 28, { color: color.dim, size: 13, anchor: 'middle' });
        draw.text('gray arcs are the slots', CX, 46, { color: color.dim, size: 13, anchor: 'middle' });
        draw.circle(CX, CY, RING + 14, { color: color.rule, width: 1 });
        draw.circle(CX, CY, RING - 14, { color: color.rule, width: 1 });

        // Each slot is a short thick arc that light passes through
        const slotPaths = [];
        for(let k = 0; k < SLOTS; k++) {
            slotPaths.push(draw.path('', { color: color.dim, width: 14 }));
        }

        // Sensor A sits at 0 degrees, sensor B a quarter slot (7.5 degrees) behind it
        const sensorA = draw.circle(0, 0, 9, { color: color.ink, width: 1.5 });
        const sensorB = draw.circle(0, 0, 9, { color: color.ink, width: 1.5 });
        const [ax, ay] = pointAt(RING + 30, 0);
        const [bx, by] = pointAt(RING + 30, -7.5);
        sensorA.set({ cx: ax, cy: ay });
        sensorB.set({ cx: bx, cy: by });
        draw.text('A', ax + 16, ay - 4, { size: 14 });
        draw.text('B', bx + 16, by + 12, { size: 14 });

        draw.text('channel A', LEFT - 14, ROWS.a + 4, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('channel B', LEFT - 14, ROWS.b + 4, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('edges counted', LEFT - 14, ROWS.count + 4, { color: color.dim, size: 14, anchor: 'end' });
        for(let s = 0; s <= DURATION; s += 2) {
            draw.text(`${s} s`, sx(s), 322, { color: color.dim, size: 13, anchor: 'middle' });
            draw.line(sx(s), 296, sx(s), 302, { color: color.rule, width: 1 });
        }
        draw.line(LEFT, 296, RIGHT, 296, { color: color.rule, width: 1 });

        const traceA = draw.path('', { color: color.value, width: 2.5 });
        const traceB = draw.path('', { color: color.focus, width: 2.5 });
        const playhead = draw.line(0, 50, 0, 296, { color: color.rule, width: 1.5 });

        const marks: ReturnType<typeof draw.circle>[] = [];
        for(let i = 0; i < 40; i++) {
            marks.push(draw.circle(0, ROWS.count, 5, { fill: color.target }));
        }

        const total = draw.text('', LEFT, 28, { size: 15 });
        const note = draw.text('', 20, 346, { size: 13, color: color.dim });

        return ({ t, p }) => {
            const swap = p.swap > 0.5;
            const x = diskPosition(t);

            // Slots rotate with the disk
            for(let k = 0; k < SLOTS; k++) {
                const start = (k - x) * 30;
                const steps = 6;
                let d = '';
                for(let i = 0; i <= steps; i++) {
                    const [px, py] = pointAt(RING, start + (i / steps) * 15);
                    d += `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
                }
                slotPaths[k].d(d);
            }

            const a = channelA(x);
            const b = channelB(x);
            sensorA.set({ fill: a ? color.value : 'none' });
            sensorB.set({ fill: b ? color.focus : 'none' });

            // Square waves up to the playhead
            const steps = 600;
            let dA = '';
            let dB = '';
            for(let i = 0; i <= steps; i++) {
                const tt = (i / steps) * t;
                const xx = diskPosition(tt);
                const px = sx(tt).toFixed(1);
                dA += `${i ? 'L' : 'M'}${px} ${ROWS.a + (channelA(xx) ? -18 : 18)}`;
                dB += `${i ? 'L' : 'M'}${px} ${ROWS.b + (channelB(xx) ? -18 : 18)}`;
            }
            traceA.d(dA);
            traceB.d(dB);
            playhead.to(sx(t), 50, sx(t), 296);

            // One mark per edge, green for +1 and red for -1
            const edges = edgesUpTo(t, swap);
            let count = 0;
            for(let i = 0; i < marks.length; i++) {
                const e = edges[i];
                if(!e) {
                    marks[i].show(false);
                    continue;
                }
                count += e.step;
                marks[i].set({ cx: sx(e.t), fill: e.step > 0 ? color.target : color.error }).show(true);
            }

            const slotsPassed = Math.floor(x);
            total.text(`count: ${count}    slots passed: ${slotsPassed}`);
            // With swapped wires the decoder's channel A is the physical B
            const last = edges[edges.length - 1];
            const physical = last ? (swap ? (last.channel === 'A' ? 'B' : 'A') : last.channel) : '';
            const sign = last && last.step > 0 ? '+1' : '-1';
            note.text(last ? `last edge: channel ${physical} changed${swap ? ' (wires swapped)' : ''}, count ${sign}` : 'no edges yet');
        };
    },
});
