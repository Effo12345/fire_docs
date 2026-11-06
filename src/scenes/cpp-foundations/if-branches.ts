import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

// Two versions of the same chain, with the tests in different orders
const CHAINS = [
    {
        lines: ['if(batteryPercent < 20) {', '    speed = 0;', '} else if(batteryPercent < 50) {', '    speed = 40;', '} else {', '    speed = 100;', '}'],
        tests: [{ line: 0, below: 20, body: 1, speed: 0 }, { line: 2, below: 50, body: 3, speed: 40 }],
        elseBody: 5,
        elseSpeed: 100,
    },
    {
        lines: ['if(batteryPercent < 50) {', '    speed = 40;', '} else if(batteryPercent < 20) {', '    speed = 0;', '} else {', '    speed = 100;', '}'],
        tests: [{ line: 0, below: 50, body: 1, speed: 40 }, { line: 2, below: 20, body: 3, speed: 0 }],
        elseBody: 5,
        elseSpeed: 100,
    },
];

const LH = 28;
const TOP = 40;
const CODE_X = 40;
const LINE_X0 = 60;
const LINE_X1 = 660;

export default defineScene({
    label: 'An if, else if, else chain over a battery percentage. The tests run top to bottom, the first true one picks the branch, and the rest are skipped. A second slider swaps the order of the first two tests.',
    height: 380,
    duration: 0,
    params: [
        { key: 'battery', label: 'batteryPercent', min: 0, max: 100, step: 1, value: 65 },
        { key: 'swap', label: 'swap tests (1 = yes)', min: 0, max: 1, step: 1, value: 0 },
    ],
    build({ draw }) {
        const band = draw.rect(CODE_X - 12, 0, 330, LH, { fill: 'rgba(244, 211, 94, 0.11)' });
        const texts = CHAINS.map((chain) => chain.lines.map((text, i) => {
            const node = draw.text(text, CODE_X, TOP + i * LH, { mono: true, size: 15 });
            node.el.style.whiteSpace = 'pre';
            return node;
        }));
        const verdicts = Array.from({ length: 2 }, () => draw.text('', 0, 0, { mono: true, size: 14 }));
        const result = draw.text('', CODE_X, TOP + 7 * LH + 16, { mono: true, size: 17, color: color.focus });
        const wrong = draw.text('', CODE_X + 190, TOP + 7 * LH + 16, { size: 14, color: color.error });

        // Number line for the battery
        const lineY = 330;
        const sx = (v: number) => LINE_X0 + (v / 100) * (LINE_X1 - LINE_X0);
        draw.line(sx(0), lineY, sx(100), lineY, { color: color.rule, width: 1 });
        for(const v of [0, 20, 50, 100]) {
            draw.line(sx(v), lineY - 5, sx(v), lineY + 5, { color: color.rule, width: 1 });
            draw.text(v, sx(v), lineY + 24, { color: color.dim, size: 13, anchor: 'middle' });
        }
        const marker = draw.circle(0, lineY, 6, { fill: color.value });

        return ({ p }) => {
            const battery = Math.round(p.battery);
            const which = Math.round(p.swap);
            texts.forEach((set, c) => set.forEach((node) => node.show(c === which)));
            const chain = CHAINS[which];

            // Walk the tests top to bottom until one is true
            let taken = chain.elseBody;
            let speed = chain.elseSpeed;
            let reached = chain.tests.length;
            for(let i = 0; i < chain.tests.length; i++) {
                if(battery < chain.tests[i].below) {
                    taken = chain.tests[i].body;
                    speed = chain.tests[i].speed;
                    reached = i;
                    break;
                }
            }

            verdicts.forEach((v, i) => {
                const test = chain.tests[i];
                const x = CODE_X + (test.line === 0 ? 270 : 340);
                const y = TOP + test.line * LH;
                if(i < reached) {
                    v.at(x, y).text('false').set({ fill: color.error });
                } else if(i === reached) {
                    v.at(x, y).text('true').set({ fill: color.target });
                } else {
                    v.at(x, y).text('skipped').set({ fill: color.faint });
                }
            });

            band.set({ y: TOP + taken * LH - LH * 0.72 });
            result.text(`speed = ${speed}`);

            // Below 20 the answer should always be 0
            const bad = battery < 20 && speed !== 0;
            wrong.text(bad ? 'wrong: a battery this low should stop' : '').show(bad);
            marker.set({ cx: sx(battery) });
        };
    },
});
