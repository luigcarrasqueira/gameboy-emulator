import LCD_MODE from "./LCD_MODE.js";
import LCD_REG from "./LCD_REG.js";
import Memory from "./Memory.js";
import IRQ from "./IRQ.js";

// Fontes de interrupção do STAT
const STAT_SRC = Object.freeze({
    HBLANK: 0x08,
    VBLANK: 0x10,
    OAM: 0x20,
    LYC: 0x40
});

// Gráficos (LCDC - Liquid Crystal Display Controller)
export default class LCDController {
    constructor(requestInterrupt) {
        this.VRAM = new Memory(0x2000); // Video RAM
        this.OAM  = new Memory(0xA0);   // Object Attribute Memory

        this.LCDC = 0x91; // LCD Control
        this.STAT = 0x85; // LCD Status
        this.SCY  = 0x00; // Scroll Y
        this.SCX  = 0x00; // Scroll X
        this.LY   = 0x00; // LCD Y Coordinate
        this.LYC  = 0x00; // LY Compare
        this.BGP  = 0xFC; // BG Palette Data
        this.OBP0 = 0xFF; // Object Palette 0 Data
        this.OBP1 = 0xFF; // Object Palette 1 Data
        this.WY   = 0x00; // Window Y Position
        this.WX   = 0x00; // Window X Position

        this.pixelClock = 0;
        this.mode = LCD_MODE.OAM;
        this.requestInterrupt = requestInterrupt;

        this.frame = new Uint32Array(160 * 144); // Tela de 160x144 pixels (ARGB 32-bit)
        this.onFrame = null;
    }

    readByte(address) {
        address &= 0xFFFF;

        if (address <= 0x009F) {
            return this.OAM.readByte(address) & 0xFF;
        }

        if (address <= 0x1FFF) {
            return this.VRAM.readByte(address) & 0xFF;
        }

        switch(address) {
            case LCD_REG.LCDC: return this.LCDC;
            case LCD_REG.STAT: return (this.STAT & 0xFC) | (this.mode & LCD_MODE.VRAM);
            case LCD_REG.SCY:  return this.SCY;
            case LCD_REG.SCX:  return this.SCX;
            case LCD_REG.LY:   return this.LY;
            case LCD_REG.LYC:  return this.LYC;
            case LCD_REG.BGP:  return this.BGP;
            case LCD_REG.OBP0: return this.OBP0;
            case LCD_REG.OBP1: return this.OBP1;
            case LCD_REG.WY:   return this.WY;
            case LCD_REG.WX:   return this.WX;
            default:           return 0xFF;
        }
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        if (address <= 0x009F) {
            this.OAM.writeByte(address, value);
            return;
        }

        if (address <= 0x1FFF) {
            this.VRAM.writeByte(address, value);
            return;
        }

        switch(address) {
            case 0xFF40:
                this.LCDC = value;
                return;
            case 0xFF41: {
                const oldEnableLYC = this.STAT & STAT_SRC.LYC; // bit 6 enabled anterior
                this.STAT = (this.STAT & 0x07) | 0x80 | (value & 0x78);
                if (this.LY === this.LYC) this.STAT |= 0x04;
                else this.STAT &= ~0x04;
                const newEnableLYC = this.STAT & STAT_SRC.LYC; // bit 6 enabled atual
                if (!oldEnableLYC && newEnableLYC && (this.STAT & 0x04)) {
                    this.requestInterrupt(IRQ.LCDSTAT);
                }
                return;
            }
            case 0xFF42:
                this.SCY = value;
                return;
            case 0xFF43:
                this.SCX = value;
                return;
            case 0xFF44: // Reset LY
                this.LY = 0;
                return;
            case 0xFF45: {
                this.LYC = value;
                const oldCoincidence = (this.STAT & 0x04) !== 0;
                if (this.LY === this.LYC) this.STAT |= 0x04;
                else this.STAT &= ~0x04;
                const newCoincidence = (this.STAT & 0x04) !== 0;
                if (!oldCoincidence && newCoincidence && (this.STAT & STAT_SRC.LYC)) {
                    this.requestInterrupt(IRQ.LCDSTAT);
                }
                return;
            }
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
        if ((this.LCDC & 0x80) === 0) { // LCD desabilitado
            this.LY = 0;
            this.pixelClock = 0;
            this.mode = LCD_MODE.HBLANK;
            return;
        }
        
        
        while (cycles-- > 0) {
            const previousLY = this.LY;
            this.pixelClock++;

            if (this.LY < 144) {
                if (this.pixelClock === 1 && this.mode !== LCD_MODE.OAM) {
                    this.mode = LCD_MODE.OAM; // 0...79
                    if (this.STAT & STAT_SRC.OAM) {
                        this.requestInterrupt(IRQ.LCDSTAT);
                    }
                } else if (this.pixelClock === 80 && this.mode !== LCD_MODE.VRAM) {
                    this.mode = LCD_MODE.VRAM; // 80...251
                } else if (this.pixelClock === 252) {
                    this.renderScanline(this.LY);
                    this.mode = LCD_MODE.HBLANK;
                    if (this.STAT & STAT_SRC.HBLANK) {
                        this.requestInterrupt(IRQ.LCDSTAT);
                    }
                }
            } else {
                if (this.mode !== LCD_MODE.VBLANK) {
                    this.mode = LCD_MODE.VBLANK;
                }
            }

            if (this.pixelClock >= 456) {
                this.pixelClock = 0;
                this.LY = (this.LY + 1) & 0xFF;

                if (previousLY === 143 && this.LY === 144) {
                    this.requestInterrupt(IRQ.VBLANK);
                    if (this.STAT & STAT_SRC.VBLANK) {
                        this.requestInterrupt(IRQ.LCDSTAT);
                    }

                    if (this.onFrame) this.onFrame(this.frame);
                }

                if (this.LY > 153) {
                    this.LY = 0;
                    this.mode = LCD_MODE.OAM;
                    if (this.STAT & STAT_SRC.OAM) {
                        this.requestInterrupt(IRQ.LCDSTAT);
                    }
                }
            }

            const coincidence = (this.LY === this.LYC);
            const oldCoincidence = (this.STAT & 0x04) !== 0;
            if (coincidence) this.STAT |= 0x04;
            else this.STAT &= ~0x04;
            if (!oldCoincidence && coincidence && (this.STAT & STAT_SRC.LYC)) {
                this.requestInterrupt(IRQ.LCDSTAT);
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
        const bgMapBaseVRAM = (this.LCDC & 0x08) ? 0x1C00 : 0x1800;
        const tileBaseUnsigned = (this.LCDC & 0x10) !== 0;
        const lineY = (line + scy) & 0xFF;
        const tileRow = (lineY >> 3) & 0x1F;
        const pixelYInTile = lineY & 0x07;

        for (let x = 0; x < 160; x++) {
            const lineX = (x + scx) & 0xFF;
            const tileCol = (lineX >> 3) & 0x1F;
            const mapIndex = tileRow * 32 + tileCol;
            const tileNumber = this.readByte(bgMapBaseVRAM + mapIndex);

            let tileAddressVRAM;
            if (tileBaseUnsigned) {
                tileAddressVRAM = tileNumber * 16;
            } else {
                const signedIndex = (tileNumber << 24) >> 24; // Sign extend
                tileAddressVRAM = (signedIndex + 128) * 16;
            }

            const low = this.readByte(tileAddressVRAM + (pixelYInTile * 2));
            const high = this.readByte(tileAddressVRAM + (pixelYInTile * 2) + 1);

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