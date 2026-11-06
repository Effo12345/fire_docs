import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';

const DURATION = 4;
const SIZE = 70;

export default defineScene({
    label: 'A top-down robot is told to drive both sides forward with a positive command. With the left ports positive, the left side pushes backward and the robot spins in place. With the left ports negative, both sides push forward and it drives straight. A slider switches between the two.',
    width: 480,
    height: 400,
    duration: DURATION,
    params: [
        { key: 'flip', label: 'left ports negative (0 no, 1 yes)', min: 0, max: 1, step: 1, value: 0, digits: 0 },
    ],
    build({ draw }) {
        // Arena on top, code underneath
        draw.rect(16, 16, 448, 210, { color: color.rule, width: 1.5 });
        draw.line(16, 121, 464, 121, { color: color.rule, width: 1, dash: '4 6' });

        draw.text('the command', 16, 262, { color: color.dim, size: 14 });
        draw.text('leftDrive.move(100);', 16, 288, { mono: true, size: 13.5 });
        draw.text('rightDrive.move(100);', 16, 310, { mono: true, size: 13.5 });
        draw.text('the ports', 250, 262, { color: color.dim, size: 14 });
        const ports = draw.text('', 250, 288, { mono: true, size: 13.5 });
        draw.text('rightDrive({4, 5, 6})', 250, 310, { mono: true, size: 13.5 });
        const verdict = draw.text('', 16, 356, { size: 15, color: color.focus });
        const verdict2 = draw.text('', 16, 380, { size: 15, color: color.dim });

        const bot = robot(draw, { size: SIZE });
        const parent = bot.el;

        // Local frame: the robot faces right, so its left side is the top
        const leftArrow = draw.arrow(0, -SIZE * 0.55, 0, -SIZE * 0.55, { color: color.focus, width: 3, head: 11, parent });
        const rightArrow = draw.arrow(0, SIZE * 0.55, 0, SIZE * 0.55, { color: color.focus, width: 3, head: 11, parent });

        // Labels stay upright, so they live outside the rotating group
        const leftTag = draw.text('left', 0, 0, { size: 13, color: color.dim, anchor: 'middle' });
        const rightTag = draw.text('right', 0, 0, { size: 13, color: color.dim, anchor: 'middle' });
        const place = (tag: typeof leftTag, cx: number, cy: number, deg: number, localY: number) => {
            const a = (deg * Math.PI) / 180;
            tag.at(cx - localY * Math.sin(a), cy + localY * Math.cos(a) + 5);
        };

        return ({ t, p }) => {
            const flip = p.flip >= 0.5;

            ports.text(flip ? 'leftDrive({-1, -2, -3})' : 'leftDrive({1, 2, 3})');
            ports.set({ fill: flip ? color.target : color.error });

            // Motors on the left face the opposite way, so a positive command pushes that side backward
            const leftDir = flip ? 1 : -1;
            const half = SIZE * 0.55;
            const reach = SIZE * 0.42;
            leftArrow.to(-leftDir * reach, -half, leftDir * reach, -half);
            rightArrow.to(-reach, half, reach, half);

            const cx = flip ? 84 + (t / DURATION) * 310 : 240;
            const deg = flip ? 0 : -t * 135;
            place(leftTag, cx, 121, deg, -SIZE * 0.55 - 20);
            place(rightTag, cx, 121, deg, SIZE * 0.55 + 22);

            if(flip) {
                bot.move(cx, 121, 0);
                verdict.text('Both sides push forward.');
                verdict2.text('The robot drives straight.');
            } else {
                bot.move(cx, 121, deg);
                verdict.text('The left side pushes backward.');
                verdict2.text('The robot spins in place.');
            }
        };
    },
});
