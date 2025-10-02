import InterruptsController from "./InterruptsController.js";
import OpcodeDecoder from "./OpcodeDecoder.js";
import FlagsRegister from "./FlagsRegister.js";
import Registers from "./Registers.js";
import ALU from "./ALU.js";
import IRQ from "./IRQ.js";

// Unidade de Controle da CPU (Control Unit)
export default class ControlUnit {
    constructor(bus) {
        this.bus = bus;

        this.interrupts = new InterruptsController();
        this.flags      = new FlagsRegister();
        this.registers  = new Registers(this.flags);
        this.ALU        = new ALU(this.flags);
        this.decoder    = new OpcodeDecoder(this);

        this.cycle = 0;
        this.halted = 0;
        this.haltBug = 0;
        this.IME = 0; // Interrupt Master Enable
        this.IMEDelay = 0; // Delay para habilitar IME após EI
    }

    step() {
        const start = this.cycle;
        
        this.serviceInterrupts();

        if (this.cycle !== start) return 0;

        if (this.halted) {
            if (this.interrupts.pending() !== 0) {
                this.halted = 0;
            } else {
                this.cycle += 4;
                return;
            }
        } else {
            this.decoder.step(this);
        }

        if (this.IMEDelay > 0) {
            this.IMEDelay--;
            if (this.IMEDelay === 0) this.IME = 1;
        }
    }

    POP() {
        const low = this.bus.readByte(this.registers.SP);
        const high = this.bus.readByte((this.registers.SP + 1) & 0xFFFF);
        this.registers.SP = (this.registers.SP + 2) & 0xFFFF;
        return (high << 8) | low;
    }

    PUSH(word) {
        word &= 0xFFFF;

        this.registers.SP = (this.registers.SP - 1) & 0xFFFF;
        this.bus.writeByte(this.registers.SP, (word >> 8) & 0xFF);
        this.registers.SP = (this.registers.SP - 1) & 0xFFFF;
        this.bus.writeByte(this.registers.SP, word & 0xFF);
    }

    fetchByte() {
        const byte = this.bus.readByte(this.registers.PC);
        if (this.haltBug) this.haltBug = false;
        else this.registers.PC = (this.registers.PC + 1) & 0xFFFF;
        return byte;
    }

    fetchWord() {
        const low = this.fetchByte();
        const high = this.fetchByte();

        return (high << 8) | low;
    }

    writeWord(address, word) {
        address &= 0xFFFF;
        word &= 0xFFFF;

        this.bus.writeByte(address, word & 0xFF);
        this.bus.writeByte((address + 1) & 0xFFFF, (word >> 8) & 0xFF);
    }

    serviceInterrupts() {
        if (!this.IME) return;

        const pending = this.interrupts.pending();
        if ((pending & 0x1F) === 0) return;

        let mask = 0;
        let vector = 0;
        if (pending & 0x01) { mask = IRQ.VBLANK; vector = 0x40; }
        else if (pending & 0x02) { mask = IRQ.LCDSTAT; vector = 0x48; }
        else if (pending & 0x04) { mask = IRQ.TIMER; vector = 0x50; }
        else if (pending & 0x08) { mask = IRQ.SERIAL; vector = 0x58; }
        else if (pending & 0x10) { mask = IRQ.JOYPAD; vector = 0x60; }
        else return;

        this.cycle += 20;
        this.IME = 0;
        this.halted = 0;
        this.interrupts.acknowledge(mask);
        this.PUSH(this.registers.PC);
        this.registers.PC = vector;
    }

    jumpRelative(condition, expected) {
        const offset = this.fetchByte();
        const relativeOffset = (offset << 24) >> 24; // sign extend 8 to 32
        if (condition === expected) {
            this.registers.PC = (this.registers.PC + relativeOffset) & 0xFFFF;
            this.cycle += 12;
        } else {
            this.cycle += 8;
        }
    }
}