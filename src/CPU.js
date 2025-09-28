import Flags from "./Flags.js";
import ALU from "./ALU.js";

// Processador (CPU - Central Processing Unit)
export default class CPU {
    constructor(MMU) {
        this.MMU = MMU;
        this.flags = new Flags();
        this.ALU = new ALU(this.flags);
        
        this.A = 0x01; // Acumulador
        this.flags.F = 0xB0; // Flags register inicializado com 0xB0
        this.B = 0x00;
        this.C = 0x13;
        this.D = 0x00;
        this.E = 0xD8;
        this.H = 0x01;
        this.L = 0x4D;
        this.PC = 0x0100; // Program Counter
        this.SP = 0xFFFE; // Stack Pointer
        this.cycle = 0;
        this.halted = false;
        this.haltBug = false;
        this.IME = false; // Interrupt Master Enable
        this.pendingIE = false; // Interrupt Enable Register
    }

    get F() {
        return this.flags.F & 0xF0;
    }

    set F(value) {
        this.flags.F = value & 0xF0;
    }

    set BC(value) {
        this.B = (value >> 8) & 0xFF;
        this.C = value & 0xFF;
    }

    get BC() {
        return ((this.B << 8) | this.C) & 0xFFFF;
    }

    set DE(value) {
        this.D = (value >> 8) & 0xFF;
        this.E = value & 0xFF;
    }

    get DE() {
        return ((this.D << 8) | this.E) & 0xFFFF;
    }

    set HL(value) {
        this.H = (value >> 8) & 0xFF;
        this.L = value & 0xFF;
    }

    get HL() {
        return ((this.H << 8) | this.L) & 0xFFFF;
    }

    executeInstruction() {
        const start = this.cycle;
        
        this.serviceInterrupts();

        if (this.cycle !== start) return false;

        if (this.halted) {
            const IE = this.MMU.readByte(0xFFFF);
            const IF = this.MMU.readByte(0xFF0F);

            if ((IE & IF) !== 0) {
                this.halted = false;
            } else {
                this.cycle += 4;
                return false;
            }
        } else {
            this.executeOpcode();
        }

        if (this.pendingIE) {
            this.IME = true;
            this.pendingIE = false;
        }

        return false;
    }

