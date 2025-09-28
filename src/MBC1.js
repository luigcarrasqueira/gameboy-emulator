import Memory from "./Memory.js";

// Controlador de banco de memória (MBC1 - Memory Bank Controller 1)
export default class MBC1 {
    constructor(romBytes, ramBanks = 0) {
        this.ROM = romBytes;
        this.RAM = null;

        this.romBankSize = 0x4000; // 16KB por banco
        this.ramBankSize = 0x2000; // 8KB por banco
        this.romBankCount = Math.max(1, (romBytes.length / this.romBankSize) | 0);
        this.ramBanks = ramBanks;

        if (ramBanks > 0) {
            this.RAM = new Memory(ramBanks * this.ramBankSize);
        }

        this.ramEnabled = false;
        this.low5 = 1; // Banco ROM baixo (5 bits)
        this.high2 = 0; // Banco ROM alto (2 bits)
        this.mode = 0; // Modo de banco (0 = ROM, 1 = RAM)
    }

    readROM(address) {
        address &= 0xFFFF;

        if (address < 0x4000) {
            const bank = this._calcFixedRomBank();
            const base = bank * this.romBankSize;
            return this.ROM[(base + address) % this.ROM.length];
        } else if (address >= 0x4000 && address < 0x8000) {
            const bank = this._calcSwitchableRomBank();
            const base = bank * this.romBankSize;
            const offset = address - 0x4000;
            return this.ROM[(base + offset) % this.ROM.length];
        }

        return 0xFF; // Endereços inválidos retornam 0xFF
    }

    writeROM(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address < 0x2000) {
            this.ramEnabled = (value & 0x0F) === 0x0A;
        } else if (address >= 0x2000 && address < 0x4000) {
           const newLow5 = value & 0x1F;
           this.low5 = (newLow5 === 0) ? 1 : newLow5;
        } else if (address >= 0x4000 && address < 0x6000) {
            this.high2 = value & 0x03;
        } else if (address >= 0x6000 && address < 0x8000) {
            this.mode = value & 0x01;
        }
    }

    readERAM(address) {
        address &= 0xFFFF;

        if (!this.RAM || !this.ramEnabled) return 0xFF;
        if (address < 0xA000 || address > 0xBFFF) return 0xFF;

        const bank = this._calcRamBank();
        const base = bank * this.ramBankSize;
        const offset = address - 0xA000;
        return this.RAM.readByte(base + offset);
    }

    writeERAM(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (!this.RAM) return;
        if (!this.ramEnabled) return;
        if (address < 0xA000 || address > 0xBFFF) return;

        const bank = this._calcRamBank();
        const base = bank * this.ramBankSize;
        const offset = address - 0xA000;
        this.RAM.writeByte(base + offset, value);
    }

    _calcSwitchableRomBank() {
        let bank = (this.mode === 0)
            ? ((this.high2 << 5) | (this.low5 & 0x1F)) >>> 0
            : (this.low5 & 0x1F);
        if ((bank & 0x1F) === 0) bank |= 1;
        bank %= this.romBankCount;
        if (bank === 0) bank = (this.romBankCount > 1) ? 1 : 0;
        return bank;
    }

    _calcFixedRomBank() {
        if (this.mode === 0) {
            return 0;
        } else {
            let bank = (this.high2 << 5) >>> 0;
            bank %= this.romBankCount;
            return bank;
        }
    }

    _calcRamBank() {
        if (this.ramBanks <= 0) return 0;
        if (this.mode === 0) return 0;
        return this.high2 % this.ramBanks;
    }
}