import test from 'node:test';
import assert from 'node:assert/strict';
import GameBoy from '../src/GameBoy.js';
import IRQ from '../src/IRQ.js';

function program(bytes) {
    const gb = new GameBoy();
    gb.WRAM.data.set(bytes);
    gb.CPU.registers.PC = 0xC000;
    return gb;
}

test('EI aguarda o término da instrução seguinte de múltiplos ciclos', () => {
    const gb = program([0xFB, 0x01, 0x34, 0x12]);
    const c = gb.CPU.control;
    c.step();
    assert.equal(c.IME, 0);
    c.step();
    c.step();
    assert.equal(c.IME, 0);
    c.step();
    assert.equal(c.registers.BC, 0x1234);
    assert.equal(c.IME, 1);
});

test('EI seguido de DI cancela a habilitação mesmo com IRQ pendente', () => {
    const gb = program([0xFB, 0xF3, 0]);
    const c = gb.CPU.control;
    c.interrupts.IE = c.interrupts.IF = 1;
    c.step();
    c.step();
    c.step();
    assert.equal(c.IME, 0);
    assert.equal(c.registers.PC, 0xC003);
    assert.equal(c.registers.SP, 0xFFFE);
});

test('EI seguido de EI não posterga a primeira habilitação', () => {
    const gb = program([0xFB, 0xFB, 0]);
    const c = gb.CPU.control;
    c.step();
    c.step();
    assert.equal(c.IME, 1);
});

test('IRQ aguarda instrução inteira e empilha seu PC final em cinco M-cycles', () => {
    const gb = program([0x01, 0x34, 0x12]);
    const c = gb.CPU.control;
    c.IME = 1;
    c.step();
    c.interrupts.IE = c.interrupts.IF = IRQ.VBLANK;
    c.step();
    assert.equal(c.registers.PC, 0xC002);
    c.step();
    assert.equal(c.registers.BC, 0x1234);
    assert.equal(c.registers.PC, 0xC003);
    const start = c.cycle;
    const events = [];
    const write = gb.bus.writeByte.bind(gb.bus);
    gb.bus.writeByte = (address, value) => { events.push([c.cycle - start, address, value]); write(address, value); };
    c.step();
    assert.equal(c.registers.SP, 0xFFFE);
    assert.equal(c.IME, 0);
    assert.equal(c.interrupts.IF, 0);
    c.step();
    assert.equal(c.registers.SP, 0xFFFE);
    c.step();
    assert.equal(c.registers.SP, 0xFFFD);
    c.step();
    assert.equal(c.registers.SP, 0xFFFC);
    assert.equal(c.registers.PC, 0xC003);
    c.step();
    assert.equal(c.cycle - start, 20);
    assert.equal(c.registers.PC, 0x40);
    assert.deepEqual(events, [[8, 0xFFFD, 0xC0], [12, 0xFFFC, 3]]);
});

test('prioridade de IRQ preserva outras solicitações', () => {
    const gb = program([0]);
    const c = gb.CPU.control;
    c.IME = 1;
    c.interrupts.IE = c.interrupts.IF = IRQ.VBLANK | IRQ.TIMER;
    for (let i = 0; i < 5; i++) c.step();
    assert.equal(c.registers.PC, 0x40);
    assert.equal(c.interrupts.IF, IRQ.TIMER);
});

test('componentes avançam em cada ciclo do atendimento da IRQ', () => {
    const gb = program([0]);
    const c = gb.CPU.control;
    c.IME = 1;
    c.interrupts.IE = c.interrupts.IF = IRQ.TIMER;
    gb.step(4);
    assert.equal(c.registers.PC, 0xC000);
    assert.equal(gb.timer.divInternal, 4);
    assert.equal(gb.LCDC.pixelClock, 4);
    gb.step(12);
    assert.equal(c.registers.SP, 0xFFFC);
    assert.equal(c.registers.PC, 0xC000);
    assert.equal(gb.timer.divInternal, 16);
    gb.step(4);
    assert.equal(c.registers.PC, 0x50);
    assert.equal(gb.timer.divInternal, 20);
    assert.equal(gb.LCDC.pixelClock, 20);
});

test('RETI habilita IME ao completar e restaura PC e SP', () => {
    const gb = program([0xD9]);
    const c = gb.CPU.control;
    c.registers.SP = 0xFFFC;
    gb.bus.writeByte(0xFFFC, 0x34);
    gb.bus.writeByte(0xFFFD, 0x12);
    for (let i = 0; i < 3; i++) c.step();
    assert.equal(c.IME, 0);
    c.step();
    assert.equal(c.IME, 1);
    assert.equal(c.registers.PC, 0x1234);
    assert.equal(c.registers.SP, 0xFFFE);
});

test('HALT mantém clocks ativos e desperta com IRQ pendente sem IME', () => {
    const gb = program([0x76, 0x04]);
    const c = gb.CPU.control;
    gb.step(8);
    assert.equal(c.halted, true);
    assert.equal(c.registers.PC, 0xC001);
    assert.equal(gb.timer.divInternal, 8);
    c.interrupts.IE = c.interrupts.IF = IRQ.TIMER;
    c.step();
    assert.equal(c.halted, 0);
    assert.equal(c.registers.B, 1);
    assert.equal(c.registers.SP, 0xFFFE);
});

test('halt bug repete o endereço de fetch uma vez com IME desligado', () => {
    const gb = program([0x76, 0x3E, 0x42]);
    const c = gb.CPU.control;
    c.interrupts.IE = c.interrupts.IF = IRQ.TIMER;
    c.step();
    c.step();
    c.step();
    assert.equal(c.registers.A, 0x3E);
    assert.equal(c.registers.PC, 0xC002);
    assert.equal(c.haltBug, false);
});

test('todos os opcodes ilegais travam a CPU mesmo com IRQ pendente', () => {
    for (const opcode of [0xD3, 0xDB, 0xDD, 0xE3, 0xE4, 0xEB, 0xEC, 0xED, 0xF4, 0xFC, 0xFD]) {
        const gb = program([opcode, 0x04]);
        const c = gb.CPU.control;
        c.step();
        c.IME = 1;
        c.interrupts.IE = c.interrupts.IF = IRQ.TIMER;
        gb.step(16);
        assert.equal(c.locked, true);
        assert.equal(c.registers.B, 0);
        assert.equal(c.registers.PC, 0xC001);
        assert.equal(c.cycle, 20);
        assert.equal(gb.timer.divInternal, 16);
    }
});
