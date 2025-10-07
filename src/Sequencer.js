export default class Sequencer {
    constructor() {
        this.mcycleQueue = [];
    }

    mcycle(fn) {
        this.mcycleQueue.push(fn);
    }

    tick(control) {
        if (this.mcycleQueue.length === 0) return;
        const fn = this.mcycleQueue.shift();
        fn();
        control.cycle += 4;
    }

    busy() {
        return this.mcycleQueue.length > 0;
    }

    reset() {
        this.mcycleQueue.length = 0;
    }
}