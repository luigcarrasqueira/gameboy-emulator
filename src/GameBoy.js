import Memory from "./Memory.js";
import Timer from "./Timer.js";
import CPU from "./CPU.js";
import PPU from "./PPU.js";
import MMU from "./MMU.js";

// Placa-mãe do Game Boy
export default class GameBoy {
    constructor() {
        this.ROM = new Memory(0x8000, true); // ROM do cartucho
        this.VRAM = new Memory(0x2000); // Video RAM (0x8000-0x9FFF)
        this.ERAM = new Memory(0x2000); // External RAM (0xA000-0xBFFF)
        this.WRAM = new Memory(0x2000); // Work RAM (0xC000-0xDFFF)
        this.OAM = new Memory(0xA0); // Object Attribute Memory (0xFE00-0xFE9F)
        this.HRAM = new Memory(0x7F); // High RAM (0xFF80-0xFFFE)
        this.IO = new Memory(0x80); // Registros de I/O (0xFF00-0xFF7F)

        this.TIMER = new Timer(mask => this.requestInterrupt(mask));
        this.PPU = new PPU(this.VRAM, this.OAM, mask => this.requestInterrupt(mask));
        this.MMU = new MMU(this.ROM, this.ERAM, this.WRAM, this.VRAM, this.OAM, this.HRAM, this.IO, this.PPU, this.TIMER);
        this.CPU = new CPU(this.MMU);

        this.cartridge = null;
    }

    insertCartridge(cartridge) {
        this.cartridge = cartridge;

        if (cartridge.MBC) {
            this.ROM.readByte = address => cartridge.readROM(address);
            this.ROM.writeByte = (address, value) => cartridge.writeROM(address, value);
            this.ERAM.readByte = address => cartridge.readERAM(address);
            this.ERAM.writeByte = (address, value) => cartridge.writeERAM(address, value);
        } else {
            this.ROM.loadBytes(cartridge.ROM);
            if (cartridge.RAM) this.ERAM.loadBytes(cartridge.RAM.data);
        }
    }

    requestInterrupt(mask) {
        this.MMU.requestInterrupt(mask);
    }

    step() {
        const before = this.CPU.cycle;
        const stopped = this.CPU.executeInstruction();
        const cycles = this.CPU.cycle - before;

        if (cycles > 0) {
            this.PPU.tick(cycles);
            this.TIMER.tick(cycles);
        }

        return stopped ? null : cycles;
    }
}