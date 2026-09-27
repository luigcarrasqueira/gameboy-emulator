import test from 'node:test';
import assert from 'node:assert/strict';
import GameBoy from '../src/GameBoy.js';
import LCD_MODE from '../src/LCD_MODE.js';
import IRQ from '../src/IRQ.js';

function consoleWithLCDOff() {
    const gb = new GameBoy();
    gb.bus.writeByte(0xFF40, 0);
    return gb;
}

test('os primeiros 160 bytes de VRAM e OAM são memórias independentes', () => {
    const gb = consoleWithLCDOff();
    for (let i = 0; i < 160; i++) {
        gb.bus.writeByte(0x8000 + i, i);
        gb.bus.writeByte(0xFE00 + i, 255 - i);
    }
    for (let i = 0; i < 160; i++) {
        assert.equal(gb.bus.readByte(0x8000 + i), i);
        assert.equal(gb.bus.readByte(0xFE00 + i), 255 - i);
    }
});

test('renderização lê o tile zero da VRAM, sem confundir com OAM', () => {
    const gb = consoleWithLCDOff();
    gb.LCDC.LCDC = 0x91;
    gb.LCDC.BGP = 0xE4;
    gb.LCDC.VRAM.data[0] = 0xFF;
    gb.LCDC.OAM.data[0] = 0;
    gb.LCDC.renderScanline(0);
    assert.equal(gb.LCDC.frame[0], 0xFFAAAAAA);
});

test('tiles assinados usam 9000 como base para índice zero', () => {
    const gb = consoleWithLCDOff();
    gb.LCDC.LCDC = 0x81;
    gb.LCDC.BGP = 0xE4;
    for (const [tile, offset] of [[0, 0x1000], [0x80, 0x800], [0x7F, 0x17F0]]) {
        gb.LCDC.VRAM.data.fill(0);
        gb.LCDC.VRAM.data[0x1800] = tile;
        gb.LCDC.VRAM.data[offset] = 0xFF;
        gb.LCDC.renderScanline(0);
        assert.equal(gb.LCDC.frame[0], 0xFFAAAAAA, `tile ${tile}`);
    }
});

for (const mode of Object.values(LCD_MODE)) {
    test(`restrições de VRAM e OAM no modo ${mode}`, () => {
        const gb = new GameBoy();
        gb.LCDC.mode = mode;
        gb.LCDC.VRAM.data[0] = 0x12;
        gb.LCDC.OAM.data[0] = 0x34;
        const vramBlocked = mode === LCD_MODE.VRAM;
        const oamBlocked = mode === LCD_MODE.OAM || vramBlocked;
        assert.equal(gb.bus.readByte(0x8000), vramBlocked ? 255 : 0x12);
        assert.equal(gb.bus.readByte(0xFE00), oamBlocked ? 255 : 0x34);
        gb.bus.writeByte(0x8000, 0x56);
        gb.bus.writeByte(0xFE00, 0x78);
        assert.equal(gb.LCDC.VRAM.data[0], vramBlocked ? 0x12 : 0x56);
        assert.equal(gb.LCDC.OAM.data[0], oamBlocked ? 0x34 : 0x78);
        gb.bus.writeByte(0xFF40, 0);
        assert.equal(gb.LCDC.mode, LCD_MODE.HBLANK);
        gb.bus.writeByte(0x8000, 0x9A);
        gb.bus.writeByte(0xFE00, 0xBC);
        assert.equal(gb.bus.readByte(0x8000), 0x9A);
        assert.equal(gb.bus.readByte(0xFE00), 0xBC);
    });
}

test('desligar LCD redefine LY e modo imediatamente e permite VRAM/OAM', () => {
    const gb = new GameBoy();
    gb.LCDC.LY = 42;
    gb.LCDC.pixelClock = 123;
    gb.bus.writeByte(0xFF40, 0);
    assert.equal(gb.bus.readByte(0xFF44), 0);
    assert.equal(gb.LCDC.pixelClock, 0);
    // Mesmo um modo antigo não deve bloquear memória com LCD desligado.
    gb.LCDC.mode = LCD_MODE.VRAM;
    gb.bus.writeByte(0x8000, 0x42);
    gb.bus.writeByte(0xFE00, 0x24);
    assert.equal(gb.bus.readByte(0x8000), 0x42);
    assert.equal(gb.bus.readByte(0xFE00), 0x24);
});

