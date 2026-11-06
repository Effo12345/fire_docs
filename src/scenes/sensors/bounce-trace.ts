import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { bounceEdges, closedAt, sampleLoop } from './lib/bounce';

const END = 80;
const DURATION = 4;
const LEFT = 150;
const RIGHT = 690;

export default defineScene({
    label: 'A switch contact chatters for a few milliseconds when pressed. A program that checks it every 10 milliseconds sees some of the chatter, and a counter shows how many new presses it thinks happened.',
    duration: DURATION,
    height: 360,
    params: [
        { key: 'bounce', label: 'chatter length (ms, illustrative)', min: 0, max: 30, step: 1, value: 20, digits: 0 },
        { key: 'offset', label: 'loop timing (ms)', min: 0, max: 9, step: 1, value: 5, digits: 0 },
    ],
    build({ draw }) {
        const sx = (ms: number) => LEFT + (ms / END) * (RIGHT - LEFT);
        const rows = { contact: 84, tick: 150, read: 188, press: 238, clean: 288 };

        draw.text('contact', LEFT - 14, rows.contact + 2, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('up = closed', LEFT - 14, rows.contact + 24, { color: color.faint, size: 12, anchor: 'end' });
        draw.text('loop ticks', LEFT - 14, rows.tick + 5, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('reads closed?', LEFT - 14, rows.read + 5, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('new press?', LEFT - 14, rows.press + 5, { color: color.dim, size: 14, anchor: 'end' });
        draw.text('3 in a row?', LEFT - 14, rows.clean + 5, { color: color.dim, size: 14, anchor: 'end' });

        draw.line(LEFT, rows.contact + 22, RIGHT, rows.contact + 22, { color: color.rule, width: 1 });
        for(let ms = 0; ms <= END; ms += 20) {
            draw.text(`${ms} ms`, sx(ms), 336, { color: color.dim, size: 13, anchor: 'middle' });
            draw.line(sx(ms), 318, sx(ms), 324, { color: color.rule, width: 1 });
        }

        const trace = draw.path('', { color: color.value, width: 2.5 });
        const playhead = draw.line(0, 40, 0, 320, { color: color.focus, width: 1.5 });

        const maxTicks = Math.floor(END / 10) + 1;
        const tickMarks = [];
        const readTexts = [];
        const pressMarks = [];
        const cleanMarks = [];
        for(let i = 0; i < maxTicks; i++) {
            tickMarks.push(draw.line(0, rows.tick - 9, 0, rows.tick + 9, { color: color.dim, width: 1.5 }));
            readTexts.push(draw.text('', 0, rows.read + 5, { mono: true, size: 14, anchor: 'middle' }));
            pressMarks.push(draw.circle(0, rows.press, 7, { fill: color.error }));
            cleanMarks.push(draw.circle(0, rows.clean, 7, { fill: color.target }));
        }

        const counts = draw.text('', LEFT, 24, { size: 14 });

        return ({ t, p }) => {
            const now = (t / DURATION) * END;
            const b = bounceEdges(p.bounce);
            const ticks = sampleLoop(b, p.offset, END);

            // Contact trace, drawn up to the playhead
            const steps = 400;
            let d = '';
            for(let i = 0; i <= steps; i++) {
                const ms = (i / steps) * Math.min(now, END);
                const y = closedAt(ms, b) ? rows.contact - 14 : rows.contact + 14;
                d += `${i ? 'L' : 'M'}${sx(ms).toFixed(1)} ${y}`;
            }
            trace.d(d);
            playhead.to(sx(now), 40, sx(now), 320);

            let presses = 0;
            let cleans = 0;
            for(let i = 0; i < maxTicks; i++) {
                const tick = ticks[i];
                const seen = tick !== undefined && tick.time <= now;
                tickMarks[i].show(tick !== undefined).opacity(seen ? 1 : 0.3);
                if(!tick) {
                    readTexts[i].text('');
                    pressMarks[i].show(false);
                    cleanMarks[i].show(false);
                    continue;
                }

                const x = sx(tick.time);
                tickMarks[i].set({ x1: x, x2: x, y1: rows.tick - 9, y2: rows.tick + 9 });
                readTexts[i].at(x, rows.read + 5).text(seen ? (tick.closed ? 'yes' : 'no') : '').set({ fill: tick.closed ? color.value : color.dim });
                pressMarks[i].set({ cx: x }).show(seen && tick.newPress);
                cleanMarks[i].set({ cx: x }).show(seen && tick.debounced);
                if(seen && tick.newPress) {
                    presses++;
                }
                if(seen && tick.debounced) {
                    cleans++;
                }
            }

            counts.text(`one real press.  new presses counted: ${presses}.  with 3 in a row: ${cleans}`);
        };
    },
});
