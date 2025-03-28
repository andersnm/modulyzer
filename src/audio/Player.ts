import { Instrument, InstrumentFactory } from "./plugins/InstrumentFactory";
import { ConnectionDocument, InstrumentDocument, PatternColumnDocument, PatternDocument, PatternEventDocument, SequenceColumnDocument, SequenceEventDocument, SongDocument, WaveDocumentEx } from "./SongDocument";

const SCHEDULE_INTERVAL = 0.5;

function areOverlapping(startA, endA, startB, endB) {
    if(startB < startA) {
        return endB > startA;
    }
    else {
        return startB < endA;
    }
}

class PatternColumn {
    patternColumnDocument: PatternColumnDocument;
    instrument: Instrument;
    pin: number;
    events: PatternEvent[] = [];

    constructor(patternColumnDocument: PatternColumnDocument) {
        this.patternColumnDocument = patternColumnDocument;
    }
}

export class PatternEvent {
    patternEventDocument: PatternEventDocument;
    time: number;
    value: number;
    data0: number;
    data1: number;
    channel: number;

    constructor(patternEventDocument: PatternEventDocument) {
        this.patternEventDocument = patternEventDocument;
    }
}

export class Pattern {
    patternDocument: PatternDocument;
    name: string;
    columns: PatternColumn[] = [];
    duration: number;

    constructor(patternDocument: PatternDocument) {
        this.patternDocument = patternDocument;
    }
}

export class SequenceEvent {
    sequenceEventDocument: SequenceEventDocument;
    time: number;
    pattern: Pattern;

    constructor(sequenceEventDocument: SequenceEventDocument) {
        this.sequenceEventDocument = sequenceEventDocument;
    }
}

export class SequenceColumn {
    sequenceColumnDocument: SequenceColumnDocument;
    events: SequenceEvent[] = [];

    constructor(sequenceColumnDocument: SequenceColumnDocument) {
        this.sequenceColumnDocument = sequenceColumnDocument;
    }
}

export class Sequence {
    columns: SequenceColumn[] = [];
}

export class Connection {
    from: Instrument;
    to: Instrument;
}

export class Wave {
    name: string;
    note: number;
    sampleRate: number;
    sampleCount: number;
    buffers: Float32Array[];
    audioBuffer: AudioBuffer;
}

export class Player {
    context: AudioContext;
    playing: boolean = false;
    startTime: number;
    currentTime: number;
    song: SongDocument;
    instrumentFactories: InstrumentFactory[];
    patterns: Pattern[] = [];
    instruments: Instrument[] = [];
    connections: Connection[] = [];
    waves: Wave[] = [];

    sequence: Sequence = new Sequence();
    bpm: number = 125;

    constructor(song: SongDocument, instrumentFactories: InstrumentFactory[], context: AudioContext) {
        console.log("INITING PLAYER", instrumentFactories)
        this.song = song;
        this.instrumentFactories = instrumentFactories;
        this.context = context;

        this.attachDocument(song);
    }

