import { Decoder } from "./Decoder";

export class WAVDecoder extends Decoder {

    decode(data: ArrayBuffer): {
        sampleRate: number;
        bitDepth: number;
        channels: Float32Array[];
        length: number;
    } | null {
        const decoded: any = {};
        let offset = 0;

        // Header
        const chunk = this.readChunkHeaderL(data, offset);
        offset += 8;
        if (chunk.name !== 'RIFF') {
            console.error('File is not a WAV');
            return null;
        }

        let fileLength = chunk.length;
        fileLength += 8;

        const wave = this.readString(data, offset, 4);
        offset += 4;
        if (wave !== 'WAVE') {
            console.error('File is not a WAV');
            return null;
        }

        while (offset < fileLength) {
            const chunk = this.readChunkHeaderL(data, offset);
            offset += 8;

            if (chunk.name === 'fmt ') {
                // File encoding
                const encoding = this.readIntL(data, offset, 2);
                offset += 2;

                if (encoding !== 0x0001) {
                    // Only support PCM
                    console.error('Cannot decode non-PCM encoded WAV file');
                    return null;
                }

                // Number of channels
                const numberOfChannels = this.readIntL(data, offset, 2);
                offset += 2;

                // Sample rate
                const sampleRate = this.readIntL(data, offset, 4);
                offset += 4;

                // Ignore bytes/sec - 4 bytes
                offset += 4;

                // Ignore block align - 2 bytes
                offset += 2;

                // Bit depth
                const bitDepth = this.readIntL(data, offset, 2);
                const bytesPerSample = bitDepth / 8;
                offset += 2;

                decoded.sampleRate = sampleRate;
                decoded.bitDepth = bitDepth;
                decoded.bytesPerSample = bytesPerSample;
                decoded.numberOfChannels = numberOfChannels;
            } else if (chunk.name === 'data') {
                const length = chunk.length / (decoded.bytesPerSample * decoded.numberOfChannels);
                const channels: Float32Array[] = [];

                for (let i = 0; i < decoded.numberOfChannels; i++) {
                    channels.push(new Float32Array(length));
                }

                for (let i = 0; i < decoded.numberOfChannels; i++) {
                    const channel = channels[i];
                    for (let j = 0; j < length; j++) {
                        const index = offset + (j * decoded.numberOfChannels + i) * decoded.bytesPerSample;
                        let value = this.readIntL(data, index, decoded.bytesPerSample);

                        const range = 1 << (decoded.bitDepth - 1);
                        if (value >= range) {
                            value |= ~(range - 1);
                        }
                        channel[j] = value / range;
                    }
                }
                decoded.channels = channels;
                decoded.length = length;
                offset += chunk.length;
            } else {
                offset += chunk.length;
            }
        }

        return decoded;
    }
}