    executeOpcode() {
        const opcode = this.fetchByte();

        switch(opcode) {
            case 0x00: // NOP - Não faz nada
                this.cycle += 4;
                break;
            case 0x01: // LD BC, d16 - Carrega o valor de 16 bits no BC
                this.BC = this.fetchWord();
                this.cycle += 12;
                break;
            case 0x02: // LD (BC), A - Carrega o valor do A no endereço apontado por BC
                this.MMU.writeByte(this.BC, this.A);
                this.cycle += 8;
                break;
            case 0x03: // INC BC - Incrementa o valor de BC
                this.BC = this.ALU.INC_16(this.BC);
                this.cycle += 8;
                break;
            case 0x04: // INC B - Incrementa o valor do B
                this.B = this.ALU.INC_8(this.B);
                this.cycle += 4;
                break;
            case 0x05: // DEC B - Decrementa o valor do B
                this.B = this.ALU.DEC_8(this.B);
                this.cycle += 4;
                break;
            case 0x06: // LD B, d8 - Carrega o valor de 8 bits no B
                this.B = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x07: // RLCA - Rotaciona o A para a esquerda
                this.A = this.ALU.RLCA(this.A);
                this.cycle += 4;
                break;
            case 0x08: // LD (a16), SP - Carrega o valor do SP no endereço de 16 bits
                this.writeWord(this.fetchWord(), this.SP);
                this.cycle += 20;
                break;
            case 0x09: // ADD HL, BC - Adiciona o valor de BC ao HL
                this.HL = this.ALU.ADD_16(this.HL, this.BC);
                this.cycle += 8;
                break;
            case 0x0A: // LD A, (BC) - Carrega o valor no endereço apontado por BC no A
                this.A = this.MMU.readByte(this.BC);
                this.cycle += 8;
                break;
            case 0x0B: // DEC BC - Decrementa o valor de BC
                this.BC = this.ALU.DEC_16(this.BC);
                this.cycle += 8;
                break;
            case 0x0C: // INC C - Incrementa o valor do C
                this.C = this.ALU.INC_8(this.C);
                this.cycle += 4;
                break;
            case 0x0D: // DEC C - Decrementa o valor do C
                this.C = this.ALU.DEC_8(this.C);
                this.cycle += 4;
                break;
            case 0x0E: // LD C, d8 - Carrega o valor de 8 bits no C
                this.C = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x0F: // RRCA - Rotaciona o A para a direita
                this.A = this.ALU.RRCA(this.A);
                this.cycle += 4;
                break;
            case 0x10: // STOP - Para a execução da CPU
                this.fetchByte();
                this.MMU.writeByte(0xFF4D, 0); // Reset o registro de parada
                this.cycle += 4;
                break;
            case 0x11: // LD DE, d16 - Carrega o valor de 16 bits no DE
                this.DE = this.fetchWord();
                this.cycle += 12;
                break;
            case 0x12: // LD (DE), A - Carrega o valor do A no endereço apontado por DE
                this.MMU.writeByte(this.DE, this.A);
                this.cycle += 8;
                break;
            case 0x13: // INC DE - Incrementa o valor de DE
                this.DE = this.ALU.INC_16(this.DE);
                this.cycle += 8;
                break;
            case 0x14: // INC D - Incrementa o valor do D
                this.D = this.ALU.INC_8(this.D);
                this.cycle += 4;
                break;
            case 0x15: // DEC D - Decrementa o valor do D
                this.D = this.ALU.DEC_8(this.D);
                this.cycle += 4;
                break;
            case 0x16: // LD D, d8 - Carrega o valor de 8 bits no D
                this.D = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x17: // RLA - Rotaciona o A para a esquerda através do carry
                this.A = this.ALU.RLA(this.A);
                this.cycle += 4;
                break;
            case 0x18: // JR r8 - Salta para um endereço relativo de 8 bits
                this.jumpRelative(1, 1);
                break;
            case 0x19: // ADD HL, DE - Adiciona o valor de DE ao HL
                this.HL = this.ALU.ADD_16(this.HL, this.DE);
                this.cycle += 8;
                break;
            case 0x1A: // LD A, (DE) - Carrega o valor no endereço apontado por DE no A
                this.A = this.MMU.readByte(this.DE);
                this.cycle += 8;
                break;
            case 0x1B: // DEC DE - Decrementa o valor de DE
                this.DE = this.ALU.DEC_16(this.DE);
                this.cycle += 8;
                break;
            case 0x1C: // INC E - Incrementa o valor do E
                this.E = this.ALU.INC_8(this.E);
                this.cycle += 4;
                break;
            case 0x1D: // DEC E - Decrementa o valor do E
                this.E = this.ALU.DEC_8(this.E);
                this.cycle += 4;
                break;
            case 0x1E: // LD E, d8 - Carrega o valor de 8 bits no E
                this.E = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x1F: // RRA - Rotaciona o A para a direita através do carry
                this.A = this.ALU.RRA(this.A);
                this.cycle += 4;
                break;
            case 0x20: // JR NZ, r8 - Salta para um endereço relativo de 8 bits se a flag Z não estiver setada
                this.jumpRelative((this.F >>> 7) & 1, 0);
                break;
            case 0x21: // LD HL, d16 - Carrega o valor de 16 bits no HL
                this.HL = this.fetchWord();
                this.cycle += 12;
                break;
            case 0x22: // LD (HL+), A - Carrega o valor do A no endereço apontado por HL e incrementa HL
                this.MMU.writeByte(this.HL, this.A);
                this.HL = this.ALU.INC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x23: // INC HL - Incrementa o valor de HL
                this.HL = this.ALU.INC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x24: // INC H - Incrementa o valor do H
                this.H = this.ALU.INC_8(this.H);
                this.cycle += 4;
                break;
            case 0x25: // DEC H - Decrementa o valor do H
                this.H = this.ALU.DEC_8(this.H);
                this.cycle += 4;
                break;
            case 0x26: // LD H, d8 - Carrega o valor de 8 bits no H
                this.H = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x27: // DAA - Ajusta o valor do A para o formato BCD
                this.A = this.ALU.DAA(this.A);
                this.cycle += 4;
                break;
            case 0x28: // JR Z, r8 - Salta para um endereço relativo de 8 bits se a flag Z estiver setada
                this.jumpRelative((this.F >>> 7) & 1, 1);
                break;
            case 0x29: // ADD HL, HL - Adiciona o valor de HL ao HL
                this.HL = this.ALU.ADD_16(this.HL, this.HL);
                this.cycle += 8;
                break;
            case 0x2A: // LD A, (HL+) - Carrega o valor no endereço apontado por HL no A e incrementa HL
                this.A = this.MMU.readByte(this.HL);
                this.HL = this.ALU.INC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x2B: // DEC HL - Decrementa o valor de HL
                this.HL = this.ALU.DEC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x2C: // INC L - Incrementa o valor do L
                this.L = this.ALU.INC_8(this.L);
                this.cycle += 4;
                break;
            case 0x2D: // DEC L - Decrementa o valor do L
                this.L = this.ALU.DEC_8(this.L);
                this.cycle += 4;
                break;
            case 0x2E: // LD L, d8 - Carrega o valor de 8 bits no L
                this.L = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x2F: // CPL - Complementa o valor do A (A = ~A)
                this.A = (~this.A) & 0xFF;
                this.flags.N = 1;
                this.flags.H = 1;
                this.cycle += 4;
                break;
            case 0x30: // JR NC - Salta para um endereço relativo de 8 bits se a flag C não estiver setada
                this.jumpRelative((this.F >>> 4) & 1, 0);
                break;
            case 0x31: // LD SP, d16 - Carrega o valor de 16 bits no SP
                this.SP = this.fetchWord();
                this.cycle += 12;
                break;
            case 0x32: // LD (HL-), A - Carrega o valor do A no endereço apontado por HL e decrementa HL
                this.MMU.writeByte(this.HL, this.A);
                this.HL = this.ALU.DEC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x33: // INC SP - Incrementa o valor do SP
                this.SP = (this.SP + 1) & 0xFFFF;
                this.cycle += 8;
                break;
            case 0x34: // INC (HL) - Incrementa o valor no endereço apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.INC_8(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 12;
                }
                break;
            case 0x35: // DEC (HL) - Decrementa o valor no endereço apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.DEC_8(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 12;
                }
                break;
            case 0x36: // LD (HL), d8 - Carrega o valor de 8 bits no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.fetchByte());
                this.cycle += 12;
                break;
            case 0x37: // SCF - Seta a flag Carry
                this.flags.C = 1;
                this.flags.N = 0;
                this.flags.H = 0;
                this.cycle += 4;
                break;
            case 0x38: // JR C, r8 - Salta para um endereço relativo de 8 bits se a flag C estiver setada
                this.jumpRelative((this.F >>> 4) & 1, 1);
                break;
            case 0x39: // ADD HL, SP - Adiciona o valor do SP ao HL
                this.HL = this.ALU.ADD_16(this.HL, this.SP);
                this.cycle += 8;
                break;
            case 0x3A: // LD A, (HL-) - Carrega o valor no endereço apontado por HL no A e decrementa HL
                this.A = this.MMU.readByte(this.HL);
                this.HL = this.ALU.DEC_16(this.HL);
                this.cycle += 8;
                break;
            case 0x3B: // DEC SP - Decrementa o valor do SP
                this.SP = this.ALU.DEC_16(this.SP);
                this.cycle += 8;
                break;
            case 0x3C: // INC A - Incrementa o valor do A
                this.A = this.ALU.INC_8(this.A);
                this.cycle += 4;
                break;
            case 0x3D: // DEC A - Decrementa o valor do A
                this.A = this.ALU.DEC_8(this.A);
                this.cycle += 4;
                break;
            case 0x3E: // LD A, d8 - Carrega o valor de 8 bits no A
                this.A = this.fetchByte();
                this.cycle += 8;
                break;
            case 0x3F: // CCF - Complementa a flag Carry
                this.flags.C ^= 1;
                this.flags.N = 0;
                this.flags.H = 0;
                this.cycle += 4;
                break;
            case 0x40: // LD B, B - Carrega o valor do B no B
                this.B = this.B;
                this.cycle += 4;
                break;
            case 0x41: // LD B, C - Carrega o valor do C no B
                this.B = this.C;
                this.cycle += 4;
                break;
            case 0x42: // LD B, D - Carrega o valor do D no B
                this.B = this.D;
                this.cycle += 4;
                break;
            case 0x43: // LD B, E - Carrega o valor do E no B
                this.B = this.E;
                this.cycle += 4;
                break;
            case 0x44: // LD B, H - Carrega o valor do H no B
                this.B = this.H;
                this.cycle += 4;
                break;
            case 0x45: // LD B, L - Carrega o valor do L no B
                this.B = this.L;
                this.cycle += 4;
                break;
            case 0x46: // LD B, (HL) - Carrega o valor no endereço apontado por HL no B
                this.B = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x47: // LD B, A - Carrega o valor do A no B
                this.B = this.A;
                this.cycle += 4;
                break;
            case 0x48: // LD C, B - Carrega o valor do B no C
                this.C = this.B;
                this.cycle += 4;
                break;
            case 0x49: // LD C, C - Carrega o valor do C no C
                this.C = this.C;
                this.cycle += 4;
                break;
            case 0x4A: // LD C, D - Carrega o valor do D no C
                this.C = this.D;
                this.cycle += 4;
                break;
            case 0x4B: // LD C, E - Carrega o valor do E no C
                this.C = this.E;
                this.cycle += 4;
                break;
            case 0x4C: // LD C, H - Carrega o valor do H no C
                this.C = this.H;
                this.cycle += 4;
                break;
            case 0x4D: // LD C, L - Carrega o valor do L no C
                this.C = this.L;
                this.cycle += 4;
                break;
            case 0x4E: // LD C, (HL) - Carrega o valor no endereço apontado por HL no C
                this.C = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x4F: // LD C, A - Carrega o valor do A no C
                this.C = this.A;
                this.cycle += 4;
                break;
            case 0x50: // LD D, B - Carrega o valor do B no D
                this.D = this.B;
                this.cycle += 4;
                break;
            case 0x51: // LD D, C - Carrega o valor do C no D
                this.D = this.C;
                this.cycle += 4;
                break;
            case 0x52: // LD D, D - Carrega o valor do D no D
                this.D = this.D;
                this.cycle += 4;
                break;
            case 0x53: // LD D, E - Carrega o valor do E no D
                this.D = this.E;
                this.cycle += 4;
                break;
            case 0x54: // LD D, H - Carrega o valor do H no D
                this.D = this.H;
                this.cycle += 4;
                break;
            case 0x55: // LD D, L - Carrega o valor do L no D
                this.D = this.L;
                this.cycle += 4;
                break;
            case 0x56: // LD D, (HL) - Carrega o valor no endereço apontado por HL no D
                this.D = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x57: // LD D, A - Carrega o valor do A no D
                this.D = this.A;
                this.cycle += 4;
                break;
            case 0x58: // LD E, B - Carrega o valor do B no E
                this.E = this.B;
                this.cycle += 4;
                break;
            case 0x59: // LD E, C - Carrega o valor do C no E
                this.E = this.C;
                this.cycle += 4;
                break;
            case 0x5A: // LD E, D - Carrega o valor do D no E
                this.E = this.D;
                this.cycle += 4;
                break;
            case 0x5B: // LD E, E - Carrega o valor do E no E
                this.E = this.E;
                this.cycle += 4;
                break;
            case 0x5C: // LD E, H - Carrega o valor do H no E
                this.E = this.H;
                this.cycle += 4;
                break;
            case 0x5D: // LD E, L - Carrega o valor do L no E
                this.E = this.L;
                this.cycle += 4;
                break;
            case 0x5E: // LD E, (HL) - Carrega o valor no endereço apontado por HL no E
                this.E = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x5F: // LD E, A - Carrega o valor do A no E
                this.E = this.A;
                this.cycle += 4;
                break;
            case 0x60: // LD H, B - Carrega o valor do B no H
                this.H = this.B;
                this.cycle += 4;
                break;
            case 0x61: // LD H, C - Carrega o valor do C no H
                this.H = this.C;
                this.cycle += 4;
                break;
            case 0x62: // LD H, D - Carrega o valor do D no H
                this.H = this.D;
                this.cycle += 4;
                break;
            case 0x63: // LD H, E - Carrega o valor do E no H
                this.H = this.E;
                this.cycle += 4;
                break;
            case 0x64: // LD H, H - Carrega o valor do H no H
                this.H = this.H;
                this.cycle += 4;
                break;
            case 0x65: // LD H, L - Carrega o valor do L no H
                this.H = this.L;
                this.cycle += 4;
                break;
            case 0x66: // LD H, (HL) - Carrega o valor no endereço apontado por HL no H
                this.H = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x67: // LD H, A - Carrega o valor do A no H
                this.H = this.A;
                this.cycle += 4;
                break;
            case 0x68: // LD L, B - Carrega o valor do B no L
                this.L = this.B;
                this.cycle += 4;
                break;
            case 0x69: // LD L, C - Carrega o valor do C no L
                this.L = this.C;
                this.cycle += 4;
                break;
            case 0x6A: // LD L, D - Carrega o valor do D no L
                this.L = this.D;
                this.cycle += 4;
                break;
            case 0x6B: // LD L, E - Carrega o valor do E no L
                this.L = this.E;
                this.cycle += 4;
                break;
            case 0x6C: // LD L, H - Carrega o valor do H no L
                this.L = this.H;
                this.cycle += 4;
                break;
            case 0x6D: // LD L, L - Carrega o valor do L no L
                this.L = this.L;
                this.cycle += 4;
                break;
            case 0x6E: // LD L, (HL) - Carrega o valor no endereço apontado por HL no L
                this.L = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x6F: // LD L, A - Carrega o valor do A no L
                this.L = this.A;
                this.cycle += 4;
                break;
            case 0x70: // LD (HL), B - Armazena o valor do B no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.B);
                this.cycle += 8;
                break;
            case 0x71: // LD (HL), C - Armazena o valor do C no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.C);
                this.cycle += 8;
                break;
            case 0x72: // LD (HL), D - Armazena o valor do D no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.D);
                this.cycle += 8;
                break;
            case 0x73: // LD (HL), E - Armazena o valor do E no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.E);
                this.cycle += 8;
                break;
            case 0x74: // LD (HL), H - Armazena o valor do H no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.H);
                this.cycle += 8;
                break;
            case 0x75: // LD (HL), L - Armazena o valor do L no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.L);
                this.cycle += 8;
                break;
            case 0x76: // HALT - Para a execução da CPU
                {
                    const IE = this.MMU.readByte(0xFFFF);
                    const IF = this.MMU.readByte(0xFF0F);
                    const pending = IE & IF & 0x1F;
                    if (this.IME) {
                        this.halted = true;
                    } else {
                        if (pending !== 0) this.haltBug = true;
                        else this.halted = true;
                    }
                    this.cycle += 4;
                }
                break;
            case 0x77: // LD (HL), A - Armazena o valor do A no endereço apontado por HL
                this.MMU.writeByte(this.HL, this.A);
                this.cycle += 8;
                break;
            case 0x78: // LD A, B - Carrega o valor do B no A
                this.A = this.B;
                this.cycle += 4;
                break;
            case 0x79: // LD A, C - Carrega o valor do C no A
                this.A = this.C;
                this.cycle += 4;
                break;
            case 0x7A: // LD A, D - Carrega o valor do D no A
                this.A = this.D;
                this.cycle += 4;
                break;
            case 0x7B: // LD A, E - Carrega o valor do E no A
                this.A = this.E;
                this.cycle += 4;
                break;
            case 0x7C: // LD A, H - Carrega o valor do H no A
                this.A = this.H;
                this.cycle += 4;
                break;
            case 0x7D: // LD A, L - Carrega o valor do L no A
                this.A = this.L;
                this.cycle += 4;
                break;
            case 0x7E: // LD A, (HL) - Carrega o valor no endereço apontado por HL no A
                this.A = this.MMU.readByte(this.HL);
                this.cycle += 8;
                break;
            case 0x7F: // LD A, A - Carrega o valor do A no A
                this.A = this.A;
                this.cycle += 4;
                break;
            case 0x80: // ADD A, B - Adiciona o valor do B ao A
                this.A = this.ALU.ADD_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0x81: // ADD A, C - Adiciona o valor do C ao A
                this.A = this.ALU.ADD_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0x82: // ADD A, D - Adiciona o valor do D ao A
                this.A = this.ALU.ADD_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0x83: // ADD A, E - Adiciona o valor do E ao A
                this.A = this.ALU.ADD_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0x84: // ADD A, H - Adiciona o valor do H ao A
                this.A = this.ALU.ADD_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0x85: // ADD A, L - Adiciona o valor do L ao A
                this.A = this.ALU.ADD_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0x86: // ADD A, (HL) - Adiciona o valor no endereço apontado por HL ao A
                this.A = this.ALU.ADD_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0x87: // ADD A, A - Adiciona o valor do A ao A
                this.A = this.ALU.ADD_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0x88: // ADC A, B - Adiciona o valor do A ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.B, this.flags.C);
                this.cycle += 4;
                break;
            case 0x89: // ADC A, C - Adiciona o valor do C ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.C, this.flags.C);
                this.cycle += 4;
                break;
            case 0x8A: // ADC A, D - Adiciona o valor do D ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.D, this.flags.C);
                this.cycle += 4;
                break;
            case 0x8B: // ADC A, E - Adiciona o valor do E ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.E, this.flags.C);
                this.cycle += 4;
                break;
            case 0x8C: // ADC A, H - Adiciona o valor do H ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.H, this.flags.C);
                this.cycle += 4;
                break;
            case 0x8D: // ADC A, L - Adiciona o valor do L ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.L, this.flags.C);
                this.cycle += 4;
                break;
            case 0x8E: // ADC A, (HL) - Adiciona o valor no endereço apontado por HL ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.MMU.readByte(this.HL), this.flags.C);
                this.cycle += 8;
                break;
            case 0x8F: // ADC A, A - Adiciona o valor do A ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.A, this.flags.C);
                this.cycle += 4;
                break;
            case 0x90: // SUB B - Subtrai o valor do B do A
                this.A = this.ALU.SUB_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0x91: // SUB C - Subtrai o valor do C do A
                this.A = this.ALU.SUB_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0x92: // SUB D - Subtrai o valor do D do A
                this.A = this.ALU.SUB_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0x93: // SUB E - Subtrai o valor do E do A
                this.A = this.ALU.SUB_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0x94: // SUB H - Subtrai o valor do H do A
                this.A = this.ALU.SUB_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0x95: // SUB L - Subtrai o valor do L do A
                this.A = this.ALU.SUB_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0x96: // SUB (HL) - Subtrai o valor no endereço apontado por HL do A
                this.A = this.ALU.SUB_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0x97: // SUB A - Subtrai o valor do A do A
                this.A = this.ALU.SUB_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0x98: // SBC A, B - Subtrai o valor do B do A com carry
                this.A = this.ALU.SBC_8(this.A, this.B, this.flags.C);
                this.cycle += 4;
                break;
            case 0x99: // SBC A, C - Subtrai o valor do C do A com carry
                this.A = this.ALU.SBC_8(this.A, this.C, this.flags.C);
                this.cycle += 4;
                break;
            case 0x9A: // SBC A, D - Subtrai o valor do D do A com carry
                this.A = this.ALU.SBC_8(this.A, this.D, this.flags.C);
                this.cycle += 4;
                break;
            case 0x9B: // SBC A, E - Subtrai o valor do E do A com carry
                this.A = this.ALU.SBC_8(this.A, this.E, this.flags.C);
                this.cycle += 4;
                break;
            case 0x9C: // SBC A, H - Subtrai o valor do H do A com carry
                this.A = this.ALU.SBC_8(this.A, this.H, this.flags.C);
                this.cycle += 4;
                break;
            case 0x9D: // SBC A, L - Subtrai o valor do L do A com carry
                this.A = this.ALU.SBC_8(this.A, this.L, this.flags.C);
                this.cycle += 4;
                break;
            case 0x9E: // SBC (HL) - Subtrai o valor no endereço apontado por HL do A com carry
                this.A = this.ALU.SBC_8(this.A, this.MMU.readByte(this.HL), this.flags.C);
                this.cycle += 8;
                break;
            case 0x9F: // SBC A, A - Subtrai o valor do A do A com carry
                this.A = this.ALU.SBC_8(this.A, this.A, this.flags.C);
                this.cycle += 4;
                break;
            case 0xA0: // AND B - Faz um AND do A com o B
                this.A = this.ALU.AND_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0xA1: // AND C - Faz um AND do A com o C
                this.A = this.ALU.AND_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0xA2: // AND D - Faz um AND do A com o D
                this.A = this.ALU.AND_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0xA3: // AND E - Faz um AND do A com o E
                this.A = this.ALU.AND_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0xA4: // AND H - Faz um AND do A com o H
                this.A = this.ALU.AND_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0xA5: // AND L - Faz um AND do A com o L
                this.A = this.ALU.AND_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0xA6: // AND (HL) - Faz um AND do A com o valor no endereço apontado por HL
                this.A = this.ALU.AND_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0xA7: // AND A - Faz um AND do A com ele mesmo
                this.A = this.ALU.AND_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0xA8: // XOR B - Faz um XOR do A com o B
                this.A = this.ALU.XOR_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0xA9: // XOR C - Faz um XOR do A com o C
                this.A = this.ALU.XOR_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0xAA: // XOR D - Faz um XOR do A com o D
                this.A = this.ALU.XOR_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0xAB: // XOR E - Faz um XOR do A com o E
                this.A = this.ALU.XOR_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0xAC: // XOR H - Faz um XOR do A com o H
                this.A = this.ALU.XOR_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0xAD: // XOR L - Faz um XOR do A com o L
                this.A = this.ALU.XOR_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0xAE: // XOR (HL) - Faz um XOR do A com o valor no endereço apontado por HL
                this.A = this.ALU.XOR_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0xAF: // XOR A - Faz um XOR do A com ele mesmo
                this.A = this.ALU.XOR_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0xB0: // OR B - Faz um OR do A com o B
                this.A = this.ALU.OR_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0xB1: // OR C - Faz um OR do A com o C
                this.A = this.ALU.OR_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0xB2: // OR D - Faz um OR do A com o D
                this.A = this.ALU.OR_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0xB3: // OR E - Faz um OR do A com o E
                this.A = this.ALU.OR_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0xB4: // OR H - Faz um OR do A com o H
                this.A = this.ALU.OR_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0xB5: // OR L - Faz um OR do A com o L
                this.A = this.ALU.OR_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0xB6: // OR (HL) - Faz um OR do A com o valor no endereço apontado por HL
                this.A = this.ALU.OR_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0xB7: // OR A - Faz um OR do A com ele mesmo
                this.A = this.ALU.OR_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0xB8: // CP B - Compara o A com o B
                this.ALU.SUB_8(this.A, this.B);
                this.cycle += 4;
                break;
            case 0xB9: // CP C - Compara o A com o C
                this.ALU.SUB_8(this.A, this.C);
                this.cycle += 4;
                break;
            case 0xBA: // CP D - Compara o A com o D
                this.ALU.SUB_8(this.A, this.D);
                this.cycle += 4;
                break;
            case 0xBB: // CP E - Compara o A com o E
                this.ALU.SUB_8(this.A, this.E);
                this.cycle += 4;
                break;
            case 0xBC: // CP H - Compara o A com o H
                this.ALU.SUB_8(this.A, this.H);
                this.cycle += 4;
                break;
            case 0xBD: // CP L - Compara the A com o L
                this.ALU.SUB_8(this.A, this.L);
                this.cycle += 4;
                break;
            case 0xBE: // CP (HL) - Compara o A com o valor no endereço apontado por HL
                this.ALU.SUB_8(this.A, this.MMU.readByte(this.HL));
                this.cycle += 8;
                break;
            case 0xBF: // CP A - Compara o A com ele mesmo
                this.ALU.SUB_8(this.A, this.A);
                this.cycle += 4;
                break;
            case 0xC0: // RET NZ - Retorna de uma chamada de sub-rotina se a flag Z não estiver setada
                if (this.flags.Z === 0) {
                    this.PC = this.POP();
                    this.cycle += 20;
                } else {
                    this.cycle += 8;
                }
                break;
            case 0xC1: // POP BC - Desempilha o valor de BC
                this.BC = this.POP();
                this.cycle += 12;
                break;
            case 0xC2: // JP NZ, a16 - Salta para o endereço de 16 bits se a flag Z não estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.Z === 0) {
                        this.PC = address & 0xFFFF;
                        this.cycle += 16;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xC3: // JP a16 - Salta para o endereço de 16 bits
                this.PC = this.fetchWord() & 0xFFFF;
                this.cycle += 16;
                break;
            case 0xC4: // CALL NZ, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z não estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.Z === 0) {
                        this.PUSH(this.PC);
                        this.PC = address & 0xFFFF;
                        this.cycle += 24;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xC5: // PUSH BC - Empilha o valor de BC
                this.PUSH(this.BC);
                this.cycle += 16;
                break;
            case 0xC6: // ADD A, d8 - Adiciona o valor de 8 bits ao A
                this.A = this.ALU.ADD_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xC7: // RST 00H - Chama a sub-rotina no endereço 0x0000
                this.PUSH(this.PC);
                this.PC = 0x0000;
                this.cycle += 16;
                break;
            case 0xC8: // RET Z - Retorna de uma chamada de sub-rotina se a flag Z estiver setada
                if (this.flags.Z === 1) {
                    this.PC = this.POP();
                    this.cycle += 20;
                } else {
                    this.cycle += 8;
                }
                break;
            case 0xC9: // RET - Retorna de uma chamada de sub-rotina
                this.PC = this.POP();
                this.cycle += 16;
                break;
            case 0xCA: // JP Z, a16 - Salta para o endereço de 16 bits se a flag Z estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.Z === 1) {
                        this.PC = address & 0xFFFF;
                        this.cycle += 16;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xCB: // CB - Prefixo de instruções de 8 bits
                this.executeCBOpcode();
                break;
            case 0xCC: // CALL Z, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.Z === 1) {
                        this.PUSH(this.PC);
                        this.PC = address & 0xFFFF;
                        this.cycle += 24;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xCD: // CALL a16 - Chama uma sub-rotina no endereço de 16 bits
                {
                    const address = this.fetchWord();
                    this.PUSH(this.PC);
                    this.PC = address & 0xFFFF;
                    this.cycle += 24;
                }
                break;
            case 0xCE: // ADC A, d8 - Adiciona o valor de 8 bits ao A com carry
                this.A = this.ALU.ADC_8(this.A, this.fetchByte(), this.flags.C);
                this.cycle += 8;
                break;
            case 0xCF: // RST 08H - Chama a sub-rotina no endereço 0x0008
                this.PUSH(this.PC);
                this.PC = 0x0008;
                this.cycle += 16;
                break;
            case 0xD0: // RET NC - Retorna de uma chamada de sub-rotina se a flag C não estiver setada
                if (this.flags.C === 0) {
                    this.PC = this.POP();
                    this.cycle += 20;
                } else {
                    this.cycle += 8;
                }
                break;
            case 0xD1: // POP DE - Desempilha o valor de DE
                {
                    const word = this.POP();
                    this.D = (word >> 8) & 0xFF;
                    this.E = word & 0xFF;
                    this.cycle += 12;
                }
                break;
            case 0xD2: // JP NC, a16 - Salta para o endereço de 16 bits se a flag C não estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.C === 0) {
                        this.PC = address & 0xFFFF;
                        this.cycle += 16;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xD3: // Não implementado
                console.error('Unimplemented instruction: D3');
                this.cycle += 4;
                break;
            case 0xD4: // CALL NC, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C não estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.C === 0) {
                        this.PUSH(this.PC);
                        this.PC = address & 0xFFFF;
                        this.cycle += 24;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xD5: // PUSH DE - Empilha o valor de DE
                this.PUSH((this.D << 8) | this.E);
                this.cycle += 16;
                break;
            case 0xD6: // SUB d8 - Subtrai o valor de 8 bits do A
                this.A = this.ALU.SUB_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xD7: // RST 10H - Chama a sub-rotina no endereço 0x0010
                this.PUSH(this.PC);
                this.PC = 0x0010;
                this.cycle += 16;
                break;
            case 0xD8: // RET C - Retorna de uma chamada de sub-rotina se a flag C estiver setada
                if (this.flags.C === 1) {
                    this.PC = this.POP();
                    this.cycle += 20;
                } else {
                    this.cycle += 8;
                }
                break;
            case 0xD9: // RETI - Retorna de uma chamada de sub-rotina e habilita as interrupções
                this.PC = this.POP();
                this.IME = true;
                this.cycle += 16;
                break;
            case 0xDA: // JP C, a16 - Salta para o endereço de 16 bits se a flag C estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.C === 1) {
                        this.PC = address & 0xFFFF;
                        this.cycle += 16;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xDB: // Não implementado
                console.error('Unimplemented instruction: DB');
                this.cycle += 4;
                break;
            case 0xDC: // CALL C, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C estiver setada
                {
                    const address = this.fetchWord();
                    if (this.flags.C === 1) {
                        this.PUSH(this.PC);
                        this.PC = address & 0xFFFF;
                        this.cycle += 24;
                    } else {
                        this.cycle += 12;
                    }
                }
                break;
            case 0xDD: // Não implementado
                console.error('Unimplemented instruction: DD');
                this.cycle += 4;
                break;
            case 0xDE: // SBC A, d8 - Subtrai o valor de 8 bits do A com carry
                this.A = this.ALU.SBC_8(this.A, this.fetchByte(), this.flags.C);
                this.cycle += 8;
                break;
            case 0xDF: // RST 18H - Chama a sub-rotina no endereço 0x0018
                this.PUSH(this.PC);
                this.PC = 0x0018;
                this.cycle += 16;
                break;
            case 0xE0: // LDH (a8), A - Armazena o valor do A no endereço 0xFF00 + valor de 8 bits
                this.MMU.writeByte(0xFF00 + this.fetchByte(), this.A);
                this.cycle += 12;
                break;
            case 0xE1: // POP HL - Desempilha o valor de HL
                {
                    const word = this.POP();
                    this.H = (word >> 8) & 0xFF;
                    this.L = word & 0xFF;
                    this.cycle += 12;
                }
                break;
            case 0xE2: // LD (C), A - Armazena o valor do A no endereço 0xFF00 + valor do C
                this.MMU.writeByte(0xFF00 + this.C, this.A);
                this.cycle += 8;
                break;
            case 0xE3: // Não implementado
                console.error('Unimplemented instruction: E3');
                this.cycle += 4;
                break;
            case 0xE4: // Não implementado
                console.error('Unimplemented instruction: E4');
                this.cycle += 4;
                break;
            case 0xE5: // PUSH HL - Empilha o valor de HL
                this.PUSH((this.H << 8) | this.L);
                this.cycle += 16;
                break;
            case 0xE6: // AND d8 - Faz um AND do A com o valor de 8 bits
                this.A = this.ALU.AND_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xE7: // RST 20H - Chama a sub-rotina no endereço 0x0020
                this.PUSH(this.PC);
                this.PC = 0x0020;
                this.cycle += 16;
                break;
            case 0xE8: // ADD SP, r8 - Adiciona o valor de 8 bits ao SP
                this.SP = this.ALU.ADD_SP_e8(this.SP, this.fetchByte());
                this.cycle += 16;
                break;
            case 0xE9: // JP (HL) - Salta para o endereço apontado por HL
                this.PC = this.HL;
                this.cycle += 4;
                break;
            case 0xEA: // LD (a16), A - Armazena o valor do A no endereço de 16 bits
                this.MMU.writeByte(this.fetchWord(), this.A);
                this.cycle += 16;
                break;
            case 0xEB: // Não implementado
                console.error('Unimplemented instruction: EB');
                this.cycle += 4;
                break;
            case 0xEC: // Não implementado
                console.error('Unimplemented instruction: EC');
                this.cycle += 4;
                break;
            case 0xED: // Não implementado
                console.error('Unimplemented instruction: ED');
                this.cycle += 4;
                break;
            case 0xEE: // XOR d8 - Faz um XOR do A com o valor de 8 bits
                this.A = this.ALU.XOR_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xEF: // RST 28H - Chama a sub-rotina no endereço 0x0028
                this.PUSH(this.PC);
                this.PC = 0x0028;
                this.cycle += 16;
                break;
            case 0xF0: // LDH A, (a8) - Carrega o valor no endereço 0xFF00 + valor de 8 bits no A
                this.A = this.MMU.readByte(0xFF00 + this.fetchByte());
                this.cycle += 12;
                break;
            case 0xF1: // POP AF - Desempilha o valor de AF
                {
                    const word = this.POP();
                    this.A = (word >> 8) & 0xFF;
                    this.F = word & 0xF0;
                    this.cycle += 12;
                }
                break;
            case 0xF2: // LD A, (C) - Carrega o valor no endereço 0xFF00 + valor do C no A
                this.A = this.MMU.readByte(0xFF00 + this.C);
                this.cycle += 8;
                break;
            case 0xF3: // DI - Desabilita as interrupções
                this.IME = false;
                this.pendingIE = false;
                this.cycle += 4;
                break;
            case 0xF4: // Não implementado
                console.error('Unimplemented instruction: F4');
                this.cycle += 4;
                break;
            case 0xF5: // PUSH AF - Empilha o valor de AF
                this.PUSH((this.A << 8) | (this.F & 0xF0));
                this.cycle += 16;
                break;
            case 0xF6: // OR d8 - Faz um OR do A com o valor de 8 bits
                this.A = this.ALU.OR_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xF7: // RST 30H - Chama a sub-rotina no endereço 0x0030
                this.PUSH(this.PC);
                this.PC = 0x0030;
                this.cycle += 16;
                break;
            case 0xF8: // LD HL, SP+r8 - Carrega o SP mais o valor de 8 bits em HL
                this.HL = this.ALU.ADD_SP_e8(this.SP, this.fetchByte());
                this.cycle += 12;
                break;
            case 0xF9: // LD SP, HL - Carrega o valor de HL no SP
                this.SP = this.HL;
                this.cycle += 8;
                break;
            case 0xFA: // LD A, (a16) - Carrega o valor no endereço de 16 bits no A
                this.A = this.MMU.readByte(this.fetchWord());
                this.cycle += 16;
                break;
            case 0xFB: // EI - Habilita as interrupções
                this.pendingIE = true;
                this.cycle += 4;
                break;
            case 0xFC: // Não implementado
                console.error('Unimplemented instruction: FC');
                this.cycle += 4;
                break;
            case 0xFD: // Não implementado
                console.error('Unimplemented instruction: FD');
                this.cycle += 4;
                break;
            case 0xFE: // CP d8 - Compara o A com o valor de 8 bits
                this.ALU.SUB_8(this.A, this.fetchByte());
                this.cycle += 8;
                break;
            case 0xFF: // RST 38H - Chama a sub-rotina no endereço 0x0038
                this.PUSH(this.PC);
                this.PC = 0x0038;
                this.cycle += 16;
                break;
            default:
                console.error(`Unimplemented instruction: ${opcode.toString(16)}`);
                this.cycle += 4;
                break;
        }
    }

    executeCBOpcode() {
        const cbOpcode = this.fetchByte();
        
        switch(cbOpcode) {
            case 0x00: // RLC B - Rotaciona o B para a esquerda
                this.B = this.ALU.RLC(this.B);
                this.cycle += 8;
                break;
            case 0x01: // RLC C - Rotaciona o C para a esquerda
                this.C = this.ALU.RLC(this.C);
                this.cycle += 8;
                break;
            case 0x02: // RLC D - Rotaciona o D para a esquerda
                this.D = this.ALU.RLC(this.D);
                this.cycle += 8;
                break;
            case 0x03: // RLC E - Rotaciona o E para a esquerda
                this.E = this.ALU.RLC(this.E);
                this.cycle += 8;
                break;
            case 0x04: // RLC H - Rotaciona o H para a esquerda
                this.H = this.ALU.RLC(this.H);
                this.cycle += 8;
                break;
            case 0x05: // RLC L - Rotaciona o L para a esquerda
                this.L = this.ALU.RLC(this.L);
                this.cycle += 8;
                break;
            case 0x06: // RLC (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RLC(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x07: // RLC A - Rotaciona o A para a esquerda
                this.A = this.ALU.RLC(this.A);
                this.cycle += 8;
                break;
            case 0x08: // RRC B - Rotaciona o B para a direita
                this.B = this.ALU.RRC(this.B);
                this.cycle += 8;
                break;
            case 0x09: // RRC C - Rotaciona o C para a direita
                this.C = this.ALU.RRC(this.C);
                this.cycle += 8;
                break;
            case 0x0A: // RRC D - Rotaciona o D para a direita
                this.D = this.ALU.RRC(this.D);
                this.cycle += 8;
                break;
            case 0x0B: // RRC E - Rotaciona o E para a direita
                this.E = this.ALU.RRC(this.E);
                this.cycle += 8;
                break;
            case 0x0C: // RRC H - Rotaciona o H para a direita
                this.H = this.ALU.RRC(this.H);
                this.cycle += 8;
                break;
            case 0x0D: // RRC L - Rotaciona o L para a direita
                this.L = this.ALU.RRC(this.L);
                this.cycle += 8;
                break;
            case 0x0E: // RRC (HL) - Rotaciona o valor no endereço apontado por HL para a direita
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RRC(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x0F: // RRC A - Rotaciona o A para a direita
                this.A = this.ALU.RRC(this.A);
                this.cycle += 8;
                break;
            case 0x10: // RL B - Rotaciona o B para a esquerda através do carry
                this.B = this.ALU.RL(this.B);
                this.cycle += 8;
                break;
            case 0x11: // RL C - Rotaciona o C para a esquerda através do carry
                this.C = this.ALU.RL(this.C);
                this.cycle += 8;
                break;
            case 0x12: // RL D - Rotaciona o D para a esquerda através do carry
                this.D = this.ALU.RL(this.D);
                this.cycle += 8;
                break;
            case 0x13: // RL E - Rotaciona o E para a esquerda através do carry
                this.E = this.ALU.RL(this.E);
                this.cycle += 8;
                break;
            case 0x14: // RL H - Rotaciona o H para a esquerda através do carry
                this.H = this.ALU.RL(this.H);
                this.cycle += 8;
                break;
            case 0x15: // RL L - Rotaciona o L para a esquerda através do carry
                this.L = this.ALU.RL(this.L);
                this.cycle += 8;
                break;
            case 0x16: // RL (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda através do carry
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RL(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x17: // RL A - Rotaciona o A para a esquerda através do carry
                this.A = this.ALU.RL(this.A);
                this.cycle += 8;
                break;
            case 0x18: // RR B - Rotaciona o B para a direita através do carry
                this.B = this.ALU.RR(this.B);
                this.cycle += 8;
                break;
            case 0x19: // RR C - Rotaciona o C para a direita através do carry
                this.C = this.ALU.RR(this.C);
                this.cycle += 8;
                break;
            case 0x1A: // RR D - Rotaciona o D para a direita através do carry
                this.D = this.ALU.RR(this.D);
                this.cycle += 8;
                break;
            case 0x1B: // RR E - Rotaciona o E para a direita através do carry
                this.E = this.ALU.RR(this.E);
                this.cycle += 8;
                break;
            case 0x1C: // RR H - Rotaciona o H para a direita através do carry
                this.H = this.ALU.RR(this.H);
                this.cycle += 8;
                break;
            case 0x1D: // RR L - Rotaciona o L para a direita através do carry
                this.L = this.ALU.RR(this.L);
                this.cycle += 8;
                break;
            case 0x1E: // RR (HL) - Rotaciona o valor no endereço apontado por HL para a direita através do carry
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RR(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x1F: // RR A - Rotaciona o A para a direita através do carry
                this.A = this.ALU.RR(this.A);
                this.cycle += 8;
                break;
            case 0x20: // SLA B - Shift left arithmetic no B
                this.B = this.ALU.SLA(this.B);
                this.cycle += 8;
                break;
            case 0x21: // SLA C - Shift left arithmetic no C
                this.C = this.ALU.SLA(this.C);
                this.cycle += 8;
                break;
            case 0x22: // SLA D - Shift left arithmetic no D
                this.D = this.ALU.SLA(this.D);
                this.cycle += 8;
                break;
            case 0x23: // SLA E - Shift left arithmetic no E
                this.E = this.ALU.SLA(this.E);
                this.cycle += 8;
                break;
            case 0x24: // SLA H - Shift left arithmetic no H
                this.H = this.ALU.SLA(this.H);
                this.cycle += 8;
                break;
            case 0x25: // SLA L - Shift left arithmetic no L
                this.L = this.ALU.SLA(this.L);
                this.cycle += 8;
                break;
            case 0x26: // SLA (HL) - Shift left arithmetic no valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SLA(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x27: // SLA A - Shift left arithmetic no A
                this.A = this.ALU.SLA(this.A);  
                this.cycle += 8;
                break;
            case 0x28: // SRA B - Shift right arithmetic no B
                this.B = this.ALU.SRA(this.B);
                this.cycle += 8;
                break;
            case 0x29: // SRA C - Shift right arithmetic no C
                this.C = this.ALU.SRA(this.C);
                this.cycle += 8;
                break;
            case 0x2A: // SRA D - Shift right arithmetic no D
                this.D = this.ALU.SRA(this.D);
                this.cycle += 8;
                break;
            case 0x2B: // SRA E - Shift right arithmetic no E
                this.E = this.ALU.SRA(this.E);
                this.cycle += 8;
                break;
            case 0x2C: // SRA H - Shift right arithmetic no H
                this.H = this.ALU.SRA(this.H);
                this.cycle += 8;
                break;
            case 0x2D: // SRA L - Shift right arithmetic no L
                this.L = this.ALU.SRA(this.L);
                this.cycle += 8;
                break;
            case 0x2E: // SRA (HL) - Shift right arithmetic no valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SRA(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x2F: // SRA A - Shift right arithmetic no A
                this.A = this.ALU.SRA(this.A);
                this.cycle += 8;
                break;
            case 0x30: // SWAP B - Troca os nibbles alto e baixo do B
                this.B = this.ALU.SWAP(this.B);
                this.cycle += 8;
                break;
            case 0x31: // SWAP C - Troca os nibbles alto e baixo do C
                this.C = this.ALU.SWAP(this.C);
                this.cycle += 8;
                break;
            case 0x32: // SWAP D - Troca os nibbles alto e baixo do D
                this.D = this.ALU.SWAP(this.D);
                this.cycle += 8;
                break;
            case 0x33: // SWAP E - Troca os nibbles alto e baixo do E
                this.E = this.ALU.SWAP(this.E);
                this.cycle += 8;
                break;
            case 0x34: // SWAP H - Troca os nibbles alto e baixo do H
                this.H = this.ALU.SWAP(this.H);
                this.cycle += 8;
                break;
            case 0x35: // SWAP L - Troca os nibbles alto e baixo do L
                this.L = this.ALU.SWAP(this.L);
                this.cycle += 8;
                break;
            case 0x36: // SWAP (HL) - Troca os nibbles alto e baixo do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SWAP(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x37: // SWAP A - Troca os nibbles alto e baixo do A
                this.A = this.ALU.SWAP(this.A);
                this.cycle += 8;
                break;
            case 0x38: // SRL B - Shift right lógico no B
                this.B = this.ALU.SRL(this.B);
                this.cycle += 8;
                break;
            case 0x39: // SRL C - Shift right lógico no C
                this.C = this.ALU.SRL(this.C);
                this.cycle += 8;
                break;
            case 0x3A: // SRL D - Shift right lógico no D
                this.D = this.ALU.SRL(this.D);
                this.cycle += 8;
                break;
            case 0x3B: // SRL E - Shift right lógico no E
                this.E = this.ALU.SRL(this.E);
                this.cycle += 8;
                break;
            case 0x3C: // SRL H - Shift right lógico no H
                this.H = this.ALU.SRL(this.H);
                this.cycle += 8;
                break;
            case 0x3D: // SRL L - Shift right lógico no L
                this.L = this.ALU.SRL(this.L);
                this.cycle += 8;
                break;
            case 0x3E: // SRL (HL) - Shift right lógico no valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SRL(value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x3F: // SRL A - Shift right lógico no A
                this.A = this.ALU.SRL(this.A);
                this.cycle += 8;
                break;
            case 0x40: // BIT 0, B - Testa o bit 0 do B
                this.ALU.BIT(0, this.B);
                this.cycle += 8;
                break;
            case 0x41: // BIT 0, C - Testa o bit 0 do C
                this.ALU.BIT(0, this.C);
                this.cycle += 8;
                break;
            case 0x42: // BIT 0, D - Testa o bit 0 do D
                this.ALU.BIT(0, this.D);
                this.cycle += 8;
                break;
            case 0x43: // BIT 0, E - Testa o bit 0 do E
                this.ALU.BIT(0, this.E);
                this.cycle += 8;
                break;
            case 0x44: // BIT 0, H - Testa o bit 0 do H
                this.ALU.BIT(0, this.H);
                this.cycle += 8;
                break;
            case 0x45: // BIT 0, L - Testa o bit 0 do L
                this.ALU.BIT(0, this.L);
                this.cycle += 8;
                break;
            case 0x46: // BIT 0, (HL) - Testa o bit 0 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(0, value);
                    this.cycle += 12;
                }
                break;
            case 0x47: // BIT 0, A - Testa o bit 0 do A
                this.ALU.BIT(0, this.A);
                this.cycle += 8;
                break;
            case 0x48: // BIT 1, B - Testa o bit 1 do B
                this.ALU.BIT(1, this.B);
                this.cycle += 8;
                break;
            case 0x49: // BIT 1, C - Testa o bit 1 do C
                this.ALU.BIT(1, this.C);
                this.cycle += 8;
                break;
            case 0x4A: // BIT 1, D - Testa o bit 1 do D
                this.ALU.BIT(1, this.D);
                this.cycle += 8;
                break;
            case 0x4B: // BIT 1, E - Testa o bit 1 do E
                this.ALU.BIT(1, this.E);
                this.cycle += 8;
                break;
            case 0x4C: // BIT 1, H - Testa o bit 1 do H
                this.ALU.BIT(1, this.H);
                this.cycle += 8;
                break;
            case 0x4D: // BIT 1, L - Testa o bit 1 do L
                this.ALU.BIT(1, this.L);
                this.cycle += 8;
                break;
            case 0x4E: // BIT 1, (HL) - Testa o bit 1 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(1, value);
                    this.cycle += 12;
                }
                break;
            case 0x4F: // BIT 1, A - Testa o bit 1 do A
                this.ALU.BIT(1, this.A);
                this.cycle += 8;
                break;
            case 0x50: // BIT 2, B - Testa o bit 2 do B
                this.ALU.BIT(2, this.B);
                this.cycle += 8;
                break;
            case 0x51: // BIT 2, C - Testa o bit 2 do C
                this.ALU.BIT(2, this.C);
                this.cycle += 8;
                break;
            case 0x52: // BIT 2, D - Testa o bit 2 do D
                this.ALU.BIT(2, this.D);
                this.cycle += 8;
                break;
            case 0x53: // BIT 2, E - Testa o bit 2 do E
                this.ALU.BIT(2, this.E);
                this.cycle += 8;
                break;
            case 0x54: // BIT 2, H - Testa o bit 2 do H
                this.ALU.BIT(2, this.H);
                this.cycle += 8;
                break;
            case 0x55: // BIT 2, L - Testa o bit 2 do L
                this.ALU.BIT(2, this.L);
                this.cycle += 8;
                break;
            case 0x56: // BIT 2, (HL) - Testa o bit 2 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(2, value);
                    this.cycle += 12;
                }
                break;
            case 0x57: // BIT 2, A - Testa o bit 2 do A
                this.ALU.BIT(2, this.A);
                this.cycle += 8;
                break;
            case 0x58: // BIT 3, B - Testa o bit 3 do B
                this.ALU.BIT(3, this.B);
                this.cycle += 8;
                break;
            case 0x59: // BIT 3, C - Testa o bit 3 do C
                this.ALU.BIT(3, this.C);
                this.cycle += 8;
                break;
            case 0x5A: // BIT 3, D - Testa o bit 3 do D
                this.ALU.BIT(3, this.D);
                this.cycle += 8;
                break;
            case 0x5B: // BIT 3, E - Testa o bit 3 do E
                this.ALU.BIT(3, this.E);
                this.cycle += 8;
                break;
            case 0x5C: // BIT 3, H - Testa o bit 3 do H
                this.ALU.BIT(3, this.H);
                this.cycle += 8;
                break;
            case 0x5D: // BIT 3, L - Testa o bit 3 do L
                this.ALU.BIT(3, this.L);
                this.cycle += 8;
                break;
            case 0x5E: // BIT 3, (HL) - Testa o bit 3 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(3, value);
                    this.cycle += 12;
                }
                break;
            case 0x5F: // BIT 3, A - Testa o bit 3 do A
                this.ALU.BIT(3, this.A);
                this.cycle += 8;
                break;
            case 0x60: // BIT 4, B - Testa o bit 4 do B
                this.ALU.BIT(4, this.B);
                this.cycle += 8;
                break;
            case 0x61: // BIT 4, C - Testa o bit 4 do C
                this.ALU.BIT(4, this.C);
                this.cycle += 8;
                break;
            case 0x62: // BIT 4, D - Testa o bit 4 do D
                this.ALU.BIT(4, this.D);
                this.cycle += 8;
                break;
            case 0x63: // BIT 4, E - Testa o bit 4 do E
                this.ALU.BIT(4, this.E);
                this.cycle += 8;
                break;
            case 0x64: // BIT 4, H - Testa o bit 4 do H
                this.ALU.BIT(4, this.H);
                this.cycle += 8;
                break;
            case 0x65: // BIT 4, L - Testa o bit 4 do L
                this.ALU.BIT(4, this.L);
                this.cycle += 8;
                break;
            case 0x66: // BIT 4, (HL) - Testa o bit 4 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(4, value);
                    this.cycle += 12;
                }
                break;
            case 0x67: // BIT 4, A - Testa o bit 4 do A
                this.ALU.BIT(4, this.A);
                this.cycle += 8;
                break;
            case 0x68: // BIT 5, B - Testa o bit 5 do B
                this.ALU.BIT(5, this.B);
                this.cycle += 8;
                break;
            case 0x69: // BIT 5, C - Testa o bit 5 do C
                this.ALU.BIT(5, this.C);
                this.cycle += 8;
                break;
            case 0x6A: // BIT 5, D - Testa o bit 5 do D
                this.ALU.BIT(5, this.D);
                this.cycle += 8;
                break;
            case 0x6B: // BIT 5, E - Testa o bit 5 do E
                this.ALU.BIT(5, this.E);
                this.cycle += 8;
                break;
            case 0x6C: // BIT 5, H - Testa o bit 5 do H
                this.ALU.BIT(5, this.H);
                this.cycle += 8;
                break;
            case 0x6D: // BIT 5, L - Testa o bit 5 do L
                this.ALU.BIT(5, this.L);
                this.cycle += 8;
                break;
            case 0x6E: // BIT 5, (HL) - Testa o bit 5 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(5, value);
                    this.cycle += 12;
                }
                break;
            case 0x6F: // BIT 5, A - Testa o bit 5 do A
                this.ALU.BIT(5, this.A);
                this.cycle += 8;
                break;
            case 0x70: // BIT 6, B - Testa o bit 6 do B
                this.ALU.BIT(6, this.B);
                this.cycle += 8;
                break;
            case 0x71: // BIT 6, C - Testa o bit 6 do C
                this.ALU.BIT(6, this.C);
                this.cycle += 8;
                break;
            case 0x72: // BIT 6, D - Testa o bit 6 do D
                this.ALU.BIT(6, this.D);
                this.cycle += 8;
                break;
            case 0x73: // BIT 6, E - Testa o bit 6 do E
                this.ALU.BIT(6, this.E);
                this.cycle += 8;
                break;
            case 0x74: // BIT 6, H - Testa o bit 6 do H
                this.ALU.BIT(6, this.H);
                this.cycle += 8;
                break;
            case 0x75: // BIT 6, L - Testa o bit 6 do L
                this.ALU.BIT(6, this.L);
                this.cycle += 8;
                break;
            case 0x76: // BIT 6, (HL) - Testa o bit 6 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(6, value);
                    this.cycle += 12;
                }
                break;
            case 0x77: // BIT 6, A - Testa o bit 6 do A
                this.ALU.BIT(6, this.A);
                this.cycle += 8;
                break;
            case 0x78: // BIT 7, B - Testa o bit 7 do B
                this.ALU.BIT(7, this.B);
                this.cycle += 8;
                break;
            case 0x79: // BIT 7, C - Testa o bit 7 do C
                this.ALU.BIT(7, this.C);
                this.cycle += 8;
                break;
            case 0x7A: // BIT 7, D - Testa o bit 7 do D
                this.ALU.BIT(7, this.D);
                this.cycle += 8;
                break;
            case 0x7B: // BIT 7, E - Testa o bit 7 do E
                this.ALU.BIT(7, this.E);
                this.cycle += 8;
                break;
            case 0x7C: // BIT 7, H - Testa o bit 7 do H
                this.ALU.BIT(7, this.H);
                this.cycle += 8;
                break;
            case 0x7D: // BIT 7, L - Testa o bit 7 do L
                this.ALU.BIT(7, this.L);
                this.cycle += 8;
                break;
            case 0x7E: // BIT 7, (HL) - Testa o bit 7 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    this.ALU.BIT(7, value);
                    this.cycle += 12;
                }
                break;
            case 0x7F: // BIT 7, A - Testa o bit 7 do A
                this.ALU.BIT(7, this.A);
                this.cycle += 8;
                break;
            case 0x80: // RES 0, B - Reseta o bit 0 do B
                this.B = this.ALU.RES(0, this.B);
                this.cycle += 8;
                break;
            case 0x81: // RES 0, C - Reseta o bit 0 do C
                this.C = this.ALU.RES(0, this.C);
                this.cycle += 8;
                break;
            case 0x82: // RES 0, D - Reseta o bit 0 do D
                this.D = this.ALU.RES(0, this.D);
                this.cycle += 8;
                break;
            case 0x83: // RES 0, E - Reseta o bit 0 do E
                this.E = this.ALU.RES(0, this.E);
                this.cycle += 8;
                break;
            case 0x84: // RES 0, H - Reseta o bit 0 do H
                this.H = this.ALU.RES(0, this.H);
                this.cycle += 8;
                break;
            case 0x85: // RES 0, L - Reseta o bit 0 do L
                this.L = this.ALU.RES(0, this.L);
                this.cycle += 8;
                break;
            case 0x86: // RES 0, (HL) - Reseta o bit 0 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(0, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x87: // RES 0, A - Reseta o bit 0 do A
                this.A = this.ALU.RES(0, this.A);
                this.cycle += 8;
                break;
            case 0x88: // RES 1, B - Reseta o bit 1 do B
                this.B = this.ALU.RES(1, this.B);   
                this.cycle += 8;
                break;
            case 0x89: // RES 1, C - Reseta o bit 1 do C
                this.C = this.ALU.RES(1, this.C);
                this.cycle += 8;
                break;
            case 0x8A: // RES 1, D - Reseta o bit 1 do D
                this.D = this.ALU.RES(1, this.D);
                this.cycle += 8;
                break;
            case 0x8B: // RES 1, E - Reseta o bit 1 do E
                this.E = this.ALU.RES(1, this.E);
                this.cycle += 8;
                break;
            case 0x8C: // RES 1, H - Reseta o bit 1 do H
                this.H = this.ALU.RES(1, this.H);
                this.cycle += 8;
                break;
            case 0x8D: // RES 1, L - Reseta o bit 1 do L
                this.L = this.ALU.RES(1, this.L);
                this.cycle += 8;
                break;
            case 0x8E: // RES 1, (HL) - Reseta o bit 1 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(1, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x8F: // RES 1, A - Reseta o bit 1 do A
                this.A = this.ALU.RES(1, this.A);
                this.cycle += 8;
                break;
            case 0x90: // RES 2, B - Reseta o bit 2 do B
                this.B = this.ALU.RES(2, this.B);
                this.cycle += 8;
                break;
            case 0x91: // RES 2, C - Reseta o bit 2 do C
                this.C = this.ALU.RES(2, this.C);
                this.cycle += 8;
                break;
            case 0x92: // RES 2, D - Reseta o bit 2 do D
                this.D = this.ALU.RES(2, this.D);
                this.cycle += 8;
                break;
            case 0x93: // RES 2, E - Reseta o bit 2 do E
                this.E = this.ALU.RES(2, this.E);
                this.cycle += 8;
                break;
            case 0x94: // RES 2, H - Reseta o bit 2 do H
                this.H = this.ALU.RES(2, this.H);
                this.cycle += 8;
                break;
            case 0x95: // RES 2, L - Reseta o bit 2 do L
                this.L = this.ALU.RES(2, this.L);
                this.cycle += 8;
                break;
            case 0x96: // RES 2, (HL) - Reseta o bit 2 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(2, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x97: // RES 2, A - Reseta o bit 2 do A
                this.A = this.ALU.RES(2, this.A);
                this.cycle += 8;
                break;
            case 0x98: // RES 3, B - Reseta o bit 3 do B
                this.B = this.ALU.RES(3, this.B);
                this.cycle += 8;
                break;
            case 0x99: // RES 3, C - Reseta o bit 3 do C
                this.C = this.ALU.RES(3, this.C);
                this.cycle += 8;
                break;
            case 0x9A: // RES 3, D - Reseta o bit 3 do D
                this.D = this.ALU.RES(3, this.D);
                this.cycle += 8;
                break;
            case 0x9B: // RES 3, E - Reseta o bit 3 do E
                this.E = this.ALU.RES(3, this.E);
                this.cycle += 8;
                break;
            case 0x9C: // RES 3, H - Reseta o bit 3 do H
                this.H = this.ALU.RES(3, this.H);
                this.cycle += 8;
                break;
            case 0x9D: // RES 3, L - Reseta o bit 3 do L
                this.L = this.ALU.RES(3, this.L);
                this.cycle += 8;
                break;
            case 0x9E: // RES 3, (HL) - Reseta o bit 3 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(3, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0x9F: // RES 3, A - Reseta o bit 3 do A
                this.A = this.ALU.RES(3, this.A);
                this.cycle += 8;
                break;
            case 0xA0: // RES 4, B - Reseta o bit 4 do B
                this.B = this.ALU.RES(4, this.B);
                this.cycle += 8;
                break;
            case 0xA1: // RES 4, C - Reseta o bit 4 do C
                this.C = this.ALU.RES(4, this.C);
                this.cycle += 8;
                break;
            case 0xA2: // RES 4, D - Reseta o bit 4 do D
                this.D = this.ALU.RES(4, this.D);
                this.cycle += 8;
                break;
            case 0xA3: // RES 4, E - Reseta o bit 4 do E
                this.E = this.ALU.RES(4, this.E);
                this.cycle += 8;
                break;
            case 0xA4: // RES 4, H - Reseta o bit 4 do H
                this.H = this.ALU.RES(4, this.H);
                this.cycle += 8;
                break;
            case 0xA5: // RES 4, L - Reseta o bit 4 do L
                this.L = this.ALU.RES(4, this.L);
                this.cycle += 8;
                break;
            case 0xA6: // RES 4, (HL) - Reseta o bit 4 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(4, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xA7: // RES 4, A - Reseta o bit 4 do A
                this.A = this.ALU.RES(4, this.A);
                this.cycle += 8;
                break;
            case 0xA8: // RES 5, B - Reseta o bit 5 do B
                this.B = this.ALU.RES(5, this.B);
                this.cycle += 8;
                break;
            case 0xA9: // RES 5, C - Reseta o bit 5 do C
                this.C = this.ALU.RES(5, this.C);
                this.cycle += 8;
                break;
            case 0xAA: // RES 5, D - Reseta o bit 5 do D
                this.D = this.ALU.RES(5, this.D);
                this.cycle += 8;
                break;
            case 0xAB: // RES 5, E - Reseta o bit 5 do E
                this.E = this.ALU.RES(5, this.E);
                this.cycle += 8;
                break;
            case 0xAC: // RES 5, H - Reseta o bit 5 do H
                this.H = this.ALU.RES(5, this.H);
                this.cycle += 8;
                break;
            case 0xAD: // RES 5, L - Reseta o bit 5 do L
                this.L = this.ALU.RES(5, this.L);
                this.cycle += 8;
                break;
            case 0xAE: // RES 5, (HL) - Reseta o bit 5 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(5, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xAF: // RES 5, A - Reseta o bit 5 do A
                this.A = this.ALU.RES(5, this.A);
                this.cycle += 8;
                break;
            case 0xB0: // RES 6, B - Reseta o bit 6 do B
                this.B = this.ALU.RES(6, this.B);
                this.cycle += 8;
                break;
            case 0xB1: // RES 6, C - Reseta o bit 6 do C
                this.C = this.ALU.RES(6, this.C);
                this.cycle += 8;
                break;
            case 0xB2: // RES 6, D - Reseta o bit 6 do D
                this.D = this.ALU.RES(6, this.D);
                this.cycle += 8;
                break;
            case 0xB3: // RES 6, E - Reseta o bit 6 do E
                this.E = this.ALU.RES(6, this.E);
                this.cycle += 8;
                break;
            case 0xB4: // RES 6, H - Reseta o bit 6 do H
                this.H = this.ALU.RES(6, this.H);
                this.cycle += 8;
                break;
            case 0xB5: // RES 6, L - Reseta o bit 6 do L
                this.L = this.ALU.RES(6, this.L);
                this.cycle += 8;
                break;
            case 0xB6: // RES 6, (HL) - Reseta o bit 6 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(6, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xB7: // RES 6, A - Reseta o bit 6 do A
                this.A = this.ALU.RES(6, this.A);
                this.cycle += 8;
                break;
            case 0xB8: // RES 7, B - Reseta o bit 7 do B
                this.B = this.ALU.RES(7, this.B);
                this.cycle += 8;
                break;
            case 0xB9: // RES 7, C - Reseta o bit 7 do C
                this.C = this.ALU.RES(7, this.C);
                this.cycle += 8;
                break;
            case 0xBA: // RES 7, D - Reseta o bit 7 do D
                this.D = this.ALU.RES(7, this.D);
                this.cycle += 8;
                break;
            case 0xBB: // RES 7, E - Reseta o bit 7 do E
                this.E = this.ALU.RES(7, this.E);
                this.cycle += 8;
                break;
            case 0xBC: // RES 7, H - Reseta o bit 7 do H
                this.H = this.ALU.RES(7, this.H);
                this.cycle += 8;
                break;
            case 0xBD: // RES 7, L - Reseta o bit 7 do L
                this.L = this.ALU.RES(7, this.L);
                this.cycle += 8;
                break;
            case 0xBE: // RES 7, (HL) - Reseta o bit 7 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.RES(7, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xBF: // RES 7, A - Reseta o bit 7 do A
                this.A = this.ALU.RES(7, this.A);
                this.cycle += 8;
                break;
            case 0xC0: // SET 0, B - Seta o bit 0 do B
                this.B = this.ALU.SET(0, this.B);
                this.cycle += 8;
                break;
            case 0xC1: // SET 0, C - Seta o bit 0 do C
                this.C = this.ALU.SET(0, this.C);
                this.cycle += 8;
                break;
            case 0xC2: // SET 0, D - Seta o bit 0 do D
                this.D = this.ALU.SET(0, this.D);
                this.cycle += 8;
                break;
            case 0xC3: // SET 0, E - Seta o bit 0 do E
                this.E = this.ALU.SET(0, this.E);
                this.cycle += 8;
                break;
            case 0xC4: // SET 0, H - Seta o bit 0 do H
                this.H = this.ALU.SET(0, this.H);
                this.cycle += 8;
                break;
            case 0xC5: // SET 0, L - Seta o bit 0 do L
                this.L = this.ALU.SET(0, this.L);
                this.cycle += 8;
                break;
            case 0xC6: // SET 0, (HL) - Seta o bit 0 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(0, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xC7: // SET 0, A - Seta o bit 0 do A
                this.A = this.ALU.SET(0, this.A);
                this.cycle += 8;
                break;
            case 0xC8: // SET 1, B - Seta o bit 1 do B
                this.B = this.ALU.SET(1, this.B);
                this.cycle += 8;
                break;
            case 0xC9: // SET 1, C - Seta o bit 1 do C
                this.C = this.ALU.SET(1, this.C);
                this.cycle += 8;
                break;
            case 0xCA: // SET 1, D - Seta o bit 1 do D
                this.D = this.ALU.SET(1, this.D);
                this.cycle += 8;
                break;
            case 0xCB: // SET 1, E - Seta o bit 1 do E
                this.E = this.ALU.SET(1, this.E);
                this.cycle += 8;
                break;
            case 0xCC: // SET 1, H - Seta o bit 1 do H
                this.H = this.ALU.SET(1, this.H);
                this.cycle += 8;
                break;
            case 0xCD: // SET 1, L - Seta o bit 1 do L
                this.L = this.ALU.SET(1, this.L);
                this.cycle += 8;
                break;
            case 0xCE: // SET 1, (HL) - Seta o bit 1 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(1, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xCF: // SET 1, A - Seta o bit 1 do A
                this.A = this.ALU.SET(1, this.A);
                this.cycle += 8;
                break;
            case 0xD0: // SET 2, B - Seta o bit 2 do B
                this.B = this.ALU.SET(2, this.B);
                this.cycle += 8;
                break;
            case 0xD1: // SET 2, C - Seta o bit 2 do C
                this.C = this.ALU.SET(2, this.C);
                this.cycle += 8;
                break;
            case 0xD2: // SET 2, D - Seta o bit 2 do D
                this.D = this.ALU.SET(2, this.D);
                this.cycle += 8;
                break;
            case 0xD3: // SET 2, E - Seta o bit 2 do E
                this.E = this.ALU.SET(2, this.E);
                this.cycle += 8;
                break;
            case 0xD4: // SET 2, H - Seta o bit 2 do H
                this.H = this.ALU.SET(2, this.H);
                this.cycle += 8;
                break;
            case 0xD5: // SET 2, L - Seta o bit 2 do L
                this.L = this.ALU.SET(2, this.L);
                this.cycle += 8;
                break;
            case 0xD6: // SET 2, (HL) - Seta o bit 2 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(2, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xD7: // SET 2, A - Seta o bit 2 do A
                this.A = this.ALU.SET(2, this.A);
                this.cycle += 8;
                break;
            case 0xD8: // SET 3, B - Seta o bit 3 do B
                this.B = this.ALU.SET(3, this.B);
                this.cycle += 8;
                break;
            case 0xD9: // SET 3, C - Seta o bit 3 do C
                this.C = this.ALU.SET(3, this.C);
                this.cycle += 8;
                break;
            case 0xDA: // SET 3, D - Seta o bit 3 do D
                this.D = this.ALU.SET(3, this.D);
                this.cycle += 8;
                break;
            case 0xDB: // SET 3, E - Seta o bit 3 do E
                this.E = this.ALU.SET(3, this.E);
                this.cycle += 8;
                break;
            case 0xDC: // SET 3, H - Seta o bit 3 do H
                this.H = this.ALU.SET(3, this.H);
                this.cycle += 8;
                break;
            case 0xDD: // SET 3, L - Seta o bit 3 do L
                this.L = this.ALU.SET(3, this.L);
                this.cycle += 8;
                break;
            case 0xDE: // SET 3, (HL) - Seta o bit 3 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(3, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xDF: // SET 3, A - Seta o bit 3 do A
                this.A = this.ALU.SET(3, this.A);
                this.cycle += 8;
                break;
            case 0xE0: // SET 4, B - Seta o bit 4 do B
                this.B = this.ALU.SET(4, this.B);
                this.cycle += 8;
                break;
            case 0xE1: // SET 4, C - Seta o bit 4 do C
                this.C = this.ALU.SET(4, this.C);
                this.cycle += 8;
                break;
            case 0xE2: // SET 4, D - Seta o bit 4 do D
                this.D = this.ALU.SET(4, this.D);
                this.cycle += 8;
                break;
            case 0xE3: // SET 4, E - Seta o bit 4 do E
                this.E = this.ALU.SET(4, this.E);
                this.cycle += 8;
                break;
            case 0xE4: // SET 4, H - Seta o bit 4 do H
                this.H = this.ALU.SET(4, this.H);
                this.cycle += 8;
                break;
            case 0xE5: // SET 4, L - Seta o bit 4 do L
                this.L = this.ALU.SET(4, this.L);
                this.cycle += 8;
                break;
            case 0xE6: // SET 4, (HL) - Seta o bit 4 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(4, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xE7: // SET 4, A - Seta o bit 4 do A
                this.A = this.ALU.SET(4, this.A);
                this.cycle += 8;
                break;
            case 0xE8: // SET 5, B - Seta o bit 5 do B
                this.B = this.ALU.SET(5, this.B);
                this.cycle += 8;
                break;
            case 0xE9: // SET 5, C - Seta o bit 5 do C
                this.C = this.ALU.SET(5, this.C);
                this.cycle += 8;
                break;
            case 0xEA: // SET 5, D - Seta o bit 5 do D
                this.D = this.ALU.SET(5, this.D);
                this.cycle += 8;
                break;
            case 0xEB: // SET 5, E - Seta o bit 5 do E
                this.E = this.ALU.SET(5, this.E);
                this.cycle += 8;
                break;
            case 0xEC: // SET 5, H - Seta o bit 5 do H
                this.H = this.ALU.SET(5, this.H);
                this.cycle += 8;
                break;
            case 0xED: // SET 5, L - Seta o bit 5 do L
                this.L = this.ALU.SET(5, this.L);
                this.cycle += 8;
                break;
            case 0xEE: // SET 5, (HL) - Seta o bit 5 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(5, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xEF: // SET 5, A - Seta o bit 5 do A
                this.A = this.ALU.SET(5, this.A);
                this.cycle += 8;
                break;
            case 0xF0: // SET 6, B - Seta o bit 6 do B
                this.B = this.ALU.SET(6, this.B);
                this.cycle += 8;
                break;
            case 0xF1: // SET 6, C - Seta o bit 6 do C
                this.C = this.ALU.SET(6, this.C);
                this.cycle += 8;
                break;
            case 0xF2: // SET 6, D - Seta o bit 6 do D
                this.D = this.ALU.SET(6, this.D);
                this.cycle += 8;
                break;
            case 0xF3: // SET 6, E - Seta o bit 6 do E
                this.E = this.ALU.SET(6, this.E);
                this.cycle += 8;
                break;
            case 0xF4: // SET 6, H - Seta o bit 6 do H
                this.H = this.ALU.SET(6, this.H);
                this.cycle += 8;
                break;
            case 0xF5: // SET 6, L - Seta o bit 6 do L
                this.L = this.ALU.SET(6, this.L);
                this.cycle += 8;
                break;
            case 0xF6: // SET 6, (HL) - Seta o bit 6 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(6, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xF7: // SET 6, A - Seta o bit 6 do A
                this.A = this.ALU.SET(6, this.A);
                this.cycle += 8;
                break;
            case 0xF8: // SET 7, B - Seta o bit 7 do B
                this.B = this.ALU.SET(7, this.B);
                this.cycle += 8;
                break;
            case 0xF9: // SET 7, C - Seta o bit 7 do C
                this.C = this.ALU.SET(7, this.C);
                this.cycle += 8;
                break;
            case 0xFA: // SET 7, D - Seta o bit 7 do D
                this.D = this.ALU.SET(7, this.D);
                this.cycle += 8;
                break;
            case 0xFB: // SET 7, E - Seta o bit 7 do E
                this.E = this.ALU.SET(7, this.E);
                this.cycle += 8;
                break;
            case 0xFC: // SET 7, H - Seta o bit 7 do H
                this.H = this.ALU.SET(7, this.H);
                this.cycle += 8;
                break;
            case 0xFD: // SET 7, L - Seta o bit 7 do L
                this.L = this.ALU.SET(7, this.L);
                this.cycle += 8;
                break;
            case 0xFE: // SET 7, (HL) - Seta o bit 7 do valor apontado por HL
                {
                    const value = this.MMU.readByte(this.HL);
                    const result = this.ALU.SET(7, value);
                    this.MMU.writeByte(this.HL, result);
                    this.cycle += 16;
                }
                break;
            case 0xFF: // SET 7, A - Seta o bit 7 do A
                this.A = this.ALU.SET(7, this.A);
                this.cycle += 8;
                break;
            default:
                console.error(`Unimplemented CB instruction: ${cbOpcode.toString(16)}`);
                break;
        }
    }

    POP() {
        const low = this.MMU.readByte(this.SP);
        const high = this.MMU.readByte((this.SP + 1) & 0xFFFF);
        this.SP = (this.SP + 2) & 0xFFFF;
        return (high << 8) | low;
    }

    PUSH(word) {
        word &= 0xFFFF;

        this.SP = (this.SP - 1) & 0xFFFF;
        this.MMU.writeByte(this.SP, (word >> 8) & 0xFF);
        this.SP = (this.SP - 1) & 0xFFFF;
        this.MMU.writeByte(this.SP, word & 0xFF);
    }

    serviceInterrupts() {
        const IE = this.MMU.readByte(0xFFFF);
        const IF = this.MMU.readByte(0xFF0F);
        const pending = IE & IF & 0x1F;

        if (pending === 0) return;
        if (this.halted) this.halted = false;
        if (!this.IME) return;

        this.IME = false;
        this.PUSH(this.PC);

        const vectors = [0x40, 0x48, 0x50, 0x58, 0x60]; // VBlank, LCD, Timer, Serial, Joypad
        for (let index = 0; index < 5; index++) {
            if (pending & (1 << index)) {
                const newIF = IF & ~(1 << index);
                this.MMU.writeByte(0xFF0F, newIF);
                this.PC = vectors[index];
                this.cycle += 20;
                break;
            }
        }
    }

    fetchByte() {
        const byte = this.MMU.readByte(this.PC);
        if (this.haltBug) this.haltBug = false;
        else this.PC = (this.PC + 1) & 0xFFFF;
        return byte;
    }

    fetchWord() {
        const low = this.fetchByte();
        const high = this.fetchByte();

        return (high << 8) | low;
    }

    writeWord(address, word) {
        address &= 0xFFFF;
        word &= 0xFFFF;

        this.MMU.writeByte(address, word & 0xFF);
        this.MMU.writeByte((address + 1) & 0xFFFF, (word >> 8) & 0xFF);
    }

    jumpRelative(condition, expected) {
        const offset = this.fetchByte();
        const relativeOffset = (offset << 24) >> 24; // sign extend 8 to 32
        if (condition === expected) {
            this.PC = (this.PC + relativeOffset) & 0xFFFF;
            this.cycle += 12;
        } else {
            this.cycle += 8;
        }
    }
}