    attachDocument(song: SongDocument) {
        // TODO; use local maps instead of object member props for the document mappings -> refactor to PlayerDocumentListener
        const instrumentMap: Map<InstrumentDocument, Instrument> = new Map();
        const patternMap: Map<PatternDocument, Pattern>  = new Map();
        const connectionMap: Map<ConnectionDocument, Connection>  = new Map();
        const waveMap: Map<WaveDocumentEx, Wave>  = new Map();

        this.bpm = song.bpm;

        for (let i of song.instruments) {
            const factory = this.getInstrumentFactoryById(i.instrumentId);
            const instrument = factory.createInstrument(this.context, this);
            this.instruments.push(instrument);
            instrumentMap.set(i, instrument);
        }

        for (let c of song.connections) {
            const connection = new Connection();
            connection.from = instrumentMap.get(c.from);
            connection.to = instrumentMap.get(c.to);

            connection.from.connect(connection.to);
            this.connections.push(connection);
            connectionMap.set(c, connection);
        }

        for (let p of song.patterns) {
            const pattern = new Pattern(p);
            pattern.name = p.name;
            pattern.duration = p.duration;
            this.patterns.push(pattern);
            patternMap.set(p, pattern);

            for (let pc of p.columns) {
                const patternColumn = new PatternColumn(pc);
                patternColumn.instrument = instrumentMap.get(pc.instrument);
                patternColumn.pin = pc.pin;

                pattern.columns.push(patternColumn);

                for (let pe of pc.events) {
                    const patternEvent = new PatternEvent(pe);
                    patternEvent.time = pe.time;
                    patternEvent.value = pe.value;
                    patternEvent.data0 = pe.data0;
                    patternEvent.data1 = pe.data1;
                    patternEvent.channel = pe.channel;
                    
                    patternColumn.events.push(patternEvent);
                }
            }
        }

        for (let sc of song.sequenceColumns) {
            const seq = new SequenceColumn(sc);
            for (let se of sc.events) {
                const pattern = patternMap.get(se.pattern); // TODO!;
                const seqEv = new SequenceEvent(se);
                seqEv.time = se.time;
                seqEv.pattern = pattern;
                seq.events.push(seqEv); 
            }
        
            this.sequence.columns.push(seq);
        }

        for (let w of song.waves) {

        }

        song.addEventListener("updateDocument", (ev: CustomEvent<SongDocument>) => {
            this.bpm = ev.detail.bpm;
        });

        song.addEventListener("createInstrument", (ev: CustomEvent<InstrumentDocument>) => {
            const i = ev.detail;
            const factory = this.getInstrumentFactoryById(i.instrumentId);
            if (!factory) {
                console.error("Unknown instrument " + i.instrumentId, i);
                return;
            }
            const instrument = factory.createInstrument(this.context, this);
            this.instruments.push(instrument);
            
            instrumentMap.set(i, instrument);
        });

        song.addEventListener("deleteInstrument", (ev: CustomEvent<InstrumentDocument>) => {
            const i = ev.detail;

            const instrument = instrumentMap.get(i);

            const ix = this.instruments.indexOf(instrument);
            this.connections.splice(ix, 1);
            instrumentMap.delete(i);
        });

        song.addEventListener("createConnection", (ev: CustomEvent<ConnectionDocument>) => {
            const c = ev.detail;

            const connection = new Connection();
            connection.from = instrumentMap.get(c.from);
            connection.to = instrumentMap.get(c.to);

            connection.from.connect(connection.to);
            this.connections.push(connection);
            connectionMap.set(c, connection);
        });

        song.addEventListener("deleteConnection", (ev: CustomEvent<ConnectionDocument>) => {
            const c = ev.detail;

            const connection = connectionMap.get(c);

            connection.from.disconnect(connection.to);

            const i = this.connections.indexOf(connection);
            this.connections.splice(i, 1);
            connectionMap.delete(c);
        });

        song.addEventListener("createWave", (ev: CustomEvent<WaveDocumentEx>) => {
            const w = ev.detail;

            const audioBuffer = this.context.createBuffer(w.buffers.length, w.sampleCount, w.sampleRate);
            for (let i = 0; i < w.buffers.length; i++) {
                const buffer = audioBuffer.getChannelData(i);
                buffer.set(w.buffers[i]);
            }

            const wave = new Wave();
            wave.buffers = w.buffers; // maybe dont need this
            wave.audioBuffer = audioBuffer;
            wave.name = w.name;
            wave.note = w.note;
            wave.sampleCount = w.sampleCount;
            wave.sampleRate = w.sampleRate;
            this.waves.push(wave);

            waveMap.set(w, wave);
        });

        song.addEventListener("updateWave", (ev: CustomEvent<WaveDocumentEx>) => {
            const w = ev.detail;

            const wave = waveMap.get(w);
            wave.note = w.note;
            wave.name = w.name;

            if (w.sampleCount !== wave.sampleCount) {
                const audioBuffer = this.context.createBuffer(w.buffers.length, w.sampleCount, w.sampleRate);
                for (let i = 0; i < w.buffers.length; i++) {
                    const buffer = audioBuffer.getChannelData(i);
                    buffer.set(w.buffers[i]);
                }

                wave.audioBuffer = audioBuffer;
                wave.sampleCount = w.sampleCount;
            } else {
                for (let i = 0; i < w.buffers.length; i++) {
                    const buffer = wave.audioBuffer.getChannelData(i);
                    buffer.set(w.buffers[i]);
                }
            }
        });

        song.addEventListener("createPattern", (ev: CustomEvent<PatternDocument>) => {
            const pattern = ev.detail;
            const p = new Pattern(pattern);
            p.name = pattern.name;
            p.duration = pattern.duration;
            this.patterns.push(p);
            patternMap.set(pattern, p);
        });

        song.addEventListener("deletePattern", (ev: CustomEvent<PatternDocument>) => {
            const pattern = ev.detail;
            const index = this.patterns.findIndex(e => e.patternDocument === pattern);
            this.patterns.splice(index, 1);
            patternMap.delete(pattern);
        });

        song.addEventListener("createPatternColumn", (ev: CustomEvent<PatternColumnDocument>) => {
            const patternColumn = ev.detail;
            const pattern = patternColumn.pattern;
            const p = this.patterns.find(p => p.patternDocument === pattern);
            const pc = new PatternColumn(patternColumn);
            pc.instrument = instrumentMap.get(patternColumn.instrument);
            pc.pin = patternColumn.pin;
            p.columns.push(pc);
        });

        song.addEventListener("createPatternEvent", (ev: CustomEvent<PatternEventDocument>) => {
            const patternEvent = ev.detail;
            const patternColumn = patternEvent.patternColumn;
            const pattern = patternColumn.pattern;

            const p = this.patterns.find(p => p.patternDocument === pattern);
            const pc = p.columns.find(c => c.patternColumnDocument === patternColumn);

            const pe = new PatternEvent(patternEvent);
            pe.time = patternEvent.time;
            pe.value = patternEvent.value;
            pe.data0 = patternEvent.data0;
            pe.data1 = patternEvent.data1;

            // TODO; insert at time
            pc.events.push(pe);
        });

        song.addEventListener("updatePatternEvent", (ev: CustomEvent<PatternEventDocument>) => {
            console.log("PLY; UPDATE PATTERNEVENT", ev.detail)
            const patternEvent = ev.detail;
            const patternColumn = patternEvent.patternColumn;
            const pattern = patternColumn.pattern;

            const p = this.patterns.find(p => p.patternDocument === pattern);
            const pc = p.columns.find(c => c.patternColumnDocument === patternColumn);
            const pe = pc.events.find(e => e.patternEventDocument === patternEvent);

            pe.value = patternEvent.value;
            pe.data0 = patternEvent.data0;
            pe.data1 = patternEvent.data1;
        });

        song.addEventListener("deletePatternEvent", (ev: CustomEvent<PatternEventDocument>) => {
            console.log("PLY; DELETE PATTERNEVENT", ev.detail)
            const patternEvent = ev.detail;
            const patternColumn = patternEvent.patternColumn;
            const pattern = patternColumn.pattern;
            const p = this.patterns.find(p => p.patternDocument === pattern);
            const pc = p.columns.find(c => c.patternColumnDocument === patternColumn);
            const index = pc.events.findIndex(e => e.patternEventDocument === patternEvent);

            pc.events.splice(index, 1);
        });

        song.addEventListener("createSequenceColumn", (ev: CustomEvent<SequenceColumnDocument>) => {
            const sequenceColumn = ev.detail;

            const sc = new SequenceColumn(sequenceColumn);
            this.sequence.columns.push(sc);
        });

        song.addEventListener("deleteSequenceColumn", (ev: CustomEvent<SequenceColumnDocument>) => {
            const sequenceColumn = ev.detail;

            const index = this.sequence.columns.findIndex(e => e.sequenceColumnDocument === sequenceColumn);
            this.sequence.columns.splice(index, 1);
        });

        song.addEventListener("createSequenceEvent", (ev: CustomEvent<SequenceEventDocument>) => {
            const sequenceEvent = ev.detail;
            const sequenceColumn = sequenceEvent.sequenceColumn;
            const p = this.patterns.find(p => p.patternDocument === sequenceEvent.pattern);
            const sc = this.sequence.columns.find(c => c.sequenceColumnDocument === sequenceColumn);

            const se = new SequenceEvent(sequenceEvent);
            se.time = sequenceEvent.time;
            se.pattern = p;
            sc.events.push(se);
        });

        song.addEventListener("updateSequenceEvent", (ev: CustomEvent<SequenceEventDocument>) => {
            const sequenceEvent = ev.detail;
            const sequenceColumn = sequenceEvent.sequenceColumn;

            const p = this.patterns.find(p => p.patternDocument === sequenceEvent.pattern);
            const sc = this.sequence.columns.find(c => c.sequenceColumnDocument === sequenceColumn);
            const se = sc.events.find(e => e.sequenceEventDocument === sequenceEvent);

            se.pattern = p;
        });

        song.addEventListener("deleteSequenceEvent", (ev: CustomEvent<SequenceEventDocument>) => {
            const sequenceEvent = ev.detail;
            const sequenceColumn = sequenceEvent.sequenceColumn;
            const sc = this.sequence.columns.find(c => c.sequenceColumnDocument === sequenceColumn);
            const index = sc.events.findIndex(e => e.sequenceEventDocument === sequenceEvent);

            console.log("player delete sequence event", index)
            sc.events.splice(index, 1);
        });
    }

