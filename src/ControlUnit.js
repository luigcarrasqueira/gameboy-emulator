import InterruptsController from "./InterruptsController.js";
import OpcodeDecoder from "./OpcodeDecoder.js";
import FlagsRegister from "./FlagsRegister.js";
import Registers from "./Registers.js";
import Sequencer from "./Sequencer.js";
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
        this.sequencer  = new Sequencer();

        this.cycle = 0;
        this.halted = 0;
        this.haltBug = 0;
        this.IME = 0; // Interrupt Master Enable (flip-flop)
        this.eiDelay = 0; // Delay para EI (flip-flop)
        this.locked = false;
        this.servicingInterrupt = false;
    }

    step() {
        if (this.locked) {
            this.cycle += 4;
            return;
        }

        if (this.halted) {
            if (this.interrupts.pending() !== 0) {
                this.halted = 0;
            } else {
                this.cycle += 4;
                return;
            }
        }

        if (!this.sequencer.busy()) {
            if (!this.serviceInterrupts()) this.decoder.step(this);
        }

        this.sequencer.tick(this);

        if (!this.sequencer.busy()) {
            if (this.servicingInterrupt) {
                this.servicingInterrupt = false;
            } else if (this.eiDelay > 0 && --this.eiDelay === 0) {
                this.IME = 1;
            }
        }
    }

    fetchByte() {
        const byte = this.bus.readByte(this.registers.PC);
        if (this.haltBug) this.haltBug = false;
        else this.registers.PC = (this.registers.PC + 1) & 0xFFFF;
        return byte;
    }

    serviceInterrupts() {
        if (!this.IME || this.sequencer.busy()) return false;

        const pending = this.interrupts.pending();
        if ((pending & 0x1F) === 0) return false;

        let mask = 0;
        let vector = 0;
        if (pending & 0x01) { mask = IRQ.VBLANK; vector = 0x40; }
        else if (pending & 0x02) { mask = IRQ.LCDSTAT; vector = 0x48; }
        else if (pending & 0x04) { mask = IRQ.TIMER; vector = 0x50; }
        else if (pending & 0x08) { mask = IRQ.SERIAL; vector = 0x58; }
        else if (pending & 0x10) { mask = IRQ.JOYPAD; vector = 0x60; }
        else return false;

        this.IME = 0;
        this.halted = 0;
        this.eiDelay = 0;
        this.servicingInterrupt = true;
        this.interrupts.acknowledge(mask);
        
        const pc = this.registers.PC;
        this.sequencer.mcycle(() => {});
        this.sequencer.mcycle(() => {});
        this.sequencer.mcycle(() => {
            this.registers.SP = (this.registers.SP - 1) & 0xFFFF;
            this.bus.writeByte(this.registers.SP, pc >>> 8);
        });
        this.sequencer.mcycle(() => {
            this.registers.SP = (this.registers.SP - 1) & 0xFFFF;
            this.bus.writeByte(this.registers.SP, pc & 0xFF);
        });
        this.sequencer.mcycle(() => { this.registers.PC = vector; });
        return true;
    }
}
