const uint8 = (value) => value & 0xFF;
const uint16 = (value) => value & 0xFFFF;
const bool = (value) => value ? 1 : 0;

// Unidade Lógica Aritmética (ALU - Arithmetic Logic Unit)
export default class ALU {
    constructor(flags) {
        this.flags = flags;
    }

    static uint8(value) {
        return value & 0xFF;
    }

    static uint16(value) {
        return value & 0xFFFF;
    }

    static bool(value) {
        return value ? 1 : 0;
    }

    ADD_8(a, b) { // soma A com B e carry opcional
        a = uint8(a);
        b = uint8(b);

        const result = uint8(a + b);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = bool(((a & 0x0F) + (b & 0x0F)) > 0x0F);
        this.flags.C = bool((a + b) > 0xFF);

        return result;
    }

    ADC_8(a, b, carry = 0) { // soma A com B e carry opcional
        a = uint8(a);
        b = uint8(b);
        carry = bool(carry);

        const result = uint8(a + b + carry);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = bool(((a & 0x0F) + (b & 0x0F) + carry) > 0x0F);
        this.flags.C = bool((a + b + carry) > 0xFF);

        return result;
    }

    SUB_8(a, b) { // subtrai B de A
        a = uint8(a);
        b = uint8(b);

        const result = uint8(a - b);

        this.flags.Z = bool(result === 0);
        this.flags.N = 1;
        this.flags.H = bool(((a & 0x0F) - (b & 0x0F)) < 0);
        this.flags.C = bool((a - b) < 0);

        return result;
    }

    SBC_8(a, b, carry = 0) { // subtrai B de A com carry opcional
        a = uint8(a);
        b = uint8(b);
        carry = bool(carry);

        const result = uint8(a - b - carry);

        this.flags.Z = bool(result === 0);
        this.flags.N = 1;
        this.flags.H = bool(((a & 0x0F) - (b & 0x0F) - carry) < 0);
        this.flags.C = bool((a - b - carry) < 0);

        return result;
    }

    AND_8(a, b) { // operação AND entre A e B
        a = uint8(a);
        b = uint8(b);

        const result = uint8(a & b);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 1;
        this.flags.C = 0;

        return result;
    }

    OR_8(a, b) { // operação OR entre A e B
        a = uint8(a);
        b = uint8(b);

        const result = uint8(a | b);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = 0;

        return result;
    }

    XOR_8(a, b) { // operação XOR entre A e B
        a = uint8(a);
        b = uint8(b);

        const result = uint8(a ^ b);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = 0;

        return result;
    }

    INC_8(a) { // incrementa A
        a = uint8(a);

        const result = uint8(a + 1);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = bool(((a & 0x0F) + 1) > 0x0F);

        return result;
    }

    DEC_8(a) { // decrementa A
        a = uint8(a);

        const result = uint8(a - 1);

        this.flags.Z = bool(result === 0);
        this.flags.N = 1;
        this.flags.H = bool(((a & 0x0F) - 1) < 0);

        return result;
    }

    ADD_16(a, b) { // soma A com B (16 bits)
        a = uint16(a);
        b = uint16(b);

        const result = uint16(a + b);

        this.flags.N = 0;
        this.flags.H = bool(((a & 0x0FFF) + (b & 0x0FFF)) > 0x0FFF);
        this.flags.C = bool((a + b) > 0xFFFF);

        return result;
    }

    INC_16(a) { // incrementa A (16 bits)
        return uint16((a & 0xFFFF) + 1);
    }

    DEC_16(a) { // decrementa A (16 bits)
        return uint16((a & 0xFFFF) - 1);
    }

