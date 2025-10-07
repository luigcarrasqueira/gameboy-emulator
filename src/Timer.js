import IRQ from "./IRQ.js";

// Timer do Game Boy
export default class Timer {
    constructor(requestInterrupt) {
        this.requestInterrupt = requestInterrupt;
        this.DIV = 0x00; // Divider Register (FF04)
        this.TIMA = 0x00; // Timer Counter (FF05)
        this.TMA = 0x00; // Timer Modulo (FF06)
        this.TAC = 0x00; // Timer Control (FF07)
        this.divInternal = 0; // Contador interno do DIV
        this.lastBit = 0; // Último estado do bit do timer
        this.reloadDelay = 0; // Atraso para recarregar TIMA

    }

    readByte(address) {
        switch(address) {
            case 0xFF04: return this.DIV; // DIV
            case 0xFF05: return this.TIMA; // Timer Counter
            case 0xFF06: return this.TMA; // Timer Modulo
            case 0xFF07: return this.TAC | 0xF8; // Timer Control
            default:     return 0xFF;
        }
    }

    writeByte(address, value) {
        address &= 0xFFFF;
        value &= 0xFF;

        switch(address) {
            case 0xFF04: // Divider Register
                {
                    const oldBit = this._sampleBit();
                    this.divInternal = 0;
                    this.DIV = 0;
                    const newBit = this._sampleBit();
                    if (oldBit === 1 && newBit === 0) this._incrementTIMA();
                    this.lastBit = newBit;
                }
                return;
            case 0xFF05: // Timer Counter
                if (this.reloadDelay > 0) this.reloadDelay = 0;
                this.TIMA = value;
                return;
            case 0xFF06: // Timer Modulo
                this.TMA = value;
                return;
            case 0xFF07: // Timer Control
                {
                    const oldBit = this._sampleBit();
                    this.TAC = value & 0x07;
                    const newBit = this._sampleBit();
                    if (oldBit === 1 && newBit === 0) this._incrementTIMA();
                    this.lastBit = newBit;
                }
                return;
        }
    }

    tick(cycles) {
        for (let i = 0; i < cycles; i++) {
            this.divInternal = (this.divInternal + 1) & 0xFFFF;
            this.DIV = (this.divInternal >>> 8) & 0xFF;

            if (this.reloadDelay > 0) {
                this.reloadDelay--;

                if (this.reloadDelay === 0) {
                    this.TIMA = this.TMA;
                    this.requestInterrupt(IRQ.TIMER); // Solicita interrupção de timer
                }
            }

            const currentBit = this._sampleBit();

            if (this.lastBit === 1 && currentBit === 0) {
                this._incrementTIMA();
            }

            this.lastBit = currentBit;
        }
    }

    _incrementTIMA() {
        if (this.TIMA === 0xFF) {
            this.TIMA = 0x00;
            this.reloadDelay = 4;
        } else {
            this.TIMA = (this.TIMA + 1) & 0xFF;
        }
    }

    _bitIndex() {
        switch(this.TAC & 0x03) {
            case 0: return 9;
            case 1: return 3;
            case 2: return 5;
            case 3: return 7;
        }
    }

    _sampleBit() {
        const bit = (this.divInternal >> this._bitIndex()) & 1;
        return (this.TAC & 0x04) ? bit : 0;
    }
}