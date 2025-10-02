export default class OpcodeDecoder {
    constructor() {
        this.opcodes = new Array(0x100).fill(null);
        this.cbOpcodes = new Array(0x100).fill(null);
        this.initializeOpcodes();
        this.initializeCBOpcodes();
    }

    step(CPU) {
        const opcode = CPU.fetchByte();
        const fn = this.opcodes[opcode];

        if (!fn) {
            console.error(`Unimplemented opcode: ${opcode.toString(16)}`);
            return;
        }

        fn(CPU);
    }

    stepCB(CPU) {
        const opcode = CPU.fetchByte();
        const fn = this.cbOpcodes[opcode];

        if (!fn) {
            console.error(`Unimplemented CB opcode: ${opcode.toString(16)}`);
            return;
        }

        fn(CPU);
    }

    initializeOpcodes() {
        const ops = this.opcodes;

        ops[0x00] = CPU => { // NOP - Não faz nada
            CPU.cycle += 4;
        };
        ops[0x01] = CPU => { // LD BC, d16 - Carrega o valor de 16 bits no BC
            CPU.registers.BC = CPU.fetchWord();
            CPU.cycle += 12;
        };
        ops[0x02] = CPU => { // LD (BC), A - Carrega o valor do A no endereço apontado por BC
            CPU.bus.writeByte(CPU.registers.BC, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x03] = CPU => { // INC BC - Incrementa o valor de BC
            CPU.registers.BC = CPU.ALU.INC_16(CPU.registers.BC);
            CPU.cycle += 8;
        };
        ops[0x04] = CPU => { // INC B - Incrementa o valor do B
            CPU.registers.B = CPU.ALU.INC_8(CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0x05] = CPU => { // DEC B - Decrementa o valor do B
            CPU.registers.B = CPU.ALU.DEC_8(CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0x06] = CPU => { // LD B, d8 - Carrega o valor de 8 bits no B
            CPU.registers.B = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x07] = CPU => { // RLCA - Rotaciona o A para a esquerda
            CPU.registers.A = CPU.ALU.RLCA(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x08] = CPU => { // LD (a16), SP - Carrega o valor do SP no endereço de 16 bits
            CPU.writeWord(CPU.fetchWord(), CPU.registers.SP);
            CPU.cycle += 20;
        };
        ops[0x09] = CPU => { // ADD HL, BC - Adiciona o valor de BC ao HL
            CPU.registers.HL = CPU.ALU.ADD_16(CPU.registers.HL, CPU.registers.BC);
            CPU.cycle += 8;
        };
        ops[0x0A] = CPU => { // LD A, (BC) - Carrega o valor no endereço apontado por BC no A
            CPU.registers.A = CPU.bus.readByte(CPU.registers.BC);
            CPU.cycle += 8;
        };
        ops[0x0B] = CPU => { // DEC BC - Decrementa o valor de BC
            CPU.registers.BC = CPU.ALU.DEC_16(CPU.registers.BC);
            CPU.cycle += 8;
        };
        ops[0x0C] = CPU => { // INC C - Incrementa o valor do C
            CPU.registers.C = CPU.ALU.INC_8(CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0x0D] = CPU => { // DEC C - Decrementa o valor do C
            CPU.registers.C = CPU.ALU.DEC_8(CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0x0E] = CPU => { // LD C, d8 - Carrega o valor de 8 bits no C
            CPU.registers.C = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x0F] = CPU => { // RRCA - Rotaciona o A para a direita
            CPU.registers.A = CPU.ALU.RRCA(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x10] = CPU => { // STOP - Para a execução da CPU
            CPU.fetchByte();
            CPU.bus.writeByte(0xFF4D, 0); // Reset o registro de parada
            CPU.cycle += 4;
        };
        ops[0x11] = CPU => { // LD DE, d16 - Carrega o valor de 16 bits no DE
            CPU.registers.DE = CPU.fetchWord();
            CPU.cycle += 12;
        };
        ops[0x12] = CPU => { // LD (DE), A - Carrega o valor do A no endereço apontado por DE
            CPU.bus.writeByte(CPU.registers.DE, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x13] = CPU => { // INC DE - Incrementa o valor de DE
            CPU.registers.DE = CPU.ALU.INC_16(CPU.registers.DE);
            CPU.cycle += 8;
        };
        ops[0x14] = CPU => { // INC D - Incrementa o valor do D
            CPU.registers.D = CPU.ALU.INC_8(CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0x15] = CPU => { // DEC D - Decrementa o valor do D
            CPU.registers.D = CPU.ALU.DEC_8(CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0x16] = CPU => { // LD D, d8 - Carrega o valor de 8 bits no D
            CPU.registers.D = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x17] = CPU => { // RLA - Rotaciona o A para a esquerda através do carry
            CPU.registers.A = CPU.ALU.RLA(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x18] = CPU => { // JR r8 - Salta para um endereço relativo de 8 bits
            CPU.jumpRelative(1, 1);
        };
        ops[0x19] = CPU => { // ADD HL, DE - Adiciona o valor de DE ao HL
            CPU.registers.HL = CPU.ALU.ADD_16(CPU.registers.HL, CPU.registers.DE);
            CPU.cycle += 8;
        };
        ops[0x1A] = CPU => { // LD A, (DE) - Carrega o valor no endereço apontado por DE no A
            CPU.registers.A = CPU.bus.readByte(CPU.registers.DE);
            CPU.cycle += 8;
        };
        ops[0x1B] = CPU => { // DEC DE - Decrementa o valor de DE
            CPU.registers.DE = CPU.ALU.DEC_16(CPU.registers.DE);
            CPU.cycle += 8;
        };
        ops[0x1C] = CPU => { // INC E - Incrementa o valor do E
            CPU.registers.E = CPU.ALU.INC_8(CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0x1D] = CPU => { // DEC E - Decrementa o valor do E
            CPU.registers.E = CPU.ALU.DEC_8(CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0x1E] = CPU => { // LD E, d8 - Carrega o valor de 8 bits no E
            CPU.registers.E = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x1F] = CPU => { // RRA - Rotaciona o A para a direita através do carry
            CPU.registers.A = CPU.ALU.RRA(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x20] = CPU => { // JR NZ, r8 - Salta para um endereço relativo de 8 bits se a flag Z não estiver setada
            CPU.jumpRelative(CPU.flags.Z, 0);
        };
        ops[0x21] = CPU => { // LD HL, d16 - Carrega o valor de 16 bits no HL
            CPU.registers.HL = CPU.fetchWord();
            CPU.cycle += 12;
        };
        ops[0x22] = CPU => { // LD (HL+), A - Carrega o valor do A no endereço apontado por HL e incrementa HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.A);
            CPU.registers.HL = CPU.ALU.INC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x23] = CPU => { // INC HL - Incrementa o valor de HL
            CPU.registers.HL = CPU.ALU.INC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x24] = CPU => { // INC H - Incrementa o valor do H
            CPU.registers.H = CPU.ALU.INC_8(CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0x25] = CPU => { // DEC H - Decrementa o valor do H
            CPU.registers.H = CPU.ALU.DEC_8(CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0x26] = CPU => { // LD H, d8 - Carrega o valor de 8 bits no H
            CPU.registers.H = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x27] = CPU => { // DAA - Ajusta o valor do A para o formato BCD
            CPU.registers.A = CPU.ALU.DAA(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x28] = CPU => { // JR Z, r8 - Salta para um endereço relativo de 8 bits se a flag Z estiver setada
            CPU.jumpRelative(CPU.flags.Z, 1);
        };
        ops[0x29] = CPU => { // ADD HL, HL - Adiciona o valor de HL ao HL
            CPU.registers.HL = CPU.ALU.ADD_16(CPU.registers.HL, CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x2A] = CPU => { // LD A, (HL+) - Carrega o valor no endereço apontado por HL no A e incrementa HL
            CPU.registers.A = CPU.bus.readByte(CPU.registers.HL);
            CPU.registers.HL = CPU.ALU.INC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x2B] = CPU => { // DEC HL - Decrementa o valor de HL
            CPU.registers.HL = CPU.ALU.DEC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x2C] = CPU => { // INC L - Incrementa o valor do L
            CPU.registers.L = CPU.ALU.INC_8(CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0x2D] = CPU => { // DEC L - Decrementa o valor do L
            CPU.registers.L = CPU.ALU.DEC_8(CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0x2E] = CPU => { // LD L, d8 - Carrega o valor de 8 bits no L
            CPU.registers.L = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x2F] = CPU => { // CPL - Complementa o valor do A (A = ~A)
            CPU.registers.A = (~CPU.registers.A) & 0xFF;
            CPU.flags.N = 1;
            CPU.flags.H = 1;
            CPU.cycle += 4;
        };
        ops[0x30] = CPU => { // JR NC - Salta para um endereço relativo de 8 bits se a flag C não estiver setada
            CPU.jumpRelative(CPU.flags.C, 0);
        };
        ops[0x31] = CPU => { // LD SP, d16 - Carrega o valor de 16 bits no SP
            CPU.registers.SP = CPU.fetchWord();
            CPU.cycle += 12;
        };
        ops[0x32] = CPU => { // LD (HL-), A - Carrega o valor do A no endereço apontado por HL e decrementa HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.A);
            CPU.registers.HL = CPU.ALU.DEC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x33] = CPU => { // INC SP - Incrementa o valor do SP
            CPU.registers.SP = (CPU.registers.SP + 1) & 0xFFFF;
            CPU.cycle += 8;
        };
        ops[0x34] = CPU => { // INC (HL) - Incrementa o valor no endereço apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.INC_8(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 12;
        };
        ops[0x35] = CPU => { // DEC (HL) - Decrementa o valor no endereço apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.DEC_8(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 12;
        };
        ops[0x36] = CPU => { // LD (HL), d8 - Carrega o valor de 8 bits no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.fetchByte());
            CPU.cycle += 12;
        };
        ops[0x37] = CPU => { // SCF - Seta a flag Carry
            CPU.flags.C = 1;
            CPU.flags.N = 0;
            CPU.flags.H = 0;
            CPU.cycle += 4;
        };
        ops[0x38] = CPU => { // JR C, r8 - Salta para um endereço relativo de 8 bits se a flag C estiver setada
            CPU.jumpRelative(CPU.flags.C, 1);
        };
        ops[0x39] = CPU => { // ADD HL, SP - Adiciona o valor do SP ao HL
            CPU.registers.HL = CPU.ALU.ADD_16(CPU.registers.HL, CPU.registers.SP);
            CPU.cycle += 8;
        };
        ops[0x3A] = CPU => { // LD A, (HL-) - Carrega o valor no endereço apontado por HL no A e decrementa HL
            CPU.registers.A = CPU.bus.readByte(CPU.registers.HL);
            CPU.registers.HL = CPU.ALU.DEC_16(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x3B] = CPU => { // DEC SP - Decrementa o valor do SP
            CPU.registers.SP = CPU.ALU.DEC_16(CPU.registers.SP);
            CPU.cycle += 8;
        };
        ops[0x3C] = CPU => { // INC A - Incrementa o valor do A
            CPU.registers.A = CPU.ALU.INC_8(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x3D] = CPU => { // DEC A - Decrementa o valor do A
            CPU.registers.A = CPU.ALU.DEC_8(CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x3E] = CPU => { // LD A, d8 - Carrega o valor de 8 bits no A
            CPU.registers.A = CPU.fetchByte();
            CPU.cycle += 8;
        };
        ops[0x3F] = CPU => { // CCF - Complementa a flag Carry
            CPU.flags.C ^= 1;
            CPU.flags.N = 0;
            CPU.flags.H = 0;
            CPU.cycle += 4;
        };
        ops[0x40] = CPU => { // LD B, B - Carrega o valor do B no B
            CPU.registers.B = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x41] = CPU => { // LD B, C - Carrega o valor do C no B
            CPU.registers.B = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x42] = CPU => { // LD B, D - Carrega o valor do D no B
            CPU.registers.B = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x43] = CPU => { // LD B, E - Carrega o valor do E no B
            CPU.registers.B = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x44] = CPU => { // LD B, H - Carrega o valor do H no B
            CPU.registers.B = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x45] = CPU => { // LD B, L - Carrega o valor do L no B
            CPU.registers.B = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x46] = CPU => { // LD B, (HL) - Carrega o valor no endereço apontado por HL no B
            CPU.registers.B = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x47] = CPU => { // LD B, A - Carrega o valor do A no B
            CPU.registers.B = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x48] = CPU => { // LD C, B - Carrega o valor do B no C
            CPU.registers.C = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x49] = CPU => { // LD C, C - Carrega o valor do C no C
            CPU.registers.C = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x4A] = CPU => { // LD C, D - Carrega o valor do D no C
            CPU.registers.C = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x4B] = CPU => { // LD C, E - Carrega o valor do E no C
            CPU.registers.C = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x4C] = CPU => { // LD C, H - Carrega o valor do H no C
            CPU.registers.C = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x4D] = CPU => { // LD C, L - Carrega o valor do L no C
            CPU.registers.C = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x4E] = CPU => { // LD C, (HL) - Carrega o valor no endereço apontado por HL no C
            CPU.registers.C = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x4F] = CPU => { // LD C, A - Carrega o valor do A no C
            CPU.registers.C = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x50] = CPU => { // LD D, B - Carrega o valor do B no D
            CPU.registers.D = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x51] = CPU => { // LD D, C - Carrega o valor do C no D
            CPU.registers.D = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x52] = CPU => { // LD D, D - Carrega o valor do D no D
            CPU.registers.D = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x53] = CPU => { // LD D, E - Carrega o valor do E no D
            CPU.registers.D = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x54] = CPU => { // LD D, H - Carrega o valor do H no D
            CPU.registers.D = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x55] = CPU => { // LD D, L - Carrega o valor do L no D
            CPU.registers.D = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x56] = CPU => { // LD D, (HL) - Carrega o valor no endereço apontado por HL no D
            CPU.registers.D = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x57] = CPU => { // LD D, A - Carrega o valor do A no D
            CPU.registers.D = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x58] = CPU => { // LD E, B - Carrega o valor do B no E
            CPU.registers.E = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x59] = CPU => { // LD E, C - Carrega o valor do C no E
            CPU.registers.E = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x5A] = CPU => { // LD E, D - Carrega o valor do D no E
            CPU.registers.E = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x5B] = CPU => { // LD E, E - Carrega o valor do E no E
            CPU.registers.E = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x5C] = CPU => { // LD E, H - Carrega o valor do H no E
            CPU.registers.E = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x5D] = CPU => { // LD E, L - Carrega o valor do L no E
            CPU.registers.E = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x5E] = CPU => { // LD E, (HL) - Carrega o valor no endereço apontado por HL no E
            CPU.registers.E = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x5F] = CPU => { // LD E, A - Carrega o valor do A no E
            CPU.registers.E = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x60] = CPU => { // LD H, B - Carrega o valor do B no H
            CPU.registers.H = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x61] = CPU => { // LD H, C - Carrega o valor do C no H
            CPU.registers.H = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x62] = CPU => { // LD H, D - Carrega o valor do D no H
            CPU.registers.H = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x63] = CPU => { // LD H, E - Carrega o valor do E no H
            CPU.registers.H = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x64] = CPU => { // LD H, H - Carrega o valor do H no H
            CPU.registers.H = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x65] = CPU => { // LD H, L - Carrega o valor do L no H
            CPU.registers.H = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x66] = CPU => { // LD H, (HL) - Carrega o valor no endereço apontado por HL no H
            CPU.registers.H = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x67] = CPU => { // LD H, A - Carrega o valor do A no H
            CPU.registers.H = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x68] = CPU => { // LD L, B - Carrega o valor do B no L
            CPU.registers.L = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x69] = CPU => { // LD L, C - Carrega o valor do C no L
            CPU.registers.L = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x6A] = CPU => { // LD L, D - Carrega o valor do D no L
            CPU.registers.L = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x6B] = CPU => { // LD L, E - Carrega o valor do E no L
            CPU.registers.L = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x6C] = CPU => { // LD L, H - Carrega o valor do H no L
            CPU.registers.L = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x6D] = CPU => { // LD L, L - Carrega o valor do L no L
            CPU.registers.L = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x6E] = CPU => { // LD L, (HL) - Carrega o valor no endereço apontado por HL no L
            CPU.registers.L = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x6F] = CPU => { // LD L, A - Carrega o valor do A no L
            CPU.registers.L = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x70] = CPU => { // LD (HL), B - Armazena o valor do B no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x71] = CPU => { // LD (HL), C - Armazena o valor do C no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x72] = CPU => { // LD (HL), D - Armazena o valor do D no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x73] = CPU => { // LD (HL), E - Armazena o valor do E no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x74] = CPU => { // LD (HL), H - Armazena o valor do H no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x75] = CPU => { // LD (HL), L - Armazena o valor do L no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x76] = CPU => { // HALT - Para a execução da CPU
            const pending = CPU.interrupts.pending();
            if (CPU.IME) {
                CPU.halted = true;
            } else {
                if (pending !== 0) CPU.haltBug = true;
                else CPU.halted = true;
            }
            CPU.cycle += 4;
        };
        ops[0x77] = CPU => { // LD (HL), A - Armazena o valor do A no endereço apontado por HL
            CPU.bus.writeByte(CPU.registers.HL, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x78] = CPU => { // LD A, B - Carrega o valor do B no A
            CPU.registers.A = CPU.registers.B;
            CPU.cycle += 4;
        };
        ops[0x79] = CPU => { // LD A, C - Carrega o valor do C no A
            CPU.registers.A = CPU.registers.C;
            CPU.cycle += 4;
        };
        ops[0x7A] = CPU => { // LD A, D - Carrega o valor do D no A
            CPU.registers.A = CPU.registers.D;
            CPU.cycle += 4;
        };
        ops[0x7B] = CPU => { // LD A, E - Carrega o valor do E no A
            CPU.registers.A = CPU.registers.E;
            CPU.cycle += 4;
        };
        ops[0x7C] = CPU => { // LD A, H - Carrega o valor do H no A
            CPU.registers.A = CPU.registers.H;
            CPU.cycle += 4;
        };
        ops[0x7D] = CPU => { // LD A, L - Carrega o valor do L no A
            CPU.registers.A = CPU.registers.L;
            CPU.cycle += 4;
        };
        ops[0x7E] = CPU => { // LD A, (HL) - Carrega o valor no endereço apontado por HL no A
            CPU.registers.A = CPU.bus.readByte(CPU.registers.HL);
            CPU.cycle += 8;
        };
        ops[0x7F] = CPU => { // LD A, A - Carrega o valor do A no A
            CPU.registers.A = CPU.registers.A;
            CPU.cycle += 4;
        };
        ops[0x80] = CPU => { // ADD A, B - Adiciona o valor do B ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0x81] = CPU => { // ADD A, C - Adiciona o valor do C ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0x82] = CPU => { // ADD A, D - Adiciona o valor do D ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0x83] = CPU => { // ADD A, E - Adiciona o valor do E ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0x84] = CPU => { // ADD A, H - Adiciona o valor do H ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0x85] = CPU => { // ADD A, L - Adiciona o valor do L ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0x86] = CPU => { // ADD A, (HL) - Adiciona o valor no endereço apontado por HL ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0x87] = CPU => { // ADD A, A - Adiciona o valor do A ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x88] = CPU => { // ADC A, B - Adiciona o valor do A ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.B, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x89] = CPU => { // ADC A, C - Adiciona o valor do C ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.C, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x8A] = CPU => { // ADC A, D - Adiciona o valor do D ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.D, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x8B] = CPU => { // ADC A, E - Adiciona o valor do E ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.E, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x8C] = CPU => { // ADC A, H - Adiciona o valor do H ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.H, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x8D] = CPU => { // ADC A, L - Adiciona o valor do L ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.L, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x8E] = CPU => { // ADC A, (HL) - Adiciona o valor no endereço apontado por HL ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL), CPU.flags.C);
            CPU.cycle += 8;
        };
        ops[0x8F] = CPU => { // ADC A, A - Adiciona o valor do A ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.registers.A, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x90] = CPU => { // SUB B - Subtrai o valor do B do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0x91] = CPU => { // SUB C - Subtrai o valor do C do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0x92] = CPU => { // SUB D - Subtrai o valor do D do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0x93] = CPU => { // SUB E - Subtrai o valor do E do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0x94] = CPU => { // SUB H - Subtrai o valor do H do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0x95] = CPU => { // SUB L - Subtrai o valor do L do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0x96] = CPU => { // SUB (HL) - Subtrai o valor no endereço apontado por HL do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0x97] = CPU => { // SUB A - Subtrai o valor do A do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0x98] = CPU => { // SBC A, B - Subtrai o valor do B do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.B, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x99] = CPU => { // SBC A, C - Subtrai o valor do C do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.C, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x9A] = CPU => { // SBC A, D - Subtrai o valor do D do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.D, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x9B] = CPU => { // SBC A, E - Subtrai o valor do E do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.E, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x9C] = CPU => { // SBC A, H - Subtrai o valor do H do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.H, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x9D] = CPU => { // SBC A, L - Subtrai o valor do L do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.L, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0x9E] = CPU => { // SBC (HL) - Subtrai o valor no endereço apontado por HL do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL), CPU.flags.C);
            CPU.cycle += 8;
        };
        ops[0x9F] = CPU => { // SBC A, A - Subtrai o valor do A do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.registers.A, CPU.flags.C);
            CPU.cycle += 4;
        };
        ops[0xA0] = CPU => { // AND B - Faz um AND do A com o B
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0xA1] = CPU => { // AND C - Faz um AND do A com o C
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0xA2] = CPU => { // AND D - Faz um AND do A com o D
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0xA3] = CPU => { // AND E - Faz um AND do A com o E
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0xA4] = CPU => { // AND H - Faz um AND do A com o H
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0xA5] = CPU => { // AND L - Faz um AND do A com o L
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0xA6] = CPU => { // AND (HL) - Faz um AND do A com o valor no endereço apontado por HL
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0xA7] = CPU => { // AND A - Faz um AND do A com ele mesmo
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0xA8] = CPU => { // XOR B - Faz um XOR do A com o B
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0xA9] = CPU => { // XOR C - Faz um XOR do A com o C
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0xAA] = CPU => { // XOR D - Faz um XOR do A com o D
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0xAB] = CPU => { // XOR E - Faz um XOR do A com o E
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0xAC] = CPU => { // XOR H - Faz um XOR do A com o H
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0xAD] = CPU => { // XOR L - Faz um XOR do A com o L
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0xAE] = CPU => { // XOR (HL) - Faz um XOR do A com o valor no endereço apontado por HL
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0xAF] = CPU => { // XOR A - Faz um XOR do A com ele mesmo
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0xB0] = CPU => { // OR B - Faz um OR do A com o B
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0xB1] = CPU => { // OR C - Faz um OR do A com o C
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0xB2] = CPU => { // OR D - Faz um OR do A com o D
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0xB3] = CPU => { // OR E - Faz um OR do A com o E
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0xB4] = CPU => { // OR H - Faz um OR do A com o H
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0xB5] = CPU => { // OR L - Faz um OR do A com o L
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0xB6] = CPU => { // OR (HL) - Faz um OR do A com o valor no endereço apontado por HL
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0xB7] = CPU => { // OR A - Faz um OR do A com ele mesmo
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0xB8] = CPU => { // CP B - Compara o A com o B
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.B);
            CPU.cycle += 4;
        };
        ops[0xB9] = CPU => { // CP C - Compara o A com o C
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.C);
            CPU.cycle += 4;
        };
        ops[0xBA] = CPU => { // CP D - Compara o A com o D
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.D);
            CPU.cycle += 4;
        };
        ops[0xBB] = CPU => { // CP E - Compara o A com o E
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.E);
            CPU.cycle += 4;
        };
        ops[0xBC] = CPU => { // CP H - Compara o A com o H
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.H);
            CPU.cycle += 4;
        };
        ops[0xBD] = CPU => { // CP L - Compara o A com o L
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.L);
            CPU.cycle += 4;
        };
        ops[0xBE] = CPU => { // CP (HL) - Compara o A com o valor no endereço apontado por HL
            CPU.ALU.SUB_8(CPU.registers.A, CPU.bus.readByte(CPU.registers.HL));
            CPU.cycle += 8;
        };
        ops[0xBF] = CPU => { // CP A - Compara o A com ele mesmo
            CPU.ALU.SUB_8(CPU.registers.A, CPU.registers.A);
            CPU.cycle += 4;
        };
        ops[0xC0] = CPU => { // RET NZ - Retorna de uma chamada de sub-rotina se a flag Z não estiver setada
            if (CPU.flags.Z === 0) {
                CPU.registers.PC = CPU.POP();
                CPU.cycle += 20;
            } else {
                CPU.cycle += 8;
            }
        };
        ops[0xC1] = CPU => { // POP BC - Desempilha o valor de BC
            CPU.registers.BC = CPU.POP();
            CPU.cycle += 12;
        };
        ops[0xC2] = CPU => { // JP NZ, a16 - Salta para o endereço de 16 bits se a flag Z não estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.Z === 0) {
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 16;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xC3] = CPU => { // JP a16 - Salta para o endereço de 16 bits
            CPU.registers.PC = CPU.fetchWord() & 0xFFFF;
            CPU.cycle += 16;
        };
        ops[0xC4] = CPU => { // CALL NZ, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z não estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.Z === 0) {
                CPU.PUSH(CPU.registers.PC);
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 24;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xC5] = CPU => { // PUSH BC - Empilha o valor de BC
            CPU.PUSH(CPU.registers.BC);
            CPU.cycle += 16;
        };
        ops[0xC6] = CPU => { // ADD A, d8 - Adiciona o valor de 8 bits ao A
            CPU.registers.A = CPU.ALU.ADD_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xC7] = CPU => { // RST 00H - Chama a sub-rotina no endereço 0x0000
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0000;
            CPU.cycle += 16;
        };
        ops[0xC8] = CPU => { // RET Z - Retorna de uma chamada de sub-rotina se a flag Z estiver setada
            if (CPU.flags.Z === 1) {
                CPU.registers.PC = CPU.POP();
                CPU.cycle += 20;
            } else {
                CPU.cycle += 8;
            }
        };
        ops[0xC9] = CPU => { // RET - Retorna de uma chamada de sub-rotina
            CPU.registers.PC = CPU.POP();
            CPU.cycle += 16;
        };
        ops[0xCA] = CPU => { // JP Z, a16 - Salta para o endereço de 16 bits se a flag Z estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.Z === 1) {
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 16;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xCB] = CPU => { // CB - Prefixo de instruções de 8 bits
            this.stepCB(CPU);
        };
        ops[0xCC] = CPU => { // CALL Z, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.Z === 1) {
                CPU.PUSH(CPU.registers.PC);
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 24;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xCD] = CPU => { // CALL a16 - Chama uma sub-rotina no endereço de 16 bits
            const address = CPU.fetchWord();
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = address & 0xFFFF;
            CPU.cycle += 24;
        };
        ops[0xCE] = CPU => { // ADC A, d8 - Adiciona o valor de 8 bits ao A com carry
            CPU.registers.A = CPU.ALU.ADC_8(CPU.registers.A, CPU.fetchByte(), CPU.flags.C);
            CPU.cycle += 8;
        };
        ops[0xCF] = CPU => { // RST 08H - Chama a sub-rotina no endereço 0x0008
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0008;
            CPU.cycle += 16;
        };
        ops[0xD0] = CPU => { // RET NC - Retorna de uma chamada de sub-rotina se a flag C não estiver setada
            if (CPU.flags.C === 0) {
                CPU.registers.PC = CPU.POP();
                CPU.cycle += 20;
            } else {
                CPU.cycle += 8;
            }
        };
        ops[0xD1] = CPU => { // POP DE - Desempilha o valor de DE
            const word = CPU.POP();
            CPU.registers.E = word & 0xFF;
            CPU.registers.D = (word >> 8) & 0xFF;
            CPU.cycle += 12;
        };
        ops[0xD2] = CPU => { // JP NC, a16 - Salta para o endereço de 16 bits se a flag C não estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.C === 0) {
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 16;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xD3] = CPU => { // Não implementado
            console.error('Unimplemented instruction: D3');
            CPU.cycle += 4;
        };
        ops[0xD4] = CPU => { // CALL NC, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C não estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.C === 0) {
                CPU.PUSH(CPU.registers.PC);
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 24;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xD5] = CPU => { // PUSH DE - Empilha o valor de DE
            CPU.PUSH((CPU.registers.D << 8) | CPU.registers.E);
            CPU.cycle += 16;
        };
        ops[0xD6] = CPU => { // SUB d8 - Subtrai o valor de 8 bits do A
            CPU.registers.A = CPU.ALU.SUB_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xD7] = CPU => { // RST 10H - Chama a sub-rotina no endereço 0x0010
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0010;
            CPU.cycle += 16;
        };
        ops[0xD8] = CPU => { // RET C - Retorna de uma chamada de sub-rotina se a flag C estiver setada
            if (CPU.flags.C === 1) {
                CPU.registers.PC = CPU.POP();
                CPU.cycle += 20;
            } else {
                CPU.cycle += 8;
            }
        };
        ops[0xD9] = CPU => { // RETI - Retorna de uma chamada de sub-rotina e habilita as interrupções
            CPU.registers.PC = CPU.POP();
            CPU.IME = true;
            CPU.cycle += 16;
        };
        ops[0xDA] = CPU => { // JP C, a16 - Salta para o endereço de 16 bits se a flag C estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.C === 1) {
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 16;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xDB] = CPU => { // Não implementado
            console.error('Unimplemented instruction: DB');
            CPU.cycle += 4;
        };
        ops[0xDC] = CPU => { // CALL C, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C estiver setada
            const address = CPU.fetchWord();
            if (CPU.flags.C === 1) {
                CPU.PUSH(CPU.registers.PC);
                CPU.registers.PC = address & 0xFFFF;
                CPU.cycle += 24;
            } else {
                CPU.cycle += 12;
            }
        };
        ops[0xDD] = CPU => { // Não implementado
            console.error('Unimplemented instruction: DD');
            CPU.cycle += 4;
        };
        ops[0xDE] = CPU => { // SBC A, d8 - Subtrai o valor de 8 bits do A com carry
            CPU.registers.A = CPU.ALU.SBC_8(CPU.registers.A, CPU.fetchByte(), CPU.flags.C);
            CPU.cycle += 8;
        };
        ops[0xDF] = CPU => { // RST 18H - Chama a sub-rotina no endereço 0x0018
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0018;
            CPU.cycle += 16;
        };
        ops[0xE0] = CPU => { // LDH (a8), A - Armazena o valor do A no endereço 0xFF00 + valor de 8 bits
            CPU.bus.writeByte(0xFF00 + CPU.fetchByte(), CPU.registers.A);
            CPU.cycle += 12;
        };
        ops[0xE1] = CPU => { // POP HL - Desempilha o valor de HL
            const word = CPU.POP();
            CPU.registers.H = (word >> 8) & 0xFF;
            CPU.registers.L = word & 0xFF;
            CPU.cycle += 12;
        };
        ops[0xE2] = CPU => { // LD (C), A - Armazena o valor do A no endereço 0xFF00 + valor do C
            CPU.bus.writeByte(0xFF00 + CPU.registers.C, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xE3] = CPU => { // Não implementado
            console.error('Unimplemented instruction: E3');
            CPU.cycle += 4;
        };
        ops[0xE4] = CPU => { // Não implementado
            console.error('Unimplemented instruction: E4');
            CPU.cycle += 4;
        };
        ops[0xE5] = CPU => { // PUSH HL - Empilha o valor de HL
            CPU.PUSH((CPU.registers.H << 8) | CPU.registers.L);
            CPU.cycle += 16;
        };
        ops[0xE6] = CPU => { // AND d8 - Faz um AND do A com o valor de 8 bits
            CPU.registers.A = CPU.ALU.AND_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xE7] = CPU => { // RST 20H - Chama a sub-rotina no endereço 0x0020
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0020;
            CPU.cycle += 16;
        };
        ops[0xE8] = CPU => { // ADD SP, r8 - Adiciona o valor de 8 bits ao SP
            CPU.registers.SP = CPU.ALU.ADD_SP_e8(CPU.registers.SP, CPU.fetchByte());
            CPU.cycle += 16;
        };
        ops[0xE9] = CPU => { // JP (HL) - Salta para o endereço apontado por HL
            CPU.registers.PC = CPU.registers.HL;
            CPU.cycle += 4;
        };
        ops[0xEA] = CPU => { // LD (a16), A - Armazena o valor do A no endereço de 16 bits
            CPU.bus.writeByte(CPU.fetchWord(), CPU.registers.A);
            CPU.cycle += 16;
        };
        ops[0xEB] = CPU => { // Não implementado
            console.error('Unimplemented instruction: EB');
            CPU.cycle += 4;
        };
        ops[0xEC] = CPU => { // Não implementado
            console.error('Unimplemented instruction: EC');
            CPU.cycle += 4;
        };
        ops[0xED] = CPU => { // Não implementado
            console.error('Unimplemented instruction: ED');
            CPU.cycle += 4;
        };
        ops[0xEE] = CPU => { // XOR d8 - Faz um XOR do A com o valor de 8 bits
            CPU.registers.A = CPU.ALU.XOR_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xEF] = CPU => { // RST 28H - Chama a sub-rotina no endereço 0x0028
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0028;
            CPU.cycle += 16;
        };
        ops[0xF0] = CPU => { // LDH A, (a8) - Carrega o valor no endereço 0xFF00 + valor de 8 bits no A
            CPU.registers.A = CPU.bus.readByte(0xFF00 + CPU.fetchByte());
            CPU.cycle += 12;
        };
        ops[0xF1] = CPU => { // POP AF - Desempilha o valor de AF
            const word = CPU.POP();
            CPU.registers.A = (word >> 8) & 0xFF;
            CPU.registers.F = word & 0xF0;
            CPU.cycle += 12;
        };
        ops[0xF2] = CPU => { // LD A, (C) - Carrega o valor no endereço 0xFF00 + valor do C no A
            CPU.registers.A = CPU.bus.readByte(0xFF00 + CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xF3] = CPU => { // DI - Desabilita as interrupções
            CPU.IME = false;
            CPU.imeDelay = 0;
            CPU.cycle += 4;
        };
        ops[0xF4] = CPU => { // Não implementado
            console.error('Unimplemented instruction: F4');
            CPU.cycle += 4;
        };
        ops[0xF5] = CPU => { // PUSH AF - Empilha o valor de AF
            CPU.PUSH((CPU.registers.A << 8) | (CPU.registers.F & 0xF0));
            CPU.cycle += 16;
        };
        ops[0xF6] = CPU => { // OR d8 - Faz um OR do A com o valor de 8 bits
            CPU.registers.A = CPU.ALU.OR_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xF7] = CPU => { // RST 30H - Chama a sub-rotina no endereço 0x0030
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0030;
            CPU.cycle += 16;
        };
        ops[0xF8] = CPU => { // LD HL, SP+r8 - Carrega o SP mais o valor de 8 bits em HL
            CPU.registers.HL = CPU.ALU.ADD_SP_e8(CPU.registers.SP, CPU.fetchByte());
            CPU.cycle += 12;
        };
        ops[0xF9] = CPU => { // LD SP, HL - Carrega o valor de HL no SP
            CPU.registers.SP = CPU.registers.HL;
            CPU.cycle += 8;
        };
        ops[0xFA] = CPU => { // LD A, (a16) - Carrega o valor no endereço de 16 bits no A
            CPU.registers.A = CPU.bus.readByte(CPU.fetchWord());
            CPU.cycle += 16;
        };
        ops[0xFB] = CPU => { // EI - Habilita as interrupções
            CPU.IMEDelay = 1;
            CPU.cycle += 4;
        };
        ops[0xFC] = CPU => { // Não implementado
            console.error('Unimplemented instruction: FC');
            CPU.cycle += 4;
        };
        ops[0xFD] = CPU => { // Não implementado
            console.error('Unimplemented instruction: FD');
            CPU.cycle += 4;
        };
        ops[0xFE] = CPU => { // CP d8 - Compara o A com o valor de 8 bits
            CPU.ALU.SUB_8(CPU.registers.A, CPU.fetchByte());
            CPU.cycle += 8;
        };
        ops[0xFF] = CPU => { // RST 38H - Chama a sub-rotina no endereço 0x0038
            CPU.PUSH(CPU.registers.PC);
            CPU.registers.PC = 0x0038;
            CPU.cycle += 16;
        };
    }

    initializeCBOpcodes() {
        const ops = this.cbOpcodes;

        ops[0x00] = CPU => { // RLC B - Rotaciona o B para a esquerda
            CPU.registers.B = CPU.ALU.RLC(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x01] = CPU => { // RLC C - Rotaciona o C para a esquerda
            CPU.registers.C = CPU.ALU.RLC(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x02] = CPU => { // RLC D - Rotaciona o D para a esquerda
            CPU.registers.D = CPU.ALU.RLC(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x03] = CPU => { // RLC E - Rotaciona o E para a esquerda
            CPU.registers.E = CPU.ALU.RLC(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x04] = CPU => { // RLC H - Rotaciona o H para a esquerda
            CPU.registers.H = CPU.ALU.RLC(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x05] = CPU => { // RLC L - Rotaciona o L para a esquerda
            CPU.registers.L = CPU.ALU.RLC(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x06] = CPU => { // RLC (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RLC(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x07] = CPU => { // RLC A - Rotaciona o A para a esquerda
            CPU.registers.A = CPU.ALU.RLC(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x08] = CPU => { // RRC B - Rotaciona o B para a direita
            CPU.registers.B = CPU.ALU.RRC(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x09] = CPU => { // RRC C - Rotaciona o C para a direita
            CPU.registers.C = CPU.ALU.RRC(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x0A] = CPU => { // RRC D - Rotaciona o D para a direita
            CPU.registers.D = CPU.ALU.RRC(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x0B] = CPU => { // RRC E - Rotaciona o E para a direita
            CPU.registers.E = CPU.ALU.RRC(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x0C] = CPU => { // RRC H - Rotaciona o H para a direita
            CPU.registers.H = CPU.ALU.RRC(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x0D] = CPU => { // RRC L - Rotaciona o L para a direita
            CPU.registers.L = CPU.ALU.RRC(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x0E] = CPU => { // RRC (HL) - Rotaciona o valor no endereço apontado por HL para a direita
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RRC(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x0F] = CPU => { // RRC A - Rotaciona o A para a direita
            CPU.registers.A = CPU.ALU.RRC(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x10] = CPU => { // RL B - Rotaciona o B para a esquerda através do carry
            CPU.registers.B = CPU.ALU.RL(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x11] = CPU => { // RL C - Rotaciona o C para a esquerda através do carry
            CPU.registers.C = CPU.ALU.RL(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x12] = CPU => { // RL D - Rotaciona o D para a esquerda através do carry
            CPU.registers.D = CPU.ALU.RL(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x13] = CPU => { // RL E - Rotaciona o E para a esquerda através do carry
            CPU.registers.E = CPU.ALU.RL(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x14] = CPU => { // RL H - Rotaciona o H para a esquerda através do carry
            CPU.registers.H = CPU.ALU.RL(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x15] = CPU => { // RL L - Rotaciona o L para a esquerda através do carry
            CPU.registers.L = CPU.ALU.RL(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x16] = CPU => { // RL (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda através do carry
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RL(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x17] = CPU => { // RL A - Rotaciona o A para a esquerda através do carry
            CPU.registers.A = CPU.ALU.RL(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x18] = CPU => { // RR B - Rotaciona o B para a direita através do carry
            CPU.registers.B = CPU.ALU.RR(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x19] = CPU => { // RR C - Rotaciona o C para a direita através do carry
            CPU.registers.C = CPU.ALU.RR(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x1A] = CPU => { // RR D - Rotaciona o D para a direita através do carry
            CPU.registers.D = CPU.ALU.RR(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x1B] = CPU => { // RR E - Rotaciona o E para a direita através do carry
            CPU.registers.E = CPU.ALU.RR(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x1C] = CPU => { // RR H - Rotaciona o H para a direita através do carry
            CPU.registers.H = CPU.ALU.RR(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x1D] = CPU => { // RR L - Rotaciona o L para a direita através do carry
            CPU.registers.L = CPU.ALU.RR(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x1E] = CPU => { // RR (HL) - Rotaciona o valor no endereço apontado por HL para a direita através do carry
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RR(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x1F] = CPU => { // RR A - Rotaciona o A para a direita através do carry
            CPU.registers.A = CPU.ALU.RR(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x20] = CPU => { // SLA B - Shift left arithmetic no B
            CPU.registers.B = CPU.ALU.SLA(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x21] = CPU => { // SLA C - Shift left arithmetic no C
            CPU.registers.C = CPU.ALU.SLA(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x22] = CPU => { // SLA D - Shift left arithmetic no D
            CPU.registers.D = CPU.ALU.SLA(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x23] = CPU => { // SLA E - Shift left arithmetic no E
            CPU.registers.E = CPU.ALU.SLA(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x24] = CPU => { // SLA H - Shift left arithmetic no H
            CPU.registers.H = CPU.ALU.SLA(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x25] = CPU => { // SLA L - Shift left arithmetic no L
            CPU.registers.L = CPU.ALU.SLA(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x26] = CPU => { // SLA (HL) - Shift left arithmetic no valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SLA(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x27] = CPU => { // SLA A - Shift left arithmetic no A
            CPU.registers.A = CPU.ALU.SLA(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x28] = CPU => { // SRA B - Shift right arithmetic no B
            CPU.registers.B = CPU.ALU.SRA(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x29] = CPU => { // SRA C - Shift right arithmetic no C
            CPU.registers.C = CPU.ALU.SRA(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x2A] = CPU => { // SRA D - Shift right arithmetic no D
            CPU.registers.D = CPU.ALU.SRA(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x2B] = CPU => { // SRA E - Shift right arithmetic no E
            CPU.registers.E = CPU.ALU.SRA(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x2C] = CPU => { // SRA H - Shift right arithmetic no H
            CPU.registers.H = CPU.ALU.SRA(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x2D] = CPU => { // SRA L - Shift right arithmetic no L
            CPU.registers.L = CPU.ALU.SRA(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x2E] = CPU => { // SRA (HL) - Shift right arithmetic no valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SRA(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x2F] = CPU => { // SRA A - Shift right arithmetic no A
            CPU.registers.A = CPU.ALU.SRA(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x30] = CPU => { // SWAP B - Troca os nibbles alto e baixo do B
            CPU.registers.B = CPU.ALU.SWAP(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x31] = CPU => { // SWAP C - Troca os nibbles alto e baixo do C
            CPU.registers.C = CPU.ALU.SWAP(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x32] = CPU => { // SWAP D - Troca os nibbles alto e baixo do D
            CPU.registers.D = CPU.ALU.SWAP(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x33] = CPU => { // SWAP E - Troca os nibbles alto e baixo do E
            CPU.registers.E = CPU.ALU.SWAP(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x34] = CPU => { // SWAP H - Troca os nibbles alto e baixo do H
            CPU.registers.H = CPU.ALU.SWAP(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x35] = CPU => { // SWAP L - Troca os nibbles alto e baixo do L
            CPU.registers.L = CPU.ALU.SWAP(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x36] = CPU => { // SWAP (HL) - Troca os nibbles alto e baixo do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SWAP(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x37] = CPU => { // SWAP A - Troca os nibbles alto e baixo do A
            CPU.registers.A = CPU.ALU.SWAP(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x38] = CPU => { // SRL B - Shift right lógico no B
            CPU.registers.B = CPU.ALU.SRL(CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x39] = CPU => { // SRL C - Shift right lógico no C
            CPU.registers.C = CPU.ALU.SRL(CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x3A] = CPU => { // SRL D - Shift right lógico no D
            CPU.registers.D = CPU.ALU.SRL(CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x3B] = CPU => { // SRL E - Shift right lógico no E
            CPU.registers.E = CPU.ALU.SRL(CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x3C] = CPU => { // SRL H - Shift right lógico no H
            CPU.registers.H = CPU.ALU.SRL(CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x3D] = CPU => { // SRL L - Shift right lógico no L
            CPU.registers.L = CPU.ALU.SRL(CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x3E] = CPU => { // SRL (HL) - Shift right lógico no valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SRL(value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x3F] = CPU => { // SRL A - Shift right lógico no A
            CPU.registers.A = CPU.ALU.SRL(CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x40] = CPU => { // BIT 0, B - Testa o bit 0 do B
            CPU.ALU.BIT(0, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x41] = CPU => { // BIT 0, C - Testa o bit 0 do C
            CPU.ALU.BIT(0, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x42] = CPU => { // BIT 0, D - Testa o bit 0 do D
            CPU.ALU.BIT(0, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x43] = CPU => { // BIT 0, E - Testa o bit 0 do E
            CPU.ALU.BIT(0, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x44] = CPU => { // BIT 0, H - Testa o bit 0 do H
            CPU.ALU.BIT(0, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x45] = CPU => { // BIT 0, L - Testa o bit 0 do L
            CPU.ALU.BIT(0, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x46] = CPU => { // BIT 0, (HL) - Testa o bit 0 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(0, value);
            CPU.cycle += 12;
        };
        ops[0x47] = CPU => { // BIT 0, A - Testa o bit 0 do A
            CPU.ALU.BIT(0, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x48] = CPU => { // BIT 1, B - Testa o bit 1 do B
            CPU.ALU.BIT(1, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x49] = CPU => { // BIT 1, C - Testa o bit 1 do C
            CPU.ALU.BIT(1, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x4A] = CPU => { // BIT 1, D - Testa o bit 1 do D
            CPU.ALU.BIT(1, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x4B] = CPU => { // BIT 1, E - Testa o bit 1 do E
            CPU.ALU.BIT(1, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x4C] = CPU => { // BIT 1, H - Testa o bit 1 do H
            CPU.ALU.BIT(1, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x4D] = CPU => { // BIT 1, L - Testa o bit 1 do L
            CPU.ALU.BIT(1, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x4E] = CPU => { // BIT 1, (HL) - Testa o bit 1 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(1, value);
            CPU.cycle += 12;
        };
        ops[0x4F] = CPU => { // BIT 1, A - Testa o bit 1 do A
            CPU.ALU.BIT(1, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x50] = CPU => { // BIT 2, B - Testa o bit 2 do B
            CPU.ALU.BIT(2, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x51] = CPU => { // BIT 2, C - Testa o bit 2 do C
            CPU.ALU.BIT(2, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x52] = CPU => { // BIT 2, D - Testa o bit 2 do D
            CPU.ALU.BIT(2, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x53] = CPU => { // BIT 2, E - Testa o bit 2 do E
            CPU.ALU.BIT(2, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x54] = CPU => { // BIT 2, H - Testa o bit 2 do H
            CPU.ALU.BIT(2, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x55] = CPU => { // BIT 2, L - Testa o bit 2 do L
            CPU.ALU.BIT(2, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x56] = CPU => { // BIT 2, (HL) - Testa o bit 2 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(2, value);
            CPU.cycle += 12;
        };
        ops[0x57] = CPU => { // BIT 2, A - Testa o bit 2 do A
            CPU.ALU.BIT(2, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x58] = CPU => { // BIT 3, B - Testa o bit 3 do B
            CPU.ALU.BIT(3, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x59] = CPU => { // BIT 3, C - Testa o bit 3 do C
            CPU.ALU.BIT(3, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x5A] = CPU => { // BIT 3, D - Testa o bit 3 do D
            CPU.ALU.BIT(3, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x5B] = CPU => { // BIT 3, E - Testa o bit 3 do E
            CPU.ALU.BIT(3, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x5C] = CPU => { // BIT 3, H - Testa o bit 3 do H
            CPU.ALU.BIT(3, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x5D] = CPU => { // BIT 3, L - Testa o bit 3 do L
            CPU.ALU.BIT(3, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x5E] = CPU => { // BIT 3, (HL) - Testa o bit 3 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(3, value);
            CPU.cycle += 12;
        };
        ops[0x5F] = CPU => { // BIT 3, A - Testa o bit 3 do A
            CPU.ALU.BIT(3, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x60] = CPU => { // BIT 4, B - Testa o bit 4 do B
            CPU.ALU.BIT(4, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x61] = CPU => { // BIT 4, C - Testa o bit 4 do C
            CPU.ALU.BIT(4, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x62] = CPU => { // BIT 4, D - Testa o bit 4 do D
            CPU.ALU.BIT(4, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x63] = CPU => { // BIT 4, E - Testa o bit 4 do E
            CPU.ALU.BIT(4, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x64] = CPU => { // BIT 4, H - Testa o bit 4 do H
            CPU.ALU.BIT(4, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x65] = CPU => { // BIT 4, L - Testa o bit 4 do L
            CPU.ALU.BIT(4, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x66] = CPU => { // BIT 4, (HL) - Testa o bit 4 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(4, value);
            CPU.cycle += 12;
        };
        ops[0x67] = CPU => { // BIT 4, A - Testa o bit 4 do A
            CPU.ALU.BIT(4, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x68] = CPU => { // BIT 5, B - Testa o bit 5 do B
            CPU.ALU.BIT(5, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x69] = CPU => { // BIT 5, C - Testa o bit 5 do C
            CPU.ALU.BIT(5, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x6A] = CPU => { // BIT 5, D - Testa o bit 5 do D
            CPU.ALU.BIT(5, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x6B] = CPU => { // BIT 5, E - Testa o bit 5 do E
            CPU.ALU.BIT(5, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x6C] = CPU => { // BIT 5, H - Testa o bit 5 do H
            CPU.ALU.BIT(5, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x6D] = CPU => { // BIT 5, L - Testa o bit 5 do L
            CPU.ALU.BIT(5, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x6E] = CPU => { // BIT 5, (HL) - Testa o bit 5 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(5, value);
            CPU.cycle += 12;
        };
        ops[0x6F] = CPU => { // BIT 5, A - Testa o bit 5 do A
            CPU.ALU.BIT(5, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x70] = CPU => { // BIT 6, B - Testa o bit 6 do B
            CPU.ALU.BIT(6, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x71] = CPU => { // BIT 6, C - Testa o bit 6 do C
            CPU.ALU.BIT(6, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x72] = CPU => { // BIT 6, D - Testa o bit 6 do D
            CPU.ALU.BIT(6, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x73] = CPU => { // BIT 6, E - Testa o bit 6 do E
            CPU.ALU.BIT(6, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x74] = CPU => { // BIT 6, H - Testa o bit 6 do H
            CPU.ALU.BIT(6, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x75] = CPU => { // BIT 6, L - Testa o bit 6 do L
            CPU.ALU.BIT(6, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x76] = CPU => { // BIT 6, (HL) - Testa o bit 6 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(6, value);
            CPU.cycle += 12;
        };
        ops[0x77] = CPU => { // BIT 6, A - Testa o bit 6 do A
            CPU.ALU.BIT(6, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x78] = CPU => { // BIT 7, B - Testa o bit 7 do B
            CPU.ALU.BIT(7, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x79] = CPU => { // BIT 7, C - Testa o bit 7 do C
            CPU.ALU.BIT(7, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x7A] = CPU => { // BIT 7, D - Testa o bit 7 do D
            CPU.ALU.BIT(7, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x7B] = CPU => { // BIT 7, E - Testa o bit 7 do E
            CPU.ALU.BIT(7, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x7C] = CPU => { // BIT 7, H - Testa o bit 7 do H
            CPU.ALU.BIT(7, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x7D] = CPU => { // BIT 7, L - Testa o bit 7 do L
            CPU.ALU.BIT(7, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x7E] = CPU => { // BIT 7, (HL) - Testa o bit 7 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            CPU.ALU.BIT(7, value);
            CPU.cycle += 12;
        };
        ops[0x7F] = CPU => { // BIT 7, A - Testa o bit 7 do A
            CPU.ALU.BIT(7, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x80] = CPU => { // RES 0, B - Reseta o bit 0 do B
            CPU.registers.B = CPU.ALU.RES(0, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x81] = CPU => { // RES 0, C - Reseta o bit 0 do C
            CPU.registers.C = CPU.ALU.RES(0, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x82] = CPU => { // RES 0, D - Reseta o bit 0 do D
            CPU.registers.D = CPU.ALU.RES(0, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x83] = CPU => { // RES 0, E - Reseta o bit 0 do E
            CPU.registers.E = CPU.ALU.RES(0, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x84] = CPU => { // RES 0, H - Reseta o bit 0 do H
            CPU.registers.H = CPU.ALU.RES(0, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x85] = CPU => { // RES 0, L - Reseta o bit 0 do L
            CPU.registers.L = CPU.ALU.RES(0, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x86] = CPU => { // RES 0, (HL) - Reseta o bit 0 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(0, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x87] = CPU => { // RES 0, A - Reseta o bit 0 do A
            CPU.registers.A = CPU.ALU.RES(0, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x88] = CPU => { // RES 1, B - Reseta o bit 1 do B
            CPU.registers.B = CPU.ALU.RES(1, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x89] = CPU => { // RES 1, C - Reseta o bit 1 do C
            CPU.registers.C = CPU.ALU.RES(1, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x8A] = CPU => { // RES 1, D - Reseta o bit 1 do D
            CPU.registers.D = CPU.ALU.RES(1, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x8B] = CPU => { // RES 1, E - Reseta o bit 1 do E
            CPU.registers.E = CPU.ALU.RES(1, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x8C] = CPU => { // RES 1, H - Reseta o bit 1 do H
            CPU.registers.H = CPU.ALU.RES(1, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x8D] = CPU => { // RES 1, L - Reseta o bit 1 do L
            CPU.registers.L = CPU.ALU.RES(1, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x8E] = CPU => { // RES 1, (HL) - Reseta o bit 1 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(1, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x8F] = CPU => { // RES 1, A - Reseta o bit 1 do A
            CPU.registers.A = CPU.ALU.RES(1, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x90] = CPU => { // RES 2, B - Reseta o bit 2 do B
            CPU.registers.B = CPU.ALU.RES(2, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x91] = CPU => { // RES 2, C - Reseta o bit 2 do C
            CPU.registers.C = CPU.ALU.RES(2, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x92] = CPU => { // RES 2, D - Reseta o bit 2 do D
            CPU.registers.D = CPU.ALU.RES(2, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x93] = CPU => { // RES 2, E - Reseta o bit 2 do E
            CPU.registers.E = CPU.ALU.RES(2, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x94] = CPU => { // RES 2, H - Reseta o bit 2 do H
            CPU.registers.H = CPU.ALU.RES(2, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x95] = CPU => { // RES 2, L - Reseta o bit 2 do L
            CPU.registers.L = CPU.ALU.RES(2, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x96] = CPU => { // RES 2, (HL) - Reseta o bit 2 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(2, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x97] = CPU => { // RES 2, A - Reseta o bit 2 do A
            CPU.registers.A = CPU.ALU.RES(2, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0x98] = CPU => { // RES 3, B - Reseta o bit 3 do B
            CPU.registers.B = CPU.ALU.RES(3, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0x99] = CPU => { // RES 3, C - Reseta o bit 3 do C
            CPU.registers.C = CPU.ALU.RES(3, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0x9A] = CPU => { // RES 3, D - Reseta o bit 3 do D
            CPU.registers.D = CPU.ALU.RES(3, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0x9B] = CPU => { // RES 3, E - Reseta o bit 3 do E
            CPU.registers.E = CPU.ALU.RES(3, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0x9C] = CPU => { // RES 3, H - Reseta o bit 3 do H
            CPU.registers.H = CPU.ALU.RES(3, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0x9D] = CPU => { // RES 3, L - Reseta o bit 3 do L
            CPU.registers.L = CPU.ALU.RES(3, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0x9E] = CPU => { // RES 3, (HL) - Reseta o bit 3 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(3, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0x9F] = CPU => { // RES 3, A - Reseta o bit 3 do A
            CPU.registers.A = CPU.ALU.RES(3, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xA0] = CPU => { // RES 4, B - Reseta o bit 4 do B
            CPU.registers.B = CPU.ALU.RES(4, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xA1] = CPU => { // RES 4, C - Reseta o bit 4 do C
            CPU.registers.C = CPU.ALU.RES(4, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xA2] = CPU => { // RES 4, D - Reseta o bit 4 do D
            CPU.registers.D = CPU.ALU.RES(4, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xA3] = CPU => { // RES 4, E - Reseta o bit 4 do E
            CPU.registers.E = CPU.ALU.RES(4, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xA4] = CPU => { // RES 4, H - Reseta o bit 4 do H
            CPU.registers.H = CPU.ALU.RES(4, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xA5] = CPU => { // RES 4, L - Reseta o bit 4 do L
            CPU.registers.L = CPU.ALU.RES(4, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xA6] = CPU => { // RES 4, (HL) - Reseta o bit 4 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(4, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xA7] = CPU => { // RES 4, A - Reseta o bit 4 do A
            CPU.registers.A = CPU.ALU.RES(4, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xA8] = CPU => { // RES 5, B - Reseta o bit 5 do B
            CPU.registers.B = CPU.ALU.RES(5, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xA9] = CPU => { // RES 5, C - Reseta o bit 5 do C
            CPU.registers.C = CPU.ALU.RES(5, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xAA] = CPU => { // RES 5, D - Reseta o bit 5 do D
            CPU.registers.D = CPU.ALU.RES(5, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xAB] = CPU => { // RES 5, E - Reseta o bit 5 do E
            CPU.registers.E = CPU.ALU.RES(5, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xAC] = CPU => { // RES 5, H - Reseta o bit 5 do H
            CPU.registers.H = CPU.ALU.RES(5, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xAD] = CPU => { // RES 5, L - Reseta o bit 5 do L
            CPU.registers.L = CPU.ALU.RES(5, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xAE] = CPU => { // RES 5, (HL) - Reseta o bit 5 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(5, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xAF] = CPU => { // RES 5, A - Reseta o bit 5 do A
            CPU.registers.A = CPU.ALU.RES(5, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xB0] = CPU => { // RES 6, B - Reseta o bit 6 do B
            CPU.registers.B = CPU.ALU.RES(6, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xB1] = CPU => { // RES 6, C - Reseta o bit 6 do C
            CPU.registers.C = CPU.ALU.RES(6, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xB2] = CPU => { // RES 6, D - Reseta o bit 6 do D
            CPU.registers.D = CPU.ALU.RES(6, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xB3] = CPU => { // RES 6, E - Reseta o bit 6 do E
            CPU.registers.E = CPU.ALU.RES(6, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xB4] = CPU => { // RES 6, H - Reseta o bit 6 do H
            CPU.registers.H = CPU.ALU.RES(6, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xB5] = CPU => { // RES 6, L - Reseta o bit 6 do L
            CPU.registers.L = CPU.ALU.RES(6, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xB6] = CPU => { // RES 6, (HL) - Reseta o bit 6 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(6, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xB7] = CPU => { // RES 6, A - Reseta o bit 6 do A
            CPU.registers.A = CPU.ALU.RES(6, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xB8] = CPU => { // RES 7, B - Reseta o bit 7 do B
            CPU.registers.B = CPU.ALU.RES(7, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xB9] = CPU => { // RES 7, C - Reseta o bit 7 do C
            CPU.registers.C = CPU.ALU.RES(7, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xBA] = CPU => { // RES 7, D - Reseta o bit 7 do D
            CPU.registers.D = CPU.ALU.RES(7, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xBB] = CPU => { // RES 7, E - Reseta o bit 7 do E
            CPU.registers.E = CPU.ALU.RES(7, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xBC] = CPU => { // RES 7, H - Reseta o bit 7 do H
            CPU.registers.H = CPU.ALU.RES(7, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xBD] = CPU => { // RES 7, L - Reseta o bit 7 do L
            CPU.registers.L = CPU.ALU.RES(7, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xBE] = CPU => { // RES 7, (HL) - Reseta o bit 7 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.RES(7, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xBF] = CPU => { // RES 7, A - Reseta o bit 7 do A
            CPU.registers.A = CPU.ALU.RES(7, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xC0] = CPU => { // SET 0, B - Seta o bit 0 do B
            CPU.registers.B = CPU.ALU.SET(0, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xC1] = CPU => { // SET 0, C - Seta o bit 0 do C
            CPU.registers.C = CPU.ALU.SET(0, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xC2] = CPU => { // SET 0, D - Seta o bit 0 do D
            CPU.registers.D = CPU.ALU.SET(0, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xC3] = CPU => { // SET 0, E - Seta o bit 0 do E
            CPU.registers.E = CPU.ALU.SET(0, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xC4] = CPU => { // SET 0, H - Seta o bit 0 do H
            CPU.registers.H = CPU.ALU.SET(0, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xC5] = CPU => { // SET 0, L - Seta o bit 0 do L
            CPU.registers.L = CPU.ALU.SET(0, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xC6] = CPU => { // SET 0, (HL) - Seta o bit 0 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(0, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xC7] = CPU => { // SET 0, A - Seta o bit 0 do A
            CPU.registers.A = CPU.ALU.SET(0, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xC8] = CPU => { // SET 1, B - Seta o bit 1 do B
            CPU.registers.B = CPU.ALU.SET(1, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xC9] = CPU => { // SET 1, C - Seta o bit 1 do C
            CPU.registers.C = CPU.ALU.SET(1, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xCA] = CPU => { // SET 1, D - Seta o bit 1 do D
            CPU.registers.D = CPU.ALU.SET(1, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xCB] = CPU => { // SET 1, E - Seta o bit 1 do E
            CPU.registers.E = CPU.ALU.SET(1, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xCC] = CPU => { // SET 1, H - Seta o bit 1 do H
            CPU.registers.H = CPU.ALU.SET(1, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xCD] = CPU => { // SET 1, L - Seta o bit 1 do L
            CPU.registers.L = CPU.ALU.SET(1, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xCE] = CPU => { // SET 1, (HL) - Seta o bit 1 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(1, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xCF] = CPU => { // SET 1, A - Seta o bit 1 do A
            CPU.registers.A = CPU.ALU.SET(1, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xD0] = CPU => { // SET 2, B - Seta o bit 2 do B
            CPU.registers.B = CPU.ALU.SET(2, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xD1] = CPU => { // SET 2, C - Seta o bit 2 do C
            CPU.registers.C = CPU.ALU.SET(2, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xD2] = CPU => { // SET 2, D - Seta o bit 2 do D
            CPU.registers.D = CPU.ALU.SET(2, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xD3] = CPU => { // SET 2, E - Seta o bit 2 do E
            CPU.registers.E = CPU.ALU.SET(2, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xD4] = CPU => { // SET 2, H - Seta o bit 2 do H
            CPU.registers.H = CPU.ALU.SET(2, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xD5] = CPU => { // SET 2, L - Seta o bit 2 do L
            CPU.registers.L = CPU.ALU.SET(2, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xD6] = CPU => { // SET 2, (HL) - Seta o bit 2 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(2, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xD7] = CPU => { // SET 2, A - Seta o bit 2 do A
            CPU.registers.A = CPU.ALU.SET(2, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xD8] = CPU => { // SET 3, B - Seta o bit 3 do B
            CPU.registers.B = CPU.ALU.SET(3, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xD9] = CPU => { // SET 3, C - Seta o bit 3 do C
            CPU.registers.C = CPU.ALU.SET(3, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xDA] = CPU => { // SET 3, D - Seta o bit 3 do D
            CPU.registers.D = CPU.ALU.SET(3, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xDB] = CPU => { // SET 3, E - Seta o bit 3 do E
            CPU.registers.E = CPU.ALU.SET(3, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xDC] = CPU => { // SET 3, H - Seta o bit 3 do H
            CPU.registers.H = CPU.ALU.SET(3, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xDD] = CPU => { // SET 3, L - Seta o bit 3 do L
            CPU.registers.L = CPU.ALU.SET(3, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xDE] = CPU => { // SET 3, (HL) - Seta o bit 3 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(3, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xDF] = CPU => { // SET 3, A - Seta o bit 3 do A
            CPU.registers.A = CPU.ALU.SET(3, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xE0] = CPU => { // SET 4, B - Seta o bit 4 do B
            CPU.registers.B = CPU.ALU.SET(4, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xE1] = CPU => { // SET 4, C - Seta o bit 4 do C
            CPU.registers.C = CPU.ALU.SET(4, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xE2] = CPU => { // SET 4, D - Seta o bit 4 do D
            CPU.registers.D = CPU.ALU.SET(4, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xE3] = CPU => { // SET 4, E - Seta o bit 4 do E
            CPU.registers.E = CPU.ALU.SET(4, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xE4] = CPU => { // SET 4, H - Seta o bit 4 do H
            CPU.registers.H = CPU.ALU.SET(4, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xE5] = CPU => { // SET 4, L - Seta o bit 4 do L
            CPU.registers.L = CPU.ALU.SET(4, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xE6] = CPU => { // SET 4, (HL) - Seta o bit 4 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(4, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xE7] = CPU => { // SET 4, A - Seta o bit 4 do A
            CPU.registers.A = CPU.ALU.SET(4, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xE8] = CPU => { // SET 5, B - Seta o bit 5 do B
            CPU.registers.B = CPU.ALU.SET(5, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xE9] = CPU => { // SET 5, C - Seta o bit 5 do C
            CPU.registers.C = CPU.ALU.SET(5, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xEA] = CPU => { // SET 5, D - Seta o bit 5 do D
            CPU.registers.D = CPU.ALU.SET(5, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xEB] = CPU => { // SET 5, E - Seta o bit 5 do E
            CPU.registers.E = CPU.ALU.SET(5, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xEC] = CPU => { // SET 5, H - Seta o bit 5 do H
            CPU.registers.H = CPU.ALU.SET(5, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xED] = CPU => { // SET 5, L - Seta o bit 5 do L
            CPU.registers.L = CPU.ALU.SET(5, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xEE] = CPU => { // SET 5, (HL) - Seta o bit 5 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(5, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xEF] = CPU => { // SET 5, A - Seta o bit 5 do A
            CPU.registers.A = CPU.ALU.SET(5, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xF0] = CPU => { // SET 6, B - Seta o bit 6 do B
            CPU.registers.B = CPU.ALU.SET(6, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xF1] = CPU => { // SET 6, C - Seta o bit 6 do C
            CPU.registers.C = CPU.ALU.SET(6, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xF2] = CPU => { // SET 6, D - Seta o bit 6 do D
            CPU.registers.D = CPU.ALU.SET(6, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xF3] = CPU => { // SET 6, E - Seta o bit 6 do E
            CPU.registers.E = CPU.ALU.SET(6, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xF4] = CPU => { // SET 6, H - Seta o bit 6 do H
            CPU.registers.H = CPU.ALU.SET(6, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xF5] = CPU => { // SET 6, L - Seta o bit 6 do L
            CPU.registers.L = CPU.ALU.SET(6, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xF6] = CPU => { // SET 6, (HL) - Seta o bit 6 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(6, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xF7] = CPU => { // SET 6, A - Seta o bit 6 do A
            CPU.registers.A = CPU.ALU.SET(6, CPU.registers.A);
            CPU.cycle += 8;
        };
        ops[0xF8] = CPU => { // SET 7, B - Seta o bit 7 do B
            CPU.registers.B = CPU.ALU.SET(7, CPU.registers.B);
            CPU.cycle += 8;
        };
        ops[0xF9] = CPU => { // SET 7, C - Seta o bit 7 do C
            CPU.registers.C = CPU.ALU.SET(7, CPU.registers.C);
            CPU.cycle += 8;
        };
        ops[0xFA] = CPU => { // SET 7, D - Seta o bit 7 do D
            CPU.registers.D = CPU.ALU.SET(7, CPU.registers.D);
            CPU.cycle += 8;
        };
        ops[0xFB] = CPU => { // SET 7, E - Seta o bit 7 do E
            CPU.registers.E = CPU.ALU.SET(7, CPU.registers.E);
            CPU.cycle += 8;
        };
        ops[0xFC] = CPU => { // SET 7, H - Seta o bit 7 do H
            CPU.registers.H = CPU.ALU.SET(7, CPU.registers.H);
            CPU.cycle += 8;
        };
        ops[0xFD] = CPU => { // SET 7, L - Seta o bit 7 do L
            CPU.registers.L = CPU.ALU.SET(7, CPU.registers.L);
            CPU.cycle += 8;
        };
        ops[0xFE] = CPU => { // SET 7, (HL) - Seta o bit 7 do valor apontado por HL
            const value = CPU.bus.readByte(CPU.registers.HL);
            const result = CPU.ALU.SET(7, value);
            CPU.bus.writeByte(CPU.registers.HL, result);
            CPU.cycle += 16;
        };
        ops[0xFF] = CPU => { // SET 7, A - Seta o bit 7 do A
            CPU.registers.A = CPU.ALU.SET(7, CPU.registers.A);
            CPU.cycle += 8;
        };
    }
}