    DAA(a) { // ajusta o valor de A para BCD (Binary-Coded Decimal)
        a = uint8(a & 0xFF);

        let adjustment = 0;
        let carry = this.flags.C;

        if (!this.flags.N) {
            if (this.flags.H || (a & 0x0F) > 0x09) {
                adjustment |= 0x06;
            }

            if (carry || a > 0x99) {
                adjustment |= 0x60;
                carry = 1;
            }

            a = uint8(a + adjustment);
        } else {
            if (this.flags.H) adjustment |= 0x06;
            if (carry) adjustment |= 0x60;

            a = uint8(a - adjustment);
        }

        this.flags.Z = bool(a === 0);
        this.flags.H = 0;
        this.flags.C = bool(carry);

        return a;
    }

    RLCA(a) { // rota à esquerda o valor de A
        const result = this.RLC(a);
        this.flags.Z = 0;
        return result;
    }

    RRCA(a) { // rota à direita o valor de A
        const result = this.RRC(a);
        this.flags.Z = 0;
        return result;
    }

    RLA(a) { // rota à esquerda o valor de A através do carry
        const result = this.RL(a);
        this.flags.Z = 0;
        return result;
    }

    RRA(a) { // rota à direita o valor de A através do carry
        const result = this.RR(a);
        this.flags.Z = 0;
        return result;
    }

    RLC(a) { // rota à esquerda o valor de A
        a = uint8(a);
        const carry = (a >>> 7) & 1;
        const result = uint8((a << 1) | carry);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carry;

        return result;
    }

    RRC(a) { // rota à direita o valor de A
        a = uint8(a);
        
        const carry = a & 1;
        const result = uint8((a >>> 1) | (carry << 7));

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carry;
        
        return result;
    }

    RL(a) { // rota à direita o valor de A através do carry
        a = uint8(a);

        const carryIn = this.flags.C & 1;
        const carryOut = (a >>> 7) & 1;
        const result = uint8((a << 1) | carryIn);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carryOut;

        return result;
    }

    RR(a) { // rota à direita o valor de A através do carry
        a = uint8(a);

        const carryIn = this.flags.C & 1;
        const carryOut = a & 1;
        const result = uint8((a >>> 1) | (carryIn << 7));

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carryOut;

        return result;
    }

    SLA(a) { // shift left aritmético
        a = uint8(a);

        const carryOut = (a >>> 7) & 1;
        const result = uint8(a << 1);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carryOut;

        return result;
    }

    SRA(a) { // shift right aritmético
        a = uint8(a);

        const carryOut = a & 1;
        const msb = a & 0x80; // mantém o bit mais significativo
        const result = uint8((a >>> 1) | msb);

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carryOut;

        return result;
    }

    SRL(a) { // shift right lógico
        a = uint8(a);

        const carryOut = a & 1;
        const result = uint8(a >>> 1);
        
        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = carryOut;

        return result;
    }

    SWAP(a) { // troca os nibbles alto e baixo de A
        a = uint8(a);

        const result = uint8((a >> 4) | ((a & 0x0F) << 4));

        this.flags.Z = bool(result === 0);
        this.flags.N = 0;
        this.flags.H = 0;
        this.flags.C = 0;

        return result;
    }

    BIT(bit, a) { // testa o bit n de A
        a = uint8(a);
        
        const bitSet = (a >> bit) & 1;

        this.flags.Z = bool(bitSet === 0);
        this.flags.N = 0;
        this.flags.H = 1;

        return a;
    }

    RES(bit, a) { // reseta o bit n de A
        return uint8(a & ~(1 << bit));
    }

    SET(bit, a) { // seta o bit n de A
        return uint8(a | (1 << bit));
    }

    ADD_SP_e8(SP, e8) { // soma um valor assinado de 8 bits ao SP
        SP = uint16(SP);

        const signed = (e8 << 24) >> 24; // sign extend
        const result = uint16(SP + signed);

        this.flags.Z = 0;
        this.flags.N = 0;
        this.flags.H = bool((SP & 0x0F) + (signed & 0x0F) > 0x0F);
        this.flags.C = bool((SP & 0xFF) + (signed & 0xFF) > 0xFF);

        return result;
    }
}