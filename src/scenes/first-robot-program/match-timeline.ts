import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

type Seg = [number, number];

const NAMES = ['initialize', 'competition_initialize', 'disabled', 'autonomous', 'opcontrol'] as const;
type Name = typeof NAMES[number];

// Not to scale: a real match is 15 s of autonomous and 1:45 of driver control
const PLANS: Record<number, Partial<Record<Name, Seg[]>>> = {
    0: {
        initialize: [[0, 2]],
        opcontrol: [[2, 23]],
    },
    1: {
        initialize: [[0, 2]],
        competition_initialize: [[2, 6]],
        disabled: [[10, 12], [20, 24]],
        autonomous: [[6, 10]],
        opcontrol: [[12, 20]],
    },
    2: {
        initialize: [[0, 2]],
        competition_initialize: [[2, 6]],
        disabled: [[10, 12], [15, 17], [20, 24]],
        autonomous: [[6, 10]],
        opcontrol: [[12, 15], [17, 20]],
    },
};

// Which bar ends mean "the kernel stopped it"
const STOPS: Record<number, Partial<Record<Name, number[]>>> = {
    0: {},
    1: { autonomous: [10], opcontrol: [20] },
    2: { autonomous: [10], opcontrol: [15, 20] },
};

const MODES = ['bench: no competition control', 'field: a normal match', 'field: disabled mid-driver-control'];

const LEFT = 196;
const RIGHT = 632;
const SPAN = 24;
const LANE_Y = (i: number) => 74 + i * 46;
const X = (t: number) => LEFT + (t / SPAN) * (RIGHT - LEFT);

export default defineScene({
    label: 'A timeline of which PROS function is running during a robot match: initialize, then competition_initialize before the match, autonomous, disabled, opcontrol, and disabled again. A slider switches between a bench with no competition control, a normal match, and a match where the robot is disabled in the middle of driver control.',
    width: 650,
    height: 400,
    duration: SPAN,
    params: [
        { key: 'mode', label: 'setup (0 bench, 1 field, 2 disabled mid-match)', min: 0, max: 2, step: 1, value: 1, digits: 0 },
    ],
    build({ draw }) {
        draw.text('PROS calls these. Your code never does.', 16, 28, { color: color.dim, size: 14, italic: true });
        const modeName = draw.text('', RIGHT, 28, { color: color.focus, size: 14, anchor: 'end' });

        const labels = NAMES.map((name, i) => draw.text(name, 16, LANE_Y(i) + 5, { mono: true, size: 13, color: color.dim }));
        NAMES.forEach((_, i) => draw.line(LEFT, LANE_Y(i) + 20, RIGHT, LANE_Y(i) + 20, { color: color.rule, width: 1 }));

        // A pool of bars per lane, shown or hidden depending on the setup
        const bars = NAMES.map((_, i) =>
            [0, 1, 2, 3].map(() => draw.rect(0, LANE_Y(i) - 12, 0, 24, {
                color: color.value,
                width: 1.5,
                fill: 'color-mix(in srgb, var(--fd-value) 28%, transparent)',
            })),
        );
        const stops = NAMES.map((_, i) =>
            [0, 1].map(() => draw.line(0, LANE_Y(i) - 16, 0, LANE_Y(i) + 16, { color: color.error, width: 3 })),
        );
        const restart = draw.text('starts over from the top', 0, LANE_Y(4) + 38, { color: color.focus, size: 13, anchor: 'middle' });
        const stopNote = draw.text('stopped', 0, LANE_Y(3) - 22, { color: color.error, size: 13, anchor: 'middle' });

        const head = draw.line(LEFT, 52, LEFT, 300, { color: color.focus, width: 2 });
        const readout = draw.text('', 16, 340, { color: color.focus, size: 15 });
        const note = draw.text('', 16, 368, { color: color.dim, size: 13.5 });

        return ({ t, p }) => {
            const mode = Math.max(0, Math.min(2, Math.round(p.mode)));
            const plan = PLANS[mode];
            const stopsHere = STOPS[mode];
            const running: string[] = [];

            modeName.text(MODES[mode]);

            NAMES.forEach((name, i) => {
                const segs = plan[name] ?? [];
                let live = false;
                bars[i].forEach((bar, k) => {
                    const seg = segs[k];
                    if(!seg || t <= seg[0]) {
                        bar.show(false);
                        return;
                    }
                    const end = Math.min(t, seg[1]);
                    bar.set({ x: X(seg[0]), width: X(end) - X(seg[0]) }).show(true);
                    if(t < seg[1]) live = true;
                });
                labels[i].set({ fill: live ? color.ink : color.dim });
                if(live) running.push(name);

                (stopsHere[name] ?? []).forEach((at, k) => stops[i][k].to(X(at), LANE_Y(i) - 16, X(at), LANE_Y(i) + 16).show(t >= at));
                for (let k = (stopsHere[name] ?? []).length; k < 2; k++) stops[i][k].show(false);
            });

            const stopTimes = [...(stopsHere.autonomous ?? []), ...(stopsHere.opcontrol ?? [])];
            const firstStop = mode === 2 ? 15 : 10;
            stopNote.at(X(firstStop), LANE_Y(mode === 2 ? 4 : 3) - 22).show(stopTimes.length > 0 && t >= firstStop && t < firstStop + 4);
            restart.at(X(17), LANE_Y(4) + 38).show(mode === 2 && t >= 17 && t < 21);

            head.to(X(t), 52, X(t), 300);
            readout.text(running.length ? `running now: ${running.join(' and ')}` : 'running now: nothing');

            let line = '';
            if(mode === 0) {
                line = 'No field or switch is attached, so opcontrol starts right after initialize.';
            } else if(t < 2) {
                line = 'Power on: initialize runs first, and everything else waits for it.';
            } else if(t < 6) {
                line = 'Disabled while the field sets up. competition_initialize runs, not disabled.';
            } else if(t < 10) {
                line = 'Autonomous: the robot drives itself for 15 seconds.';
            } else if(t < 12) {
                line = 'The field disables the robot between periods. autonomous is stopped.';
            } else if(mode === 2 && t >= 15 && t < 17) {
                line = 'The robot was disabled, so opcontrol is stopped.';
            } else if(mode === 2 && t >= 17 && t < 20) {
                line = 'Enabled again: opcontrol is a fresh start, not a resume.';
            } else if(t < 20) {
                line = 'Driver control: the driver has 1 minute 45 seconds.';
            } else {
                line = 'Match over: disabled again.';
            }
            note.text(line);
        };
    },
});
