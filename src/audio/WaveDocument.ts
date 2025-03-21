// import { WaveFileCreator } from "../wavefile/wavefile-creator";
// import { AudioDevice } from "./AudioDevice";
// import { AudioStorage } from "./AudioStorage";
// import { Connection, Pattern } from "./Player";
// import { Instrument } from "./plugins/InstrumentFactory";

// export const ACTION_DELETE_RANGE = 0;
// export const ACTION_INSERT_RANGE = 1;
// export const ACTION_FADE_RANGE = 2;

// // indexed db;
// // recordings, wavedata
// // history = alle edits med buffer? vil ha en operation

// export interface IWaveAction {
//     action: string;
//     rangeStart?: number;
//     rangeEnd?: number;
//     bufferRecordingId?: IDBValidKey; // this is a serialized representation
// }

// export interface IWaveOperation {
//     label: string;
//     redo: IWaveAction[];
//     undo: IWaveAction[];
// }

// // IWaveDocument is the document index that points at the wavedata, this is being enumerated in getall etc
// export interface IWaveDocument {
//     id: IDBValidKey;
//     recordingId: IDBValidKey;
//     name: string;
//     channelCount: number;
//     sampleRate: number;
//     sampleCount: number;
//     historyPosition: number;
//     history: IWaveOperation[];
// }

// // IRecording is the raw wavedata in work buffer and undo buffers
// export interface IRecording {
//     id: IDBValidKey;
//     sampleRate: number;
//     buffers: Float32Array[]; // yeah cant getall these!!
// }

// class DocumentManipulator {
//     document: WaveDocument;

//     constructor(document: WaveDocument) {
//         this.document = document;
//     }

//     async insertRange(action: IWaveAction) {
//         const rangeRecording = await this.document.storage.getRecording(action.bufferRecordingId);

//         const rangeLength = rangeRecording.buffers[0].length;
//         const originalLength = this.document.recording.buffers[0].length;

//         const buffers = this.document.recording.buffers.map(b => new Float32Array(originalLength + rangeLength));

//         const at = action.rangeStart;

//         for (let i = 0; i < buffers.length; i++) {
//             const buffer = buffers[i];
//             const recordingBuffer = this.document.recording.buffers[i];
//             const rangeBuffer = rangeRecording.buffers[i % rangeRecording.buffers.length]; // mod -> mono to stereo
//             // reconstruct the whole buffer, with the inserted range in the middle
//             buffer.set(recordingBuffer.subarray(0, at), 0);
//             buffer.set(rangeBuffer, at);
//             buffer.set(recordingBuffer.subarray(at), at + rangeBuffer.length);
//         }

//         console.log("Updating after insert")
//         this.document.document.sampleCount = originalLength + rangeLength;
//         this.document.recording.buffers = buffers;
//     }

//     async deleteRange(action: IWaveAction) {
//         const start = action.rangeStart;
//         const end = action.rangeEnd;

//         const rangeLength = (end - start);
//         // const recordingSamples = this.document.document.sampleCount - (end - start);
//         const originalLength = this.document.recording.buffers[0].length;

//         const buffers = this.document.recording.buffers.map(b => new Float32Array(originalLength - rangeLength));

//         for (let i = 0; i < buffers.length; i++) {
//             const buffer = buffers[i];
//             const recordingBuffer = this.document.recording.buffers[i];

//             buffer.set(recordingBuffer.subarray(0, start), 0);
//             buffer.set(recordingBuffer.subarray(end), start);
//         }

//         console.log("Updating after delete")
//         this.document.document.sampleCount = originalLength - rangeLength;
//         this.document.recording.buffers = buffers;
//     }

//     async replaceRange(action: IWaveAction) {
//         const rangeRecording = await this.document.storage.getRecording(action.bufferRecordingId);
//         // const rangeLength = rangeRecording.buffers[0].length;
//         // const originalLength = this.document.recording.buffers[0].length;
//         const at = action.rangeStart;

//         const buffers = this.document.recording.buffers;

//         console.log(action, buffers, rangeRecording)

//         for (let i = 0; i < buffers.length; i++) {
//             const buffer = buffers[i];
//             const rangeBuffer = rangeRecording.buffers[i % rangeRecording.buffers.length]; // mod -> mono to stereo

//             // update the buffer inline
//             buffer.set(rangeBuffer, at);
//         }

//     }
// }

// export interface WaveRange {
//     start: number;
//     end: number;
// }

// export class WaveDocument extends EventTarget {
//     device: AudioDevice;
//     storage: AudioStorage; // since we have waves in memory, only use tis for --- ?? (except edited which this is)
//     document: IWaveDocument;
//     recording: IRecording
//     manipulator: DocumentManipulator;
//     operation: IWaveOperation;
//     selection?: WaveRange;
//     zoom?: WaveRange;
//     playPosition: number = 0;
    
