export default class OpcodeDecoder {
    constructor() {
        this.opcodes = new Array(0x100).fill(null);
        this.cbOpcodes = new Array(0x100).fill(null);
        this.initializeOpcodes();
        this.initializeCBOpcodes();
    }

    step(control) {
        control.sequencer.mcycle(() => {
            const opcode = control.fetchByte();
            const fn = this.opcodes[opcode];

            if (!fn) {
                console.error(`Unimplemented opcode: ${opcode.toString(16)}`);
                return;
            }
    
            fn(control);
        });
    }

    stepCB(control) {
        control.sequencer.mcycle(() => {
            const opcode = control.fetchByte();
            const fn = this.cbOpcodes[opcode];

            if (!fn) {
                console.error(`Unimplemented CB opcode: ${opcode.toString(16)}`);
                return;
            }

            fn(control);
        });
    }

    initializeOpcodes() {
        const ops = this.opcodes;

        ops[0x00] = () => {}; // NOP - Não faz nada
        ops[0x01] = control => { // LD BC, d16 - Carrega o valor de 16 bits no BC
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                control.registers.BC = (high << 8) | low;
            });
        };
        ops[0x02] = control => { // LD (BC), A - Carrega o valor do A no endereço apontado por BC
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.BC, control.registers.A);
            });
        };
        ops[0x03] = control => { // INC BC - Incrementa o valor de BC
            control.sequencer.mcycle(() => {
                control.registers.BC = control.ALU.INC_16(control.registers.BC);
            });
        };
        ops[0x04] = control => { // INC B - Incrementa o valor do B
            control.registers.B = control.ALU.INC(control.registers.B);
        };
        ops[0x05] = control => { // DEC B - Decrementa o valor do B
            control.registers.B = control.ALU.DEC(control.registers.B);
        };
        ops[0x06] = control => { // LD B, d8 - Carrega o valor de 8 bits no B
            control.sequencer.mcycle(() => {
                control.registers.B = control.fetchByte();
            });
        };
        ops[0x07] = control => { // RLCA - Rotaciona o A para a esquerda
            control.registers.A = control.ALU.RLCA(control.registers.A);
        };
        ops[0x08] = control => { // LD (a16), SP - Carrega o valor do SP no endereço de 16 bits
            let low = 0;
            let high = 0;
            let address = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                high = control.fetchByte();
            });
            
            control.sequencer.mcycle(() => {
                address = (high << 8) | low;
                control.bus.writeByte(address, control.registers.SP & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte((address + 1) & 0xFFFF, (control.registers.SP >> 8) & 0xFF);
            });
        };
        ops[0x09] = control => { // ADD HL, BC - Adiciona o valor de BC ao HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.ADD_16(control.registers.HL, control.registers.BC);
            });
        };
        ops[0x0A] = control => { // LD A, (BC) - Carrega o valor no endereço apontado por BC no A
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(control.registers.BC);
            });
        };
        ops[0x0B] = control => { // DEC BC - Decrementa o valor de BC
            control.sequencer.mcycle(() => {
                control.registers.BC = control.ALU.DEC_16(control.registers.BC);
            });
        };
        ops[0x0C] = control => { // INC C - Incrementa o valor do C
            control.registers.C = control.ALU.INC(control.registers.C);
        };
        ops[0x0D] = control => { // DEC C - Decrementa o valor do C
            control.registers.C = control.ALU.DEC(control.registers.C);
        };
        ops[0x0E] = control => { // LD C, d8 - Carrega o valor de 8 bits no C
            control.sequencer.mcycle(() => {
                control.registers.C = control.fetchByte();
            });
        };
        ops[0x0F] = control => { // RRCA - Rotaciona o A para a direita
            control.registers.A = control.ALU.RRCA(control.registers.A);
        };
        ops[0x10] = control => { // STOP - Para a execução da control
            control.fetchByte();
            control.bus.writeByte(0xFF4D, 0); // Reset o registro de parada
        };
        ops[0x11] = control => { // LD DE, d16 - Carrega o valor de 16 bits no DE
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                control.registers.DE = (high << 8) | low;
            });
        };
        ops[0x12] = control => { // LD (DE), A - Carrega o valor do A no endereço apontado por DE
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.DE, control.registers.A);
            });
        };
        ops[0x13] = control => { // INC DE - Incrementa o valor de DE
            control.sequencer.mcycle(() => {
                control.registers.DE = control.ALU.INC_16(control.registers.DE);
            });
        };
        ops[0x14] = control => { // INC D - Incrementa o valor do D
            control.registers.D = control.ALU.INC(control.registers.D);
        };
        ops[0x15] = control => { // DEC D - Decrementa o valor do D
            control.registers.D = control.ALU.DEC(control.registers.D);
        };
        ops[0x16] = control => { // LD D, d8 - Carrega o valor de 8 bits no D
            control.sequencer.mcycle(() => {
                control.registers.D = control.fetchByte();
            });
        };
        ops[0x17] = control => { // RLA - Rotaciona o A para a esquerda através do carry
            control.registers.A = control.ALU.RLA(control.registers.A);
        };
        ops[0x18] = control => { // JR r8 - Salta para um endereço relativo de 8 bits
            let byte = 0;

            control.sequencer.mcycle(() => {
                byte = control.fetchByte();
            });
            
            control.sequencer.mcycle(() => {
                const displacement = (byte << 24) >> 24; // Sign extend 8 to 32
                control.registers.PC = (control.registers.PC + displacement) & 0xFFFF;
            });
        };
        ops[0x19] = control => { // ADD HL, DE - Adiciona o valor de DE ao HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.ADD_16(control.registers.HL, control.registers.DE);
            });
        };
        ops[0x1A] = control => { // LD A, (DE) - Carrega o valor no endereço apontado por DE no A
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(control.registers.DE);
            });
        };
        ops[0x1B] = control => { // DEC DE - Decrementa o valor de DE
            control.sequencer.mcycle(() => {
                control.registers.DE = control.ALU.DEC_16(control.registers.DE);
            });
        };
        ops[0x1C] = control => { // INC E - Incrementa o valor do E
            control.registers.E = control.ALU.INC(control.registers.E);
        };
        ops[0x1D] = control => { // DEC E - Decrementa o valor do E
            control.registers.E = control.ALU.DEC(control.registers.E);
        };
        ops[0x1E] = control => { // LD E, d8 - Carrega o valor de 8 bits no E
            control.sequencer.mcycle(() => {
                control.registers.E = control.fetchByte();
            });
        };
        ops[0x1F] = control => { // RRA - Rotaciona o A para a direita através do carry
            control.registers.A = control.ALU.RRA(control.registers.A);
        };
        ops[0x20] = control => { // JR NZ, r8 - Salta para um endereço relativo de 8 bits se a flag Z não estiver setada            
            control.sequencer.mcycle(() => {
                const byte = control.fetchByte();
                
                if (control.flags.Z === 0) {
                    control.sequencer.mcycle(() => {
                        const displacement = (byte << 24) >> 24; // Sign extend 8 to 32
                        control.registers.PC = (control.registers.PC + displacement) & 0xFFFF;
                    });
                }
            });
        };
        ops[0x21] = control => { // LD HL, d16 - Carrega o valor de 16 bits no HL
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                control.registers.HL = (high << 8) | low;
            });
        };
        ops[0x22] = control => { // LD (HL+), A - Carrega o valor do A no endereço apontado por HL e incrementa HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.A);
                control.registers.HL = control.ALU.INC_16(control.registers.HL);
            });
        };
        ops[0x23] = control => { // INC HL - Incrementa o valor de HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.INC_16(control.registers.HL);
            });
        };
        ops[0x24] = control => { // INC H - Incrementa o valor do H
            control.registers.H = control.ALU.INC(control.registers.H);
        };
        ops[0x25] = control => { // DEC H - Decrementa o valor do H
            control.registers.H = control.ALU.DEC(control.registers.H);
        };
        ops[0x26] = control => { // LD H, d8 - Carrega o valor de 8 bits no H
            control.sequencer.mcycle(() => {
                control.registers.H = control.fetchByte();
            });
        };
        ops[0x27] = control => { // DAA - Ajusta o valor do A para o formato BCD
            control.registers.A = control.ALU.DAA(control.registers.A);
        };
        ops[0x28] = control => { // JR Z, r8 - Salta para um endereço relativo de 8 bits se a flag Z estiver setada
            control.sequencer.mcycle(() => {
                const byte = control.fetchByte();

                if (control.flags.Z === 1) {
                    control.sequencer.mcycle(() => {
                        const displacement = (byte << 24) >> 24; // Sign extend 8 to 32
                        control.registers.PC = (control.registers.PC + displacement) & 0xFFFF;
                    });
                }
            });
        };
        ops[0x29] = control => { // ADD HL, HL - Adiciona o valor de HL ao HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.ADD_16(control.registers.HL, control.registers.HL);
            });
        };
        ops[0x2A] = control => { // LD A, (HL+) - Carrega o valor no endereço apontado por HL no A e incrementa HL
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(control.registers.HL);
                control.registers.HL = control.ALU.INC_16(control.registers.HL);
            });
        };
        ops[0x2B] = control => { // DEC HL - Decrementa o valor de HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.DEC_16(control.registers.HL);
            });
        };
        ops[0x2C] = control => { // INC L - Incrementa o valor do L
            control.registers.L = control.ALU.INC(control.registers.L);
        };
        ops[0x2D] = control => { // DEC L - Decrementa o valor do L
            control.registers.L = control.ALU.DEC(control.registers.L);
        };
        ops[0x2E] = control => { // LD L, d8 - Carrega o valor de 8 bits no L
            control.sequencer.mcycle(() => {
                control.registers.L = control.fetchByte();
            });
        };
        ops[0x2F] = control => { // CPL - Complementa o valor do A (A = ~A)
            control.registers.A = (~control.registers.A) & 0xFF;
            control.flags.N = 1;
            control.flags.H = 1;
        };
        ops[0x30] = control => { // JR NC - Salta para um endereço relativo de 8 bits se a flag C não estiver setada
            control.sequencer.mcycle(() => {
                const byte = control.fetchByte();
                
                if (control.flags.C === 0) {
                    control.sequencer.mcycle(() => {
                        const displacement = (byte << 24) >> 24; // Sign extend 8 to 32
                        control.registers.PC = (control.registers.PC + displacement) & 0xFFFF;
                    });
                }
            });
        };
        ops[0x31] = control => { // LD SP, d16 - Carrega o valor de 16 bits no SP
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                control.registers.SP = (high << 8) | low;
            });
        };
        ops[0x32] = control => { // LD (HL-), A - Carrega o valor do A no endereço apontado por HL e decrementa HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.A);
                control.registers.HL = control.ALU.DEC_16(control.registers.HL);
            });
        };
        ops[0x33] = control => { // INC SP - Incrementa o valor do SP
            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });
        };
        ops[0x34] = control => { // INC (HL) - Incrementa o valor no endereço apontado por HL
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.INC(value);
                control.bus.writeByte(control.registers.HL, result);
            });
        };
        ops[0x35] = control => { // DEC (HL) - Decrementa o valor no endereço apontado por HL
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.DEC(value);
                control.bus.writeByte(control.registers.HL, result);
            });
        };
        ops[0x36] = control => { // LD (HL), d8 - Carrega o valor de 8 bits no endereço apontado por HL
            let immediate = 0;

            control.sequencer.mcycle(() => {
                immediate = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, immediate);
            });
        };
        ops[0x37] = control => { // SCF - Seta a flag Carry
            control.flags.C = 1;
            control.flags.N = 0;
            control.flags.H = 0;
        };
        ops[0x38] = control => { // JR C, r8 - Salta para um endereço relativo de 8 bits se a flag C estiver setada
            control.sequencer.mcycle(() => {
                const byte = control.fetchByte();
                
                if (control.flags.C === 1) {
                    control.sequencer.mcycle(() => {
                        const displacement = (byte << 24) >> 24; // Sign extend 8 to 32
                        control.registers.PC = (control.registers.PC + displacement) & 0xFFFF;
                    });
                }
            });
        };
        ops[0x39] = control => { // ADD HL, SP - Adiciona o valor do SP ao HL
            control.sequencer.mcycle(() => {
                control.registers.HL = control.ALU.ADD_16(control.registers.HL, control.registers.SP);
            });
        };
        ops[0x3A] = control => { // LD A, (HL-) - Carrega o valor no endereço apontado por HL no A e decrementa HL
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(control.registers.HL);
                control.registers.HL = control.ALU.DEC_16(control.registers.HL);
            });
        };
        ops[0x3B] = control => { // DEC SP - Decrementa o valor do SP
            control.sequencer.mcycle(() => {
                control.registers.SP = control.ALU.DEC_16(control.registers.SP);
            });
        };
        ops[0x3C] = control => { // INC A - Incrementa o valor do A
            control.registers.A = control.ALU.INC(control.registers.A);
        };
        ops[0x3D] = control => { // DEC A - Decrementa o valor do A
            control.registers.A = control.ALU.DEC(control.registers.A);
        };
        ops[0x3E] = control => { // LD A, d8 - Carrega o valor de 8 bits no A
            control.sequencer.mcycle(() => {
                control.registers.A = control.fetchByte();
            });
        };
        ops[0x3F] = control => { // CCF - Complementa a flag Carry
            control.flags.C ^= 1;
            control.flags.N = 0;
            control.flags.H = 0;
        };
        ops[0x40] = control => { // LD B, B - Carrega o valor do B no B
            control.registers.B = control.registers.B;
        };
        ops[0x41] = control => { // LD B, C - Carrega o valor do C no B
            control.registers.B = control.registers.C;
        };
        ops[0x42] = control => { // LD B, D - Carrega o valor do D no B
            control.registers.B = control.registers.D;
        };
        ops[0x43] = control => { // LD B, E - Carrega o valor do E no B
            control.registers.B = control.registers.E;
        };
        ops[0x44] = control => { // LD B, H - Carrega o valor do H no B
            control.registers.B = control.registers.H;
        };
        ops[0x45] = control => { // LD B, L - Carrega o valor do L no B
            control.registers.B = control.registers.L;
        };
        ops[0x46] = control => { // LD B, (HL) - Carrega o valor no endereço apontado por HL no B
            control.sequencer.mcycle(() => {
                control.registers.B = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x47] = control => { // LD B, A - Carrega o valor do A no B
            control.registers.B = control.registers.A;
        };
        ops[0x48] = control => { // LD C, B - Carrega o valor do B no C
            control.registers.C = control.registers.B;
        };
        ops[0x49] = control => { // LD C, C - Carrega o valor do C no C
            control.registers.C = control.registers.C;
        };
        ops[0x4A] = control => { // LD C, D - Carrega o valor do D no C
            control.registers.C = control.registers.D;
        };
        ops[0x4B] = control => { // LD C, E - Carrega o valor do E no C
            control.registers.C = control.registers.E;
        };
        ops[0x4C] = control => { // LD C, H - Carrega o valor do H no C
            control.registers.C = control.registers.H;
        };
        ops[0x4D] = control => { // LD C, L - Carrega o valor do L no C
            control.registers.C = control.registers.L;
        };
        ops[0x4E] = control => { // LD C, (HL) - Carrega o valor no endereço apontado por HL no C
            control.sequencer.mcycle(() => {
                control.registers.C = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x4F] = control => { // LD C, A - Carrega o valor do A no C
            control.registers.C = control.registers.A;
        };
        ops[0x50] = control => { // LD D, B - Carrega o valor do B no D
            control.registers.D = control.registers.B;
        };
        ops[0x51] = control => { // LD D, C - Carrega o valor do C no D
            control.registers.D = control.registers.C;
        };
        ops[0x52] = control => { // LD D, D - Carrega o valor do D no D
            control.registers.D = control.registers.D;
        };
        ops[0x53] = control => { // LD D, E - Carrega o valor do E no D
            control.registers.D = control.registers.E;
        };
        ops[0x54] = control => { // LD D, H - Carrega o valor do H no D
            control.registers.D = control.registers.H;
        };
        ops[0x55] = control => { // LD D, L - Carrega o valor do L no D
            control.registers.D = control.registers.L;
        };
        ops[0x56] = control => { // LD D, (HL) - Carrega o valor no endereço apontado por HL no D
            control.sequencer.mcycle(() => {
                control.registers.D = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x57] = control => { // LD D, A - Carrega o valor do A no D
            control.registers.D = control.registers.A;
        };
        ops[0x58] = control => { // LD E, B - Carrega o valor do B no E
            control.registers.E = control.registers.B;
        };
        ops[0x59] = control => { // LD E, C - Carrega o valor do C no E
            control.registers.E = control.registers.C;
        };
        ops[0x5A] = control => { // LD E, D - Carrega o valor do D no E
            control.registers.E = control.registers.D;
        };
        ops[0x5B] = control => { // LD E, E - Carrega o valor do E no E
            control.registers.E = control.registers.E;
        };
        ops[0x5C] = control => { // LD E, H - Carrega o valor do H no E
            control.registers.E = control.registers.H;
        };
        ops[0x5D] = control => { // LD E, L - Carrega o valor do L no E
            control.registers.E = control.registers.L;
        };
        ops[0x5E] = control => { // LD E, (HL) - Carrega o valor no endereço apontado por HL no E
            control.sequencer.mcycle(() => {
                control.registers.E = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x5F] = control => { // LD E, A - Carrega o valor do A no E
            control.registers.E = control.registers.A;
        };
        ops[0x60] = control => { // LD H, B - Carrega o valor do B no H
            control.registers.H = control.registers.B;
        };
        ops[0x61] = control => { // LD H, C - Carrega o valor do C no H
            control.registers.H = control.registers.C;
        };
        ops[0x62] = control => { // LD H, D - Carrega o valor do D no H
            control.registers.H = control.registers.D;
        };
        ops[0x63] = control => { // LD H, E - Carrega o valor do E no H
            control.registers.H = control.registers.E;
        };
        ops[0x64] = control => { // LD H, H - Carrega o valor do H no H
            control.registers.H = control.registers.H;
        };
        ops[0x65] = control => { // LD H, L - Carrega o valor do L no H
            control.registers.H = control.registers.L;
        };
        ops[0x66] = control => { // LD H, (HL) - Carrega o valor no endereço apontado por HL no H
            control.sequencer.mcycle(() => {
                control.registers.H = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x67] = control => { // LD H, A - Carrega o valor do A no H
            control.registers.H = control.registers.A;
        };
        ops[0x68] = control => { // LD L, B - Carrega o valor do B no L
            control.registers.L = control.registers.B;
        };
        ops[0x69] = control => { // LD L, C - Carrega o valor do C no L
            control.registers.L = control.registers.C;
        };
        ops[0x6A] = control => { // LD L, D - Carrega o valor do D no L
            control.registers.L = control.registers.D;
        };
        ops[0x6B] = control => { // LD L, E - Carrega o valor do E no L
            control.registers.L = control.registers.E;
        };
        ops[0x6C] = control => { // LD L, H - Carrega o valor do H no L
            control.registers.L = control.registers.H;
        };
        ops[0x6D] = control => { // LD L, L - Carrega o valor do L no L
            control.registers.L = control.registers.L;
        };
        ops[0x6E] = control => { // LD L, (HL) - Carrega o valor no endereço apontado por HL no L
            control.sequencer.mcycle(() => {
                control.registers.L = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x6F] = control => { // LD L, A - Carrega o valor do A no L
            control.registers.L = control.registers.A;
        };
        ops[0x70] = control => { // LD (HL), B - Armazena o valor do B no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.B);
            });
        };
        ops[0x71] = control => { // LD (HL), C - Armazena o valor do C no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.C);
            });
        };
        ops[0x72] = control => { // LD (HL), D - Armazena o valor do D no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.D);
            });
        };
        ops[0x73] = control => { // LD (HL), E - Armazena o valor do E no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.E);
            });
        };
        ops[0x74] = control => { // LD (HL), H - Armazena o valor do H no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.H);
            });
        };
        ops[0x75] = control => { // LD (HL), L - Armazena o valor do L no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.L);
            });
        };
        ops[0x76] = control => { // HALT - Para a execução da control
            const pending = control.interrupts.pending();
            if (control.IME) {
                control.halted = true;
            } else {
                if (pending !== 0) control.haltBug = true;
                else control.halted = true;
            }
        };
        ops[0x77] = control => { // LD (HL), A - Armazena o valor do A no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.bus.writeByte(control.registers.HL, control.registers.A);
            });
        };
        ops[0x78] = control => { // LD A, B - Carrega o valor do B no A
            control.registers.A = control.registers.B;
        };
        ops[0x79] = control => { // LD A, C - Carrega o valor do C no A
            control.registers.A = control.registers.C;
        };
        ops[0x7A] = control => { // LD A, D - Carrega o valor do D no A
            control.registers.A = control.registers.D;
        };
        ops[0x7B] = control => { // LD A, E - Carrega o valor do E no A
            control.registers.A = control.registers.E;
        };
        ops[0x7C] = control => { // LD A, H - Carrega o valor do H no A
            control.registers.A = control.registers.H;
        };
        ops[0x7D] = control => { // LD A, L - Carrega o valor do L no A
            control.registers.A = control.registers.L;
        };
        ops[0x7E] = control => { // LD A, (HL) - Carrega o valor no endereço apontado por HL no A
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(control.registers.HL);
            });
        };
        ops[0x7F] = control => { // LD A, A - Carrega o valor do A no A
            control.registers.A = control.registers.A;
        };
        ops[0x80] = control => { // ADD A, B - Adiciona o valor do B ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.B);
        };
        ops[0x81] = control => { // ADD A, C - Adiciona o valor do C ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.C);
        };
        ops[0x82] = control => { // ADD A, D - Adiciona o valor do D ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.D);
        };
        ops[0x83] = control => { // ADD A, E - Adiciona o valor do E ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.E);
        };
        ops[0x84] = control => { // ADD A, H - Adiciona o valor do H ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.H);
        };
        ops[0x85] = control => { // ADD A, L - Adiciona o valor do L ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.L);
        };
        ops[0x86] = control => { // ADD A, (HL) - Adiciona o valor no endereço apontado por HL ao A
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.ADD(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0x87] = control => { // ADD A, A - Adiciona o valor do A ao A
            control.registers.A = control.ALU.ADD(control.registers.A, control.registers.A);
        };
        ops[0x88] = control => { // ADC A, B - Adiciona o valor do A ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.B, control.flags.C);
        };
        ops[0x89] = control => { // ADC A, C - Adiciona o valor do C ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.C, control.flags.C);
        };
        ops[0x8A] = control => { // ADC A, D - Adiciona o valor do D ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.D, control.flags.C);
        };
        ops[0x8B] = control => { // ADC A, E - Adiciona o valor do E ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.E, control.flags.C);
        };
        ops[0x8C] = control => { // ADC A, H - Adiciona o valor do H ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.H, control.flags.C);
        };
        ops[0x8D] = control => { // ADC A, L - Adiciona o valor do L ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.L, control.flags.C);
        };
        ops[0x8E] = control => { // ADC A, (HL) - Adiciona o valor no endereço apontado por HL ao A com carry
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.ADC(control.registers.A, control.bus.readByte(control.registers.HL), control.flags.C);
            });
        };
        ops[0x8F] = control => { // ADC A, A - Adiciona o valor do A ao A com carry
            control.registers.A = control.ALU.ADC(control.registers.A, control.registers.A, control.flags.C);
        };
        ops[0x90] = control => { // SUB B - Subtrai o valor do B do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.B);
        };
        ops[0x91] = control => { // SUB C - Subtrai o valor do C do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.C);
        };
        ops[0x92] = control => { // SUB D - Subtrai o valor do D do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.D);
        };
        ops[0x93] = control => { // SUB E - Subtrai o valor do E do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.E);
        };
        ops[0x94] = control => { // SUB H - Subtrai o valor do H do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.H);
        };
        ops[0x95] = control => { // SUB L - Subtrai o valor do L do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.L);
        };
        ops[0x96] = control => { // SUB (HL) - Subtrai o valor no endereço apontado por HL do A
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.SUB(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0x97] = control => { // SUB A - Subtrai o valor do A do A
            control.registers.A = control.ALU.SUB(control.registers.A, control.registers.A);
        };
        ops[0x98] = control => { // SBC A, B - Subtrai o valor do B do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.B, control.flags.C);
        };
        ops[0x99] = control => { // SBC A, C - Subtrai o valor do C do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.C, control.flags.C);
        };
        ops[0x9A] = control => { // SBC A, D - Subtrai o valor do D do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.D, control.flags.C);
        };
        ops[0x9B] = control => { // SBC A, E - Subtrai o valor do E do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.E, control.flags.C);
        };
        ops[0x9C] = control => { // SBC A, H - Subtrai o valor do H do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.H, control.flags.C);
        };
        ops[0x9D] = control => { // SBC A, L - Subtrai o valor do L do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.L, control.flags.C);
        };
        ops[0x9E] = control => { // SBC (HL) - Subtrai o valor no endereço apontado por HL do A com carry
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.SBC(control.registers.A, control.bus.readByte(control.registers.HL), control.flags.C);
            });
        };
        ops[0x9F] = control => { // SBC A, A - Subtrai o valor do A do A com carry
            control.registers.A = control.ALU.SBC(control.registers.A, control.registers.A, control.flags.C);
        };
        ops[0xA0] = control => { // AND B - Faz um AND do A com o B
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.B);
        };
        ops[0xA1] = control => { // AND C - Faz um AND do A com o C
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.C);
        };
        ops[0xA2] = control => { // AND D - Faz um AND do A com o D
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.D);
        };
        ops[0xA3] = control => { // AND E - Faz um AND do A com o E
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.E);
        };
        ops[0xA4] = control => { // AND H - Faz um AND do A com o H
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.H);
        };
        ops[0xA5] = control => { // AND L - Faz um AND do A com o L
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.L);
        };
        ops[0xA6] = control => { // AND (HL) - Faz um AND do A com o valor no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.AND(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0xA7] = control => { // AND A - Faz um AND do A com ele mesmo
            control.registers.A = control.ALU.AND(control.registers.A, control.registers.A);
        };
        ops[0xA8] = control => { // XOR B - Faz um XOR do A com o B
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.B);
        };
        ops[0xA9] = control => { // XOR C - Faz um XOR do A com o C
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.C);
        };
        ops[0xAA] = control => { // XOR D - Faz um XOR do A com o D
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.D);
        };
        ops[0xAB] = control => { // XOR E - Faz um XOR do A com o E
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.E);
        };
        ops[0xAC] = control => { // XOR H - Faz um XOR do A com o H
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.H);
        };
        ops[0xAD] = control => { // XOR L - Faz um XOR do A com o L
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.L);
        };
        ops[0xAE] = control => { // XOR (HL) - Faz um XOR do A com o valor no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.XOR(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0xAF] = control => { // XOR A - Faz um XOR do A com ele mesmo
            control.registers.A = control.ALU.XOR(control.registers.A, control.registers.A);
        };
        ops[0xB0] = control => { // OR B - Faz um OR do A com o B
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.B);
        };
        ops[0xB1] = control => { // OR C - Faz um OR do A com o C
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.C);
        };
        ops[0xB2] = control => { // OR D - Faz um OR do A com o D
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.D);
        };
        ops[0xB3] = control => { // OR E - Faz um OR do A com o E
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.E);
        };
        ops[0xB4] = control => { // OR H - Faz um OR do A com o H
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.H);
        };
        ops[0xB5] = control => { // OR L - Faz um OR do A com o L
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.L);
        };
        ops[0xB6] = control => { // OR (HL) - Faz um OR do A com o valor no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.OR(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0xB7] = control => { // OR A - Faz um OR do A com ele mesmo
            control.registers.A = control.ALU.OR(control.registers.A, control.registers.A);
        };
        ops[0xB8] = control => { // CP B - Compara o A com o B
            control.ALU.SUB(control.registers.A, control.registers.B);
        };
        ops[0xB9] = control => { // CP C - Compara o A com o C
            control.ALU.SUB(control.registers.A, control.registers.C);
        };
        ops[0xBA] = control => { // CP D - Compara o A com o D
            control.ALU.SUB(control.registers.A, control.registers.D);
        };
        ops[0xBB] = control => { // CP E - Compara o A com o E
            control.ALU.SUB(control.registers.A, control.registers.E);
        };
        ops[0xBC] = control => { // CP H - Compara o A com o H
            control.ALU.SUB(control.registers.A, control.registers.H);
        };
        ops[0xBD] = control => { // CP L - Compara o A com o L
            control.ALU.SUB(control.registers.A, control.registers.L);
        };
        ops[0xBE] = control => { // CP (HL) - Compara o A com o valor no endereço apontado por HL
            control.sequencer.mcycle(() => {
                control.ALU.SUB(control.registers.A, control.bus.readByte(control.registers.HL));
            });
        };
        ops[0xBF] = control => { // CP A - Compara o A com ele mesmo
            control.ALU.SUB(control.registers.A, control.registers.A);
        };
        ops[0xC0] = control => { // RET NZ - Retorna de uma chamada de sub-rotina se a flag Z não estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                if (control.flags.Z === 0) {
                    control.sequencer.mcycle(() => {
                        low = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {
                        const high = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xC1] = control => { // POP BC - Desempilha o valor de BC
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.BC = ((high << 8) | low) & 0xFFFF;
            });
        };
        ops[0xC2] = control => { // JP NZ, a16 - Salta para o endereço de 16 bits se a flag Z não estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.Z === 0) {
                    control.sequencer.mcycle(() => {
                        const address = ((high << 8) | low) & 0xFFFF;
                        control.registers.PC = address;
                    });
                }
            });
        };
        ops[0xC3] = control => { // JP a16 - Salta para o endereço de 16 bits
            let low = 0;
            let high = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                high = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const address = ((high << 8) | low) & 0xFFFF;
                control.registers.PC = address;
            });
        };
        ops[0xC4] = control => { // CALL NZ, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z não estiver setada
            let low = 0;
            
            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                const address = control.registers.PC & 0xFFFF;

                if (control.flags.Z === 0) {
                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
                    });

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, address & 0xFF);
                    });

                    control.sequencer.mcycle(() => {
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });
                }
            });
        };
        ops[0xC5] = control => { // PUSH BC - Empilha o valor de BC
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.registers.BC & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (value >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, value & 0xFF);
            });
        };
        ops[0xC6] = control => { // ADD A, d8 - Adiciona o valor de 8 bits ao A
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.ADD(control.registers.A, control.fetchByte());
            });
        };
        ops[0xC7] = control => { // RST 00H - Chama a sub-rotina no endereço 0x0000
            let address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0000;
            });
        };
        ops[0xC8] = control => { // RET Z - Retorna de uma chamada de sub-rotina se a flag Z estiver setada
            control.sequencer.mcycle(() => {
                if (control.flags.Z === 1) {
                    let low = 0;

                    control.sequencer.mcycle(() => {
                        low = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {
                        const high = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xC9] = control => { // RET - Retorna de uma chamada de sub-rotina
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP);
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP);
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.PC = (high << 8) | low;
            });
            
            control.sequencer.mcycle(() => {});
        };
        ops[0xCA] = control => { // JP Z, a16 - Salta para o endereço de 16 bits se a flag Z estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.Z === 1) {
                    control.sequencer.mcycle(() => {
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });
                }
            });
        };
        ops[0xCB] = control => { // CB - Prefixo de instruções de 8 bits
            this.stepCB(control);
        };
        ops[0xCC] = control => { // CALL Z, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag Z estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.Z === 1) {
                    const address = control.registers.PC & 0xFFFF;

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
                    });

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, address & 0xFF);
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xCD] = control => { // CALL a16 - Chama uma sub-rotina no endereço de 16 bits
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();
                const address = control.registers.PC & 0xFFFF;

                control.sequencer.mcycle(() => {
                    control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                    control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
                });

                control.sequencer.mcycle(() => {
                    control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                    control.bus.writeByte(control.registers.SP, address & 0xFF);
                    control.registers.PC = ((high << 8) | low) & 0xFFFF;
                });

                control.sequencer.mcycle(() => {});
            });
        };
        ops[0xCE] = control => { // ADC A, d8 - Adiciona o valor de 8 bits ao A com carry
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.ADC(control.registers.A, control.fetchByte(), control.flags.C);
            });
        };
        ops[0xCF] = control => { // RST 08H - Chama a sub-rotina no endereço 0x0008
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0008;
            });
        };
        ops[0xD0] = control => { // RET NC - Retorna de uma chamada de sub-rotina se a flag C não estiver setada
            control.sequencer.mcycle(() => {
                if (control.flags.C === 0) {
                    let low = 0;

                    control.sequencer.mcycle(() => {
                        low = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {
                        const high = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xD1] = control => { // POP DE - Desempilha o valor de DE
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.DE = ((high << 8) | low) & 0xFFFF;
            });
        };
        ops[0xD2] = control => { // JP NC, a16 - Salta para o endereço de 16 bits se a flag C não estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.C === 0) {
                    control.sequencer.mcycle(() => {
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });
                }
            });
        };
        ops[0xD3] = () => { // Não implementado
            console.error('Unimplemented instruction: D3');
        };
        ops[0xD4] = control => { // CALL NC, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C não estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.C === 0) {
                    const address = control.registers.PC & 0xFFFF;

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
                    });

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, address & 0xFF);
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xD5] = control => { // PUSH DE - Empilha o valor de DE
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.registers.DE & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (value >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, value & 0xFF);
            });
        };
        ops[0xD6] = control => { // SUB d8 - Subtrai o valor de 8 bits do A
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.SUB(control.registers.A, control.fetchByte());
            });
        };
        ops[0xD7] = control => { // RST 10H - Chama a sub-rotina no endereço 0x0010
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0010;
            });
        };
        ops[0xD8] = control => { // RET C - Retorna de uma chamada de sub-rotina se a flag C estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                if (control.flags.C === 1) {
                    control.sequencer.mcycle(() => {
                        low = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {
                        const high = control.bus.readByte(control.registers.SP) & 0xFF;
                        control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xD9] = control => { // RETI - Retorna de uma chamada de sub-rotina e habilita as interrupções
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.PC = ((high << 8) | low) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                control.IME = 1;
            });
        };
        ops[0xDA] = control => { // JP C, a16 - Salta para o endereço de 16 bits se a flag C estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.C === 1) {
                    control.sequencer.mcycle(() => {
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });
                }
            });
        };
        ops[0xDB] = () => { // Não implementado
            console.error('Unimplemented instruction: DB');
        };
        ops[0xDC] = control => { // CALL C, a16 - Chama uma sub-rotina no endereço de 16 bits se a flag C estiver setada
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const high = control.fetchByte();

                if (control.flags.C === 1) {
                    const address = control.registers.PC & 0xFFFF;

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
                    });

                    control.sequencer.mcycle(() => {
                        control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                        control.bus.writeByte(control.registers.SP, address & 0xFF);
                        control.registers.PC = ((high << 8) | low) & 0xFFFF;
                    });

                    control.sequencer.mcycle(() => {});
                }
            });
        };
        ops[0xDD] = control => { // Não implementado
            console.error('Unimplemented instruction: DD');
        };
        ops[0xDE] = control => { // SBC A, d8 - Subtrai o valor de 8 bits do A com carry
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.SBC(control.registers.A, control.fetchByte(), control.flags.C);
            });
        };
        ops[0xDF] = control => { // RST 18H - Chama a sub-rotina no endereço 0x0018
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0018;
            });
        };
        ops[0xE0] = control => { // LDH (a8), A - Armazena o valor do A no endereço 0xFF00 + valor de 8 bits
            let offset = 0;

            control.sequencer.mcycle(() => {
                offset = control.fetchByte() & 0xFF;
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(0xFF00 | offset, control.registers.A);
            });
        };
        ops[0xE1] = control => { // POP HL - Desempilha o valor de HL
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.HL = ((high << 8) | low) & 0xFFFF;
            });
        };
        ops[0xE2] = control => { // LD (C), A - Armazena o valor do A no endereço 0xFF00 + valor do C
            control.sequencer.mcycle(() => {
                control.bus.writeByte(0xFF00 + control.registers.C, control.registers.A);
            });
        };
        ops[0xE3] = () => { // Não implementado
            console.error('Unimplemented instruction: E3');
        };
        ops[0xE4] = () => { // Não implementado
            console.error('Unimplemented instruction: E4');
        };
        ops[0xE5] = control => { // PUSH HL - Empilha o valor de HL
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.registers.HL & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (value >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, value & 0xFF);
            });
        };
        ops[0xE6] = control => { // AND d8 - Faz um AND do A com o valor de 8 bits
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.AND(control.registers.A, control.fetchByte());
            });
        };
        ops[0xE7] = control => { // RST 20H - Chama a sub-rotina no endereço 0x0020
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0020;
            });
        };
        ops[0xE8] = control => { // ADD SP, r8 - Adiciona o valor de 8 bits ao SP
            let immediate = 0;

            control.sequencer.mcycle(() => {
                immediate = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const sp = control.registers.SP;
                const signed = (immediate << 24) >> 24; // Converte para signed 32 bits

                control.flags.Z = 0;
                control.flags.N = 0;
                control.flags.H = ((sp & 0x0F) + (signed & 0x0F)) > 0x0F ? 1 : 0;
                control.flags.C = ((sp & 0xFF) + (signed & 0xFF)) > 0xFF ? 1 : 0;
                control.registers.SP = (sp + signed) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {});
        };
        ops[0xE9] = control => { // JP (HL) - Salta para o endereço apontado por HL
            control.registers.PC = control.registers.HL;
        };
        ops[0xEA] = control => { // LD (a16), A - Armazena o valor do A no endereço de 16 bits
            let low = 0;
            let high = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                high = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const address = ((high << 8) | low) & 0xFFFF;
                control.bus.writeByte(address, control.registers.A);
            });
        };
        ops[0xEB] = () => { // Não implementado
            console.error('Unimplemented instruction: EB');
        };
        ops[0xEC] = () => { // Não implementado
            console.error('Unimplemented instruction: EC');
        };
        ops[0xED] = () => { // Não implementado
            console.error('Unimplemented instruction: ED');
        };
        ops[0xEE] = control => { // XOR d8 - Faz um XOR do A com o valor de 8 bits
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.XOR(control.registers.A, control.fetchByte());
            });
        };
        ops[0xEF] = control => { // RST 28H - Chama a sub-rotina no endereço 0x0028
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0028;
            });
        };
        ops[0xF0] = control => { // LDH A, (a8) - Carrega o valor no endereço 0xFF00 + valor de 8 bits no A
            let offset = 0;

            control.sequencer.mcycle(() => {
                offset = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const address = (0xFF00 | offset) & 0xFFFF;
                control.registers.A = control.bus.readByte(address);
            });
        };
        ops[0xF1] = control => { // POP AF - Desempilha o valor de AF
            let low = 0;

            control.sequencer.mcycle(() => {
                low = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
            });

            control.sequencer.mcycle(() => {
                const high = control.bus.readByte(control.registers.SP) & 0xFF;
                control.registers.SP = (control.registers.SP + 1) & 0xFFFF;
                control.registers.AF = ((high << 8) | (low & 0xF0)) & 0xFFFF;
            });
        };
        ops[0xF2] = control => { // LD A, (C) - Carrega o valor no endereço 0xFF00 + valor do C no A
            control.sequencer.mcycle(() => {
                control.registers.A = control.bus.readByte(0xFF00 + control.registers.C);
            });
        };
        ops[0xF3] = control => { // DI - Desabilita as interrupções
            control.IME = 0;
            control.eiDelay = 0;
        };
        ops[0xF4] = () => { // Não implementado
            console.error('Unimplemented instruction: F4');
        };
        ops[0xF5] = control => { // PUSH AF - Empilha o valor de AF
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.registers.AF;
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (value >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, value & 0xFF);
            });
        };
        ops[0xF6] = control => { // OR d8 - Faz um OR do A com o valor de 8 bits
            control.sequencer.mcycle(() => {
                control.registers.A = control.ALU.OR(control.registers.A, control.fetchByte());
            });
        };
        ops[0xF7] = control => { // RST 30H - Chama a sub-rotina no endereço 0x0030
            const address = control.registers.PC & 0xFFFF;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0030;
            });
        };
        ops[0xF8] = control => { // LD HL, SP+r8 - Carrega o SP mais o valor de 8 bits em HL
            let immediate = 0;

            control.sequencer.mcycle(() => {
                immediate = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const sp = control.registers.SP;
                const signed = (immediate << 24) >> 24; // Converte para signed 32 bits

                control.flags.Z = 0;
                control.flags.N = 0;
                control.flags.H = ((sp & 0x0F) + (signed & 0x0F)) > 0x0F ? 1 : 0;
                control.flags.C = ((sp & 0xFF) + (signed & 0xFF)) > 0xFF ? 1 : 0;
                control.registers.HL = (sp + signed) & 0xFFFF;
            });
        };
        ops[0xF9] = control => { // LD SP, HL - Carrega o valor de HL no SP
            control.sequencer.mcycle(() => {
                control.registers.SP = control.registers.HL;
            });
        };
        ops[0xFA] = control => { // LD A, (a16) - Carrega o valor no endereço de 16 bits no A
            let low = 0;
            let high = 0;

            control.sequencer.mcycle(() => {
                low = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                high = control.fetchByte();
            });

            control.sequencer.mcycle(() => {
                const address = ((high << 8) | low) & 0xFFFF;
                control.registers.A = control.bus.readByte(address);
            });
        };
        ops[0xFB] = control => { // EI - Habilita as interrupções
            control.eiDelay = 1;
        };
        ops[0xFC] = () => { // Não implementado
            console.error('Unimplemented instruction: FC');
        };
        ops[0xFD] = () => { // Não implementado
            console.error('Unimplemented instruction: FD');
        };
        ops[0xFE] = control => { // CP d8 - Compara o A com o valor de 8 bits
            control.sequencer.mcycle(() => {
                control.ALU.SUB(control.registers.A, control.fetchByte());
            });
        };
        ops[0xFF] = control => { // RST 38H - Chama a sub-rotina no endereço 0x0038
            const address = control.registers.PC;

            control.sequencer.mcycle(() => {});

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, (address >> 8) & 0xFF);
            });

            control.sequencer.mcycle(() => {
                control.registers.SP = (control.registers.SP - 1) & 0xFFFF;
                control.bus.writeByte(control.registers.SP, address & 0xFF);
                control.registers.PC = 0x0038;
            });
        };
    }

    initializeCBOpcodes() {
        const ops = this.cbOpcodes;

        ops[0x00] = control => { // RLC B - Rotaciona o B para a esquerda
            control.registers.B = control.ALU.RLC(control.registers.B);
        };
        ops[0x01] = control => { // RLC C - Rotaciona o C para a esquerda
            control.registers.C = control.ALU.RLC(control.registers.C);
        };
        ops[0x02] = control => { // RLC D - Rotaciona o D para a esquerda
            control.registers.D = control.ALU.RLC(control.registers.D);
        };
        ops[0x03] = control => { // RLC E - Rotaciona o E para a esquerda
            control.registers.E = control.ALU.RLC(control.registers.E);
        };
        ops[0x04] = control => { // RLC H - Rotaciona o H para a esquerda
            control.registers.H = control.ALU.RLC(control.registers.H);
        };
        ops[0x05] = control => { // RLC L - Rotaciona o L para a esquerda
            control.registers.L = control.ALU.RLC(control.registers.L);
        };
        ops[0x06] = control => { // RLC (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.RLC(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x07] = control => { // RLC A - Rotaciona o A para a esquerda
            control.registers.A = control.ALU.RLC(control.registers.A);
        };
        ops[0x08] = control => { // RRC B - Rotaciona o B para a direita
            control.registers.B = control.ALU.RRC(control.registers.B);
        };
        ops[0x09] = control => { // RRC C - Rotaciona o C para a direita
            control.registers.C = control.ALU.RRC(control.registers.C);
        };
        ops[0x0A] = control => { // RRC D - Rotaciona o D para a direita
            control.registers.D = control.ALU.RRC(control.registers.D);
        };
        ops[0x0B] = control => { // RRC E - Rotaciona o E para a direita
            control.registers.E = control.ALU.RRC(control.registers.E);
        };
        ops[0x0C] = control => { // RRC H - Rotaciona o H para a direita
            control.registers.H = control.ALU.RRC(control.registers.H);
        };
        ops[0x0D] = control => { // RRC L - Rotaciona o L para a direita
            control.registers.L = control.ALU.RRC(control.registers.L);
        };
        ops[0x0E] = control => { // RRC (HL) - Rotaciona o valor no endereço apontado por HL para a direita
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.RRC(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x0F] = control => { // RRC A - Rotaciona o A para a direita
            control.registers.A = control.ALU.RRC(control.registers.A);
        };
        ops[0x10] = control => { // RL B - Rotaciona o B para a esquerda através do carry
            control.registers.B = control.ALU.RL(control.registers.B);
        };
        ops[0x11] = control => { // RL C - Rotaciona o C para a esquerda através do carry
            control.registers.C = control.ALU.RL(control.registers.C);
        };
        ops[0x12] = control => { // RL D - Rotaciona o D para a esquerda através do carry
            control.registers.D = control.ALU.RL(control.registers.D);
        };
        ops[0x13] = control => { // RL E - Rotaciona o E para a esquerda através do carry
            control.registers.E = control.ALU.RL(control.registers.E);
        };
        ops[0x14] = control => { // RL H - Rotaciona o H para a esquerda através do carry
            control.registers.H = control.ALU.RL(control.registers.H);
        };
        ops[0x15] = control => { // RL L - Rotaciona o L para a esquerda através do carry
            control.registers.L = control.ALU.RL(control.registers.L);
        };
        ops[0x16] = control => { // RL (HL) - Rotaciona o valor no endereço apontado por HL para a esquerda através do carry
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.RL(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x17] = control => { // RL A - Rotaciona o A para a esquerda através do carry
            control.registers.A = control.ALU.RL(control.registers.A);
        };
        ops[0x18] = control => { // RR B - Rotaciona o B para a direita através do carry
            control.registers.B = control.ALU.RR(control.registers.B);
        };
        ops[0x19] = control => { // RR C - Rotaciona o C para a direita através do carry
            control.registers.C = control.ALU.RR(control.registers.C);
        };
        ops[0x1A] = control => { // RR D - Rotaciona o D para a direita através do carry
            control.registers.D = control.ALU.RR(control.registers.D);
        };
        ops[0x1B] = control => { // RR E - Rotaciona o E para a direita através do carry
            control.registers.E = control.ALU.RR(control.registers.E);
        };
        ops[0x1C] = control => { // RR H - Rotaciona o H para a direita através do carry
            control.registers.H = control.ALU.RR(control.registers.H);
        };
        ops[0x1D] = control => { // RR L - Rotaciona o L para a direita através do carry
            control.registers.L = control.ALU.RR(control.registers.L);
        };
        ops[0x1E] = control => { // RR (HL) - Rotaciona o valor no endereço apontado por HL para a direita através do carry
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.RR(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x1F] = control => { // RR A - Rotaciona o A para a direita através do carry
            control.registers.A = control.ALU.RR(control.registers.A);
        };
        ops[0x20] = control => { // SLA B - Shift left arithmetic no B
            control.registers.B = control.ALU.SLA(control.registers.B);
        };
        ops[0x21] = control => { // SLA C - Shift left arithmetic no C
            control.registers.C = control.ALU.SLA(control.registers.C);
        };
        ops[0x22] = control => { // SLA D - Shift left arithmetic no D
            control.registers.D = control.ALU.SLA(control.registers.D);
        };
        ops[0x23] = control => { // SLA E - Shift left arithmetic no E
            control.registers.E = control.ALU.SLA(control.registers.E);
        };
        ops[0x24] = control => { // SLA H - Shift left arithmetic no H
            control.registers.H = control.ALU.SLA(control.registers.H);
        };
        ops[0x25] = control => { // SLA L - Shift left arithmetic no L
            control.registers.L = control.ALU.SLA(control.registers.L);
        };
        ops[0x26] = control => { // SLA (HL) - Shift left arithmetic no valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.SLA(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x27] = control => { // SLA A - Shift left arithmetic no A
            control.registers.A = control.ALU.SLA(control.registers.A);
        };
        ops[0x28] = control => { // SRA B - Shift right arithmetic no B
            control.registers.B = control.ALU.SRA(control.registers.B);
        };
        ops[0x29] = control => { // SRA C - Shift right arithmetic no C
            control.registers.C = control.ALU.SRA(control.registers.C);
        };
        ops[0x2A] = control => { // SRA D - Shift right arithmetic no D
            control.registers.D = control.ALU.SRA(control.registers.D);
        };
        ops[0x2B] = control => { // SRA E - Shift right arithmetic no E
            control.registers.E = control.ALU.SRA(control.registers.E);
        };
        ops[0x2C] = control => { // SRA H - Shift right arithmetic no H
            control.registers.H = control.ALU.SRA(control.registers.H);
        };
        ops[0x2D] = control => { // SRA L - Shift right arithmetic no L
            control.registers.L = control.ALU.SRA(control.registers.L);
        };
        ops[0x2E] = control => { // SRA (HL) - Shift right arithmetic no valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.SRA(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x2F] = control => { // SRA A - Shift right arithmetic no A
            control.registers.A = control.ALU.SRA(control.registers.A);
        };
        ops[0x30] = control => { // SWAP B - Troca os nibbles alto e baixo do B
            control.registers.B = control.ALU.SWAP(control.registers.B);
        };
        ops[0x31] = control => { // SWAP C - Troca os nibbles alto e baixo do C
            control.registers.C = control.ALU.SWAP(control.registers.C);
        };
        ops[0x32] = control => { // SWAP D - Troca os nibbles alto e baixo do D
            control.registers.D = control.ALU.SWAP(control.registers.D);
        };
        ops[0x33] = control => { // SWAP E - Troca os nibbles alto e baixo do E
            control.registers.E = control.ALU.SWAP(control.registers.E);
        };
        ops[0x34] = control => { // SWAP H - Troca os nibbles alto e baixo do H
            control.registers.H = control.ALU.SWAP(control.registers.H);
        };
        ops[0x35] = control => { // SWAP L - Troca os nibbles alto e baixo do L
            control.registers.L = control.ALU.SWAP(control.registers.L);
        };
        ops[0x36] = control => { // SWAP (HL) - Troca os nibbles alto e baixo do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.SWAP(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x37] = control => { // SWAP A - Troca os nibbles alto e baixo do A
            control.registers.A = control.ALU.SWAP(control.registers.A);
        };
        ops[0x38] = control => { // SRL B - Shift right lógico no B
            control.registers.B = control.ALU.SRL(control.registers.B);
        };
        ops[0x39] = control => { // SRL C - Shift right lógico no C
            control.registers.C = control.ALU.SRL(control.registers.C);
        };
        ops[0x3A] = control => { // SRL D - Shift right lógico no D
            control.registers.D = control.ALU.SRL(control.registers.D);
        };
        ops[0x3B] = control => { // SRL E - Shift right lógico no E
            control.registers.E = control.ALU.SRL(control.registers.E);
        };
        ops[0x3C] = control => { // SRL H - Shift right lógico no H
            control.registers.H = control.ALU.SRL(control.registers.H);
        };
        ops[0x3D] = control => { // SRL L - Shift right lógico no L
            control.registers.L = control.ALU.SRL(control.registers.L);
        };
        ops[0x3E] = control => { // SRL (HL) - Shift right lógico no valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(control.registers.HL);
            });

            control.sequencer.mcycle(() => {
                const result = control.ALU.SRL(value);
                control.bus.writeByte(address, result);
            });
        };
        ops[0x3F] = control => { // SRL A - Shift right lógico no A
            control.registers.A = control.ALU.SRL(control.registers.A);
        };
        ops[0x40] = control => { // BIT 0, B - Testa o bit 0 do B
            control.ALU.BIT(0, control.registers.B);
        };
        ops[0x41] = control => { // BIT 0, C - Testa o bit 0 do C
            control.ALU.BIT(0, control.registers.C);
        };
        ops[0x42] = control => { // BIT 0, D - Testa o bit 0 do D
            control.ALU.BIT(0, control.registers.D);
        };
        ops[0x43] = control => { // BIT 0, E - Testa o bit 0 do E
            control.ALU.BIT(0, control.registers.E);
        };
        ops[0x44] = control => { // BIT 0, H - Testa o bit 0 do H
            control.ALU.BIT(0, control.registers.H);
        };
        ops[0x45] = control => { // BIT 0, L - Testa o bit 0 do L
            control.ALU.BIT(0, control.registers.L);
        };
        ops[0x46] = control => { // BIT 0, (HL) - Testa o bit 0 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(0, value);
            });
        };
        ops[0x47] = control => { // BIT 0, A - Testa o bit 0 do A
            control.ALU.BIT(0, control.registers.A);
        };
        ops[0x48] = control => { // BIT 1, B - Testa o bit 1 do B
            control.ALU.BIT(1, control.registers.B);
        };
        ops[0x49] = control => { // BIT 1, C - Testa o bit 1 do C
            control.ALU.BIT(1, control.registers.C);
        };
        ops[0x4A] = control => { // BIT 1, D - Testa o bit 1 do D
            control.ALU.BIT(1, control.registers.D);
        };
        ops[0x4B] = control => { // BIT 1, E - Testa o bit 1 do E
            control.ALU.BIT(1, control.registers.E);
        };
        ops[0x4C] = control => { // BIT 1, H - Testa o bit 1 do H
            control.ALU.BIT(1, control.registers.H);
        };
        ops[0x4D] = control => { // BIT 1, L - Testa o bit 1 do L
            control.ALU.BIT(1, control.registers.L);
        };
        ops[0x4E] = control => { // BIT 1, (HL) - Testa o bit 1 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(1, value);
            });
        };
        ops[0x4F] = control => { // BIT 1, A - Testa o bit 1 do A
            control.ALU.BIT(1, control.registers.A);
        };
        ops[0x50] = control => { // BIT 2, B - Testa o bit 2 do B
            control.ALU.BIT(2, control.registers.B);
        };
        ops[0x51] = control => { // BIT 2, C - Testa o bit 2 do C
            control.ALU.BIT(2, control.registers.C);
        };
        ops[0x52] = control => { // BIT 2, D - Testa o bit 2 do D
            control.ALU.BIT(2, control.registers.D);
        };
        ops[0x53] = control => { // BIT 2, E - Testa o bit 2 do E
            control.ALU.BIT(2, control.registers.E);
        };
        ops[0x54] = control => { // BIT 2, H - Testa o bit 2 do H
            control.ALU.BIT(2, control.registers.H);
        };
        ops[0x55] = control => { // BIT 2, L - Testa o bit 2 do L
            control.ALU.BIT(2, control.registers.L);
        };
        ops[0x56] = control => { // BIT 2, (HL) - Testa o bit 2 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(2, value);
            });
        };
        ops[0x57] = control => { // BIT 2, A - Testa o bit 2 do A
            control.ALU.BIT(2, control.registers.A);
        };
        ops[0x58] = control => { // BIT 3, B - Testa o bit 3 do B
            control.ALU.BIT(3, control.registers.B);
        };
        ops[0x59] = control => { // BIT 3, C - Testa o bit 3 do C
            control.ALU.BIT(3, control.registers.C);
        };
        ops[0x5A] = control => { // BIT 3, D - Testa o bit 3 do D
            control.ALU.BIT(3, control.registers.D);
        };
        ops[0x5B] = control => { // BIT 3, E - Testa o bit 3 do E
            control.ALU.BIT(3, control.registers.E);
        };
        ops[0x5C] = control => { // BIT 3, H - Testa o bit 3 do H
            control.ALU.BIT(3, control.registers.H);
        };
        ops[0x5D] = control => { // BIT 3, L - Testa o bit 3 do L
            control.ALU.BIT(3, control.registers.L);
        };
        ops[0x5E] = control => { // BIT 3, (HL) - Testa o bit 3 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(3, value);
            });
        };
        ops[0x5F] = control => { // BIT 3, A - Testa o bit 3 do A
            control.ALU.BIT(3, control.registers.A);
        };
        ops[0x60] = control => { // BIT 4, B - Testa o bit 4 do B
            control.ALU.BIT(4, control.registers.B);
        };
        ops[0x61] = control => { // BIT 4, C - Testa o bit 4 do C
            control.ALU.BIT(4, control.registers.C);
        };
        ops[0x62] = control => { // BIT 4, D - Testa o bit 4 do D
            control.ALU.BIT(4, control.registers.D);
        };
        ops[0x63] = control => { // BIT 4, E - Testa o bit 4 do E
            control.ALU.BIT(4, control.registers.E);
        };
        ops[0x64] = control => { // BIT 4, H - Testa o bit 4 do H
            control.ALU.BIT(4, control.registers.H);
        };
        ops[0x65] = control => { // BIT 4, L - Testa o bit 4 do L
            control.ALU.BIT(4, control.registers.L);
        };
        ops[0x66] = control => { // BIT 4, (HL) - Testa o bit 4 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(4, value);
            });
        };
        ops[0x67] = control => { // BIT 4, A - Testa o bit 4 do A
            control.ALU.BIT(4, control.registers.A);
        };
        ops[0x68] = control => { // BIT 5, B - Testa o bit 5 do B
            control.ALU.BIT(5, control.registers.B);
        };
        ops[0x69] = control => { // BIT 5, C - Testa o bit 5 do C
            control.ALU.BIT(5, control.registers.C);
        };
        ops[0x6A] = control => { // BIT 5, D - Testa o bit 5 do D
            control.ALU.BIT(5, control.registers.D);
        };
        ops[0x6B] = control => { // BIT 5, E - Testa o bit 5 do E
            control.ALU.BIT(5, control.registers.E);
        };
        ops[0x6C] = control => { // BIT 5, H - Testa o bit 5 do H
            control.ALU.BIT(5, control.registers.H);
        };
        ops[0x6D] = control => { // BIT 5, L - Testa o bit 5 do L
            control.ALU.BIT(5, control.registers.L);
        };
        ops[0x6E] = control => { // BIT 5, (HL) - Testa o bit 5 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(5, value);
            });
        };
        ops[0x6F] = control => { // BIT 5, A - Testa o bit 5 do A
            control.ALU.BIT(5, control.registers.A);
        };
        ops[0x70] = control => { // BIT 6, B - Testa o bit 6 do B
            control.ALU.BIT(6, control.registers.B);
        };
        ops[0x71] = control => { // BIT 6, C - Testa o bit 6 do C
            control.ALU.BIT(6, control.registers.C);
        };
        ops[0x72] = control => { // BIT 6, D - Testa o bit 6 do D
            control.ALU.BIT(6, control.registers.D);
        };
        ops[0x73] = control => { // BIT 6, E - Testa o bit 6 do E
            control.ALU.BIT(6, control.registers.E);
        };
        ops[0x74] = control => { // BIT 6, H - Testa o bit 6 do H
            control.ALU.BIT(6, control.registers.H);
        };
        ops[0x75] = control => { // BIT 6, L - Testa o bit 6 do L
            control.ALU.BIT(6, control.registers.L);
        };
        ops[0x76] = control => { // BIT 6, (HL) - Testa o bit 6 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(6, value);
            });
        };
        ops[0x77] = control => { // BIT 6, A - Testa o bit 6 do A
            control.ALU.BIT(6, control.registers.A);
        };
        ops[0x78] = control => { // BIT 7, B - Testa o bit 7 do B
            control.ALU.BIT(7, control.registers.B);
        };
        ops[0x79] = control => { // BIT 7, C - Testa o bit 7 do C
            control.ALU.BIT(7, control.registers.C);
        };
        ops[0x7A] = control => { // BIT 7, D - Testa o bit 7 do D
            control.ALU.BIT(7, control.registers.D);
        };
        ops[0x7B] = control => { // BIT 7, E - Testa o bit 7 do E
            control.ALU.BIT(7, control.registers.E);
        };
        ops[0x7C] = control => { // BIT 7, H - Testa o bit 7 do H
            control.ALU.BIT(7, control.registers.H);
        };
        ops[0x7D] = control => { // BIT 7, L - Testa o bit 7 do L
            control.ALU.BIT(7, control.registers.L);
        };
        ops[0x7E] = control => { // BIT 7, (HL) - Testa o bit 7 do valor apontado por HL
            control.sequencer.mcycle(() => {
                const value = control.bus.readByte(control.registers.HL);
                control.ALU.BIT(7, value);
            });
        };
        ops[0x7F] = control => { // BIT 7, A - Testa o bit 7 do A
            control.ALU.BIT(7, control.registers.A);
        };
        ops[0x80] = control => { // RES 0, B - Reseta o bit 0 do B
            control.registers.B = control.ALU.RES(0, control.registers.B);
        };
        ops[0x81] = control => { // RES 0, C - Reseta o bit 0 do C
            control.registers.C = control.ALU.RES(0, control.registers.C);
        };
        ops[0x82] = control => { // RES 0, D - Reseta o bit 0 do D
            control.registers.D = control.ALU.RES(0, control.registers.D);
        };
        ops[0x83] = control => { // RES 0, E - Reseta o bit 0 do E
            control.registers.E = control.ALU.RES(0, control.registers.E);
        };
        ops[0x84] = control => { // RES 0, H - Reseta o bit 0 do H
            control.registers.H = control.ALU.RES(0, control.registers.H);
        };
        ops[0x85] = control => { // RES 0, L - Reseta o bit 0 do L
            control.registers.L = control.ALU.RES(0, control.registers.L);
        };
        ops[0x86] = control => { // RES 0, (HL) - Reseta o bit 0 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(0, value));
            });
        };
        ops[0x87] = control => { // RES 0, A - Reseta o bit 0 do A
            control.registers.A = control.ALU.RES(0, control.registers.A);
        };
        ops[0x88] = control => { // RES 1, B - Reseta o bit 1 do B
            control.registers.B = control.ALU.RES(1, control.registers.B);
        };
        ops[0x89] = control => { // RES 1, C - Reseta o bit 1 do C
            control.registers.C = control.ALU.RES(1, control.registers.C);
        };
        ops[0x8A] = control => { // RES 1, D - Reseta o bit 1 do D
            control.registers.D = control.ALU.RES(1, control.registers.D);
        };
        ops[0x8B] = control => { // RES 1, E - Reseta o bit 1 do E
            control.registers.E = control.ALU.RES(1, control.registers.E);
        };
        ops[0x8C] = control => { // RES 1, H - Reseta o bit 1 do H
            control.registers.H = control.ALU.RES(1, control.registers.H);
        };
        ops[0x8D] = control => { // RES 1, L - Reseta o bit 1 do L
            control.registers.L = control.ALU.RES(1, control.registers.L);
        };
        ops[0x8E] = control => { // RES 1, (HL) - Reseta o bit 1 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(1, value));
            });
        };
        ops[0x8F] = control => { // RES 1, A - Reseta o bit 1 do A
            control.registers.A = control.ALU.RES(1, control.registers.A);
        };
        ops[0x90] = control => { // RES 2, B - Reseta o bit 2 do B
            control.registers.B = control.ALU.RES(2, control.registers.B);
        };
        ops[0x91] = control => { // RES 2, C - Reseta o bit 2 do C
            control.registers.C = control.ALU.RES(2, control.registers.C);
        };
        ops[0x92] = control => { // RES 2, D - Reseta o bit 2 do D
            control.registers.D = control.ALU.RES(2, control.registers.D);
        };
        ops[0x93] = control => { // RES 2, E - Reseta o bit 2 do E
            control.registers.E = control.ALU.RES(2, control.registers.E);
        };
        ops[0x94] = control => { // RES 2, H - Reseta o bit 2 do H
            control.registers.H = control.ALU.RES(2, control.registers.H);
        };
        ops[0x95] = control => { // RES 2, L - Reseta o bit 2 do L
            control.registers.L = control.ALU.RES(2, control.registers.L);
        };
        ops[0x96] = control => { // RES 2, (HL) - Reseta o bit 2 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(2, value));
            });
        };
        ops[0x97] = control => { // RES 2, A - Reseta o bit 2 do A
            control.registers.A = control.ALU.RES(2, control.registers.A);
        };
        ops[0x98] = control => { // RES 3, B - Reseta o bit 3 do B
            control.registers.B = control.ALU.RES(3, control.registers.B);
        };
        ops[0x99] = control => { // RES 3, C - Reseta o bit 3 do C
            control.registers.C = control.ALU.RES(3, control.registers.C);
        };
        ops[0x9A] = control => { // RES 3, D - Reseta o bit 3 do D
            control.registers.D = control.ALU.RES(3, control.registers.D);
        };
        ops[0x9B] = control => { // RES 3, E - Reseta o bit 3 do E
            control.registers.E = control.ALU.RES(3, control.registers.E);
        };
        ops[0x9C] = control => { // RES 3, H - Reseta o bit 3 do H
            control.registers.H = control.ALU.RES(3, control.registers.H);
        };
        ops[0x9D] = control => { // RES 3, L - Reseta o bit 3 do L
            control.registers.L = control.ALU.RES(3, control.registers.L);
        };
        ops[0x9E] = control => { // RES 3, (HL) - Reseta o bit 3 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(3, value));
            });
        };
        ops[0x9F] = control => { // RES 3, A - Reseta o bit 3 do A
            control.registers.A = control.ALU.RES(3, control.registers.A);
        };
        ops[0xA0] = control => { // RES 4, B - Reseta o bit 4 do B
            control.registers.B = control.ALU.RES(4, control.registers.B);
        };
        ops[0xA1] = control => { // RES 4, C - Reseta o bit 4 do C
            control.registers.C = control.ALU.RES(4, control.registers.C);
        };
        ops[0xA2] = control => { // RES 4, D - Reseta o bit 4 do D
            control.registers.D = control.ALU.RES(4, control.registers.D);
        };
        ops[0xA3] = control => { // RES 4, E - Reseta o bit 4 do E
            control.registers.E = control.ALU.RES(4, control.registers.E);
        };
        ops[0xA4] = control => { // RES 4, H - Reseta o bit 4 do H
            control.registers.H = control.ALU.RES(4, control.registers.H);
        };
        ops[0xA5] = control => { // RES 4, L - Reseta o bit 4 do L
            control.registers.L = control.ALU.RES(4, control.registers.L);
        };
        ops[0xA6] = control => { // RES 4, (HL) - Reseta o bit 4 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(4, value));
            });
        };
        ops[0xA7] = control => { // RES 4, A - Reseta o bit 4 do A
            control.registers.A = control.ALU.RES(4, control.registers.A);
        };
        ops[0xA8] = control => { // RES 5, B - Reseta o bit 5 do B
            control.registers.B = control.ALU.RES(5, control.registers.B);
        };
        ops[0xA9] = control => { // RES 5, C - Reseta o bit 5 do C
            control.registers.C = control.ALU.RES(5, control.registers.C);
        };
        ops[0xAA] = control => { // RES 5, D - Reseta o bit 5 do D
            control.registers.D = control.ALU.RES(5, control.registers.D);
        };
        ops[0xAB] = control => { // RES 5, E - Reseta o bit 5 do E
            control.registers.E = control.ALU.RES(5, control.registers.E);
        };
        ops[0xAC] = control => { // RES 5, H - Reseta o bit 5 do H
            control.registers.H = control.ALU.RES(5, control.registers.H);
        };
        ops[0xAD] = control => { // RES 5, L - Reseta o bit 5 do L
            control.registers.L = control.ALU.RES(5, control.registers.L);
        };
        ops[0xAE] = control => { // RES 5, (HL) - Reseta o bit 5 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(5, value));
            });
        };
        ops[0xAF] = control => { // RES 5, A - Reseta o bit 5 do A
            control.registers.A = control.ALU.RES(5, control.registers.A);
        };
        ops[0xB0] = control => { // RES 6, B - Reseta o bit 6 do B
            control.registers.B = control.ALU.RES(6, control.registers.B);
        };
        ops[0xB1] = control => { // RES 6, C - Reseta o bit 6 do C
            control.registers.C = control.ALU.RES(6, control.registers.C);
        };
        ops[0xB2] = control => { // RES 6, D - Reseta o bit 6 do D
            control.registers.D = control.ALU.RES(6, control.registers.D);
        };
        ops[0xB3] = control => { // RES 6, E - Reseta o bit 6 do E
            control.registers.E = control.ALU.RES(6, control.registers.E);
        };
        ops[0xB4] = control => { // RES 6, H - Reseta o bit 6 do H
            control.registers.H = control.ALU.RES(6, control.registers.H);
        };
        ops[0xB5] = control => { // RES 6, L - Reseta o bit 6 do L
            control.registers.L = control.ALU.RES(6, control.registers.L);
        };
        ops[0xB6] = control => { // RES 6, (HL) - Reseta o bit 6 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(6, value));
            });
        };
        ops[0xB7] = control => { // RES 6, A - Reseta o bit 6 do A
            control.registers.A = control.ALU.RES(6, control.registers.A);
        };
        ops[0xB8] = control => { // RES 7, B - Reseta o bit 7 do B
            control.registers.B = control.ALU.RES(7, control.registers.B);
        };
        ops[0xB9] = control => { // RES 7, C - Reseta o bit 7 do C
            control.registers.C = control.ALU.RES(7, control.registers.C);
        };
        ops[0xBA] = control => { // RES 7, D - Reseta o bit 7 do D
            control.registers.D = control.ALU.RES(7, control.registers.D);
        };
        ops[0xBB] = control => { // RES 7, E - Reseta o bit 7 do E
            control.registers.E = control.ALU.RES(7, control.registers.E);
        };
        ops[0xBC] = control => { // RES 7, H - Reseta o bit 7 do H
            control.registers.H = control.ALU.RES(7, control.registers.H);
        };
        ops[0xBD] = control => { // RES 7, L - Reseta o bit 7 do L
            control.registers.L = control.ALU.RES(7, control.registers.L);
        };
        ops[0xBE] = control => { // RES 7, (HL) - Reseta o bit 7 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.RES(7, value));
            });
        };
        ops[0xBF] = control => { // RES 7, A - Reseta o bit 7 do A
            control.registers.A = control.ALU.RES(7, control.registers.A);
        };
        ops[0xC0] = control => { // SET 0, B - Seta o bit 0 do B
            control.registers.B = control.ALU.SET(0, control.registers.B);
        };
        ops[0xC1] = control => { // SET 0, C - Seta o bit 0 do C
            control.registers.C = control.ALU.SET(0, control.registers.C);
        };
        ops[0xC2] = control => { // SET 0, D - Seta o bit 0 do D
            control.registers.D = control.ALU.SET(0, control.registers.D);
        };
        ops[0xC3] = control => { // SET 0, E - Seta o bit 0 do E
            control.registers.E = control.ALU.SET(0, control.registers.E);
        };
        ops[0xC4] = control => { // SET 0, H - Seta o bit 0 do H
            control.registers.H = control.ALU.SET(0, control.registers.H);
        };
        ops[0xC5] = control => { // SET 0, L - Seta o bit 0 do L
            control.registers.L = control.ALU.SET(0, control.registers.L);
        };
        ops[0xC6] = control => { // SET 0, (HL) - Seta o bit 0 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(0, value));
            });
        };
        ops[0xC7] = control => { // SET 0, A - Seta o bit 0 do A
            control.registers.A = control.ALU.SET(0, control.registers.A);
        };
        ops[0xC8] = control => { // SET 1, B - Seta o bit 1 do B
            control.registers.B = control.ALU.SET(1, control.registers.B);
        };
        ops[0xC9] = control => { // SET 1, C - Seta o bit 1 do C
            control.registers.C = control.ALU.SET(1, control.registers.C);
        };
        ops[0xCA] = control => { // SET 1, D - Seta o bit 1 do D
            control.registers.D = control.ALU.SET(1, control.registers.D);
        };
        ops[0xCB] = control => { // SET 1, E - Seta o bit 1 do E
            control.registers.E = control.ALU.SET(1, control.registers.E);
        };
        ops[0xCC] = control => { // SET 1, H - Seta o bit 1 do H
            control.registers.H = control.ALU.SET(1, control.registers.H);
        };
        ops[0xCD] = control => { // SET 1, L - Seta o bit 1 do L
            control.registers.L = control.ALU.SET(1, control.registers.L);
        };
        ops[0xCE] = control => { // SET 1, (HL) - Seta o bit 1 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(1, value));
            });
        };
        ops[0xCF] = control => { // SET 1, A - Seta o bit 1 do A
            control.registers.A = control.ALU.SET(1, control.registers.A);
        };
        ops[0xD0] = control => { // SET 2, B - Seta o bit 2 do B
            control.registers.B = control.ALU.SET(2, control.registers.B);
        };
        ops[0xD1] = control => { // SET 2, C - Seta o bit 2 do C
            control.registers.C = control.ALU.SET(2, control.registers.C);
        };
        ops[0xD2] = control => { // SET 2, D - Seta o bit 2 do D
            control.registers.D = control.ALU.SET(2, control.registers.D);
        };
        ops[0xD3] = control => { // SET 2, E - Seta o bit 2 do E
            control.registers.E = control.ALU.SET(2, control.registers.E);
        };
        ops[0xD4] = control => { // SET 2, H - Seta o bit 2 do H
            control.registers.H = control.ALU.SET(2, control.registers.H);
        };
        ops[0xD5] = control => { // SET 2, L - Seta o bit 2 do L
            control.registers.L = control.ALU.SET(2, control.registers.L);
        };
        ops[0xD6] = control => { // SET 2, (HL) - Seta o bit 2 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(2, value));
            });
        };
        ops[0xD7] = control => { // SET 2, A - Seta o bit 2 do A
            control.registers.A = control.ALU.SET(2, control.registers.A);
        };
        ops[0xD8] = control => { // SET 3, B - Seta o bit 3 do B
            control.registers.B = control.ALU.SET(3, control.registers.B);
        };
        ops[0xD9] = control => { // SET 3, C - Seta o bit 3 do C
            control.registers.C = control.ALU.SET(3, control.registers.C);
        };
        ops[0xDA] = control => { // SET 3, D - Seta o bit 3 do D
            control.registers.D = control.ALU.SET(3, control.registers.D);
        };
        ops[0xDB] = control => { // SET 3, E - Seta o bit 3 do E
            control.registers.E = control.ALU.SET(3, control.registers.E);
        };
        ops[0xDC] = control => { // SET 3, H - Seta o bit 3 do H
            control.registers.H = control.ALU.SET(3, control.registers.H);
        };
        ops[0xDD] = control => { // SET 3, L - Seta o bit 3 do L
            control.registers.L = control.ALU.SET(3, control.registers.L);
        };
        ops[0xDE] = control => { // SET 3, (HL) - Seta o bit 3 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(3, value));
            });
        };
        ops[0xDF] = control => { // SET 3, A - Seta o bit 3 do A
            control.registers.A = control.ALU.SET(3, control.registers.A);
        };
        ops[0xE0] = control => { // SET 4, B - Seta o bit 4 do B
            control.registers.B = control.ALU.SET(4, control.registers.B);
        };
        ops[0xE1] = control => { // SET 4, C - Seta o bit 4 do C
            control.registers.C = control.ALU.SET(4, control.registers.C);
        };
        ops[0xE2] = control => { // SET 4, D - Seta o bit 4 do D
            control.registers.D = control.ALU.SET(4, control.registers.D);
        };
        ops[0xE3] = control => { // SET 4, E - Seta o bit 4 do E
            control.registers.E = control.ALU.SET(4, control.registers.E);
        };
        ops[0xE4] = control => { // SET 4, H - Seta o bit 4 do H
            control.registers.H = control.ALU.SET(4, control.registers.H);
        };
        ops[0xE5] = control => { // SET 4, L - Seta o bit 4 do L
            control.registers.L = control.ALU.SET(4, control.registers.L);
        };
        ops[0xE6] = control => { // SET 4, (HL) - Seta o bit 4 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(4, value));
            });
        };
        ops[0xE7] = control => { // SET 4, A - Seta o bit 4 do A
            control.registers.A = control.ALU.SET(4, control.registers.A);
        };
        ops[0xE8] = control => { // SET 5, B - Seta o bit 5 do B
            control.registers.B = control.ALU.SET(5, control.registers.B);
        };
        ops[0xE9] = control => { // SET 5, C - Seta o bit 5 do C
            control.registers.C = control.ALU.SET(5, control.registers.C);
        };
        ops[0xEA] = control => { // SET 5, D - Seta o bit 5 do D
            control.registers.D = control.ALU.SET(5, control.registers.D);
        };
        ops[0xEB] = control => { // SET 5, E - Seta o bit 5 do E
            control.registers.E = control.ALU.SET(5, control.registers.E);
        };
        ops[0xEC] = control => { // SET 5, H - Seta o bit 5 do H
            control.registers.H = control.ALU.SET(5, control.registers.H);
        };
        ops[0xED] = control => { // SET 5, L - Seta o bit 5 do L
            control.registers.L = control.ALU.SET(5, control.registers.L);
        };
        ops[0xEE] = control => { // SET 5, (HL) - Seta o bit 5 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(5, value));
            });
        };
        ops[0xEF] = control => { // SET 5, A - Seta o bit 5 do A
            control.registers.A = control.ALU.SET(5, control.registers.A);
        };
        ops[0xF0] = control => { // SET 6, B - Seta o bit 6 do B
            control.registers.B = control.ALU.SET(6, control.registers.B);
        };
        ops[0xF1] = control => { // SET 6, C - Seta o bit 6 do C
            control.registers.C = control.ALU.SET(6, control.registers.C);
        };
        ops[0xF2] = control => { // SET 6, D - Seta o bit 6 do D
            control.registers.D = control.ALU.SET(6, control.registers.D);
        };
        ops[0xF3] = control => { // SET 6, E - Seta o bit 6 do E
            control.registers.E = control.ALU.SET(6, control.registers.E);
        };
        ops[0xF4] = control => { // SET 6, H - Seta o bit 6 do H
            control.registers.H = control.ALU.SET(6, control.registers.H);
        };
        ops[0xF5] = control => { // SET 6, L - Seta o bit 6 do L
            control.registers.L = control.ALU.SET(6, control.registers.L);
        };
        ops[0xF6] = control => { // SET 6, (HL) - Seta o bit 6 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(6, value));
            });
        };
        ops[0xF7] = control => { // SET 6, A - Seta o bit 6 do A
            control.registers.A = control.ALU.SET(6, control.registers.A);
        };
        ops[0xF8] = control => { // SET 7, B - Seta o bit 7 do B
            control.registers.B = control.ALU.SET(7, control.registers.B);
        };
        ops[0xF9] = control => { // SET 7, C - Seta o bit 7 do C
            control.registers.C = control.ALU.SET(7, control.registers.C);
        };
        ops[0xFA] = control => { // SET 7, D - Seta o bit 7 do D
            control.registers.D = control.ALU.SET(7, control.registers.D);
        };
        ops[0xFB] = control => { // SET 7, E - Seta o bit 7 do E
            control.registers.E = control.ALU.SET(7, control.registers.E);
        };
        ops[0xFC] = control => { // SET 7, H - Seta o bit 7 do H
            control.registers.H = control.ALU.SET(7, control.registers.H);
        };
        ops[0xFD] = control => { // SET 7, L - Seta o bit 7 do L
            control.registers.L = control.ALU.SET(7, control.registers.L);
        };
        ops[0xFE] = control => { // SET 7, (HL) - Seta o bit 7 do valor apontado por HL
            const address = control.registers.HL;
            let value = 0;

            control.sequencer.mcycle(() => {
                value = control.bus.readByte(address);
            });

            control.sequencer.mcycle(() => {
                control.bus.writeByte(address, control.ALU.SET(7, value));
            });
        };
        ops[0xFF] = control => { // SET 7, A - Seta o bit 7 do A
            control.registers.A = control.ALU.SET(7, control.registers.A);
        };
    }
}