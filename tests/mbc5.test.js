import test from 'node:test';
import assert from 'node:assert/strict';
import MBC5 from '../src/MBC5.js';
import Emulator from '../src/Emulator.js';

test('MBC5 seleciona banco zero e o bit 8 sem alterar o banco fixo', () => {
    const rom = new Uint8Array(512 * 0x4000);
    for (let bank = 0; bank < 512; bank++) {
        rom[bank * 0x4000] = bank & 255;
        rom[bank * 0x4000 + 1] = bank >>> 8;
    }
    const mbc = new MBC5(rom);
    assert.equal(mbc.readROM(0x4000), 1);
    mbc.writeROM(0x2000, 0);
    assert.equal(mbc.readROM(0x4000), 0);
    mbc.writeROM(0x3000, 1);
    assert.equal(mbc.readROM(0x4001), 1);
    mbc.writeROM(0x2000, 255);
    assert.equal(mbc.readROM(0x4000), 255);
    assert.equal(mbc.readROM(0x4001), 1);
    assert.equal(mbc.readROM(1), 0);
    mbc.writeROM(0x3000, 2);
    assert.equal(mbc.readROM(0x4001), 0);
});

test('MBC5 mantém 16 bancos de RAM independentes e respeita habilitação', () => {
    const mbc = new MBC5(new Uint8Array(32768), 128 * 1024);
    mbc.writeERAM(0, 0x42);
    assert.equal(mbc.readERAM(0), 255);
    mbc.writeROM(0x0000, 0x1A);
    for (let bank = 0; bank < 16; bank++) {
        mbc.writeROM(0x4000, bank);
        mbc.writeERAM(0, bank);
        mbc.writeERAM(0x1FFF, 255 - bank);
    }
    for (let bank = 0; bank < 16; bank++) {
        mbc.writeROM(0x4000, bank);
        assert.equal(mbc.readERAM(0), bank);
        assert.equal(mbc.readERAM(0x1FFF), 255 - bank);
    }
    mbc.writeROM(0, 0);
    mbc.writeERAM(0, 0x42);
    assert.equal(mbc.readERAM(0), 255);
    mbc.writeROM(0, 10);
    assert.equal(mbc.readERAM(0), 15);
});

test('MBC5 sem RAM retorna FF mesmo após habilitação', () => {
    const mbc = new MBC5(new Uint8Array(32768));
    mbc.writeROM(0, 10);
    mbc.writeERAM(0, 0x42);
    assert.equal(mbc.readERAM(0), 255);
});

test('carregador usa MBC5 real em vez de fallback e DMA recebe RAM de cartucho', () => {
    for (const type of [0x19, 0x1A, 0x1B]) {
        const rom = new Uint8Array(32768);
        rom[0x147] = type;
        rom[0x149] = 2;
        const emulator = new Emulator();
        emulator.loadROM(rom);
        const gb = emulator.console;
        assert.ok(gb.cartridge.MBC instanceof MBC5);
        gb.bus.writeByte(0xFF40, 0);
        gb.bus.writeByte(0, 10);
        for (let i = 0; i < 160; i++) gb.bus.writeByte(0xA000 + i, i);
        gb.bus.writeByte(0xFF46, 0xA0);
        gb.bus.DMA.tick(648);
        const expected = type === 0x19 ? new Uint8Array(160).fill(255) : Uint8Array.from({ length: 160 }, (_, i) => i);
        assert.deepEqual(gb.LCDC.OAM.data, expected);
    }
});