//     isRecording: boolean;

//     // recordingPosition:
//     // historyPosition: number = 0; is in IWaveDocument

//     constructor(device: AudioDevice, storage: AudioStorage, document: IWaveDocument, recording: IRecording) {
//         super();
//         this.device = device;
//         this.storage = storage;
//         this.document = document;
//         this.recording = recording;
//         this.manipulator = new DocumentManipulator(this);
//         this.operation = { label: "", redo: [], undo: []};
//     }

//     static createFromBuffers(device: AudioDevice, storage: AudioStorage, name: string, sampleRate: number, buffers: Float32Array[]) {
//         return new WaveDocument(device, storage,
//             {id: 0, name, channelCount: buffers.length, sampleRate, sampleCount: buffers[0].length, historyPosition: 0, history: [], recordingId: 0 },
//             {id: 0, sampleRate, buffers })
//     }

//     async createRecordingFromRange(start: number, end: number): Promise<IRecording> {
//         const recording = await this.storage.createRecording(
//             this.recording.sampleRate,
//             this.recording.buffers.map(b => b.subarray(start, end))
//         );

//         console.log("CREATED RECORDING", recording)

//         return recording;
//     }

//     async crop(start: number, end: number) {

//         await this.deleteRange(end, this.document.sampleCount);
//         await this.deleteRange(0, start);
//         await this.commit("Crop");

//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     setPlayPosition(position) {
//         this.playPosition = position;
//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     setSelection(selection: WaveRange) {
//         this.selection = selection;
//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     setZoom(selection: WaveRange) {
//         this.zoom = selection;
//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     async redo() {
//         if (this.document.historyPosition >= this.document.history.length - 1) {
//             return;
//         }

//         if (this.operation.redo.length || this.operation.undo.length) {
//             throw new Error("Should not redo in an active operation");
//         }

//         // historyPosition points at the last action that was executed, so we look one ahead
//         this.document.historyPosition++;

//         const op = this.document.history[this.document.historyPosition];
//         console.log("redoing", op)
//         console.log(this.recording.buffers)

//         for (let action of op.redo) {
//             await this.execAction(action);
//         }

//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     async undo() {
//         if (this.document.historyPosition <= 0) {
//             return;
//         }

//         if (this.operation.redo.length || this.operation.undo.length) {
//             throw new Error("Should not undo in an active operation");
//         }

//         const op = this.document.history[this.document.historyPosition];
//         console.log("undoing", op)
//         console.log(this.recording.buffers)

//         this.document.historyPosition--;

//         // NOTE; reverse undo actions
//         const undoActions = [ ...op.undo ].reverse();
//         for (let action of undoActions) {
//             await this.execAction(action);
//         }

//         this.dispatchEvent(new CustomEvent("change", { detail: this }))

//         // dont do this yet
//         // await this.storage.updateDocument(this.document);
//     }

//     async execAction(action: IWaveAction) {
//         switch (action.action) {
//             // replace-range? = paste w/overwrite like when recording
//             case "insert-range":
//                 await this.manipulator.insertRange(action);
//                 break;
//             case "delete-range":
//                 this.manipulator.deleteRange(action);
//                 break;
//             case "replace-range":
//                 await this.manipulator.replaceRange(action);
//                 break;
//             case "fade-range": default:
//                 throw new Error("Internal error! Action not implemented " + action.action);
//         }
//     }

//     async commit(label: string) {
//         // push to history
//         this.operation.label = label;
//         // TODO; if historyPosition != end, truncate and delete parallell history, then continue at end

//         if (this.document.historyPosition < this.document.history.length - 1) {
//             // TODO; delete stuff
//             throw new Error("It says TODO here");
//             return;
//         }

//         this.document.history.push(this.operation);
//         this.document.historyPosition = this.document.history.length - 1;

//         await this.storage.updateDocument(this.document);
//         await this.storage.updateRecording(this.recording);

//         // TODO; save document and recording
//         // await this.storage.updateDocument();
//         // await this.storage.updateRecording();

//         this.operation = { label: "", redo: [], undo: []};

//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }

//     async deleteRange(start: number, end: number) {
//         const action = {
//             action: "delete-range",
//             rangeStart: start,
//             rangeEnd: end,
//         };

//         this.operation.redo.push(action);

//         const beforeRecording = await this.createRecordingFromRange(start, end);

//         const undoAction: IWaveAction = {
//             action: "insert-range",
//             rangeStart: start,
//             bufferRecordingId: beforeRecording.id,
//         };

//         // TODO; undo er egentlig i motsatt rekkefølge!! så vi kan soft-fix for å teste current impl
//         this.operation.undo.push(undoAction);