test('DMA tem intervalo inicial e transfere 160 bytes em 640 ciclos', () => {
    const gb = consoleWithLCDOff();
    const pattern = Uint8Array.from({ length: 160 }, (_, i) => i ^ 0x5A);
    gb.WRAM.data.set(pattern);
    gb.LCDC.OAM.data.fill(0xAA);
    gb.bus.writeByte(0xFF46, 0xC0);
    gb.bus.DMA.tick(4); // M0: escrita.
    assert.equal(gb.bus.readByte(0xFE00), 0xAA);
    assert.equal(gb.bus.DMA.active, 0);
    gb.bus.DMA.tick(4); // M1: ainda não copiou.
    assert.equal(gb.LCDC.OAM.data[0], 0xAA);
    assert.equal(gb.bus.DMA.active, 1);
    gb.bus.DMA.tick(636);
    assert.equal(gb.bus.DMA.index, 159);
    assert.equal(gb.bus.DMA.active, 1);
    assert.equal(gb.bus.readByte(0xFE9F), 255);
    gb.bus.DMA.tick(4);
    assert.equal(gb.bus.DMA.active, 0);
    assert.deepEqual(gb.LCDC.OAM.data, pattern);
});

test('DMA copia apesar das restrições da CPU, que só acessa HRAM', () => {
    const gb = new GameBoy();
    gb.LCDC.mode = LCD_MODE.VRAM;
    gb.WRAM.data.fill(0x42, 0, 160);
    gb.bus.writeByte(0xFF46, 0xC0);
    gb.bus.DMA.tick(8);
    for (const address of [0, 0x8000, 0xA000, 0xC000, 0xE000, 0xFE00, 0xFF00, 0xFF46, 0xFFFF]) {
        assert.equal(gb.bus.readByte(address), 255);
    }
    gb.bus.writeByte(0xC000, 0x12);
    gb.bus.writeByte(0xFE00, 0x34);
    gb.bus.writeByte(0xFFFF, 0x1F);
    gb.bus.writeByte(0xFF80, 0x56);
    gb.bus.writeByte(0xFFFE, 0x78);
    assert.equal(gb.bus.readByte(0xFF80), 0x56);
    assert.equal(gb.bus.readByte(0xFFFE), 0x78);
    assert.equal(gb.CPU.interrupts.IE, 0);
    gb.bus.DMA.tick(640);
    assert.ok(gb.LCDC.OAM.data.every(v => v === 0x42));
    assert.equal(gb.WRAM.data[0], 0x42);
});

test('reiniciar DMA conserva a cópia antiga durante o atraso e reinicia no índice zero', () => {
    const gb = consoleWithLCDOff();
    gb.WRAM.data.fill(0x11, 0, 160);
    gb.WRAM.data.fill(0x22, 0x1000, 0x10A0);
    gb.bus.writeByte(0xFF46, 0xC0);
    gb.bus.DMA.tick(8 + 12);
    assert.equal(gb.bus.DMA.index, 3);
    gb.bus.writeByte(0xFF46, 0xD0);
    gb.bus.DMA.tick(4);
    assert.equal(gb.bus.DMA.index, 4);
    assert.equal(gb.LCDC.OAM.data[3], 0x11);
    gb.bus.DMA.tick(4);
    assert.equal(gb.LCDC.OAM.data[4], 0x11);
    assert.equal(gb.bus.DMA.index, 0);
    gb.bus.DMA.tick(640);
    assert.ok(gb.LCDC.OAM.data.every(v => v === 0x22));
});

test('DMA lê ROM, VRAM, RAM de cartucho, WRAM e espelhos DMG de páginas altas', () => {
    const gb = consoleWithLCDOff();
    gb.bus.attachCartridge(a => (a >>> 8) ^ 0x19, null, a => (a >>> 8) ^ 0xA7);
    gb.LCDC.VRAM.data.fill(0x80, 0, 160);
    gb.WRAM.data.fill(0xC0, 0, 160);
    gb.WRAM.data.fill(0xDE, 0x1E00, 0x1EA0);
    gb.WRAM.data.fill(0xDF, 0x1F00, 0x1FA0);
    for (const [page, expected] of [[0, 0x19], [0x40, 0x59], [0x80, 0x80], [0xA0, 0xA7], [0xC0, 0xC0], [0xE0, 0xC0], [0xFE, 0xDE], [0xFF, 0xDF]]) {
        gb.bus.writeByte(0xFF46, page);
        gb.bus.DMA.tick(648);
        assert.ok(gb.LCDC.OAM.data.every(v => v === expected), `página ${page.toString(16)}`);
    }
});

