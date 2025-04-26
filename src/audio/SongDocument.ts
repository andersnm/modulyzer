import { deflate, inflate } from 'pako';
import { getNewPatternName } from '../components/PatternEditorHelper';

function compressFloat32ArrayToBase64(data: Float32Array): string {
    const uint8Array = new Uint8Array(data.buffer);
    const compressed = deflate(uint8Array);

    let binaryString = "";
    for (let i = 0; i < compressed.length; i++) {
        binaryString += String.fromCharCode(compressed[i]);
    }
    return btoa(binaryString);
}

function decompressBase64ToFloat32Array(base64String: string): Float32Array {
    const binaryString = atob(base64String);

    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        compressed[i] = binaryString.charCodeAt(i);
    }

    const decompressed = inflate(compressed);
    return new Float32Array(decompressed.buffer);
}

export type CcValueDictionary = {[key: number]: number};

export class InstrumentDocument {
    name: string;
    instrumentId: string;
    x: number = 0;
    y: number = 0;
    ccs: CcValueDictionary = {};
    waves: WaveDocument[] = [];
}

export class ConnectionDocument {
    from: InstrumentDocument;
    to: InstrumentDocument;
}

export class PatternEventDocument {
    patternColumn: PatternColumnDocument;
    time: number = 0;
    value: number = 0;
    data0: number = 0;
    data1: number = 0;
    channel: number = 0; // ui-only channel for polyphonic midi notes, not during playback, otherwise 0

    constructor(patternColumn: PatternColumnDocument) {
        this.patternColumn = patternColumn;
    }
}

export class PatternColumnDocument {
    pattern: PatternDocument;
    instrument: InstrumentDocument;
    pin: number;
    events: PatternEventDocument[] = [];

    constructor(pattern: PatternDocument) {
        this.pattern = pattern;
    }
};

export class PatternDocument {
    name: string = "";
    duration: number = 1;
    subdivision: number = 4;
    swing: number = 50;
    columns: PatternColumnDocument[] = [];
}

export class SequenceEventDocument {
    sequenceColumn: SequenceColumnDocument;
    time: number;
    pattern: PatternDocument;

    constructor(sequenceColumn: SequenceColumnDocument, time: number, pattern: PatternDocument) {
        this.sequenceColumn = sequenceColumn;
        this.time = time;
        this.pattern = pattern;
    }
}

export class SequenceColumnDocument {
    events: SequenceEventDocument[] = [];
}

export class WaveDocument {
    instrument: InstrumentDocument;
    name: string;
    sampleCount: number;
    sampleRate: number;
    buffers: Float32Array[];
    note: number;
    selection: WaveRange | null = null;
    zoom: WaveRange | null = null;

    insertRange(at: number, rangeBuffers: Float32Array[]) {
        const rangeLength = rangeBuffers[0].length;
        const originalLength = this.buffers[0].length;
        const buffers = this.buffers.map(b => new Float32Array(originalLength + rangeLength));

        for (let i = 0; i < buffers.length; i++) {
            const buffer = buffers[i];
            const recordingBuffer = this.buffers[i];
            const rangeBuffer = rangeBuffers[i % rangeBuffers.length]; // mod -> mono to stereo
            // reconstruct the whole buffer, with the inserted range in the middle
            buffer.set(recordingBuffer.subarray(0, at), 0);
            buffer.set(rangeBuffer, at);
            buffer.set(recordingBuffer.subarray(at), at + rangeBuffer.length);
        }

        console.log("Updating after insert")
        this.sampleCount = originalLength + rangeLength;
        this.buffers = buffers;
    }

    deleteRange(start: number, end: number) {
        const rangeLength = (end - start);
        const originalLength = this.buffers[0].length;

        const buffers = this.buffers.map(b => new Float32Array(originalLength - rangeLength));

        for (let i = 0; i < buffers.length; i++) {
            const buffer = buffers[i];
            const recordingBuffer = this.buffers[i];

            buffer.set(recordingBuffer.subarray(0, start), 0);
            buffer.set(recordingBuffer.subarray(end), start);
        }

        console.log("Updating after delete")
        this.sampleCount = originalLength - rangeLength;
        this.buffers = buffers;
    }

    replaceRange(at, rangeBuffers: Float32Array[]) {
        const buffers = this.buffers;

        for (let i = 0; i < buffers.length; i++) {
            const buffer = buffers[i];
            const rangeBuffer = rangeBuffers[i % rangeBuffers.length]; // mod -> mono to stereo

            // update the buffer inline
            buffer.set(rangeBuffer, at);
        }
    }

