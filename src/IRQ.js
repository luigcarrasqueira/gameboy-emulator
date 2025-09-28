// Requisição de Interrupção - Interrupt Request (IF) bits
const IRQ = Object.freeze({
    VBLANK: 0x01,  // bit 0
    LCDSTAT: 0x02, // bit 1
    TIMER: 0x04,   // bit 2
    SERIAL: 0x08,  // bit 3
    JOYPAD: 0x10   // bit 4
});

export default IRQ;