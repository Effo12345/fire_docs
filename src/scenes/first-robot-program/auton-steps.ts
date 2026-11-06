import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A drive helper run one line at a time. The motor lines return at once, the delay line makes the program wait while the wheels keep turning, and the brake lines at the end stop them.',
    stepTime: 2.2,
    code: `
void driveFor(int voltage, int ms) {
    leftDrive.move_voltage(voltage);
    rightDrive.move_voltage(voltage);
    pros::delay(ms);
    leftDrive.brake();
    rightDrive.brake();

    // Let it finish rolling before the next move
    pros::delay(150);
}

void autonomous() {
    driveFor(6000, 1000);
    // the next move goes here
}
`,
    steps: [
        { line: 13, vars: { voltage: 6000, ms: 1000, wheels: 'off', code: 'runs' }, note: '<code>autonomous</code> calls the helper. The wheels are stopped and the program is running.' },
        { line: 2, vars: { wheels: 'on' }, note: 'The left motors are given 6000 mV. The line takes almost no time: it hands the number to the motors and moves on.' },
        { line: 3, note: 'Same for the right side. The wheels start to turn, and the program has done nothing but run two quick lines.' },
        { line: 4, vars: { code: 'waits' }, note: 'Now the program sleeps for 1000 ms. This is a blocking call: the next line cannot run until it returns.' },
        { line: 4, note: 'The program is stuck on this one line, but the wheels are not. The motors keep the last command they were given, so the robot drives the whole time.' },
        { line: 5, vars: { code: 'runs' }, note: 'The delay ends and the program wakes up. The left side is told to brake, but the right side is still turning, because nothing has told it otherwise.' },
        { line: 6, vars: { wheels: 'off' }, note: 'The right side brakes too, and the robot slows to a stop. How long this takes depends on the floor and the speed.' },
        { line: 9, note: 'A short wait lets the robot finish rolling before the next move starts. The program waits again, but now the wheels are stopped.' },
        { line: 14, note: 'Only now does the next move begin. The routine knows how long it waited, and nothing about how far the robot went.' },
    ],
});
