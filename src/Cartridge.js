export default class Cartridge {
    constructor(romBytes, { mbc = null, eram = null } = {}) {
        this.ROM = romBytes;
        this.MBC = mbc; // Memory Bank Controller (MBC)

        if (this.MBC) {
            if (eram) this.MBC.RAM = eram;
            this.RAM = this.MBC.RAM ?? null;
        } else {
            this.RAM = eram ?? null;
            this._romOnlyRamEnabled = true;
        }
    }

    readROM(address) {
        address &= 0xFFFF;

        if (this.MBC) return this.MBC.readROM(address);
        const offset = address;
        if (offset < 0x8000) return this.ROM[offset % this.ROM.length];
        return 0xFF;
    }

    writeROM(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (this.MBC) {
            this.MBC.writeROM(address, value);
            return;
        }
    }

    readERAM(address) {
        address &= 0xFFFF;

        if (this.MBC) return this.MBC.readERAM(address);
        const offset = address;
        if (!this.RAM || !this._romOnlyRamEnabled) return 0xFF;
        if (offset < 0xA000 || offset > 0xBFFF) return 0xFF;
        return this.RAM.readByte(offset - 0xA000);
    }

    writeERAM(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (this.MBC) {
            this.MBC.writeERAM(address, value);
            return;
        }
        const offset = address;
        if (!this.RAM || !this._romOnlyRamEnabled) return;
        if (offset < 0xA000 || offset > 0xBFFF) return;
        this.RAM.writeByte(offset - 0xA000, value);
    }
}