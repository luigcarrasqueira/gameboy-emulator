import ControlUnit from "./ControlUnit.js";

// Processador (CPU - Central Processing Unit)
export default class CPU {
    constructor(bus) {
        this.bus = bus;
        this.controller = new ControlUnit(this.bus);
    }

    get cycle() { return this.controller.cycle; }
    set cycle(value) { this.controller.cycle = value; }

    get interrupts() { return this.controller.interrupts; }
    get registers()  { return this.controller.registers; }
    get flags()      { return this.controller.flags; }
    get ALU()        { return this.controller.ALU; }
    get decoder()    { return this.controller.decoder; }

    executeInstruction() {
        this.controller.step();
    }
}