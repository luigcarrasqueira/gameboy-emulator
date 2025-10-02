import IRQ from "./IRQ.js";

export default class InterruptsController {
    constructor() {
        this.IE = 0x00; // Interrupt Enable (0xFFFF)
        this.IF = 0x00; // Interrupt Flag (0xFF0F)
    }

    readByte(address) {
        address &= 0xFFFF;

        switch(address) {
            case 0xFF0F: // Interrupt Flag
                return (this.IF & 0x1F) | 0xE0;
            case 0xFFFF: // Interrupt Enable
                return (this.IE & 0x1F) | 0xE0;
            default:
                return 0xFF;
        }
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        switch(address) {
            case 0xFF0F: // Interrupt Flag
                this.IF = value & 0x1F;
                return 1;
            case 0xFFFF: // Interrupt Enable
                this.IE = value & 0x1F;
                return 1;
            default:
                return 0;
        }
    }

    request(mask) { // Sinalizar IRQ: mask é o índice 0..4 (0=VBLANK, 1=LCDSTAT, 2=TIMER, 3=SERIAL, 4=JOYPAD)
        this.IF |= mask & 0x1F;
    }

    pending() { // Bits pendentes de fato (IF & IE), já limitado a 0..4
        return (this.IF & this.IE) & 0x1F;
    }

    hasPending() { // retorna se há interrupções pendentes
        return ((this.IF & this.IE) & 0x1F) !== 0 ? 1 : 0;
    }

    highestPriority() { // retorna o bit da IRQ de maior prioridade que está pendente
        const pending = this.IF & this.IE;
        if (pending & IRQ.VBLANK) return IRQ.VBLANK;
        if (pending & IRQ.LCDSTAT) return IRQ.LCDSTAT;
        if (pending & IRQ.TIMER) return IRQ.TIMER;
        if (pending & IRQ.SERIAL) return IRQ.SERIAL;
        if (pending & IRQ.JOYPAD) return IRQ.JOYPAD;
        return 0x00;
    }

    acknowledge(mask) { // Limpa o bit de IF correspondente à interrupção atendida
        this.IF &= ~mask & 0x1F;
    }
}