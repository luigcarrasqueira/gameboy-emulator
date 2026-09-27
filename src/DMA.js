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
        this.startDelay = 0;
        this.pendingSource = 0;
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
            this.pendingSource = value << 8;
            // M0 contém a escrita; M1 ainda deixa OAM acessível;
            // a transferência nova começa em M2 (Mooneye oam_dma_start).
            // Um DMA anterior continua durante esse intervalo.
            this.startDelay = 8;
            return;
        }

        // DMG não possui HDMA; não fazemos nada
        if (address >= 0xFF51 && address <= 0xFF55) return;
    }

    tick(cycles) {
        if (!this.active && !this.startDelay) return;

        this.accumulatedCycles += cycles;

        while ((this.active || this.startDelay) && this.accumulatedCycles >= 4) {
            this.accumulatedCycles -= 4;

            if (this.active) {
                const address = this.sourceAddress + this.index;
                this.oamWrite(this.index + 0xFE00, this.busRead(address) & 0xFF);
                if (++this.index === 0xA0) this.active = 0;
            }

            if (this.startDelay > 0) {
                this.startDelay -= 4;
                if (this.startDelay === 0) {
                    this.sourceAddress = this.pendingSource;
                    this.index = 0;
                    this.active = 1;
                }
            }
        }
        if (!this.active && !this.startDelay) this.accumulatedCycles = 0;
    }
}
