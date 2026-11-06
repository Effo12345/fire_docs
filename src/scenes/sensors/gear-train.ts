import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { CIRCUMFERENCE, WHEEL_DIAMETER, BLUE_DEGREES_PER_TICK, wheelTurns, inchesDriven } from './lib/gearing';

const RULER_LEFT = 40;
const RULER_RIGHT = 680;
const RULER_INCHES = 96;
const RULER_Y = 340;
const GEAR_Y = 135;
const DRIVER_X = 100;
const PER_TOOTH = 1.2;
const DRIVER_CHOICES = [24, 36, 48];
const DRIVEN_CHOICES = [36, 48, 60];

const sx = (inches: number) => RULER_LEFT + (inches / RULER_INCHES) * (RULER_RIGHT - RULER_LEFT);

const nearest = (choices: number[], value: number) =>
    choices.reduce((best, c) => (Math.abs(c - value) < Math.abs(best - value) ? c : best));

export default defineScene({
    label: 'A small gear on the motor shaft turns a larger gear on the wheel shaft. Sliders set how far the motor turns and how many teeth each gear has, and the wheel rolls along a ruler while the arithmetic from motor degrees to inches updates beside it.',
    height: 410,
    duration: 0,
    params: [
        { key: 'motor', label: 'motor shaft turned (degrees)', min: 0, max: 2400, step: 10, value: 720, digits: 0 },
        { key: 'driver', label: 'teeth on the motor gear', min: 24, max: 48, step: 12, value: 36, digits: 0 },
        { key: 'driven', label: 'teeth on the wheel gear', min: 36, max: 60, step: 12, value: 48, digits: 0 },
    ],
    build({ draw }) {
        // One gear per tooth count, built once; the update shows the chosen pair
        const gear = (teeth: number, phase: number) => {
            const radius = teeth * PER_TOOTH;
            const g = draw.group();
            draw.circle(0, 0, radius, { color: color.value, width: 2, parent: g.el });
            for(let k = 0; k < teeth; k++) {
                const a = ((k + phase) / teeth) * 2 * Math.PI;
                draw.line(Math.cos(a) * radius, Math.sin(a) * radius, Math.cos(a) * (radius + 6), Math.sin(a) * (radius + 6), { color: color.value, width: 2, parent: g.el });
            }
            draw.line(0, 0, radius, 0, { color: color.focus, width: 2.5, parent: g.el });
            draw.circle(0, 0, 3, { fill: color.ink, parent: g.el });

            return { g, radius };
        };

        const drivers = DRIVER_CHOICES.map(teeth => ({ teeth, ...gear(teeth, 0) }));
        const drivens = DRIVEN_CHOICES.map(teeth => ({ teeth, ...gear(teeth, 0.5) }));

        const driverLabel = draw.text('', DRIVER_X, 28, { color: color.dim, size: 14, anchor: 'middle' });
        const drivenLabel = draw.text('', 0, 28, { color: color.dim, size: 14, anchor: 'middle' });
        draw.text('motor gear', DRIVER_X, 236, { color: color.dim, size: 14, anchor: 'middle' });
        const drivenName = draw.text('wheel gear', 0, 236, { color: color.dim, size: 14, anchor: 'middle' });

        const chain = [0, 1, 2, 3, 4].map(i => draw.text('', 340, 70 + i * 28, { size: 15 }));
        const ticks = draw.text('', 340, 70 + 5 * 28 + 4, { size: 13, color: color.dim });

        draw.line(sx(0), RULER_Y + 18, sx(RULER_INCHES), RULER_Y + 18, { color: color.rule, width: 1 });
        for(let inches = 0; inches <= RULER_INCHES; inches += 12) {
            draw.line(sx(inches), RULER_Y + 18, sx(inches), RULER_Y + 24, { color: color.rule, width: 1 });
            draw.text(inches, sx(inches), RULER_Y + 42, { color: color.dim, size: 13, anchor: 'middle' });
        }
        draw.text('inches', RULER_RIGHT, RULER_Y + 62, { color: color.dim, size: 13, anchor: 'end' });
        draw.line(sx(48), RULER_Y - 20, sx(48), RULER_Y + 18, { color: color.target, width: 1.5, dash: '4 4' });
        draw.text('48 in', sx(48), RULER_Y - 28, { color: color.target, size: 13, anchor: 'middle' });

        const trail = draw.line(sx(0), RULER_Y + 18, sx(0), RULER_Y + 18, { color: color.focus, width: 3 });
        const wheelRadius = (WHEEL_DIAMETER / 2) * ((RULER_RIGHT - RULER_LEFT) / RULER_INCHES);
        const wheel = draw.group();
        draw.circle(0, 0, wheelRadius, { color: color.value, width: 2, parent: wheel.el });
        draw.line(0, 0, wheelRadius, 0, { color: color.focus, width: 2, parent: wheel.el });
        draw.text('3.25 in wheel, drawn to scale', RULER_LEFT, RULER_Y - 28, { color: color.dim, size: 13 });

        return ({ p }) => {
            const driver = nearest(DRIVER_CHOICES, p.driver);
            const driven = nearest(DRIVEN_CHOICES, p.driven);

            const small = drivers.find(d => d.teeth === driver)!;
            const big = drivens.find(d => d.teeth === driven)!;
            const drivenX = DRIVER_X + small.radius + big.radius + 8;

            for(const d of drivers) {
                d.g.show(d === small);
            }
            for(const d of drivens) {
                d.g.show(d === big);
            }

            // Meshed gears turn opposite ways, and the tooth counts set the speed ratio
            small.g.move(DRIVER_X, GEAR_Y, -p.motor);
            big.g.move(drivenX, GEAR_Y, p.motor * (driver / driven));
            driverLabel.text(`${driver} teeth`);
            drivenLabel.at(drivenX, 28).text(`${driven} teeth`);
            drivenName.at(drivenX, 236);

            const turns = wheelTurns(p.motor, driver, driven);
            const inches = inchesDriven(p.motor, driver, driven);

            chain[0].text(`motor: ${(p.motor / 360).toFixed(2)} turns (${p.motor.toFixed(0)}°)`);
            chain[1].text(`× ${driver}/${driven} = ${(driver / driven).toFixed(3)}`).set({ fill: color.dim });
            chain[2].text(`wheel: ${turns.toFixed(2)} turns`);
            chain[3].text(`× ${CIRCUMFERENCE.toFixed(2)} in per turn`).set({ fill: color.dim });
            chain[4].text(`= ${inches.toFixed(2)} in`).set({ fill: color.focus });
            ticks.text(`${Math.round(p.motor / BLUE_DEGREES_PER_TICK)} ticks on a blue cartridge`);

            const x = sx(Math.min(inches, RULER_INCHES));
            wheel.move(x, RULER_Y + 18 - wheelRadius, turns * 360);
            trail.to(sx(0), RULER_Y + 18, x, RULER_Y + 18);
        };
    },
});
