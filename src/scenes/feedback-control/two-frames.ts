import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { Field, robot } from '@kit/robot';
import { toRobotFrame, toStandard } from './lib/frames';

const FIELD = 240;
const FIELD_X = 34;
const PANEL_X = 400;
const PANEL_Y = 160;
const PANEL_SCALE = 0.45;

export default defineScene({
    label: 'A field with a robot and one fixed point, and beside it the same point seen from the robot: how far ahead and how far to the right. Sliders move the robot and the point.',
    duration: 0,
    width: 540,
    height: 380,
    params: [
        { key: 'x', label: 'robot x (in)', min: 0, max: 144, step: 1, value: 48, digits: 0 },
        { key: 'y', label: 'robot y (in)', min: 0, max: 144, step: 1, value: 36, digits: 0 },
        { key: 'heading', label: 'robot heading (degrees)', min: 0, max: 359, step: 1, value: 30, digits: 0 },
        { key: 'px', label: 'point x (in)', min: 0, max: 144, step: 1, value: 100, digits: 0 },
        { key: 'py', label: 'point y (in)', min: 0, max: 144, step: 1, value: 96, digits: 0 },
    ],
    build({ draw }) {
        const field = new Field(draw, FIELD_X, 40, FIELD);
        draw.text('field frame', FIELD_X, 26, { size: 14, color: color.dim });
        draw.text('x', FIELD_X + FIELD + 8, 40 + FIELD + 5, { size: 13, color: color.dim });
        draw.text('y', FIELD_X - 6, 34, { size: 13, color: color.dim, anchor: 'end' });

        const bot = robot(draw);
        const heading = draw.line(0, 0, 0, 0, { color: color.value, width: 2 });
        const fieldDot = draw.circle(0, 0, 6, { fill: color.target });
        const link = draw.line(0, 0, 0, 0, { color: color.rule, width: 1.5, dash: '4 4' });

        draw.text('robot frame', PANEL_X, 26, { size: 14, color: color.dim, anchor: 'middle' });
        draw.line(PANEL_X - 106, PANEL_Y, PANEL_X + 106, PANEL_Y, { color: color.rule, width: 1 });
        draw.line(PANEL_X, PANEL_Y - 106, PANEL_X, PANEL_Y + 106, { color: color.rule, width: 1 });
        draw.text('forward', PANEL_X + 8, PANEL_Y - 100, { size: 13, color: color.dim });
        draw.text('right', PANEL_X + 106, PANEL_Y + 20, { size: 13, color: color.dim, anchor: 'end' });
        const botView = robot(draw);
        botView.move(PANEL_X, PANEL_Y, -90);
        const viewDot = draw.circle(0, 0, 6, { fill: color.target });

        const fieldText = draw.text('', FIELD_X, 316, { mono: true, size: 14, color: color.ink });
        const headText = draw.text('', FIELD_X, 340, { mono: true, size: 14, color: color.value });
        const frameText = draw.text('', FIELD_X, 364, { mono: true, size: 14, color: color.target });

        return ({ p }) => {
            const pose = { x: p.x, y: p.y, heading: p.heading };
            const rad = (p.heading * Math.PI) / 180;
            const sx = field.sx(p.x);
            const sy = field.sy(p.y);
            const dotX = field.sx(p.px);
            const dotY = field.sy(p.py);

            bot.move(sx, sy, p.heading - 90);
            heading.to(sx, sy, sx + 46 * Math.sin(rad), sy - 46 * Math.cos(rad));
            fieldDot.move(dotX, dotY);
            link.to(sx, sy, dotX, dotY);

            const num = (n: number) => (Math.round(n) + 0).toFixed(0);
            const view = toRobotFrame({ x: p.px, y: p.py }, pose);
            viewDot.move(PANEL_X + view.right * PANEL_SCALE, PANEL_Y - view.forward * PANEL_SCALE);

            fieldText.text(`point in the field frame: (${p.px.toFixed(0)}, ${p.py.toFixed(0)})`);
            headText.text(`heading ${p.heading.toFixed(0)}, standard angle ${toStandard(p.heading).toFixed(0)}`);
            frameText.text(`point in the robot frame: ${num(view.forward)} ahead, ${num(view.right)} right`);
        };
    },
});
