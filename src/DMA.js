// Acesso Direto à Memória (DMA - Direct Memory Access)
export default class DMA {
    constructor(busRead, oamWrite) {
        this.busRead = busRead;
        this.oamWrite = oamWrite;
        this.REGISTER = 0x00; // Registrador do OAM DMA (FF46)
        this.active = 0;
        this.sourceAddress = 0x0000;
        this.index = 0;
        this.accumulatedCycles = 0;
    }

    readByte(address) {
        address &= 0xFFFF;

        if (address === 0xFF46) {
            return this.REGISTER & 0xFF; 
        }

        // DMG não possui HDMA;
        if (address >= 0xFF51 && address <= 0xFF55) return 0xFF;

        return 0xFF;
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address === 0xFF46) {
            this.REGISTER = value;
            this.sourceAddress = (value << 8) & 0xFF00;
            this.index = 0;
            this.accumulatedCycles = 0;
            this.active = 1;
            return;
        }

        // DMG não possui HDMA; não fazemos nada
        if (address >= 0xFF51 && address <= 0xFF55) return;
    }

    tick(cycles) {
        if (!this.active) return;

        this.accumulatedCycles += cycles;

        while (this.active && this.accumulatedCycles >= 4) {
            this.accumulatedCycles -= 4;

            const address = (this.sourceAddress + this.index) & 0xFFFF;
            const value = this.busRead(address) & 0xFF;

            this.oamWrite(this.index + 0xFE00, value);
            this.index++;
        
            if (this.index >= 0xA0) {
                this.active = 0;
            }
        }
    }
}