import Cartridge from "./Cartridge.js";
import GameBoy from "./GameBoy.js";
import Memory from "./Memory.js";
import MBC1 from "./MBC1.js";

export default class Emulator {
    constructor(frameRate = 59.73) {
        this.console = new GameBoy();
        this.frameRate = frameRate;
        this.running = false;

        this._targetFrameTime = 1000 / this.frameRate;

        this.onStop = null;
        this.onHalt = null;
    }

    mainLoop() {
        if (!this.running) return;

        const start = performance.now();
        const executed = this.console.step();
        const elapsed = performance.now() - start;
        const delay = Math.max(0, this._targetFrameTime - elapsed);

        setTimeout(() => {
            if (!this.running) return;
            requestAnimationFrame(() => this.mainLoop());
        }, delay);
    }

    loadROM(romBytes) {
        const cartType = romBytes[0x0147] ?? 0x00;
        const ramSize = romBytes[0x0149] ?? 0x00;

        const { mapper, hasRAM } = this._decodeRomType(cartType);
        const { bytes: eramBytes, banks: ramBanks } = this._decodeRamSize(ramSize, mapper);

        console.log(mapper, hasRAM, eramBytes, ramBanks);

        if (mapper === "ROM") {
            const eram = eramBytes > 0 ? new Memory(eramBytes) : null;
            const cartridge = new Cartridge(romBytes, { eram });
            this.console.insertCartridge(cartridge);
            return;
        }

        if (mapper === "MBC1") {
            const mbc1 = new MBC1(romBytes, ramBanks);
            const cartridge = new Cartridge(romBytes, { mbc: mbc1 });
            this.console.insertCartridge(cartridge);
            return;
        }

        console.warn(`[Emulator] Mapper ${cartType.toString(16)} não suportado; carregando como ROM-only.`);
        const eram = eramBytes > 0 ? new Memory(eramBytes) : null;
        const fallback = new Cartridge(romBytes, { eram });
        this.console.insertCartridge(fallback);
    }

    start() {
        this.running = true;
        this.mainLoop();
    }

    stop() {
        this.running = false;
        if (this.onStop) this.onStop();
    }

    _decodeRomType(romType) {
        switch (romType) {
            case 0x00: return { mapper: "ROM", hasRAM: false, battery: false }; // ROM Only
            case 0x01: return { mapper: "MBC1", hasRAM: false, battery: false }; // MBC1
            case 0x02: return { mapper: "MBC1", hasRAM: true, battery: false }; // MBC1+RAM
            case 0x03: return { mapper: "MBC1", hasRAM: true, battery: true }; // MBC1+RAM+BATTERY
            case 0x08: return { mapper: "ROM", hasRAM: true, battery: false }; // ROM+RAM
            case 0x09: return { mapper: "ROM", hasRAM: true, battery: true }; // ROM+RAM+BATTERY
            default: return { mapper: "UNSUPPORTED", hasRAM: false, battery: false };
        }
    }

    _decodeRamSize(code, mapper) {
        let bytes = 0;
        let banks = 0;

        switch (code) {
            case 0x00: // None
                bytes = 0;
                banks = 0;
                break;
            case 0x01: // 2KB
                bytes = 0x0800;
                banks = 1;
                break;
            case 0x02: // 8KB
                bytes = 0x2000;
                banks = 1;
                break;
            case 0x03: // 32KB (4 banks of 8KB each)
                bytes = 0x8000;
                banks = 4;
                break;
            case 0x04: // 128KB (16 banks of 8KB each)
                bytes = 0x20000;
                banks = 16;
                break;
            case 0x05: // 64KB (8 banks of 8KB each)
                bytes = 0x10000;
                banks = 8;
                break;
            default:
                bytes = 0;
                banks = 0;
        }

        if (mapper === "MBC1" && banks > 4) {
            console.warn(`[Emulator] RAM declarada com ${banks} bancos, limitando a 4 para MBC1.`);
            bytes = 0x8000; // 32KB
            banks = 4;
        }

        return { bytes, banks };
    }
}