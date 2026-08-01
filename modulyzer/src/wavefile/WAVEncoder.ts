export enum WAVFormat {
    UInt8 = 'UInt8',
    Int16 = 'Int16',
    Int32 = 'Int32',
    Float32 = 'Float32',
}

export class WAVEncoder {
    encode(name: string, sampleRate: number, format: WAVFormat, channels: Float32Array[]): ArrayBuffer {
        const bytesPerSample = this.getBytesPerSample(format);
        const numberOfChannels = channels.length;
        const length = channels[0].length; // Assuming all channels have the same length
        const blockAlign = bytesPerSample * numberOfChannels;
        const byteRate = sampleRate * blockAlign;

        // Prepare name data for INAM chunk
        const listInfoChunkSize = 8 + 4 + 8 + name.length + 1; // INFO header + LIST + INAM header + data

        // Calculate the total file size: Header + fmt chunk + data chunk
        const dataChunkSize = length * blockAlign;
        const fileSize = 44 + listInfoChunkSize + dataChunkSize; // 44 bytes is the header size for WAV

        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);

        let offset = 0;

        // RIFF header
        this.writeString(view, offset, 'RIFF');
        offset += 4;
        view.setUint32(offset, fileSize - 8, true); // File size minus "RIFF" and size field
        offset += 4;
        this.writeString(view, offset, 'WAVE');
        offset += 4;

        // fmt chunk
        this.writeString(view, offset, 'fmt ');
        offset += 4;
        view.setUint32(offset, 16, true); // Sub-chunk size (16 for PCM)
        offset += 4;
        view.setUint16(offset, format === WAVFormat.Float32 ? 3 : 1, true); // Audio format: 1 = PCM, 3 = IEEE Float
        offset += 2;
        view.setUint16(offset, numberOfChannels, true); // Number of channels
        offset += 2;
        view.setUint32(offset, sampleRate, true); // Sample rate
        offset += 4;
        view.setUint32(offset, byteRate, true); // Byte rate
        offset += 4;
        view.setUint16(offset, blockAlign, true); // Block align
        offset += 2;
        view.setUint16(offset, bytesPerSample * 8, true); // Bits per sample
        offset += 2;

        // LIST chunk
        this.writeString(view, offset, 'LIST');
        offset += 4;
        view.setUint32(offset, listInfoChunkSize - 8, true); // Size of LIST chunk minus "LIST" and size field
        offset += 4;
        this.writeString(view, offset, 'INFO');
        offset += 4;

        // INAM subchunk
        this.writeString(view, offset, 'INAM');
        offset += 4;
        view.setUint32(offset, name.length + 1, true); // INAM chunk size
        offset += 4;
        this.writeString(view, offset, name);
        offset += name.length;
        view.setUint8(offset, 0);
        offset += 1;

        // data chunk
        this.writeString(view, offset, 'data');
        offset += 4;
        view.setUint32(offset, dataChunkSize, true); // Data chunk size
        offset += 4;

        // Write audio data
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = channels[channel][i];
                this.writeSample(view, offset, sample, format);
                offset += bytesPerSample;
            }
        }

        return buffer;
    }

    private writeSample(view: DataView, offset: number, sample: number, format: WAVFormat): void {
        switch (format) {
            case WAVFormat.UInt8:
                view.setUint8(offset, Math.max(0, Math.min(255, (sample * 127.5) + 127.5))); // Scale [-1,1] to [0,255]
                break;
            case WAVFormat.Int16:
                view.setInt16(offset, Math.max(-32768, Math.min(32767, sample * 32767)), true);
                break;
            case WAVFormat.Int32:
                view.setInt32(offset, Math.max(-2147483648, Math.min(2147483647, sample * 2147483647)), true);
                break;
            case WAVFormat.Float32:
                view.setFloat32(offset, sample, true);
                break;
        }
    }

    private getBytesPerSample(format: WAVFormat): number {
        switch (format) {
            case WAVFormat.UInt8:
                return 1;
            case WAVFormat.Int16:
                return 2;
            case WAVFormat.Int32:
                return 4;
            case WAVFormat.Float32:
                return 4;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    private writeString(view: DataView, offset: number, text: string): void {
        for (let i = 0; i < text.length; i++) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    }
}
