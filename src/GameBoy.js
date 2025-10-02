import LCDController from "./LCDController.js";
import SystemBus from "./SystemBus.js";
import Joypad from "./Joypad.js";
import Memory from "./Memory.js";
import Timer from "./Timer.js";
import CPU from "./CPU.js";

// Placa-mãe do Game Boy
export default class GameBoy {
    constructor() {
        this.ROM  = new Memory(0x8000, 1); // ROM do cartucho
        this.ERAM = new Memory(0x2000);    // External RAM
        this.WRAM = new Memory(0x2000);    // Work RAM
        this.HRAM = new Memory(0x7F);      // High RAM
        this.IO   = new Memory(0x80);      // Registros de I/O

        this.bus = new SystemBus();
        this.CPU = new CPU(this.bus);
        this.LCDC = new LCDController(mask => this.CPU.interrupts.request(mask));
        this.joypad = new Joypad();
        this.timer = new Timer(mask => this.CPU.interrupts.request(mask));

        this.bus.setLCDC(this.LCDC);
        this.bus.setJoypad(this.joypad);
        this.bus.setTimer(this.timer);
        this.bus.setInterrupts(this.CPU.interrupts);
        this.bus.attachWRAM(
            address          => this.WRAM.readByte(address),
            (address, value) => this.WRAM.writeByte(address, value)
        );
        this.bus.attachHRAM(
            address          => this.HRAM.readByte(address),
            (address, value) => this.HRAM.writeByte(address, value)
        );


        this.bootBytes = null;
        this.cartridge = null;
    }

    loadBootROM(bootBytes) {
        this.bootBytes = bootBytes || null;
        if (this.bootBytes) this.bus.attachBootROM(this.bootBytes);
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
                address            => this.ROM.readByte(address),
                (_address, _value) => {},
                address            => this.ERAM.readByte(address),
                (address, value)   => this.ERAM.writeByte(address, value)
            );
        }
    }

    requestInterrupt(mask) {
        this.CPU.interrupts.request(mask);
    }

    step(maxCycles = 70224) { // 70224 ciclos = 1 frame (59.7 Hz)
        let currentCycles = 0;

        while (currentCycles < maxCycles) {
            const before = this.CPU.cycle;
            this.CPU.executeInstruction();
            const used = this.CPU.cycle - before;

            if (used <= 0) continue; // Evita loops infinitos

            this.LCDC.tick(used);
            this.timer.tick(used);
            this.bus.DMA.tick(used);

            currentCycles += used;
        }

        return currentCycles;
    }
}