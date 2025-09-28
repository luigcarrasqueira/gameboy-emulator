// Memória Simples
export default class Memory {
    constructor(size, readOnly = false) {
        this.data = new Uint8Array(size);
        this.readOnly = readOnly;
    }

    readByte(address) {
        address &= 0xFFFF;
        return this.data[address % this.data.length];
    }

    writeByte(address, value) {
        if (!this.readOnly) {
            address &= 0xFFFF;
            value &= 0xFF;
            this.data[address % this.data.length] = value;
        }
    }

    loadBytes(bytes, offset = 0) {
        const max = Math.min(bytes.length, this.data.length - offset);
        this.data.set(bytes.subarray(0, max), offset);
    }
}