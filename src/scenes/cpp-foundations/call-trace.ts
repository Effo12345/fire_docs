import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A function named clamp is called with 140, 0 and 100. The highlighted line jumps up into the function, tests the value, returns 100, and jumps back to the call, where 100 is stored in speed.',
    code: `
int clamp(int value, int low, int high) {
    if(value < low) {
        return low;
    }
    if(value > high) {
        return high;
    }
    return value;
}

int speed = clamp(140, 0, 100);
`,
    steps: [
        { line: 11, note: 'The call. The program works out the three arguments and remembers this spot, so it knows where to come back to.' },
        { line: 1, vars: { value: 140, low: 0, high: 100 }, note: 'The jump. The parameters are new boxes, filled with copies of the arguments in order.' },
        { line: 2, note: 'Is 140 less than <code>low</code> (0)? No, so the body of this <code>if</code> is skipped.' },
        { line: 5, note: 'Is 140 greater than <code>high</code> (100)? Yes.' },
        { line: 6, note: '<code>return high</code> ends the function and hands back 100, the value in <code>high</code>.' },
        { line: 11, vars: { speed: 100, value: '', low: '', high: '' }, note: 'Back at the call. The whole call is replaced by the returned 100, and <code>speed</code> stores it. The function\'s boxes are gone.' },
    ],
});