    copyRange(start: number, end: number): Float32Array[] {
        return this.buffers.map(buffer => buffer.slice(start, end));
    }
}

export interface WaveRange {
    start: number;
    end: number;
}

export class SongDocument extends EventTarget {
    constructor() {
        super();

        this.createInstrument("@modulyzer/Master", "Master", 0, 0, {});
        const sc = this.createSequenceColumn();
        const p = this.createPattern("00", 32, 4);
        this.createSequenceEvent(sc, 0, p);
    }

    name: string = "Untitled";
    bpm: number = 125;
    loopStart: number = 0;
    loopEnd: number = 8;

    instruments: InstrumentDocument[] = [];
    connections: ConnectionDocument[] = [];
    patterns: PatternDocument[] = [];
    sequenceColumns: SequenceColumnDocument[] = [];

    setBpm(bpm: number) {
        this.bpm = bpm;
        this.dispatchEvent(new CustomEvent("updateDocument", { detail: this }));
    }

    setLoop(start: number, end: number) {
        this.loopStart = start;
        this.loopEnd = end;
        this.dispatchEvent(new CustomEvent("updateDocument", { detail: this }));
    }

    createInstrument(id: string, name: string, x: number, y: number, ccs: CcValueDictionary) {
        const instrument = new InstrumentDocument();
        instrument.instrumentId = id;
        instrument.name = name;
        instrument.x = x;
        instrument.y = y;
        instrument.ccs = { ... ccs };
        this.instruments.push(instrument);

        this.dispatchEvent(new CustomEvent("createInstrument", { detail: instrument }));

        return instrument;
    }

    deleteInstrument(instrument: InstrumentDocument) {

        // delete all connections with this, or error?
        for (let c = 0; c < this.connections.length; ) {
            const connection = this.connections[c];
            if (connection.from === instrument || connection.to === instrument) {
                this.deleteConnection(connection);
                this.connections.splice(c, 1);
            } else {
                c++;
            }
        }

        while (instrument.waves.length) {
            this.deleteWave(instrument, instrument.waves[instrument.waves.length - 1]);
        }

        const index = this.instruments.findIndex(c => c === instrument);
        if (index === -1) {
            return;
        }

        this.instruments.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteInstrument", { detail: instrument }));
    }

    createConnection(from: InstrumentDocument, to: InstrumentDocument) {
        const connection = new ConnectionDocument();
        connection.from = from;
        connection.to = to;
        this.connections.push(connection);

        this.dispatchEvent(new CustomEvent("createConnection", { detail: connection }));

        return connection;
    }

    deleteConnection(connection: ConnectionDocument) {
        const index = this.connections.findIndex(c => c === connection);
        if (index === -1) {
            return;
        }

        this.connections.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteConnection", { detail: connection }));
    }

    createPattern(name: string, duration: number, subdivision: number) {
        const pattern = new PatternDocument();
        pattern.name = name;
        pattern.duration = duration;
        pattern.subdivision = subdivision;
        this.patterns.push(pattern);

        this.dispatchEvent(new CustomEvent("createPattern", { detail: pattern }));

        return pattern;
    }

    updatePattern(pattern: PatternDocument, name: string, length: number, subdivision: number, swing: number) {
        pattern.name = name;
        pattern.duration = length;
        pattern.subdivision = subdivision;
        pattern.swing = swing;

        this.dispatchEvent(new CustomEvent("updatePattern", { detail: pattern }));
    }

    deletePattern(pattern: PatternDocument) {

        while (pattern.columns.length > 0) {
            this.deletePatternColumn(pattern, pattern.columns[pattern.columns.length - 1]);
        }

        const index = this.patterns.findIndex(c => c === pattern);
        if (index === -1) {
            return;
        }

        this.patterns.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deletePattern", { detail: pattern }));
    }

    createPatternColumn(pattern: PatternDocument, instrument: InstrumentDocument, pin: number) {
        if (!instrument) {
            throw new Error("createPatternColumn: Invalid instrument");
        }

        const pc = new PatternColumnDocument(pattern);
        pc.instrument = instrument;
        pc.pin = pin;

        pattern.columns.push(pc);

        this.dispatchEvent(new CustomEvent("createPatternColumn", { detail: pc }));

        return pc;
    }

    deletePatternColumn(pattern: PatternDocument, patternColumn: PatternColumnDocument) {

        while (patternColumn.events.length > 0) {
            this.deletePatternEvent(patternColumn, patternColumn.events[patternColumn.events.length - 1]);
        }

        const index = pattern.columns.findIndex(c => c === patternColumn);
        if (index === -1) {
            return;
        }

        pattern.columns.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deletePatternColumn", { detail: patternColumn }));
    }

