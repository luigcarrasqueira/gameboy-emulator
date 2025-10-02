import LCD_MODE from "./LCD_MODE.js";
import DMA from "./DMA.js";

export default class SystemBus {
    constructor() {
        this.DMA = new DMA(
            address          => this.readByte(address),
            (address, value) => this.writeByte(address, value)
        );

        this.LCDC       = null;
        this.joypad     = null;
        this.timer      = null;
        this.interrupts = null;

        this.romRead   = (_address) => 0xFF;
        this.romWrite  = (_address, _value) => {};
        this.eramRead  = (_address) => 0xFF;
        this.eramWrite = (_address, _value) => {};
        this.wramRead  = (_address) => 0xFF;
        this.wramWrite = (_address, _value) => {};
        this.hramRead  = (_address) => 0xFF;
        this.hramWrite = (_address, _value) => {};

        this.bootROM = null; // Uint8Array
        this.bootEnabled = 1; // desabilita ao escrever 0xFF50
    }

    setLCDC(LCDC) {
        this.LCDC = LCDC;
    }

    setJoypad(joypad) {
        this.joypad = joypad;
    }

    setTimer(timer) {
        this.timer = timer;
    }

    setInterrupts(interrupts) {
        this.interrupts = interrupts;
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

        if (this.DMA.active && !(address >= 0xFF80 && address <= 0xFFFE) && address !== 0xFF46) {
            return 0xFF; // Durante o DMA, leituras de HRAM retornam 0xFF
        }

        if (this.bootEnabled && this.bootROM && address < this.bootROM.length && address < 0x100) { // Boot ROM mapeada sobre 0x0000-0x00FF enquanto habilitada
            return this.bootROM[address] & 0xFF;
        }

        if (address <= 0x7FFF) { // 0x0000-0x7FFF ROM (Cartucho/MBC)
            return this.romRead(address) & 0xFF;
        }

        if (address >= 0x8000 && address <= 0x9FFF) { // 0x8000-0x9FFF VRAM (LCDC)
            if (this.LCDC.mode === LCD_MODE.VRAM) return 0xFF; // Durante o modo 3 (transferência de dados para LCD), VRAM não pode ser lida
            return this.LCDC.readByte(address - 0x8000) & 0xFF;
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

        if (address >= 0xFE00 && address <= 0xFE9F) { // 0xFE00-0xFE9F OAM (LCDC)
            if (this.LCDC.mode === LCD_MODE.OAM || this.LCDC.mode === LCD_MODE.VRAM) return 0xFF; // Durante os modos 2 e 3, OAM não pode ser lida

            return this.LCDC.readByte(address - 0xFE00) & 0xFF;
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

        if (address >= 0xFF40 && address <= 0xFF4B) { // 0xFF40-0xFF4B LCDC
            if (address === 0xFF46) return this.DMA.readByte(0xFF46) & 0xFF; // 0xFF46 DMA

            return this.LCDC.readByte(address) & 0xFF;
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

        if (this.DMA.active && !(address >= 0xFF80 && address <= 0xFFFE) && address !== 0xFF46) {
            return; // Durante o DMA, escritas de HRAM são permitidas
        }

        if (address <= 0x7FFF) { // 0x0000-0x7FFF ROM (Cartucho/MBC)
            this.romWrite(address, value);
            return;
        }

        if (address >= 0x8000 && address <= 0x9FFF) { // 0x8000-0x9FFF VRAM (LCDC)
            this.LCDC.writeByte(address - 0x8000, value);
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

        if (address >= 0xFE00 && address <= 0xFE9F) { // 0xFE00-0xFE9F OAM (LCDC)
            if (this.LCDC.mode === LCD_MODE.OAM || this.LCDC.mode === LCD_MODE.VRAM) return; // Durante os modos 2 e 3, OAM não pode ser escrita

            this.LCDC.writeByte(address - 0xFE00, value);
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

        if (address >= 0xFF40 && address <= 0xFF4B) { // 0xFF40-0xFF4B LCDC
            if (address === 0xFF46) { // 0xFF46 DMA
                this.DMA.writeByte(address, value);
                return;
            }

            this.LCDC.writeByte(address, value);
            return;
        }

        if (address === 0xFF50) { // 0xFF50 Boot ROM disable
            if (value !== 0) this.bootEnabled = 0;
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