import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { PIECE_START, REPORT_PERIOD, viewTime, windowShare } from './lib/hue';

const END = 800;

export default defineScene({
    label: 'A timeline of one game piece passing the optical sensor. A bar shows how long the piece is in view. Below it, a tick every 20 milliseconds shows how much of that reading\'s integration window had the piece in it. A long integration time or a fast piece leaves every reading mostly background.',
    width: 520,
    height: 400,
    duration: 0,
    params: [
        { key: 'speed', label: 'piece speed past the sensor (in/s, illustrative)', min: 5, max: 120, step: 1, value: 30, digits: 0 },
        { key: 'integration', label: 'integration time (ms)', min: 3, max: 712, step: 1, value: 100, digits: 0 },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 60, right: 490, top: 150, bottom: 300 },
            x: [0, END],
            y: [0, 1],
            xTicks: [0, 200, 400, 600, 800],
            xUnit: ' ms',
            yTicks: [0, 0.5, 1],
            yLabel: 'piece share',
        });

        draw.text('the piece is in view', 60, 40, { color: color.dim, size: 13 });
        const view = draw.line(0, 60, 0, 60, { color: color.focus, width: 8 });
        const viewText = draw.text('', 60, 92, { size: 14, color: color.focus });

        const bars = draw.path('', { color: color.value, width: 5 });
        const windowBar = draw.line(0, 340, 0, 340, { color: color.faint, width: 4 });
        const windowText = draw.text('', 60, 364, { size: 13, color: color.dim });
        draw.text('Each tick is one reading, every 20 ms.', 60, 112, { size: 13, color: color.dim });
        const best = draw.text('', 60, 388, { size: 14, color: color.value });

        return ({ p }) => {
            const inView = viewTime(p.speed);
            const x0 = axes.sx(PIECE_START);
            const x1 = axes.sx(Math.min(END, PIECE_START + inView));
            view.to(x0, 60, x1, 60);
            viewText.text(`${inView.toFixed(0)} ms at ${p.speed.toFixed(0)} in/s`);

            let d = '';
            let top = 0;
            for(let time = 0; time <= END; time += REPORT_PERIOD) {
                const share = windowShare(time, p.integration, PIECE_START, inView);
                top = Math.max(top, share);
                if(share > 0.005) {
                    d += `M${axes.sx(time).toFixed(1)} ${axes.sy(0).toFixed(1)}L${axes.sx(time).toFixed(1)} ${axes.sy(share).toFixed(1)}`;
                }
            }
            bars.d(d);

            // One window, drawn ending at the end of the piece's time in view
            const endTime = Math.min(END, PIECE_START + inView);
            windowBar.to(axes.sx(Math.max(0, endTime - p.integration)), 340, axes.sx(endTime), 340);
            windowText.text(`one ${p.integration.toFixed(0)} ms window, ending as the piece leaves`);
            best.text(`best reading is ${(top * 100).toFixed(0)}% piece`);
        };
    },
});
