import { deflate, inflate } from 'pako';

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

export class InstrumentDocument {
    name: string;
    instrumentId: string;
    x: number = 0;
    y: number = 0;
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

export class WaveDocumentEx {
    name: string;
    sampleCount: number;
    sampleRate: number;
    buffers: Float32Array[];
    // key: IDBValidKey;
}

export interface WaveRange {
    start: number;
    end: number;
}

export class SongDocument extends EventTarget {
    constructor() {
        super();

        this.createInstrument("@modulyzer/Master", "Master", 0, 0);
        const sc = this.createSequenceColumn();
        const p = this.createPattern("00", 32);
        this.createSequenceEvent(sc, 0, p);
    }

    name: string = "Untitled";
    bpm: number = 125;

    instruments: InstrumentDocument[] = [];
    connections: ConnectionDocument[] = [];
    patterns: PatternDocument[] = [];
    sequenceColumns: SequenceColumnDocument[] = [];
    waves: WaveDocumentEx[] = [];

    setBpm(bpm: number) {
        this.bpm = bpm;
        this.dispatchEvent(new CustomEvent("updateDocument", { detail: this }));
    }

    createInstrument(id: string, name: string, x, y) {
        const instrument = new InstrumentDocument();
        instrument.instrumentId = id;
        instrument.name = name;
        instrument.x = x;
        instrument.y = y;
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

    createPattern(name: string, duration: number) {
        const pattern = new PatternDocument();
        pattern.name = name;
        pattern.duration = duration;
        this.patterns.push(pattern);

        this.dispatchEvent(new CustomEvent("createPattern", { detail: pattern }));

        return pattern;
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

    updatePatternEvent(pe: PatternEventDocument, value: number, data0: number, data1: number) {
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

    createWave(name: string, sampleCount: number, sampleRate: number, buffers: Float32Array[]) {
        const wave = new WaveDocumentEx();
        wave.name = name;
        wave.sampleCount = sampleCount;
        wave.sampleRate = sampleRate;
        wave.buffers = buffers;
        this.waves.push(wave);

        this.dispatchEvent(new CustomEvent("createWave", { detail: wave }));

        return wave;
    }

    deleteWave(wave: WaveDocumentEx) {
        const index = this.waves.findIndex(c => c === wave);
        if (index === -1) {
            return;
        }

        this.waves.splice(index, 1);
        this.dispatchEvent(new CustomEvent("deleteWave", { detail: wave }));
    }

    replaceWaveBuffer(wave: WaveDocumentEx, offset: number, inputs: Float32Array[]) {

        for (let i = 0; i < wave.buffers.length; i++) {
            const output = wave.buffers[i];
            const input = inputs[i % inputs.length];

            for (let j = 0; j < input.length; j++) {
                output[offset + j] = input[j];
            }
        }

        this.dispatchEvent(new CustomEvent("updateWave", { detail: wave }));
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

        while (this.waves.length) {
            this.deleteWave(this.waves[this.waves.length - 1]);
        }

    }

    exportProjectJson() {
        const project = {
            instruments: this.instruments.map(instrument => ({
                name: instrument.name,
                ref: instrument.instrumentId,
                x: instrument.x,
                y: instrument.y,
            })),
            connections: this.connections.map(connection => ({
                from: this.instruments.indexOf(connection.from),
                to: this.instruments.indexOf(connection.to),
            })),
            patterns: this.patterns.map(pattern => ({
                name: pattern.name,
                duration: pattern.duration,
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
            waves: this.waves.map(wave => ({
                name: wave.name,
                sampleRate: wave.sampleRate,
                sampleCount: wave.sampleCount,
                buffers: wave.buffers.map(b => compressFloat32ArrayToBase64(b)),
            }))
        };
    
        return project;
    }

    importProjectJson(json) {
        // this.instruments = [];
        // this.connections = [];
        // this.patterns = [];
        this.clearAll();

        for (let jsonInstrument of json.instruments) {
            const i = this.createInstrument(jsonInstrument.ref, jsonInstrument.name, jsonInstrument.x, jsonInstrument.y);
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
            const p = this.createPattern(jsonPattern.name, jsonPattern.duration);

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

        // waves -> embed or refer to filenames (in storage, zip, ??)
        for (let jsonWave of json.waves) {
            const buffers = jsonWave.buffers.map(b => decompressBase64ToFloat32Array(b));
            this.createWave(jsonWave.name, jsonWave.sampleCount, jsonWave.sampleRate, buffers);
        }
    }

}
