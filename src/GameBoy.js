import Interrupts from "./Interrupts.js";
import SystemBus from "./SystemBus.js";
import Memory from "./Memory.js";
import Timer from "./Timer.js";
import CPU from "./CPU.js";
import PPU from "./PPU.js";

// Placa-mãe do Game Boy
export default class GameBoy {
    constructor() {
        this.ROM  = new Memory(0x8000, 1); // ROM do cartucho         (0x0000-0x7FFF)
        this.VRAM = new Memory(0x2000);    // Video RAM               (0x8000-0x9FFF)
        this.ERAM = new Memory(0x2000);    // External RAM            (0xA000-0xBFFF)
        this.WRAM = new Memory(0x2000);    // Work RAM                (0xC000-0xDFFF)
        this.OAM  = new Memory(0xA0);      // Object Attribute Memory (0xFE00-0xFE9F)
        this.HRAM = new Memory(0x7F);      // High RAM                (0xFF80-0xFFFE)
        this.IO   = new Memory(0x80);      // Registros de I/O        (0xFF00-0xFF7F)

        this.interrupts = new Interrupts();

        this.timer = new Timer(mask => this.interrupts.request(mask)); // Timer Interrupt
        this.PPU = new PPU(this.VRAM, this.OAM, mask => this.interrupts.request(mask)); // V-Blank Interrupt
        this.joypad = { readByte: (addr) => 0xFF, writeByte: (addr, val) => {} }; // Joypad (placeholder)
        this.DMA = { readByte: (addr) => 0xFF, writeByte: (addr, val) => {} }; // DMA (placeholder)

        this.bus = new SystemBus(this.PPU, this.timer, this.DMA, this.joypad, this.interrupts);
        this.bus.attachWRAM(
            address          => this.WRAM.readByte(address),
            (address, value) => this.WRAM.writeByte(address, value)
        );
        this.bus.attachHRAM(
            address          => this.HRAM.readByte(address),
            (address, value) => this.HRAM.writeByte(address, value)
        );
        
        this.bootBytes = null;

        this.CPU = new CPU(this.bus, this.interrupts);

        this.cartridge = null;
    }

    loadBootROM(bootBytes) {
        this.bootBytes = bootBytes || null;
        if (this.bootBytes) this.attachBootROM(this.bootBytes);
    }

    insertCartridge(cartridge) {
        this.cartridge = cartridge;

        if (cartridge.MBC) {
            this.bus.attachCartridge(
                address          => cartridge.readROM(address),
                (address, value) => cartridge.writeROM(address, value),
                address          => cartridge.readERAM(address),
                (address, value) => cartridge.writeERAM(address, value)
            );
        } else {
            this.ROM.loadBytes(cartridge.ROM);
            if (cartridge.RAM) this.ERAM.loadBytes(cartridge.RAM.data);

            this.bus.attachCartridge(
                address          => this.ROM.readByte(address),
                (address, value) => {},
                address          => this.ERAM.readByte(address),
                (address, value) => this.ERAM.writeByte(address, value)
            );
        }
    }

    requestInterrupt(mask) {
        this.interrupts.request(mask);
    }

    step(maxCycles = 70224) { // 70224 ciclos = 1 frame (59.7 Hz)
        let currentCycles = 0;

        while (currentCycles < maxCycles) {
            const before = this.CPU.cycle;
            this.CPU.executeInstruction();
            const used = this.CPU.cycle - before;

            if (used <= 0) continue; // Evita loops infinitos

            this.PPU.tick(used);
            this.timer.tick(used);

            currentCycles += used;
        }

        return currentCycles;
    }
}