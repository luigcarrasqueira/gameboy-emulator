// Flags de status da CPU
export default class FlagsRegister {
    #Z = 0; // Zero Flag
    #N = 0; // Subtract Flag
    #H = 0; // Half Carry Flag
    #C = 0; // Carry Flag

    get Z() {
        return this.#Z;
    }

    set Z(value) {
        this.#Z = value & 1;
    }

    get N() {
        return this.#N;
    }

    set N(value) {
        this.#N = value & 1;
    }

    get H() {
        return this.#H;
    }

    set H(value) {
        this.#H = value & 1;
    }

    get C() {
        return this.#C;
    }
    
    set C(value) {
        this.#C = value & 1;
    }

    getF() {
        return (this.#Z << 7) | (this.#N << 6) | (this.#H << 5) | (this.#C << 4);
    }

    setF(value) {
        this.#Z = (value >> 7) & 1;
        this.#N = (value >> 6) & 1;
        this.#H = (value >> 5) & 1;
        this.#C = (value >> 4) & 1;
    }

    reset() {
        this.#Z = 0;
        this.#N = 0;
        this.#H = 0;
        this.#C = 0;
    }
}
