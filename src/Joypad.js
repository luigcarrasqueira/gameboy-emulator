import IRQ from "./IRQ.js";

export default class Joypad {
    constructor(requestInterrupt) {
        this.requestInterrupt = requestInterrupt;

        this.buttons = {
            A: 1,
            B: 1,
            SELECT: 1,
            START: 1,
            RIGHT: 1,
            LEFT: 1,
            UP: 1,
            DOWN: 1
        };

        this.selectAction = 1;
        this.selectDirection = 1;
        this.lastState = 0xFF;
    }

    readByte(address) {
        if (address !== 0xFF00) return 0xFF;

        let value = 0xC0;

        value |= this.selectAction << 4;
        value |= this.selectDirection << 5;

        let lower = 0x0F;

        if (this.selectAction === 0) {
            lower = ((this.buttons.START  & 1) << 3) |
                    ((this.buttons.SELECT & 1) << 2) |
                    ((this.buttons.B      & 1) << 1) |
                    ((this.buttons.A      & 1) << 0);
        } else if (this.selectDirection === 0) {
            lower = ((this.buttons.DOWN  & 1) << 3) |
                    ((this.buttons.UP    & 1) << 2) |
                    ((this.buttons.LEFT  & 1) << 1) |
                    ((this.buttons.RIGHT & 1) << 0);
        }

        value |= lower;

        return value;
    }
    
    writeByte(address, value) {
        if (address !== 0xFF00) return;

        this.selectAction = (value >> 4) & 1;
        this.selectDirection = (value >> 5) & 1;
    }

    pressButton(button) {
        if (!(button in this.buttons)) return;

        this.buttons[button] = 0;
        this._checkInterrupt();
    }

    releaseButton(button) {
        if (!(button in this.buttons)) return;
        this.buttons[button] = 1;
    }

    _checkInterrupt() {
        const currentState = this._currentState();

        if ((currentState & ~this.lastState) !== 0) {
            this.requestInterrupt(IRQ.JOYPAD);
        }

        this.lastState = currentState;
    }

    _currentState() {
        for (const button in this.buttons) {
            if (this.buttons[button] === 0) {
                return 1;
            }
        }

        return 0;
    }
}