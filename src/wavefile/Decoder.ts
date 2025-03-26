export class Decoder {
    readString(data: ArrayBuffer, offset: number, length: number): string {
        const uint8Array = new Uint8Array(data, offset, length);
        return String.fromCharCode(...uint8Array);
    }

    readIntL(data: ArrayBuffer, offset: number, length: number): number {
        const view = new DataView(data);
        let value = 0;
        for (let i = 0; i < length; i++) {
            value += view.getUint8(offset + i) * Math.pow(2, 8 * i);
        }
        return value;
    }

    readChunkHeaderL(data: ArrayBuffer, offset: number): { name: string; length: number } {
        return {
            name: this.readString(data, offset, 4),
            length: this.readIntL(data, offset + 4, 4),
        };
    }

    readIntB(data: ArrayBuffer, offset: number, length: number): number {
        const view = new DataView(data);
        let value = 0;
        for (let i = 0; i < length; i++) {
            value += view.getUint8(offset + i) * Math.pow(2, 8 * (length - i - 1));
        }
        return value;
    }

    readChunkHeaderB(data: ArrayBuffer, offset: number): { name: string; length: number } {
        return {
            name: this.readString(data, offset, 4),
            length: this.readIntB(data, offset + 4, 4),
        };
    }

    readFloatB(data: ArrayBuffer, offset: number): number {
        const view = new DataView(data);
        let expon = view.getUint16(offset, false); // Big-endian
        const range = (1 << 16) - 1;

        if (expon >= range) {
            expon |= ~(range - 1);
        }

        let sign = 1;
        if (expon < 0) {
            sign = -1;
            expon += range;
        }

        const himant = view.getUint32(offset + 2, false); // Big-endian
        const lomant = view.getUint32(offset + 6, false); // Big-endian
        let value: number;

        if (expon === 0 && himant === 0 && lomant === 0) {
            value = 0;
        } else if (expon === 0x7FFF) {
            value = Number.MAX_VALUE;
        } else {
            expon -= 16383;
            value = (himant * 0x100000000 + lomant) * Math.pow(2, expon - 63);
        }

        return sign * value;
    }
}
