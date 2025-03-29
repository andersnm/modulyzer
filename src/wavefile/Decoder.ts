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
}