    getInstrumentFactoryById(id) {
        for (let instrumentFactory of this.instrumentFactories) {
            if (instrumentFactory.getIdentifier() === id) {
                return instrumentFactory;
            }
        }

        return null;
    }

    playInterval;
    play() {
        if (this.playing) {
            return;
        }

        this.playing = true;

        this.currentTime = 0;
        this.startTime = this.context.currentTime;

        // schedule 1 second first, then reschedule after 500ms to fill so we remain 1 second ahead
        this.scheduleSequence(this.startTime, this.currentTime, SCHEDULE_INTERVAL);
        this.currentTime = SCHEDULE_INTERVAL;

        this.playInterval = setInterval(() => {

            const until = this.context.currentTime + SCHEDULE_INTERVAL;
            const duration = until - (this.startTime + this.currentTime);

            // from startTime until 
            console.log("Playr time", this.currentTime, "Duration", duration, "Dvic time", this.context.currentTime, "relative to", this.startTime )
            // schedule events in the next second window
            // correlate with main time
            this.scheduleSequence(this.startTime, this.currentTime, duration);
            
            this.currentTime = until - this.startTime;

        }, SCHEDULE_INTERVAL * 1000 / 2);
    }

    stop() {
        if (!this.playing) {
            return;
        }

        clearInterval(this.playInterval);
        this.playInterval = null;
        this.playing = false;

        for (let instrument of this.instruments) {
            instrument.sendMidi(0, 0xB0, 0x7b, 0);
        }
    }

