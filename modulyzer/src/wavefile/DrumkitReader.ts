/*
parser for the .drumkit format from PSI Drum 2 / Drumkit Manager 3

Based on the VB code with spanish variable names from http://dkm3.sourceforge.net/ :)

This code is public domain. Or at least LGPL if there was a judicial problem by porting the spanish VB.

Ported from https://github.com/clvn/buze/blob/master/src/armstrong/src/modfile/drumkitimport.h using Bing Copilot.
*/

export interface DrumkitHeader {
    psid: string; // Always 4 characters
    sampleCount: number;
    author: string; // Up to 64 characters
    comment: string; // Up to 128 characters
}

export interface DrumkitSampleHeader {
    name: string; // Up to 32 characters
    sampleType: number; // Single byte
    tone: number; // Single byte
    volume: number; // Single byte
    tamano: number; // Number of samples (unsigned integer)
    offset: number; // File offset location of the sample
    buffer: Float32Array;
}

export class DrumkitReader {
    private buffer: DataView | null = null;
    public header: DrumkitHeader | null = null;
    public samples: DrumkitSampleHeader[] = [];

    open(fileBuffer: ArrayBuffer): boolean {
        try {
            this.buffer = new DataView(fileBuffer);

            // Read drumkit header
            this.header = {
                psid: this.readString(0, 4),
                sampleCount: this.buffer.getUint32(4, true),
                author: this.readString(8, 64),
                comment: this.readString(72, 128)
            };

            let offset = 200; // Header ends at byte 200

            // Read sample headers
            for (let i = 0; i < this.header.sampleCount; i++) {
                const sampleCount = this.buffer.getUint32(offset + 35, true);
                const sampleHeader: DrumkitSampleHeader = {
                    name: this.readString(offset, 32),
                    sampleType: this.buffer.getUint8(offset + 32),
                    tone: this.buffer.getUint8(offset + 33),
                    volume: this.buffer.getUint8(offset + 34),
                    tamano: sampleCount,
                    buffer: this.readSampleData(offset + 39, sampleCount),
                    offset: offset + 39 // The offset to the sample data
                };

                this.samples.push(sampleHeader);
                offset += 39; // Move past the header

                // Skip over sample data in the file
                if (sampleHeader.tamano > 0) {
                    offset += sampleHeader.tamano * 2; // Assuming 16-bit samples (2 bytes per sample)
                }
            }

            return true;
        } catch (error) {
            console.error("Failed to open drumkit file:", error);
            return false;
        }
    }

    private readSampleData(startOffset: number, sampleCount: number): Float32Array {
        if (!this.buffer) {
            throw new Error("No buffer loaded.");
        }

        const endOffset = startOffset + sampleCount * 2; // 2 bytes per sample

        const floatBuffer = new Float32Array(sampleCount);
        let bufferIndex = 0;

        for (let i = startOffset; i < endOffset; i += 2) {
            // Read 16-bit signed samples
            const sampleValue = this.buffer.getInt16(i, true);
            floatBuffer[bufferIndex++] = sampleValue / 32768; // Normalize to -1.0 to 1.0 range
        }

        return floatBuffer;
    }

    close(): void {
        this.buffer = null;
        this.header = null;
        this.samples = [];
    }

    private readString(offset: number, length: number): string {
        if (!this.buffer) {
            throw new Error("No buffer loaded.");
        }

        let str = "";
        for (let i = offset; i < offset + length; i++) {
            const char = this.buffer.getUint8(i);
            if (char === 0) break; // Null-terminated string
            str += String.fromCharCode(char);
        }

        return str.trim();
    }
}
