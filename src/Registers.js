export default class Registers {
    constructor(flags) {
        this.flags = flags;
        this.A = 0x01; // Acumulador
        this.F = 0xB0; // Flags de status
        this.B = 0x00;
        this.C = 0x13;
        this.D = 0x00;
        this.E = 0xD8;
        this.H = 0x01;
        this.L = 0x4D;
        this.PC = 0x0100; // Program Counter
        this.SP = 0xFFFE; // Stack Pointer

    }

    set F(value) {
        this.flags.setF(value & 0xF0);
    }

    get F() {
        return this.flags.getF() & 0xF0;
    }

    set AF(value) {
        this.A = (value >> 8) & 0xFF;
        this.F = value & 0xFF;
    }

    get AF() {
        return ((this.A << 8) | this.F) & 0xFFFF;
    }

    set BC(value) {
        this.B = (value >> 8) & 0xFF;
        this.C = value & 0xFF;
    }

    get BC() {
        return ((this.B << 8) | this.C) & 0xFFFF;
    }

    set DE(value) {
        this.D = (value >> 8) & 0xFF;
        this.E = value & 0xFF;
    }

    get DE() {
        return ((this.D << 8) | this.E) & 0xFFFF;
    }

    set HL(value) {
        this.H = (value >> 8) & 0xFF;
        this.L = value & 0xFF;
    }

    get HL() {
        return ((this.H << 8) | this.L) & 0xFFFF;
    }
}