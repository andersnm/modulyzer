import { WAVDecoder, WAVFile } from "./wavefile/WAVDecoder";
import { WAVEncoder, WAVFormat } from "./wavefile/WAVEncoder";

export async function readClipboardWave(): Promise<WAVFile> {
    const items = await navigator.clipboard.read();

    let wavBlob: Blob
    for (let item of items) {
        wavBlob = await item.getType("web audio/wav");
        if (wavBlob) {
            break;
        }
    }

    const wavArrayBuffer = await wavBlob.arrayBuffer();
    console.log(wavArrayBuffer)

    const reader = new WAVDecoder();
    return reader.decode(wavArrayBuffer);
}

export async function writeClipboardWave(sampleRate: number, buffers: Float32Array[]): Promise<void> {
    const writer = new WAVEncoder();
    const wavBuffer = writer.encode(sampleRate, WAVFormat.Float32, buffers);

    console.log(wavBuffer)

    const wavBlob = new Blob([wavBuffer], {
        type: "audio/wav"
    });
    const items = [ new ClipboardItem({"web audio/wav": wavBlob}) ];
    await navigator.clipboard.write(items);
}
