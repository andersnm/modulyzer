// import { WaveFileCreator } from "./wavefile/wavefile-creator";

// export async function readClipboardRecording(): Promise<IRecording> {
//     const items = await navigator.clipboard.read();

//     let wavBlob: Blob
//     for (let item of items) {
//         wavBlob = await item.getType("web audio/wav");
//         if (wavBlob) {
//             break;
//         }
//     }

//     const wavArrayBuffer = await wavBlob.arrayBuffer();
//     var wavBuffer = new Uint8Array(wavArrayBuffer);

//     const reader = new WaveFileCreator();
//     reader.fromBuffer(wavBuffer, true);
//     let buffers = reader.getSamples(false, Float32Array);

//     // normalize to array of channels of array of samples
//     if (reader.fmt.numChannels === 1) {
//         buffers = [ buffers ];
//     }

//     return {
//         id: 0,
//         buffers,
//         sampleRate: 48000, /// reader, how to get from reader
//     };
// }

// export async function writeClipboardRecording(recording: IRecording): Promise<void> {

//     const writer = new WaveFileCreator();
//     // const buffer = interleave(rangeRecording.buffers);
//     writer.fromScratch(recording.buffers.length, recording.sampleRate, '32f', recording.buffers);
//     const wavBuffer = writer.toBuffer();
//     // console.log("WRITING", wavBuffer);

//     const wavBlob = new Blob([wavBuffer], {
//         type: "audio/wav"
//     });
//     // console.log(await wavBlob.text());
//     const items = [ new ClipboardItem({"web audio/wav": wavBlob}) ];
//     await navigator.clipboard.write(items);
// }
