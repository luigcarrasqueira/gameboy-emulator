// Gráficos (PPU - Picture Processing Unit)
export default class PPU {
    constructor(VRAM, OAM, requestInterrupt) {
        this.VRAM = VRAM;
        this.OAM = OAM;

        this.LCDC = 0x91; // LCD Control (FF40)
        this.STAT = 0x85; // LCD Status (FF41)
        this.SCY = 0x00; // Scroll Y (FF42)
        this.SCX = 0x00; // Scroll X (FF43)
        this.LY = 0x00; // LCD Y Coordinate (FF44)
        this.LYC = 0x00; // LY Compare (FF45)
        this.DMA = 0x00; // DMA Transfer and Start Address (FF46)
        this.BGP = 0xFC; // BG Palette Data (FF47)
        this.OBP0 = 0xFF; // Object Palette 0 Data (FF48)
        this.OBP1 = 0xFF; // Object Palette 1 Data (FF49)
        this.WY = 0x00; // Window Y Position (FF4A)
        this.WX = 0x00; // Window X Position (FF4B) 

        this.cycle = 0;
        this.mode = 0x02; // 0=HBlank, 1=VBlank, 2=Searching OAM, 3=Transferring Data to LCD;
        this.requestInterrupt = requestInterrupt;

        this.frame = new Uint32Array(160 * 144); // Tela de 160x144 pixels (ARGB 32-bit)
        this.onFrame = null;
    }

    readByte(address) {
        address &= 0xFFFF;

        if (address >= 0x8000 && address <= 0x9FFF) {
            return this.VRAM.readByte(address - 0x8000);
        }

        if (address >= 0xFE00 && address <= 0xFE9F) {
            return this.OAM.readByte(address - 0xFE00);
        }

        switch(address) {
            case 0xFF40: return this.LCDC;
            case 0xFF41: return (this.STAT & 0xFC) | (this.mode & 0x03);
            case 0xFF42: return this.SCY;
            case 0xFF43: return this.SCX;
            case 0xFF44: return this.LY;
            case 0xFF45: return this.LYC;
            case 0xFF46: return this.DMA;
            case 0xFF47: return this.BGP;
            case 0xFF48: return this.OBP0;
            case 0xFF49: return this.OBP1;
            case 0xFF4A: return this.WY;
            case 0xFF4B: return this.WX;
            default: return 0xFF;
        }
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address >= 0x8000 && address <= 0x9FFF) {
            this.VRAM.writeByte(address - 0x8000, value);
            return;
        }

        if (address >= 0xFE00 && address <= 0xFE9F) {
            this.OAM.writeByte(address - 0xFE00, value);
            return;
        }

        switch(address) {
            case 0xFF40:
                this.LCDC = value;
                return;
            case 0xFF41:
                this.STAT = (this.STAT & 0x07) | (value & 0xF8);
                return;
            case 0xFF42:
                this.SCY = value;
                return;
            case 0xFF43:
                this.SCX = value;
                return;
            case 0xFF44: // Reset LY
                this.LY = 0;
                return;
            case 0xFF45:
                this.LYC = value;
                return;
            case 0xFF46:
                this.DMA = value;
                return;
            case 0xFF47:
                this.BGP = value;
                return;
            case 0xFF48:
                this.OBP0 = value;
                return;
            case 0xFF49:
                this.OBP1 = value;
                return;
            case 0xFF4A:
                this.WY = value;
                return;
            case 0xFF4B:
                this.WX = value;
                return;
        }
    }

    tick(cycles) {
        if ((this.LCDC & 0x80) === 0) {
            this.LY = 0;
            this.mode = 0x00;
            this.cycle = 0;
            return;
        }

        this.cycle += cycles;

        while (this.cycle >= 456) {
            this.cycle -= 456;

            if (this.LY < 144) {
                this.renderScanline(this.LY);
                this.mode = 0x00; // HBlank
                if (this.STAT & 0x08) this.requestInterrupt(0x02);
            }

            this.LY++;

            if (this.LY === 144) {
                this.mode = 0x01; // VBlank
                this.requestInterrupt(0x01);
                if (this.STAT & 0x10) this.requestInterrupt(0x02);
                if (this.onFrame) this.onFrame(this.frame);
            } else if (this.LY > 153) {
                this.LY = 0;
                this.mode = 0x02; // Searching OAM
                if (this.STAT & 0x20) this.requestInterrupt(0x02);
            }

            if (this.LY === this.LYC) {
                this.STAT |= 0x04;
                if (this.STAT & 0x40) this.requestInterrupt(0x02);
            } else {
                this.STAT &= ~0x04;
            }
        }
    }

    renderScanline(line) {
        if (!(this.LCDC & 0x01)) { // BG desabilitado
            const color = 0xFFFFFFFF; // Branco
            this.frame.fill(color, line * 160, line * 160 + 160);
            return;
        }

        const scy = this.SCY;
        const scx = this.SCX;
        const bgMapBase = (this.LCDC & 0x08) ? 0x9C00 : 0x9800;
        const tileBaseUnsigned = (this.LCDC & 0x10) !== 0;
        const lineY = (line + scy) & 0xFF;
        const tileRow = (lineY >> 3) & 0x1F;
        const pixelYInTile = lineY & 0x07;

        for (let x = 0; x < 160; x++) {
            const lineX = (x + scx) & 0xFF;
            const tileCol = (lineX >> 3) & 0x1F;
            const mapIndex = tileRow * 32 + tileCol;
            const tileNumber = this.readByte(bgMapBase + mapIndex);
            let tileAddress;
            if (tileBaseUnsigned) {
                tileAddress = 0x8000 + (tileNumber * 16);
            } else {
                const signedIndex = (tileNumber << 24) >> 24; // Sign extend
                tileAddress = 0x8800 + ((signedIndex + 128) * 16);
            }

            const low = this.readByte(tileAddress + (pixelYInTile * 2));
            const high = this.readByte(tileAddress + (pixelYInTile * 2) + 1);
            const bit = 7 - (lineX & 0x07);
            const colorId = ((high >> bit) & 0x01) << 1 | ((low >> bit) & 0x01);
            const shade = (this.BGP >> (colorId * 2)) & 0x03;
            const rgb = this.shadeToRGBA(shade);
            this.frame[line * 160 + x] = rgb;
        }
    }

    shadeToRGBA(shade) {
        const level = [0xFF, 0xAA, 0x55, 0x00][shade];
        return (0xFF << 24) | (level << 16) | (level << 8) | level; // ARGB
    }
}