    schedulePattern(pattern: Pattern, deviceTime: number, fromTime: number, duration: number) {
        // schedule events within local pattern time fromTime, 
        // fromtime can be negative, just means we want to skip non-existent notes 2 seconds before
        // notes in range are offset by the sequenceTime
        for (let column of pattern.columns) {
            const instrument = column.instrument; // this.instruments[column.instrument];
            const pins = instrument.factory.getPins();
            const pin = pins[column.pin];

            for (let event of column.events) {
                const eventTime = this.toSeconds(event.time);
                if (eventTime >= fromTime && eventTime < fromTime + duration) {
                    if (pin.type === "controller") {
                        console.log("Sending controller", column, deviceTime, eventTime, pin.value, event.value, 0);
                        instrument.sendMidi(deviceTime + eventTime, 0xB0, pin.value, event.value);
                    } else if (pin.type === "note") {
                        console.log("Sending note", column, deviceTime, eventTime, event.value, event.data0);
                        instrument.sendMidi(deviceTime + eventTime, 0x90, event.value, event.data0);
                    } else {
                        console.error("Unknown pin type" + pin.type);
                    }
                }
            }
        }
    }

    toSeconds(rowIndex: number) {
        const rowsPerBeat = 4; // pr-pattern
        const beatsPerSecond = this.bpm / 60;
        const rowsPerSecond = beatsPerSecond * rowsPerBeat;
        return rowIndex / rowsPerSecond;
    }

    scheduleSequence(deviceTime: number, fromTime: number, duration: number) {

        for (let column of this.sequence.columns) {
            for (let ev of column.events) {
                const p = ev.pattern;

                // do ev.time .. p.duration overlap with fromTime + duration

                const evTime = this.toSeconds(ev.time);
                const patternDuration = this.toSeconds(p.duration);

                if (areOverlapping(evTime, evTime + patternDuration, fromTime, duration)) {
                    // this pattern is playing at this time
                    // pattern starts at 60 , is 16 long, ev.time = 60
                    // fromTim = 58, duration 4, is -2 ahead
                    // fromTim = 61, duration 4, is 1 into
                    this.schedulePattern(p, deviceTime + evTime, fromTime - evTime, duration);
                }
            }
        }
    }
}
