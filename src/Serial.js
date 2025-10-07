import IRQ from "./IRQ.js";

export default class Serial {
    constructor(interrupts) {
        this.interrupts = interrupts;
        this.SB = 0x00;  // Serial Data
        this.SC = 0x7E; // Serial Control
    }

    readByte(address) {
        address &= 0xFFFF;

        if (address === 0xFF01) return this.SB;
        if (address === 0xFF02) return this.SC | 0x7E;
        return 0xFF;
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address === 0xFF01) {
            this.SB = value;
            return;
        }

        if (address === 0xFF02) {
            const start = (value & 0x80) !== 0;
            this.SC = value & 0x81;

            if (start) {
                if (this.interrupts) this.interrupts.request(IRQ.SERIAL);
                this.SC &= 0x7E; // Reseta o bit de start
            }
        }
    }
}