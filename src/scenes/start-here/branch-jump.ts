import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const ASM = ['load  r0, [3]', 'compare r0, 20', 'jump_ge 105', 'set   r1, 0', 'store r1, [4]', 'the rest of the program'];
const FIRST = 100;
const STEP = 1.1;

// Which instruction addresses run, in order, for a given distance
const pathFor = (distance: number) => (distance < 20 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 5]);

export default defineScene({
    label: 'A C++ if statement beside its machine steps. A slider sets distance. When distance is 20 or more, a jump instruction skips the two instructions that set speed to 0; otherwise the program counter moves through them in order.',
    height: 380,
    duration: 7,
    params: [{ key: 'distance', label: 'distance', min: 0, max: 40, step: 1, value: 35, digits: 0 }],
    beats: [
        { at: 0, text: 'The <em>if</em> statement becomes a compare, then a jump. Slide <em>distance</em> across 20 and watch which instructions the program counter visits.' },
    ],
    build({ draw }) {
        const rowY = (i: number) => 112 + i * 34;

        // C++ on the left, lined up with the instructions it became
        draw.text('C++', 20, 40, { color: color.dim, size: 13 });
        draw.text('if(distance < 20) {', 20, rowY(1), { mono: true, size: 15 });
        const body = draw.text('    speed = 0;', 20, rowY(3) + 17, { mono: true, size: 15 });
        body.el.style.whiteSpace = 'pre';
        draw.text('}', 20, rowY(5) - 8, { mono: true, size: 15 });
        draw.span(262, rowY(0) - 12, 262, rowY(2) + 10, { color: color.rule, width: 1.25 });
        draw.span(262, rowY(3) - 12, 262, rowY(4) + 10, { color: color.rule, width: 1.25 });

        // Assembly in the middle
        draw.text('machine steps', 300, 40, { color: color.dim, size: 13 });
        const band = draw.rect(290, 0, 330, 28, { fill: 'rgba(244, 211, 94, 0.12)' });
        const rows = ASM.map((line, i) => {
            const y = rowY(i);
            draw.text(FIRST + i, 296, y, { mono: true, size: 12, color: color.faint });
            return draw.text(line, 336, y, { mono: true, size: 15, italic: i === 5 });
        });
        draw.text('PC', 640, 40, { color: color.dim, size: 13 });
        const pcValue = draw.text('', 672, 40, { mono: true, size: 16, color: color.focus });

        // The jump, drawn as an arc down the right side of the instructions
        const y2 = rowY(2) - 5;
        const y5 = rowY(5) - 5;
        const arc = draw.path(`M 548 ${y2} C 604 ${y2} 604 ${y5} 552 ${y5} M 560 ${y5 - 6} L 551 ${y5} L 560 ${y5 + 6}`, { color: color.focus, width: 2 });

        const r0 = draw.text('', 20, 316, { mono: true, size: 15, color: color.value });
        const verdict = draw.text('', 20, 346, { size: 15 });

        return ({ t, p }) => {
            const distance = Math.round(p.distance);
            const path = pathFor(distance);
            const step = Math.min(path.length - 1, Math.floor(t / STEP));
            const here = path[step];
            const taken = distance >= 20;
            const jumped = taken && step >= 3;

            band.set({ y: rowY(here) - 18 });
            pcValue.text(FIRST + here);
            rows.forEach((row, i) => {
                const skipped = taken && (i === 3 || i === 4);
                row.set({ fill: skipped && jumped ? color.faint : color.ink });
                row.opacity(skipped && jumped ? 0.35 : 1);
            });
            body.set({ fill: taken && jumped ? color.faint : color.ink });
            arc.show(taken && step >= 2);

            r0.text(step >= 1 ? `r0 = ${distance}   (distance, loaded from address 3)` : 'r0 = ?');
            if(step < 2) {
                verdict.text('');
            } else if(taken) {
                verdict.text(`${distance} is 20 or more, so the jump writes 105 into the PC. 103 and 104 never run.`).set({ fill: color.focus });
            } else {
                verdict.text(`${distance} is less than 20, so there's no jump. The PC just moves on to the next address.`).set({ fill: color.target });
            }
        };
    },
});
