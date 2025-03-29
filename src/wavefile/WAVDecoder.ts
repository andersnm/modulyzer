import { Decoder } from "./Decoder";

export interface WAVFile {
    name?: string;
    sampleRate: number;
    bitDepth: number;
    channels: Float32Array[];
    length: number;
}

export class WAVDecoder extends Decoder {
    decode(data: ArrayBuffer): WAVFile | null {
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
                const encoding = this.readInt16(data, offset);
                offset += 2;

                if (encoding !== 0x0001 && encoding !== 0x0003) {
                    // Only support PCM (0x0001) and IEEE float (0x0003)
                    console.error('Cannot decode non-PCM or non-IEEE float WAV files');
                    return null;
                }

                // Number of channels
                const numberOfChannels = this.readInt16(data, offset);
                offset += 2;

                // Sample rate
                const sampleRate = this.readInt32(data, offset);
                offset += 4;

                // Ignore bytes/sec - 4 bytes
                offset += 4;

                // Ignore block align - 2 bytes
                offset += 2;

                // Bit depth
                const bitDepth = this.readInt16(data, offset);
                const bytesPerSample = bitDepth / 8;
                offset += 2;

                decoded.sampleRate = sampleRate;
                decoded.bitDepth = bitDepth;
                decoded.bytesPerSample = bytesPerSample;
                decoded.numberOfChannels = numberOfChannels;
                decoded.encoding = encoding;
            } else if (chunk.name === 'data') {
                const length = chunk.length / (decoded.bytesPerSample * decoded.numberOfChannels);
                const channels: Float32Array[] = [];

                for (let i = 0; i < decoded.numberOfChannels; i++) {
                    channels.push(new Float32Array(length));
                }

                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < decoded.numberOfChannels; j++) {
                        let value;

                        if (decoded.encoding === 0x0001) {
                            // PCM encoding
                            if (decoded.bitDepth === 8) {
                                // uint8 PCM (0-255 -> -1.0 to 1.0)
                                value = this.readUint8(data, offset) - 128;
                                channels[j][i] = value / 128;
                            } else if (decoded.bitDepth === 16) {
                                // int16 PCM (-32768 to 32767 -> -1.0 to 1.0)
                                value = this.readInt16(data, offset);
                                channels[j][i] = value / 32768;
                            } else if (decoded.bitDepth === 32) {
                                // int32 PCM (-2^31 to 2^31-1 -> -1.0 to 1.0)
                                value = this.readInt32(data, offset);
                                channels[j][i] = value / 2147483648;
                            }
                        } else if (decoded.encoding === 0x0003 && decoded.bitDepth === 32) {
                            // IEEE float32 PCM (-1.0 to 1.0)
                            value = this.readFloat32(data, offset);
                            channels[j][i] = value;
                        }

                        offset += decoded.bytesPerSample;
                    }
                }

                decoded.channels = channels;
                decoded.length = length;
            }  else if (chunk.name === 'LIST') {
                const listType = this.readString(data, offset, 4);
                offset += 4;

                if (listType === 'INFO') {
                    const listEnd = offset + chunk.length - 4; // Calculate end of LIST chunk
                    while (offset < listEnd) {
                        const infoChunk = this.readChunkHeaderL(data, offset);
                        offset += 8;

                        if (infoChunk.name === 'INAM') {
                            decoded.name = this.readString(data, offset, infoChunk.length).replace(/\0/g, '');
                        }

                        offset += infoChunk.length; // Move to the next subchunk
                    }
                } else {
                    offset += chunk.length - 4; // Skip LIST chunk if not INFO
                }
            } else {
                offset += chunk.length;
            }
        }

        return decoded;
    }
}
