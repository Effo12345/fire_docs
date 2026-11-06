// The <fire-scene> element. Loads a scene when it nears the screen, then runs its
// controls. Scenes never handle time or input themselves.
import type { Frame, Param, SceneDef, SceneContext, Seekable, Update } from './scene';
import { Draw } from './draw';
import { color } from './palette';

const modules = import.meta.glob<{ default: SceneDef }>('/src/scenes/**/*.ts');
const SVG_NS = 'http://www.w3.org/2000/svg';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const digitsOf = (param: Param) => param.digits ?? (param.step < 0.1 ? 2 : param.step < 1 ? 1 : 0);

class FireScene extends HTMLElement {
    private def!: SceneDef;
    private update?: Update;
    private seekable?: Seekable;
    private duration = 0;
    private t = 0;
    private playing = false;
    private hasPlayed = false;
    private lastNow = 0;
    private frameId = 0;
    private dirty = true;
    private target: Record<string, number> = {};
    private shown: Record<string, number> = {};
    private playButton?: HTMLButtonElement;
    private scrub?: HTMLInputElement;
    private timeOut?: HTMLOutputElement;
    private beatLine?: HTMLParagraphElement;
    private sliders: Record<string, [HTMLInputElement, HTMLOutputElement]> = {};

    connectedCallback() {
        const near = new IntersectionObserver((entries) => {
            if(entries[0].isIntersecting) {
                near.disconnect();
                this.load();
            }
        }, { rootMargin: '500px' });
        near.observe(this);
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
    }

    private async load() {
        const name = this.dataset.name!;
        try {
            const mod = await modules[`/src/scenes/${name}.ts`]();
            this.mount(mod.default);
        }
        catch(err) {
            console.error(`Scene ${name} failed`, err);
            this.innerHTML = '';
            const message = document.createElement('p');
            message.className = 'fd-scene-error';
            message.textContent = 'This animation failed to load. Try reloading the page.';
            this.append(message);
            this.dataset.state = 'error';
        }
    }

    private mount(def: SceneDef) {
        this.def = def;
        const width = def.width ?? 720;
        const height = def.height ?? 400;
        for (const param of def.params ?? []) {
            this.target[param.key] = param.value;
            this.shown[param.key] = param.value;
        }

        const stage = document.createElement('div');
        stage.className = 'fd-stage';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', def.label);
        stage.append(svg);

        const ctx: SceneContext = {
            svg,
            draw: new Draw(svg),
            color,
            width,
            height,
            setParam: (key, value) => this.setParam(key, value),
            drag: (el, onMove) => this.makeDraggable(svg, el, onMove),
        };
        const built = def.build(ctx);
        if(typeof built === 'function') {
            this.update = built;
        }
        else {
            this.update = built.update;
            this.seekable = built.timeline;
        }
        this.duration = def.duration ?? this.seekable?.duration() ?? 0;

        this.innerHTML = '';
        this.append(stage);
        this.buildControls();
        this.startingFrame();
        this.dataset.state = 'ready';
    }

    private startingFrame() {
        const seek = new URLSearchParams(location.search).get('seek');
        if(seek !== null) {
            this.t = Number(seek) * this.duration;
            this.hasPlayed = true;
        }
        else if(reducedMotion()) {
            // No motion, so start on the finished picture
            this.t = this.duration;
            this.hasPlayed = true;
        }
        else if(this.duration > 0 && this.def.autoplay !== false) {
            const seen = new IntersectionObserver((entries) => {
                if(entries[0].isIntersecting) {
                    seen.disconnect();
                    if(!this.hasPlayed) {
                        this.hasPlayed = true;
                        this.setPlaying(true);
                    }
                }
            }, { threshold: 0.55 });
            seen.observe(this);
        }

        // Stop running while offscreen
        new IntersectionObserver((entries) => {
            if(!entries[0].isIntersecting && this.playing) this.setPlaying(false);
        }).observe(this);

        this.requestFrame();
    }

