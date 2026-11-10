import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { timeline, fadeIn, textAt } from '@kit/timeline';

// What each block is called in the four machines the scene walks through
const SWAP = [0, 17.4, 21, 24.6];
const pick = (t: number, names: string[]) => textAt(t, SWAP.map((at, i): [number, string] => [at, names[i]]));

const TEXT = {
    target: ['24 in', '65 mph', '70 °F', 'level'],
    controller: ['your code', 'cruise computer', 'thermostat', 'flight controller'],
    actuator: ['drive motors', 'throttle', 'furnace', 'motors, props'],
    plant: ['drivetrain', 'the car', 'the house', 'the drone'],
    disturbance: ['a defender, a load', 'a hill, a headwind', 'an open window', 'a gust of wind'],
    sensor: ['wheel encoders', 'speed sensor', 'thermometer', 'gyro (IMU)'],
    result: ['position', 'speed', 'temperature', 'tilt'],
};

// Which block is in focus during each stretch of the narration
const FOCUS: [number, string][] = [[0, 'controller'], [1.6, 'actuator'], [2.8, 'plant'], [4.6, 'actuator'], [6.6, 'plant'], [8.4, 'disturbance'], [12.8, 'sensor'], [15.2, 'controller'], [17.4, '']];

export default defineScene({
    label: 'A block diagram built up in steps: a controller sends a command to an actuator, which drives a plant, with a disturbance pushing on the plant and a sensor sending the result back to the controller. The same diagram is then relabeled for cruise control, a thermostat and a quadcopter.',
    width: 600,
    height: 390,
    duration: 26.5,
    beats: [
        { at: 0, text: 'Your autonomous so far: the code picks a command from a target, the motors act on it, and the robot moves.' },
        { at: 4.6, text: 'The thing being controlled is the <strong>plant</strong>. What the motors really deliver to it is the <strong>actuator output</strong>, which can differ from the command. A hot motor cuts its current, for one.' },
        { at: 8.4, text: 'A <strong>disturbance</strong> pushes on the plant from outside. Nothing in the chain can see it coming or tell that it happened.' },
        { at: 12.8, text: 'Add a sensor that reads the result, and send the reading back to the code. The whole loop is a <strong>control system</strong>, and a picture like this is a block diagram.' },
        { at: 17.4, text: 'The same diagram on a car. Cruise control holds a speed, and a hill is the disturbance.' },
        { at: 21, text: 'A thermostat holds a temperature. The furnace is the actuator and the house is the plant.' },
        { at: 24.6, text: 'A quadcopter holds itself level. Its flight controller runs this loop many times a second.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const boxY = 150;
        const boxH = 50;
        const boxW = 116;
        const midY = boxY + boxH / 2;
        const xs = { controller: 10, actuator: 206, plant: 402 };
        const sensorY = 290;
        const plantMid = xs.plant + boxW / 2;

        const box = (name: 'controller' | 'actuator' | 'plant', role: string, at: number) => {
            const rect = draw.rect(xs[name], boxY, boxW, boxH, { color: color.dim, width: 1.5 });
            const label = draw.text('', xs[name] + boxW / 2, midY + 5, { size: 14, anchor: 'middle' });
            const roleText = draw.text(role, xs[name] + 4, boxY + boxH + 20, { size: 13, color: color.dim });
            [rect, label, roleText].forEach((n) => fadeIn(tl, n, at));
            return { rect, label };
        };

        const blocks = {
            controller: box('controller', 'controller', 0.3),
            actuator: box('actuator', 'actuator', 1.6),
            plant: box('plant', 'plant', 2.8),
        };

        // Chain arrows with their labels
        const link = (x1: number, x2: number, lines: string[], at: number) => {
            const arrow = draw.arrow(x1, midY, x2, midY, { color: color.dim, width: 1.5, head: 9 });
            const texts = lines.map((line, i) => draw.text(line, (x1 + x2) / 2, midY - 30 + i * 15 + (lines.length === 1 ? 14 : 0), { size: 13, color: color.dim, anchor: 'middle' }));
            [arrow, ...texts].forEach((n) => fadeIn(tl, n, at));
        };
        link(xs.controller + boxW, xs.actuator, ['command'], 1.1);
        link(xs.actuator + boxW, xs.plant, ['actuator', 'output'], 2.3);

        const resultX1 = xs.plant + boxW;
        const resultX2 = 590;
        const resultArrow = draw.arrow(resultX1, midY, resultX2, midY, { color: color.value, width: 1.5, head: 9 });
        const resultLabel = draw.text('result', (resultX1 + resultX2) / 2 - 4, midY - 16, { size: 13, color: color.dim, anchor: 'middle' });
        const resultName = draw.text('', (resultX1 + resultX2) / 2 - 4, midY - 34, { size: 13, color: color.value, anchor: 'middle' });
        [resultArrow, resultLabel, resultName].forEach((n) => fadeIn(tl, n, 3.6));

        // The target going in
        const targetX = xs.controller + boxW / 2;
        const targetArrow = draw.arrow(targetX, 74, targetX, boxY - 3, { color: color.target, width: 1.5, head: 9 });
        const targetText = draw.text('', targetX, 62, { size: 14, color: color.target, anchor: 'middle' });
        [targetArrow, targetText].forEach((n) => fadeIn(tl, n, 0.3));

        // The disturbance pushing on the plant
        const distArrow = draw.arrow(plantMid, 74, plantMid, boxY - 3, { color: color.error, width: 2, head: 9 });
        const distText = draw.text('', plantMid, 62, { size: 14, color: color.error, anchor: 'middle' });
        const distWord = draw.text('disturbance', plantMid + 8, 108, { size: 13, color: color.dim });
        [distArrow, distText, distWord].forEach((n) => fadeIn(tl, n, 8.4));

        // The sensor, and the measurement coming back
        const sensorRect = draw.rect(xs.plant, sensorY, boxW, boxH - 4, { color: color.dim, width: 1.5 });
        const sensorText = draw.text('', plantMid, sensorY + 28, { size: 14, anchor: 'middle' });
        const sensorRole = draw.text('sensor', xs.plant + 4, sensorY + boxH + 16, { size: 13, color: color.dim });
        const tapX = resultX2 - 14;
        const tap = draw.path(`M${tapX} ${midY} L${tapX} ${sensorY + 23} L${xs.plant + boxW + 14} ${sensorY + 23}`, { color: color.value, width: 1.5 });
        const tapHead = draw.arrow(xs.plant + boxW + 14, sensorY + 23, xs.plant + boxW + 2, sensorY + 23, { color: color.value, width: 1.5, head: 9 });
        const returnX = 110;
        const back = draw.path(`M${xs.plant} ${sensorY + 23} L${returnX} ${sensorY + 23} L${returnX} ${boxY + boxH + 16}`, { color: color.value, width: 1.5 });
        const backHead = draw.arrow(returnX, boxY + boxH + 26, returnX, boxY + boxH + 2, { color: color.value, width: 1.5, head: 9 });
        const backLabel = draw.text('measurement', (returnX + xs.plant) / 2, sensorY + 46, { size: 13, color: color.dim, anchor: 'middle' });
        [sensorRect, sensorText, sensorRole, tap, tapHead, back, backHead, backLabel].forEach((n) => fadeIn(tl, n, 12.8, 0.8));

        const focusable: Record<string, { set(a: Record<string, string | number>): unknown }> = {
            controller: blocks.controller.rect,
            actuator: blocks.actuator.rect,
            plant: blocks.plant.rect,
            sensor: sensorRect,
        };

        return {
            timeline: tl,
            update({ t }) {
                targetText.text(`target: ${pick(t, TEXT.target)}`);
                blocks.controller.label.text(pick(t, TEXT.controller));
                blocks.actuator.label.text(pick(t, TEXT.actuator));
                blocks.plant.label.text(pick(t, TEXT.plant));
                distText.text(pick(t, TEXT.disturbance));
                sensorText.text(pick(t, TEXT.sensor));
                resultName.text(pick(t, TEXT.result));

                const focus = String(textAt(t, FOCUS));
                for(const name in focusable) {
                    const on = name === focus;
                    focusable[name].set({ stroke: on ? color.focus : color.dim, 'stroke-width': on ? 3 : 1.5 });
                }
            },
        };
    },
});
