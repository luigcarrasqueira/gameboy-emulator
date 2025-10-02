import ControlUnit from "./ControlUnit.js";

// Processador (CPU - Central Processing Unit)
export default class CPU {
    constructor(bus) {
        this.bus = bus;
        this.control = new ControlUnit(this.bus);
    }

    get cycle() { return this.control.cycle; }
    set cycle(value) { this.control.cycle = value; }

    get interrupts() { return this.control.interrupts; }
    get registers()  { return this.control.registers; }
    get flags()      { return this.control.flags; }
    get decoder()    { return this.control.decoder; }

    executeInstruction() {
        this.control.step();
    }
}