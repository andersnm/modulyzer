export class Decoder {
    readString(data: ArrayBuffer, offset: number, length: number): string {
        const uint8Array = new Uint8Array(data, offset, length);
        return String.fromCharCode(...uint8Array);
    }

    readUint8(data: ArrayBuffer, offset: number): number {
        return new DataView(data).getUint8(offset);
    }

    readInt16(data: ArrayBuffer, offset: number): number {
        return new DataView(data).getInt16(offset, true);
    }

    readInt32(data: ArrayBuffer, offset: number): number {
        return new DataView(data).getInt32(offset, true);
    }

    readFloat32(data: ArrayBuffer, offset: number): number {
        return new DataView(data).getFloat32(offset, true);
    }

    readChunkHeaderL(data: ArrayBuffer, offset: number): { name: string; length: number } {
        return {
            name: this.readString(data, offset, 4),
            length: this.readInt32(data, offset + 4),
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
}