test('DMA aceita ticks fracionados e não perde ciclos de início ou transferência', () => {
    const gb = consoleWithLCDOff();
    gb.WRAM.data.fill(0x42, 0, 160);
    gb.bus.writeByte(0xFF46, 0xC0);
    for (let i = 0; i < 647; i++) gb.bus.DMA.tick(1);
    assert.equal(gb.bus.DMA.active, 1);
    gb.bus.DMA.tick(1);
    assert.equal(gb.bus.DMA.active, 0);
    assert.ok(gb.LCDC.OAM.data.every(v => v === 0x42));
});

test('CPU enxerga OAM no primeiro fetch após iniciar DMA, mas não no seguinte', () => {
    const gb = consoleWithLCDOff();
    // Executa LD (HL),A no espelho de WRAM imediatamente antes de OAM.
    gb.bus.writeByte(0xFDFF, 0x77);
    gb.bus.writeByte(0xFE00, 0x04); // INC B
    gb.bus.writeByte(0xFE01, 0x04);
    gb.CPU.registers.PC = 0xFDFF;
    gb.CPU.registers.HL = 0xFF46;
    gb.CPU.registers.A = 0xC0;
    gb.step(8); // fetch de LD e escrita em FF46.
    assert.equal(gb.bus.DMA.active, 0);
    gb.step(4); // primeiro fetch de OAM: INC B.
    assert.equal(gb.CPU.registers.B, 1);
    assert.equal(gb.bus.DMA.active, 1);
    gb.step(4); // próximo fetch lê FF (RST 38), não INC B.
    assert.equal(gb.CPU.registers.B, 1);
    assert.equal(gb.CPU.control.sequencer.busy(), true);
});

test('rotina de DMA em HRAM continua executando até a transferência acabar', () => {
    const gb = consoleWithLCDOff();
    // LD A,C0; LDH (46),A; LD A,40; DEC A; JR NZ,-3; NOP.
    gb.HRAM.data.set([0x3E, 0xC0, 0xE0, 0x46, 0x3E, 40, 0x3D, 0x20, 0xFD, 0]);
    gb.WRAM.data.fill(0x42, 0, 160);
    gb.CPU.registers.PC = 0xFF80;
    while (gb.CPU.registers.PC !== 0xFF8A && gb.CPU.cycle < 1000) gb.step(4);
    assert.equal(gb.CPU.registers.PC, 0xFF8A);
    assert.equal(gb.CPU.registers.A, 0);
    assert.equal(gb.bus.DMA.active, 0);
    assert.ok(gb.LCDC.OAM.data.every(v => v === 0x42));
});

test('WRAM espelhada e memória não utilizável respeitam o mapa', () => {
    const gb = consoleWithLCDOff();
    gb.bus.writeByte(0xC000, 0x42);
    assert.equal(gb.bus.readByte(0xE000), 0x42);
    gb.bus.writeByte(0xFDFF, 0x24);
    assert.equal(gb.bus.readByte(0xDDFF), 0x24);
    for (const address of [0xFEA0, 0xFEFF, 0xFF03, 0xFF4D, 0xFF51, 0xFF55]) {
        gb.bus.writeByte(address, 0);
        assert.equal(gb.bus.readByte(address), 255);
    }
});

test('IE preserva oito bits, enquanto só os cinco bits inferiores geram IRQ', () => {
    const gb = new GameBoy();
    for (const value of [0, 0xE0, 0x1F, 0xA5, 255]) {
        gb.bus.writeByte(0xFFFF, value);
        assert.equal(gb.bus.readByte(0xFFFF), value);
    }
    gb.bus.writeByte(0xFFFF, 0xE0);
    gb.CPU.interrupts.request(0xFF);
    assert.equal(gb.CPU.interrupts.pending(), 0);
    gb.bus.writeByte(0xFFFF, IRQ.TIMER);
    assert.equal(gb.CPU.interrupts.pending(), IRQ.TIMER);
    assert.equal(gb.bus.readByte(0xFF0F), 255);
});

test('FF50 desabilita boot ROM sem permitir reativação por escrita', () => {
    const gb = new GameBoy();
    gb.bus.attachCartridge(() => 0x42);
    gb.bus.attachBootROM(new Uint8Array(256).fill(0x24));
    assert.equal(gb.bus.readByte(0), 0x24);
    assert.equal(gb.bus.readByte(0x100), 0x42);
    assert.equal(gb.bus.readByte(0xFF50), 255);
    gb.bus.writeByte(0xFF50, 0);
    assert.equal(gb.bus.readByte(0), 0x24);
    gb.bus.writeByte(0xFF50, 1);
    assert.equal(gb.bus.readByte(0), 0x42);
    gb.bus.writeByte(0xFF50, 0);
    assert.equal(gb.bus.readByte(0), 0x42);
});