    createPatternEvent(column: PatternColumnDocument, time: number, value: number, data0: number, data1: number, channel: number) {
        const pe = new PatternEventDocument(column);
        pe.time = time;
        pe.value = value;
        pe.data0 = data0;
        pe.data1 = data1;
        pe.channel = channel;

    
        // insert by time
        const i = column.events.findIndex(e => e.time > time);
        if (i === -1) {
            column.events.push(pe);
        } else {
            column.events.splice(i, 0, pe)
        }

        this.dispatchEvent(new CustomEvent("createPatternEvent", { detail: pe }));

        return pe;
    }

    updatePatternEvent(pe: PatternEventDocument, time: number, value: number, data0: number, data1: number) {
        pe.time = time;
        pe.value = value;
        pe.data0 = data0;
        pe.data1 = data1;

        this.dispatchEvent(new CustomEvent("updatePatternEvent", { detail: pe }));
    }

    deletePatternEvent(patternColumn: PatternColumnDocument, patternEvent: PatternEventDocument) {
        const index = patternColumn.events.findIndex(e => e === patternEvent);
        if (index === -1) {
            return;
        }

        patternColumn.events.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deletePatternEvent", { detail: patternEvent }));
    }

    createSequenceColumn() {
        const sc = new SequenceColumnDocument();

        this.sequenceColumns.push(sc);

        this.dispatchEvent(new CustomEvent("createSequenceColumn", { detail: sc }));

        return sc;
    }

    deleteSequenceColumn(sequenceColumn: SequenceColumnDocument) {

        while (sequenceColumn.events.length > 0) {
            this.deleteSequenceEvent(sequenceColumn, sequenceColumn.events[sequenceColumn.events.length - 1]);
        }

        const index = this.sequenceColumns.findIndex(e => e === sequenceColumn);
        if (index === -1) {
            return;
        }

        this.sequenceColumns.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteSequenceColumn", { detail: sequenceColumn }));
    }


    createSequenceEvent(sequenceColumn: SequenceColumnDocument, time: number, pattern: PatternDocument) {
        const se = new SequenceEventDocument(sequenceColumn, time, pattern);

        sequenceColumn.events.push(se);

        this.dispatchEvent(new CustomEvent("createSequenceEvent", { detail: se }));

        return se;
    }

    updateSequenceEvent(sequenceEvent: SequenceEventDocument, pattern: PatternDocument) {
        sequenceEvent.pattern = pattern;

        this.dispatchEvent(new CustomEvent("updateSequenceEvent", { detail: sequenceEvent }));
    }

    deleteSequenceEvent(sequenceColumn: SequenceColumnDocument, sequenceEvent: SequenceEventDocument) {
        const index = sequenceColumn.events.findIndex(e => e === sequenceEvent);
        if (index === -1) {
            return;
        }

        sequenceColumn.events.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteSequenceEvent", { detail: sequenceEvent }));
    }

    createWave(instrument: InstrumentDocument, name: string, note: number, sampleCount: number, sampleRate: number, buffers: Float32Array[], selection: WaveRange = null, zoom: WaveRange = null) {
        const wave = new WaveDocument();
        wave.instrument = instrument;
        wave.name = name;
        wave.note = note;
        wave.sampleCount = sampleCount;
        wave.sampleRate = sampleRate;
        wave.buffers = buffers;
        wave.selection = selection;
        wave.zoom = zoom;
        instrument.waves.push(wave);

        this.dispatchEvent(new CustomEvent("createWave", { detail: wave }));

        return wave;
    }

    updateWave(wave: WaveDocument, name: string, note: number, selection: WaveRange, zoom: WaveRange) {
        wave.name = name;
        wave.note = note;
        wave.selection = selection;
        wave.zoom = zoom;

        this.dispatchEvent(new CustomEvent("updateWave", { detail: wave }));
    }

    deleteWave(instrument: InstrumentDocument, wave: WaveDocument) {
        const index = instrument.waves.findIndex(c => c === wave);
        if (index === -1) {
            return;
        }

        instrument.waves.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteWave", { detail: wave }));
    }

    replaceWaveBuffer(wave: WaveDocument, offset: number, inputs: Float32Array[]) {

        for (let i = 0; i < wave.buffers.length; i++) {
            const output = wave.buffers[i];
            const input = inputs[i % inputs.length];

            for (let j = 0; j < input.length; j++) {
                output[offset + j] = input[j];
            }
        }

        this.dispatchEvent(new CustomEvent("updateWave", { detail: wave }));
    }

