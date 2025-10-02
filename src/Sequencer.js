export default class Sequencer {
    constructor(control) {
        this.control = control;
        this.queue = [];
    }

    enqueue(fn) {
        this.queue.push(fn);
    }

    tick() {
        if (this.queue.length === 0) return;
        const fn = this.queue.shift();
        fn();
        this.control.cycle += 4;
    }

    busy() {
        return this.queue.length > 0;
    }

    reset() {
        this.queue.length = 0;
    }
}