//         await this.manipulator.deleteRange(action);

//         return beforeRecording;
//     }

//     async insertRange(at: number, rangeRecording: IRecording) {

//         // const rangeRecording = await this.storage.getRecording(recordingId);

//         if (rangeRecording.id === 0) {
//             // create or throw?
//             throw Error("insert range must have recording id")
//         }

//         const action: IWaveAction = {
//             action: "insert-range",
//             rangeStart: at,
//             bufferRecordingId: rangeRecording.id,
//         };

//         this.operation.redo.push(action);

//         const undoAction: IWaveAction = {
//             action: "delete-range",
//             rangeStart: at,
//             rangeEnd: rangeRecording.buffers[0].length,
//         };

//         this.operation.undo.push(undoAction);

//         await this.manipulator.insertRange(action);
//     }

//     async replaceRange(at: number, rangeRecording: IRecording) {

//         if (rangeRecording.id === 0) {
//             // create or throw?
//             throw Error("insert range must have recording id")
//         }

//         const rangeLength = rangeRecording.buffers[0].length;

//         const beforeRecording = await this.createRecordingFromRange(at, at + rangeLength);

//         console.log("IS IT REALY", at, rangeLength, rangeRecording, beforeRecording)

//         const action: IWaveAction = {
//             action: "replace-range",
//             rangeStart: at,
//             bufferRecordingId: rangeRecording.id,
//         };

//         this.operation.redo.push(action);

//         const undoAction: IWaveAction = {
//             action: "replace-range",
//             rangeStart: at,
//             bufferRecordingId: beforeRecording.id,
//         };

//         this.operation.undo.push(undoAction);

//         await this.manipulator.replaceRange(action);

//         return beforeRecording;
//     }

//     onRecordInput = async (ev: CustomEvent<Float32Array[]>) => {
//         // we are being called, so, we are recording into the document, 
//         // but should end when reaching the end of the buffer

//         // should amend undo buffer!! is not undoable yet

//         const inputs = ev.detail;
//         const buffers = this.recording.buffers;

//         const inputLength = inputs[0].length;
//         const bufferLength = buffers[0].length;

//         if (this.playPosition + inputLength > bufferLength) {
//             console.log("Recorder reached end of output buffer")
//             this.stopRecording();
//             // this.isRecording = false;
//             // this.dispatchEvent(new CustomEvent("end"))
//             return;
//         }

//         // TODO; record to a bigger buffer, insert via undoable sub-op 
//         // OK! buffer is bigger now; need replace func
//         const recordBufferRecording = await this.storage.createRecording(44100, inputs);

//         console.log("THEY SAID UNDEFINED", recordBufferRecording)

//         await this.replaceRange(this.playPosition, recordBufferRecording);

//         // if (this.device.inputMode === "stereo") {
//         //     for (let i = 0; i < buffers.length; i++) {
//         //         buffers[i].set(inputs[i % inputs.length], this.playPosition);
//         //     }
//         // } else if (this.device.inputMode === "left") {
//         //     buffers[0].set(inputs[0], this.playPosition);
//         // } else if (this.device.inputMode === "right") {
//         //     buffers[1 % buffers.length].set(inputs[1 % inputs.length], this.playPosition);
//         // }

//         this.playPosition += inputLength;
//         // TODO; less frequency
//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     };

//     beginRecording() {
//         if (this.isRecording) {
//             console.warn("Already recording");
//             return;
//         }

//         // no edits until recorder reaches end of input or manually stopped
//         this.isRecording = true;
//         this.playPosition = 0; // selection start if set, and then record only in selection??
//         this.device.recorder.addEventListener("input", this.onRecordInput);
//     }

//     stopRecording() {
//         if (!this.isRecording) {
//             console.warn("Not recording");
//             return;
//         }

//         console.log(this.operation, this.document) // document has been proxied?
//         this.commit("Record Input");

//         this.device.recorder.removeEventListener("input", this.onRecordInput);
//         this.isRecording = false;

//         this.dispatchEvent(new CustomEvent("end"));
//         this.dispatchEvent(new CustomEvent("change", { detail: this }))
//     }


//     exportWav(format) {
//         const writer = new WaveFileCreator();
//         // const buffer = interleave(rangeRecording.buffers);
//         writer.fromScratch(this.recording.buffers.length, this.recording.sampleRate, '32f', this.recording.buffers);
//         const wavBuffer = writer.toBuffer();
//         const wavBlob = new Blob([wavBuffer], {
//             type: "audio/wav"
//         });

//         return wavBlob;
//     }
// }

// // export class PatternDocument {
// //     pattern: Pattern;


// // }

// // export class InstrumentDocument {
// //     instrument: Instrument;
// // }

// // export class ConnectionDocument {
// //     connection: Connection;
// // }
