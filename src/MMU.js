// Memória Mapeada (MMU - Memory Management Unit)
export default class MMU {
    constructor(ROM, ERAM, WRAM, VRAM, OAM, HRAM, IO, PPU, TIMER) {
        this.ROM = ROM;
        this.ERAM = ERAM;
        this.WRAM = WRAM;
        this.VRAM = VRAM;
        this.OAM = OAM;
        this.HRAM = HRAM;
        this.IO = IO;
        this.PPU = PPU;
        this.TIMER = TIMER;

        this.IF = 0xE1; // Interrupt Flag (0xFF0F)
        this.IE = 0x00; // Interrupt Enable (0xFFFF)
    }

    requestInterrupt(mask) {
        this.IF = (this.IF | (mask & 0x1F)) & 0xFF; // seta bits em IF (0xFF0F)
    }

    readByte(address) {
        address &= 0xFFFF;

        if (address < 0x8000) return this.ROM.readByte(address);
        if (address >= 0x8000 && address < 0xA000) return this.VRAM.readByte(address - 0x8000);
        if (address >= 0xA000 && address < 0xC000) return this.ERAM.readByte(address - 0xA000);
        if (address >= 0xC000 && address < 0xE000) return this.WRAM.readByte(address - 0xC000);
        if (address >= 0xE000 && address < 0xFE00) return this.WRAM.readByte(address - 0xE000);
        if (address >= 0xFE00 && address < 0xFEA0) return this.OAM.readByte(address - 0xFE00);
        if (address >= 0xFEA0 && address < 0xFF00) return 0xFF; // Área não mapeada

        if (address >= 0xFF00 && address < 0xFF80) {
            if (address >= 0xFF04 && address <= 0xFF07) return this.TIMER.readByte(address);
            if (address >= 0xFF40 && address <= 0xFF4B) return this.PPU.readByte(address);
            if (address === 0xFF0F) return this.IF;
            return this.IO.readByte(address - 0xFF00);
        }

        if (address >= 0xFF80 && address < 0xFFFF) return this.HRAM.readByte(address - 0xFF80);
        if (address === 0xFFFF) return this.IE;
        return 0xFF; // Endereços não mapeados retornam 0xFF
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address < 0x8000) {
            this.ROM.writeByte(address, value);
            return;
        }

        if (address >= 0x8000 && address < 0xA000) {
            this.VRAM.writeByte(address - 0x8000, value);
            return;
        }

        if (address >= 0xA000 && address < 0xC000) {
            this.ERAM.writeByte(address - 0xA000, value);
            return;
        }

        if (address >= 0xC000 && address < 0xE000) {
            this.WRAM.writeByte(address - 0xC000, value);
            return;
        }

        if (address >= 0xE000 && address < 0xFE00) {
            this.WRAM.writeByte(address - 0xE000, value);
            return;
        }
        
        if (address >= 0xFE00 && address < 0xFEA0) {
            this.OAM.writeByte(address - 0xFE00, value);
            return;
        }

        if (address >= 0xFEA0 && address < 0xFF00) return;

        if (address >= 0xFF00 && address < 0xFF80) {
            if (address === 0xFF01) { // Serial Data
                this.IO.writeByte(0x01, value);
                return;
            }

            if (address === 0xFF02) { // Serial Control
                this.IO.writeByte(0x02, value & 0x83); // Apenas bits 0 e 7 são usados

                if ((value & 0x81) === 0x81) {
                    const sent = this.IO.readByte(0x01);
                    this.IO.writeByte(0x01, sent); // Ecoa o dado enviado

                    const newSC = value & ~0x80;
                    this.IO.writeByte(0x02, newSC & 0x83); // Limpa o bit 7

                    this.requestInterrupt(0x08); // Solicita interrupção de serial
                }

                return;
            }

            if (address >= 0xFF04 && address <= 0xFF07) {
                this.TIMER.writeByte(address, value);
                return;
            }

            if (address === 0xFF46) { // DMA Transfer
                const source = value << 8;

                for (let index = 0; index < 0xA0; index++) {
                    const byte = this.readByte(source + index);
                    this.OAM.writeByte(index, byte);
                }

                console.log(`DMA transfer from ${source.toString(16).toUpperCase()} to OAM`);
                if (this.onDMATicks) this.onDMATicks(640); // DMA leva 160 ciclos de máquina (640 ciclos de clock)
                this.HRAM.writeByte(0x7F, 0xDA);
                return;
            }

            if (address >= 0xFF40 && address <= 0xFF4B) {
                this.PPU.writeByte(address, value);
                return;
            }

            if (address === 0xFF0F) { // Interrupt Flag
                this.IF = (this.IF & 0xE0) | (value & 0x1F);
                return;
            }

            this.IO.writeByte(address - 0xFF00, value);
            return;
        }

        if (address >= 0xFF80 && address < 0xFFFF) {
            this.HRAM.writeByte(address - 0xFF80, value);
            return;
        }

        if (address === 0xFFFF) {
            this.IE = value & 0x1F;
            return;
        }
    }
}