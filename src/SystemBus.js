export default class SystemBus {
    constructor(PPU, timer, DMA, joypad, interrupts) {
        this.PPU = PPU;
        this.timer = timer;
        this.DMA = DMA;
        this.joypad = joypad;
        this.interrupts = interrupts;

        this.romRead = (address) => 0xFF;
        this.romWrite = (address, value) => {};
        this.eramRead = (address) => 0xFF;
        this.eramWrite = (address, value) => {};
        this.wramRead = (address) => 0xFF;
        this.wramWrite = (address, value) => {};
        this.hramRead = (address) => 0xFF;
        this.hramWrite = (address, value) => {};

        this.bootROM = null; // Uint8Array
        this.bootEnabled = 1; // desabilita ao escrever 0xFF50
    }

    attachBootROM(bootROM) {
        this.bootROM = bootROM;
        this.bootEnabled = 1;
    }

    detachBootROM() {
        this.bootROM = null;
        this.bootEnabled = 0;
    }

    attachWRAM(readByte, writeByte) {
        this.wramRead = readByte;
        this.wramWrite = writeByte;
    }

    attachHRAM(readByte, writeByte) {
        this.hramRead = readByte;
        this.hramWrite = writeByte;
    }

    attachCartridge(romRead, romWrite, eramRead, eramWrite) {
        if (romRead)  this.romRead  = romRead;
        if (romWrite) this.romWrite = romWrite;
        if (eramRead) this.eramRead = eramRead;
        if (eramWrite) this.eramWrite = eramWrite;
    }

    readByte(address) {
        address &= 0xFFFF;

        if (this.bootEnabled && this.bootROM && address < this.bootROM.length && address < 0x100) { // Boot ROM mapeada sobre 0x0000-0x00FF enquanto habilitada
            return this.bootROM[address] & 0xFF;
        }

        if (address <= 0x7FFF) { // 0x0000-0x7FFF ROM (Cartucho/MBC)
            return this.romRead(address) & 0xFF;
        }

        if (address >= 0x8000 && address <= 0x9FFF) { // 0x8000-0x9FFF VRAM (PPU)
            return this.PPU.readByte(address - 0x8000) & 0xFF;
        }

        if (address >= 0xA000 && address <= 0xBFFF) { // 0xA000-0xBFFF ERAM (cartucho/MBC)
            return this.eramRead(address - 0xA000) & 0xFF;
        }

        if (address >= 0xC000 && address <= 0xDFFF) { // 0xC000-0xDFFF WRAM
            return this.wramRead(address - 0xC000) & 0xFF;
        }

        if (address >= 0xE000 && address <= 0xFDFF) { // 0xE000-0xFDFF Espelho de WRAM
            return this.wramRead(address - 0xE000) & 0xFF;
        }

        if (address >= 0xFE00 && address <= 0xFE9F) { // 0xFE00-0xFE9F OAM (PPU)
            return this.PPU.readByte(address - 0xFE00) & 0xFF;
        }

        if (address === 0xFF00) { // 0xFF00 joypad
            return this.joypad.readByte(0xFF00) & 0xFF;
        }

        if (address >= 0xFF01 && address <= 0xFF02) { // 0xFF01-0xFF02 Serial
            return 0xFF;
        }
        
        if (address >= 0xFF04 && address <= 0xFF07) { // 0xFF04-0xFF07 Timer
            return this.timer.readByte(address) & 0xFF;
        }

        if (address === 0xFF0F) { // 0xFF0F Interrupts
            return this.interrupts.readByte(0xFF0F) & 0xFF;
        }

        if (address >= 0xFF10 && address <= 0xFF3F) { // 0xFF10-0xFF3F Sound
            return 0xFF;
        }

        if (address >= 0xFF40 && address <= 0xFF4B) { // 0xFF40-0xFF4B PPU
            return this.PPU.readByte(address) & 0xFF;
        }

        if (address === 0xFF46) { // 0xFF46 DMA
            return this.DMA.readByte(0xFF46) & 0xFF;
        }

        if (address === 0xFF50) { // 0xFF50 Boot ROM disable
            return this.bootEnabled ? 1 : 0;
        }

        if (address >= 0xFF80 && address <= 0xFFFE) { // 0xFF80-0xFFFE HRAM
            return this.hramRead(address - 0xFF80) & 0xFF;
        }

        if (address === 0xFFFF) { // 0xFFFF IE (Interrupt Enable)
            return this.interrupts.readByte(0xFFFF) & 0xFF;
        }

        return 0xFF;
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address <= 0x7FFF) { // 0x0000-0x7FFF ROM (Cartucho/MBC)
            this.romWrite(address, value);
            return;
        }

        if (address >= 0x8000 && address <= 0x9FFF) { // 0x8000-0x9FFF VRAM (PPU)
            this.PPU.writeByte(address - 0x8000, value);
            return;
        }

        if (address >= 0xA000 && address <= 0xBFFF) { // 0xA000-0xBFFF ERAM (Cartucho/MBC)
            this.eramWrite(address - 0xA000, value);
            return;
        }

        if (address >= 0xC000 && address <= 0xDFFF) { // 0xC000-0xDFFF WRAM
            this.wramWrite(address - 0xC000, value);
            return;
        }

        if (address >= 0xE000 && address <= 0xFDFF) { // 0xE000-0xFDFF Espelho de WRAM
            this.wramWrite(address - 0xE000, value);
            return;
        }

        if (address >= 0xFE00 && address <= 0xFE9F) { // 0xFE00-0xFE9F OAM (PPU)
            this.PPU.writeByte(address - 0xFE00, value);
            return;
        }

        if (address === 0xFF00) { // 0xFF00 Joypad
            this.joypad.writeByte(0xFF00, value);
            return;
        }

        if (address >= 0xFF04 && address <= 0xFF07) { // 0xFF04-0xFF07 Timer
            this.timer.writeByte(address, value);
            return;
        }

        if (address === 0xFF0F) { // 0xFF10-0xFFFF Interrupts
            this.interrupts.writeByte(address, value);
            return;
        }

        if (address >= 0xFF10 && address <= 0xFF3F) { // 0xFF10-0xFF3F Sound
            return;
        }

        if (address >= 0xFF40 && address <= 0xFF4B) { // 0xFF40-0xFF4B PPU
            this.PPU.writeByte(address, value);
            return;
        }

        if (address === 0xFF46) { // 0xFF46 DMA
            this.DMA.writeByte(address, value);
            return;
        }

        if (address === 0xFF50) { // 0xFF50 Boot ROM disable
            if (value === 1) this.bootEnabled = 0;
            return;
        }

        if (address >= 0xFF51 && address <= 0xFF55) { // 0xFF51-0xFF55 HDMA
            this.DMA.writeByte(address, value);
            return;
        }

        if (address >= 0xFF80 && address <= 0xFFFE) { // 0xFF80-0xFFFE HRAM
            this.hramWrite(address - 0xFF80, value);
            return;
        }

        if (address === 0xFFFF) { // 0xFFFF IE (Interrupt Enable)
            this.interrupts.writeByte(address, value);
            return;
        }

        return;
    }
}