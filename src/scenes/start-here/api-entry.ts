import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const CHAR = 8.4;
const X = 22;

// Which parts of the entry are lit at each moment, and the question that part answers
const PARTS: { at: number; question: string; lit: string[] }[] = [
    { at: 0, question: '', lit: [] },
    { at: 3.5, question: 'What is it called?', lit: ['name'] },
    { at: 8, question: 'What does it do?', lit: ['brief'] },
    { at: 13, question: 'What do I give it, and in what units?', lit: ['argSig', 'params'] },
    { at: 19, question: 'What do I get back?', lit: ['retSig', 'returns'] },
    { at: 24.5, question: 'What can go wrong?', lit: ['errno'] },
    { at: 30, question: 'What can wait for now?', lit: ['wait'] },
    { at: 35, question: 'What does real use look like?', lit: ['example'] },
    { at: 41, question: '', lit: [] },
];

export default defineScene({
    label: 'The documentation entry for pros::MotorGroup::move_voltage, drawn in the order the docs site shows it: signature, include line, one-sentence description, parameters, return value, errno note and example. One part at a time is highlighted with the question it answers.',
    width: 620,
    height: 500,
    duration: 46,
    beats: [
        { at: 0, text: 'This is one entry from the PROS docs, the page for the function that sets how hard a group of motors pushes. Every function in the library has an entry shaped like this one.' },
        { at: 3.5, text: 'First, the <em>name</em>. You find an entry by it, or by browsing the group it lives in. Here the group is <em>MotorGroup</em>, and the name is <em>move_voltage</em>.' },
        { at: 8, text: 'Next, the <em>brief</em>: one plain sentence. It sets the voltage sent to the motors, anywhere from -12000 to 12000, in millivolts. Read this before anything else.' },
        { at: 13, text: 'The <em>parameters</em> are what you hand over. There is one, called <em>voltage</em>, and the docs give its range. The parentheses in the signature list the same thing. Check the unit every time.' },
        { at: 19, text: 'The <em>return value</em> is what you get back. The type on the far left of the signature says what kind of number it is, and the Returns text says what it means: 1 for success, <em>PROS_ERR</em> for failure.' },
        { at: 24.5, text: 'When a call fails, PROS also sets a variable called <em>errno</em> to a code. This entry lists the one it can use: <em>ENODEV</em>, meaning a port that is not a motor. Skim this part now and use it when something misbehaves.' },
        { at: 30, text: 'Some parts you can skip until C++ Foundations explains them. <em>const</em> and <em>virtual</em> promise things about how the function works, and the <em>#include</em> line is already handled in a PROS project.' },
        { at: 35, text: 'Last, the <em>example</em>: a few real lines using the function. Copy its shape, then change the numbers. The example assumes a motor group called <em>mg</em> already exists.' },
        { at: 41, text: 'In order: name, brief, parameters, return value, example, and errno when something breaks. The entries around this one in the docs follow the same shape.' },
    ],
    build({ draw }) {
        const parts: Record<string, { opacity(v: number): unknown }[]> = {};
        const lit = (name: string, node: { opacity(v: number): unknown }) => {
            parts[name] = (parts[name] ?? []).concat(node);
        };

        const question = draw.text('', X, 30, { size: 16, color: color.focus, italic: true });
        draw.line(X, 44, 598, 44, { color: color.rule, width: 1 });

        // The highlight bands sit behind the text
        const bandFor: Record<string, ReturnType<typeof draw.rect>> = {};
        const band = (name: string, x: number, y: number, w: number, h: number) => {
            bandFor[name] = draw.rect(x, y, w, h, { fill: 'rgba(244, 211, 94, 0.14)' });
        };
        band('name', X + 13.6 * CHAR - 4, 62, 12 * CHAR + 8, 24);
        band('retSig', X - 4, 62, 12 * CHAR + 8, 24);
        band('argSig', X + 26.6 * CHAR - 4, 62, 28 * CHAR + 8, 24);
        band('wait1', X + 56.2 * CHAR - 4, 62, 13 * CHAR + 8, 24);
        band('wait2', X - 4, 90, 31 * CHAR + 8, 22);
        band('brief', X - 6, 122, 592, 28);
        band('params', X - 6, 172, 592, 52);
        band('returns', X - 6, 236, 592, 58);
        band('errno', X - 6, 304, 592, 52);
        band('example', X - 6, 366, 592, 126);

        // Signature, in pieces so each can be lit on its own
        const sigY = 80;
        const piece = (text: string, col: number, name: string) => {
            const node = draw.text(text, X + col * CHAR, sigY, { mono: true, size: 14 });
            node.el.style.whiteSpace = 'pre';
            lit(name, node);
            return node;
        };
        piece('std::int32_t', 0, 'retSig');
        piece('move_voltage', 13.6, 'name');
        piece('(const std::int32_t voltage)', 26.6, 'argSig');
        piece('const virtual', 56.2, 'wait1');
        const include = draw.text('#include <pros/motor_group.hpp>', X, 106, { mono: true, size: 14, color: color.dim });
        lit('wait2', include);

        const brief = draw.text('Sets the output voltage for the motor group from -12000 to 12000 in millivolts.', X, 142, { size: 15 });
        lit('brief', brief);

        // Parameters
        lit('params', draw.text('Parameters', X, 188, { size: 13, color: color.dim }));
        lit('params', draw.text('voltage', X + 16, 212, { mono: true, size: 14 }));
        lit('params', draw.text('The new voltage value from -12000 to 12000', X + 110, 212, { size: 14 }));

        // Returns
        lit('returns', draw.text('Returns', X, 252, { size: 13, color: color.dim }));
        lit('returns', draw.text('1 if the operation was successful or PROS_ERR if the operation failed,', X + 16, 274, { size: 14 }));
        lit('returns', draw.text('setting errno.', X + 16, 292, { size: 14 }));

        // errno
        lit('errno', draw.text('This function uses the following values of errno when an error state is reached:', X, 322, { size: 14 }));
        lit('errno', draw.text('ENODEV', X + 16, 346, { mono: true, size: 14 }));
        lit('errno', draw.text('- The port cannot be configured as a motor', X + 16 + 7 * CHAR, 346, { size: 14 }));

        // Example
        lit('example', draw.text('Example', X, 382, { size: 13, color: color.dim }));
        const code = ['void autonomous() {', '    mg.move_voltage(12000);', '    pros::delay(1000); // Move at max voltage for 1 second', '    mg.move_voltage(0);', '}'];
        code.forEach((line, i) => {
            const node = draw.text(line, X + 16, 406 + i * 19, { mono: true, size: 13 });
            node.el.style.whiteSpace = 'pre';
            lit('example', node);
        });

        const allNames = ['name', 'retSig', 'argSig', 'wait1', 'wait2', 'brief', 'params', 'returns', 'errno', 'example'];

        return ({ t }) => {
            let current = PARTS[0];
            for(const part of PARTS) {
                if(part.at <= t + 1e-6) {
                    current = part;
                }
            }
            const everything = current.lit.length === 0;

            // 'wait' lights two pieces
            const active = current.lit.flatMap((name) => (name === 'wait' ? ['wait1', 'wait2'] : [name]));

            allNames.forEach((name) => {
                const on = everything || active.includes(name);
                (parts[name] ?? []).forEach((node) => node.opacity(on ? 1 : 0.3));
                const b = bandFor[name];
                if(b) {
                    b.opacity(!everything && on ? 1 : 0);
                }
            });
            question.text(current.question);
        };
    },
});