    duplicatePattern(pattern: PatternDocument) {
        const name = getNewPatternName(this.patterns);

        const p = this.createPattern(name, pattern.duration, pattern.subdivision);
        for (let column of pattern.columns) {
            const pc = this.createPatternColumn(p, column.instrument, column.pin);

            for (let event of column.events) {
                const pe = this.createPatternEvent(pc, event.time, event.value, event.data0, event.data1, event.channel);
            }
        }

        return p;
    }

    clearAll() {
        while (this.instruments.length) {
            this.deleteInstrument(this.instruments[this.instruments.length - 1]);
        }

        while (this.patterns.length) {
            this.deletePattern(this.patterns[this.patterns.length - 1]);
        }

        while (this.sequenceColumns.length) {
            this.deleteSequenceColumn(this.sequenceColumns[this.sequenceColumns.length - 1]);
        }
    }

    exportProjectJson() {
        const project = {
            bpm: this.bpm,
            instruments: this.instruments.map(instrument => ({
                name: instrument.name,
                ref: instrument.instrumentId,
                x: instrument.x,
                y: instrument.y,
                ccs: instrument.ccs,
                waves: instrument.waves.map(wave => ({
                    name: wave.name,
                    note: wave.note,
                    sampleRate: wave.sampleRate,
                    sampleCount: wave.sampleCount,
                    selection: wave.selection,
                    zoom: wave.zoom,
                    buffers: wave.buffers.map(b => compressFloat32ArrayToBase64(b)),
                }))
            })),
            connections: this.connections.map(connection => ({
                from: this.instruments.indexOf(connection.from),
                to: this.instruments.indexOf(connection.to),
            })),
            patterns: this.patterns.map(pattern => ({
                name: pattern.name,
                duration: pattern.duration,
                subdivision: pattern.subdivision,
                columns: pattern.columns.map(column => ({
                    instrument: this.instruments.indexOf(column.instrument),
                    pin: column.pin,
                    events: column.events.map(event => ({
                        time: event.time,
                        value: event.value,
                        data0: event.data0,
                        data1: event.data1,
                        channel: event.channel,
                    })),
                })),
            })),
            sequence: {
                columns: this.sequenceColumns.map(column => ({
                    events: column.events.map(event => ({
                        time: event.time,
                        pattern: this.patterns.indexOf(event.pattern),
                    })),
                })),
            },
        };
    
        return project;
    }

    importProjectJson(json) {
        this.clearAll();

        if (json.bpm) {
            this.setBpm(json.bpm);
        } else {
            this.setBpm(125);
        }

        for (let jsonInstrument of json.instruments) {
            const i = this.createInstrument(jsonInstrument.ref, jsonInstrument.name, jsonInstrument.x, jsonInstrument.y, jsonInstrument.ccs || {});

            if (Array.isArray(jsonInstrument.waves)) {
                for (let jsonWave of jsonInstrument.waves) {
                    const buffers = jsonWave.buffers.map(b => decompressBase64ToFloat32Array(b));
                    this.createWave(i, jsonWave.name, jsonWave.note || 60, jsonWave.sampleCount, jsonWave.sampleRate, buffers, jsonWave.selection, jsonWave.zoom);
                }
            }
        }

        for (let jsonConnection of json.connections) {
            const from = this.instruments[jsonConnection.from];
            const to = this.instruments[jsonConnection.to];

            if (!from || !to) {
                throw new Error("Invalid connection " + JSON.stringify(jsonConnection));
            }

            this.createConnection(from, to);
        }

        for (let jsonPattern of json.patterns) {
            const p = this.createPattern(jsonPattern.name, jsonPattern.duration, jsonPattern.subdivision ?? 4);

            for (let jsonColumn of jsonPattern.columns) {
                const instrument = this.instruments[jsonColumn.instrument];
                if (!instrument) {
                    throw new Error("Invalid or missing instrument in pattern column");
                }

                if (!Array.isArray(jsonColumn.events)) {
                    throw new Error("Invalid or missing events in pattern column");
                }

                const pc = this.createPatternColumn(p, instrument, jsonColumn.pin);

                for (let jsonEvent of jsonColumn.events) {
                    this.createPatternEvent(pc, jsonEvent.time, jsonEvent.value, jsonEvent.data0, jsonEvent.data1, jsonEvent.channel);
                }
            }
        }

        for (let jsonSequenceColumn of json.sequence.columns) {
            const sc = this.createSequenceColumn();
            for (let jsonEvent of jsonSequenceColumn.events) {
                const pattern = this.patterns[jsonEvent.pattern];
                this.createSequenceEvent(sc, jsonEvent.time, pattern);
            }
        }
    }
}
