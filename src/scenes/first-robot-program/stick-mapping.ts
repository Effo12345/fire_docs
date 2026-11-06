import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { STICK_MAX, arcadeMix, clamp, robotPose, tankMix } from './lib/drive-mix';

const DURATION = 2;
const PAD = 110;
const HALF = PAD / 2;
const PADS = [
    { name: 'left stick', cx: 66, cy: 120, kx: 'lx', ky: 'ly' },
    { name: 'right stick', cx: 196, cy: 120, kx: 'rx', ky: 'ry' },
];

// Bars
const BAR_TOP = 70;
const BAR_BOTTOM = 330;
const BAR_MID = (BAR_TOP + BAR_BOTTOM) / 2;
const BAR_SCALE = (BAR_BOTTOM - BAR_TOP) / 2 / STICK_MAX;

// Field pane
const PANE = { x: 512, y: 40, w: 192, h: 320 };
const PX_PER_IN = 2.2;
const START = { x: PANE.x + PANE.w / 2, y: PANE.y + PANE.h - 36 };

export default defineScene({
    label: 'Two controller sticks drive a robot. In tank mode each stick sets one side of the drivetrain. In arcade mode the left stick sets forward speed and the right stick sets turning, and the two are added and subtracted to get the left and right wheel commands. Bars show each side\'s command, a marker shows when the formula asks for more than 127, and a top-down robot drives the resulting path.',
    width: 720,
    height: 400,
    duration: DURATION,
    params: [
        { key: 'mode', label: 'drive mode (0 tank, 1 arcade)', min: 0, max: 1, step: 1, value: 0, digits: 0 },
        { key: 'fix', label: 'when over 127 (0 clamp, 1 scale)', min: 0, max: 1, step: 1, value: 0, digits: 0 },
        { key: 'lx', label: 'lx', min: -127, max: 127, step: 1, value: 0, hidden: true },
        { key: 'ly', label: 'ly', min: -127, max: 127, step: 1, value: 100, hidden: true },
        { key: 'rx', label: 'rx', min: -127, max: 127, step: 1, value: 60, hidden: true },
        { key: 'ry', label: 'ry', min: -127, max: 127, step: 1, value: 60, hidden: true },
    ],
    build({ draw, drag, setParam }) {
        // Sticks
        draw.text('drag the dots', 16, 24, { color: color.dim, size: 14 });
        const pads = PADS.map((pad) => {
            const rect = draw.rect(pad.cx - HALF, pad.cy - HALF, PAD, PAD, { color: color.rule, width: 1.5, fill: color.bg });
            draw.line(pad.cx - HALF, pad.cy, pad.cx + HALF, pad.cy, { color: color.rule, width: 1, dash: '3 5' });
            draw.line(pad.cx, pad.cy - HALF, pad.cx, pad.cy + HALF, { color: color.rule, width: 1, dash: '3 5' });
            draw.text(pad.name, pad.cx, pad.cy - HALF - 10, { color: color.dim, size: 14, anchor: 'middle' });
            const usedX = draw.line(pad.cx, pad.cy, pad.cx, pad.cy, { color: color.value, width: 3 });
            const usedY = draw.line(pad.cx, pad.cy, pad.cx, pad.cy, { color: color.value, width: 3 });
            const dot = draw.circle(pad.cx, pad.cy, 9, { fill: color.focus });
            const readout = draw.text('', pad.cx, pad.cy + HALF + 22, { mono: true, size: 13, anchor: 'middle' });
            return { pad, rect, usedX, usedY, dot, readout };
        });

        for (const item of pads) {
            const move = (x: number, y: number) => {
                const px = clamp(Math.round(((x - item.pad.cx) / HALF) * STICK_MAX), -STICK_MAX, STICK_MAX);
                const py = clamp(Math.round(((item.pad.cy - y) / HALF) * STICK_MAX), -STICK_MAX, STICK_MAX);
                setParam(item.pad.kx, px);
                setParam(item.pad.ky, py);
            };
            drag(item.rect.el, move);
            drag(item.dot.el, move);
        }

        // The formula
        const f1 = draw.text('', 16, 300, { mono: true, size: 13 });
        const f2 = draw.text('', 16, 322, { mono: true, size: 13 });
        const f3 = draw.text('', 16, 352, { size: 14, color: color.dim });
        const f4 = draw.text('', 16, 374, { size: 14, color: color.dim });

        // Bars
        const bars = [
            { name: 'left', x: 330, side: -1 },
            { name: 'right', x: 400, side: 1 },
        ].map((bar) => {
            draw.rect(bar.x, BAR_TOP, 34, BAR_BOTTOM - BAR_TOP, { color: color.rule, width: 1.5 });
            draw.line(bar.x - 6, BAR_MID, bar.x + 40, BAR_MID, { color: color.rule, width: 1 });
            const fill = draw.rect(bar.x, BAR_MID, 34, 0, { fill: 'rgba(86, 154, 255, 0.55)' });
            const over = draw.line(bar.x, BAR_TOP, bar.x + 34, BAR_TOP, { color: color.error, width: 3.5 });
            const overText = draw.text('', bar.side < 0 ? bar.x - 8 : bar.x + 42, 0, { color: color.error, size: 13, anchor: bar.side < 0 ? 'end' : 'start' });
            const value = draw.text('', bar.x + 17, BAR_BOTTOM + 24, { mono: true, size: 14, anchor: 'middle' });
            draw.text(bar.name, bar.x + 17, BAR_BOTTOM + 44, { color: color.dim, size: 14, anchor: 'middle' });
            return { fill, over, overText, value };
        });
        draw.text('127', 382, BAR_TOP + 4, { color: color.faint, size: 12, anchor: 'middle' });
        draw.text('-127', 382, BAR_BOTTOM + 4, { color: color.faint, size: 12, anchor: 'middle' });
        draw.text('wheel commands', 382, 24, { color: color.dim, size: 14, anchor: 'middle' });

        // Field pane
        draw.text('the next second', PANE.x + PANE.w / 2, 24, { color: color.dim, size: 14, anchor: 'middle' });
        draw.rect(PANE.x, PANE.y, PANE.w, PANE.h, { color: color.rule, width: 1.5 });
        const ghost = draw.path('', { color: color.target, width: 2, dash: '5 5' });
        const bot = robot(draw, { size: 34 });

        return ({ t, p }) => {
            const arcade = p.mode >= 0.5;
            const scale = p.fix >= 0.5;

            for (const item of pads) {
                const x = p[item.pad.kx];
                const y = p[item.pad.ky];
                const sx = item.pad.cx + (x / STICK_MAX) * HALF;
                const sy = item.pad.cy - (y / STICK_MAX) * HALF;
                item.dot.set({ cx: sx, cy: sy });

                // Only the axes the mode reads get a colored bar
                const isLeft = item.pad.kx === 'lx';
                const readsY = arcade ? isLeft : true;
                const readsX = arcade && !isLeft;
                item.usedY.to(item.pad.cx, item.pad.cy, item.pad.cx, readsY ? sy : item.pad.cy);
                item.usedX.to(item.pad.cx, item.pad.cy, readsX ? sx : item.pad.cx, item.pad.cy);
                item.readout.text(`x ${String(Math.round(x)).padStart(4)}  y ${String(Math.round(y)).padStart(4)}`);
            }

            const forward = Math.round(p.ly);
            const turn = Math.round(p.rx);
            const mix = arcade
                ? arcadeMix(forward, turn, scale ? 'scale' : 'clamp')
                : tankMix(Math.round(p.ly), Math.round(p.ry));

            // The formula text
            if(arcade) {
                f1.text(`left  = ${forward} + ${turn} = ${mix.askLeft}`.replace('+ -', '- '));
                f2.text(`right = ${forward} - ${turn} = ${mix.askRight}`.replace('- -', '+ '));
            } else {
                f1.text(`left  = left stick y  = ${mix.askLeft}`);
                f2.text(`right = right stick y = ${mix.askRight}`);
            }

            const over = Math.max(Math.abs(mix.askLeft), Math.abs(mix.askRight)) > STICK_MAX;
            if(over && scale) {
                const factor = mix.left / mix.askLeft || mix.right / mix.askRight;
                f3.text(`Over 127, so both are multiplied by ${factor.toFixed(2)}.`);
                f4.text('The sides keep their ratio, so the curve holds.');
                f3.set({ fill: color.focus });
            } else if(over) {
                f3.text('Over 127, so that side is cut off at 127.');
                f4.text('The gap between the sides, the turn, shrinks.');
                f3.set({ fill: color.error });
            } else {
                f3.text('Both are inside the range.');
                f4.text('');
                f3.set({ fill: color.dim });
            }

            // Bars
            const sides = [
                { out: mix.left, ask: mix.askLeft },
                { out: mix.right, ask: mix.askRight },
            ];
            bars.forEach((bar, i) => {
                const { out, ask } = sides[i];
                const h = out * BAR_SCALE;
                bar.fill.set({ y: h >= 0 ? BAR_MID - h : BAR_MID, height: Math.abs(h) });
                bar.value.text(Math.round(out));

                // A red cap on the wall the command ran into
                const askOver = Math.abs(ask) > STICK_MAX && !scale;
                bar.over.show(askOver);
                bar.overText.show(askOver);
                if(askOver) {
                    const edge = ask > 0 ? BAR_TOP : BAR_BOTTOM;
                    bar.over.set({ y1: edge, y2: edge });
                    bar.overText.at(Number(bar.overText.el.getAttribute('x')), edge + 5);
                    bar.overText.text(`asked ${Math.round(ask)}`);
                }
            });

            // Path for the next second, drawn as a dashed line
            const points: string[] = [];
            let pen = false;
            const inside = (x: number, y: number) => x > PANE.x + 4 && x < PANE.x + PANE.w - 4 && y > PANE.y + 4 && y < PANE.y + PANE.h - 4;
            for (let i = 0; i <= 40; i++) {
                const pose = robotPose(mix.left, mix.right, i / 40);
                const x = START.x + pose.x * PX_PER_IN;
                const y = START.y - pose.y * PX_PER_IN;
                if(inside(x, y)) {
                    points.push(`${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
                    pen = true;
                } else {
                    pen = false;
                }
            }
            ghost.d(points.join(' '));

            const pose = robotPose(mix.left, mix.right, t / DURATION);
            const rx = START.x + pose.x * PX_PER_IN;
            const ry = START.y - pose.y * PX_PER_IN;
            bot.show(inside(rx, ry));
            // robot faces right at 0 degrees, and ours starts facing up
            bot.move(rx, ry, -90 + (pose.heading * 180) / Math.PI);
        };
    },
});
