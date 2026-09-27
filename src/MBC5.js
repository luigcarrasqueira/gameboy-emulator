import Memory from './Memory.js';

// MBC5 sem rumble: cartuchos 19, 1A e 1B.
export default class MBC5 {
    constructor(romBytes, ramBytes = 0) {
        this.ROM = romBytes;
        this.RAM = ramBytes > 0 ? new Memory(ramBytes) : null;
        this.romBank = 1;
        this.ramBank = 0;
        this.ramEnabled = false;
    }

    readROM(address) {
        const offset = address < 0x4000
            ? address
            : this.romBank * 0x4000 + (address & 0x3FFF);
        return this.ROM[offset % this.ROM.length] ?? 0xFF;
    }

    writeROM(address, value) {
        value &= 0xFF;
        if (address < 0x2000) this.ramEnabled = (value & 0x0F) === 0x0A;
        else if (address < 0x3000) this.romBank = (this.romBank & 0x100) | value;
        else if (address < 0x4000) this.romBank = (this.romBank & 0xFF) | ((value & 1) << 8);
        else if (address < 0x6000) this.ramBank = value & 0x0F;
    }

    _ramOffset(address) {
        return (this.ramBank * 0x2000 + (address & 0x1FFF)) % this.RAM.data.length;
    }

    readERAM(address) {
        if (!this.RAM || !this.ramEnabled) return 0xFF;
        // O endereço do chip pode ultrapassar 16 bits (RAM de até 128 KiB).
        return this.RAM.data[this._ramOffset(address)];
    }

    writeERAM(address, value) {
        if (this.RAM && this.ramEnabled) this.RAM.data[this._ramOffset(address)] = value & 0xFF;
    }
}