    private buildControls() {
        const def = this.def;
        if(def.beats?.length) {
            this.beatLine = document.createElement('p');
            this.beatLine.className = 'fd-beat';
            this.append(this.beatLine);
        }

        if(this.duration > 0) {
            const row = document.createElement('div');
            row.className = 'fd-controls';

            this.playButton = document.createElement('button');
            this.playButton.type = 'button';
            this.playButton.className = 'fd-play';
            this.playButton.addEventListener('click', () => {
                if(this.t >= this.duration) this.t = 0;
                this.hasPlayed = true;
                this.setPlaying(!this.playing);
            });

            const track = document.createElement('div');
            track.className = 'fd-track';
            this.scrub = document.createElement('input');
            this.scrub.type = 'range';
            this.scrub.min = '0';
            this.scrub.max = '1000';
            this.scrub.value = '0';
            this.scrub.setAttribute('aria-label', 'Animation time');
            this.scrub.addEventListener('input', () => {
                this.hasPlayed = true;
                this.setPlaying(false);
                this.t = (Number(this.scrub!.value) / 1000) * this.duration;
                this.requestFrame();
            });
            track.append(this.scrub);

            if(def.beats && def.beats.length > 1) {
                const ticks = document.createElement('div');
                ticks.className = 'fd-ticks';
                ticks.setAttribute('aria-hidden', 'true');
                for (const beat of def.beats) {
                    const tick = document.createElement('i');
                    tick.style.left = `${(beat.at / this.duration) * 100}%`;
                    ticks.append(tick);
                }
                track.append(ticks);
            }

            this.timeOut = document.createElement('output');
            row.append(this.playButton, track, this.timeOut);
            this.append(row);
        }

        const visible = (def.params ?? []).filter((param) => !param.hidden);
        if(visible.length) {
            const grid = document.createElement('div');
            grid.className = 'fd-params';
            for (const param of visible) {
                const id = `${this.dataset.name}-${param.key}`.replace(/\W/g, '-');
                const label = document.createElement('label');
                label.htmlFor = id;
                label.innerHTML = param.label;
                const input = document.createElement('input');
                input.type = 'range';
                input.id = id;
                input.min = String(param.min);
                input.max = String(param.max);
                input.step = String(param.step);
                input.value = String(param.value);
                const out = document.createElement('output');
                out.textContent = param.value.toFixed(digitsOf(param));
                input.addEventListener('input', () => this.setParam(param.key, Number(input.value)));
                this.sliders[param.key] = [input, out];
                grid.append(label, input, out);
            }
            this.append(grid);
        }
    }

    private setParam(key: string, value: number) {
        this.target[key] = value;
        const param = this.def.params?.find((item) => item.key === key);
        const slider = this.sliders[key];
        if(slider && param) {
            slider[0].value = String(value);
            slider[1].textContent = value.toFixed(digitsOf(param));
        }
        if(reducedMotion()) this.shown[key] = value;
        this.requestFrame();
    }

    private makeDraggable(svg: SVGSVGElement, el: Element, onMove: (x: number, y: number) => void) {
        const move = (event: PointerEvent) => {
            const matrix = svg.getScreenCTM();
            if(!matrix) return;
            const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
            onMove(point.x, point.y);
        };
        (el as SVGElement).style.cursor = 'grab';
        (el as SVGElement).style.touchAction = 'none';
        el.addEventListener('pointerdown', (event) => {
            const pointer = event as PointerEvent;
            (el as SVGElement).setPointerCapture(pointer.pointerId);
            el.addEventListener('pointermove', move as EventListener);
        });
        el.addEventListener('pointerup', () => el.removeEventListener('pointermove', move as EventListener));
    }

    private setPlaying(playing: boolean) {
        this.playing = playing;
        this.requestFrame();
    }

    private requestFrame() {
        this.dirty = true;
        if(!this.frameId) {
            this.lastNow = performance.now();
            this.frameId = requestAnimationFrame((now) => this.tick(now));
        }
    }

    private tick(now: number) {
        this.frameId = 0;
        const dt = Math.min(0.05, (now - this.lastNow) / 1000);
        this.lastNow = now;
        let again = false;

        if(this.playing) {
            this.t = Math.min(this.duration, this.t + dt);
            if(this.t >= this.duration) this.playing = false;
            this.dirty = true;
            again = true;
        }

        // Ease sliders toward their new values, so curves flow to their new shape
        for (const key in this.target) {
            const gap = this.target[key] - this.shown[key];
            if(gap === 0) continue;
            const range = this.def.params!.find((item) => item.key === key)!;
            if(Math.abs(gap) < (range.max - range.min) * 0.001) {
                this.shown[key] = this.target[key];
            }
            else {
                this.shown[key] += gap * (1 - Math.exp(-dt * 14));
                again = true;
            }
            this.dirty = true;
        }

        if(this.dirty) {
            this.dirty = false;
            this.render();
        }
        if(again) {
            this.frameId = requestAnimationFrame((next) => this.tick(next));
        }
    }

    private render() {
        const frame: Frame = {
            t: this.t,
            u: this.duration > 0 ? this.t / this.duration : 1,
            p: this.shown,
        };
        this.seekable?.seek(this.t, false);
        this.update?.(frame);

        if(this.scrub) this.scrub.value = String(Math.round(frame.u * 1000));
        if(this.timeOut) this.timeOut.textContent = `${this.t.toFixed(1)} s`;
        if(this.playButton) {
            this.playButton.textContent = this.playing ? 'Pause' : this.t >= this.duration ? 'Replay' : 'Play';
        }
        if(this.beatLine && this.def.beats) {
            let text = '';
            for (const beat of this.def.beats) {
                if(beat.at <= this.t + 1e-6) text = beat.text;
            }
            if(this.beatLine.innerHTML !== text) this.beatLine.innerHTML = text;
        }
    }
}

if(!customElements.get('fire-scene')) customElements.define('fire-scene', FireScene);
