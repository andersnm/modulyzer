import { Connection, Pattern, PatternColumn, PatternEvent, Player, SequenceColumn, SequenceEvent, Wave } from "./Player";
import { Instrument } from "./plugins/InstrumentFactory";
import { ConnectionDocument, InstrumentDocument, PatternColumnDocument, PatternDocument, PatternEventDocument, SequenceColumnDocument, SequenceEventDocument, SongDocument, WaveDocumentEx } from "./SongDocument";

export class PlayerSongAdapter {
    player: Player; 
    song: SongDocument;
    instrumentMap: Map<InstrumentDocument, Instrument> = new Map();
    connectionMap: Map<ConnectionDocument, Connection>  = new Map();
    patternMap: Map<PatternDocument, Pattern>  = new Map();
    patternColumnMap: Map<PatternColumnDocument, PatternColumn>  = new Map();
    patternEventMap: Map<PatternEventDocument, PatternEvent>  = new Map();
    sequenceColumnMap: Map<SequenceColumnDocument, SequenceColumn>  = new Map();
    sequenceEventMap: Map<SequenceEventDocument, SequenceEvent>  = new Map();
    waveMap: Map<WaveDocumentEx, Wave>  = new Map();

    constructor(player: Player, song: SongDocument) {
        this.player = player;
        this.song = song;

        // TODO: removeEventListener at the end of the player lifetime
        this.song.addEventListener("updateDocument", this.onUpdateDocument);
        this.song.addEventListener("createInstrument", this.onCreateInstrument);
        this.song.addEventListener("deleteInstrument", this.onDeleteInstrument);
        this.song.addEventListener("createConnection", this.onCreateConnection);
        this.song.addEventListener("deleteConnection", this.onDeleteConnection);
        this.song.addEventListener("createWave", this.onCreateWave);
        this.song.addEventListener("updateWave", this.onUpdateWave);
        this.song.addEventListener("createPattern", this.onCreatePattern);
        this.song.addEventListener("deletePattern", this.onDeletePattern);
        this.song.addEventListener("createPatternColumn", this.onCreatePatternColumn);
        this.song.addEventListener("deletePatternColumn", this.onDeletePatternColumn);
        this.song.addEventListener("createPatternEvent", this.onCreatePatternEvent);
        this.song.addEventListener("updatePatternEvent", this.onUpdatePatternEvent);
        this.song.addEventListener("deletePatternEvent", this.onDeletePatternEvent);
        this.song.addEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.song.addEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
        this.song.addEventListener("createSequenceEvent", this.onCreateSequenceEvent);
        this.song.addEventListener("updateSequenceEvent", this.onUpdateSequenceEvent);
        this.song.addEventListener("deleteSequenceEvent", this.onDeleteSequenceEvent);

        this.attachDocument();
    }

    attachDocument() {

        this.player.bpm = this.song.bpm;

        for (let i of this.song.instruments) {
            this.onCreateInstrument(new CustomEvent("createInstrument", { detail: i }));
        }

        for (let c of this.song.connections) {
            this.onCreateConnection(new CustomEvent("createConnection", { detail: c }));
        }

        for (let p of this.song.patterns) {
            this.onCreatePattern(new CustomEvent("createPattern", { detail: p }));
            for (let pc of p.columns) {
                this.onCreatePatternColumn(new CustomEvent("createPatternColumn", { detail: pc }));
                 for (let pe of pc.events) {
                    this.onCreatePatternEvent(new CustomEvent("createPatternEvent", { detail: pe }));
                 }
            }
        }

        for (let sc of this.song.sequenceColumns) {
            this.onCreateSequenceColumn(new CustomEvent("createSequenceColumn", { detail: sc }));
            for (let se of sc.events) {
                this.onCreateSequenceEvent(new CustomEvent("createSequenceEvent", { detail: se }));
            }
        }

        for (let w of this.song.waves) {
            this.onCreateWave(new CustomEvent("createWave", { detail: w }));
        }
    }

    onUpdateDocument = (ev: CustomEvent<SongDocument>) => {
        this.player.bpm = ev.detail.bpm;
    };

    onCreateInstrument = (ev: CustomEvent<InstrumentDocument>) => {
        const i = ev.detail;
        const factory = this.player.getInstrumentFactoryById(i.instrumentId);
        if (!factory) {
            console.error("Unknown instrument " + i.instrumentId, i);
            return;
        }
        const instrument = factory.createInstrument(this.player.context, this.player);
        this.player.instruments.push(instrument);

        this.instrumentMap.set(i, instrument);
    };

    onDeleteInstrument = (ev: CustomEvent<InstrumentDocument>) => {
        const i = ev.detail;

        const instrument = this.instrumentMap.get(i);

        const ix = this.player.instruments.indexOf(instrument);
        this.player.instruments.splice(ix, 1);

        this.instrumentMap.delete(i);
    };

    onCreateConnection = (ev: CustomEvent<ConnectionDocument>) => {
        const c = ev.detail;

        const connection = new Connection();
        connection.from = this.instrumentMap.get(c.from);
        connection.to = this.instrumentMap.get(c.to);

        connection.from.connect(connection.to);
        this.player.connections.push(connection);

        this.connectionMap.set(c, connection);
    };

    onDeleteConnection = (ev: CustomEvent<ConnectionDocument>) => {
        const c = ev.detail;

        const connection = this.connectionMap.get(c);

        connection.from.disconnect(connection.to);

        const i = this.player.connections.indexOf(connection);
        this.player.connections.splice(i, 1);

        this.connectionMap.delete(c);
    };

    onCreateWave = (ev: CustomEvent<WaveDocumentEx>) => {
        const w = ev.detail;

        const audioBuffer = this.player.context.createBuffer(w.buffers.length, w.sampleCount, w.sampleRate);
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
        this.player.waves.push(wave);

        this.waveMap.set(w, wave);
    };

    onUpdateWave = (ev: CustomEvent<WaveDocumentEx>) => {
        const w = ev.detail;

        const wave = this.waveMap.get(w);
        wave.note = w.note;
        wave.name = w.name;

        if (w.sampleCount !== wave.sampleCount) {
            const audioBuffer = this.player.context.createBuffer(w.buffers.length, w.sampleCount, w.sampleRate);
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
    };

    onCreatePattern = (ev: CustomEvent<PatternDocument>) => {
        const pattern = ev.detail;
        const p = new Pattern();
        p.name = pattern.name;
        p.duration = pattern.duration;
        this.player.patterns.push(p);

        this.patternMap.set(pattern, p);
    };

    onDeletePattern = (ev: CustomEvent<PatternDocument>) => {
        const pattern = ev.detail;
        const p = this.patternMap.get(pattern);
        const index = this.player.patterns.findIndex(e => e === p);
        this.player.patterns.splice(index, 1);

        this.patternMap.delete(pattern);
    };

    onCreatePatternColumn = (ev: CustomEvent<PatternColumnDocument>) => {
        const patternColumn = ev.detail;
        const pattern = patternColumn.pattern;
        const p = this.patternMap.get(pattern);

        const pc = new PatternColumn();
        pc.instrument = this.instrumentMap.get(patternColumn.instrument);
        pc.pin = patternColumn.pin;
        p.columns.push(pc);

        this.patternColumnMap.set(patternColumn, pc);
    };

    onDeletePatternColumn = (ev: CustomEvent<PatternColumnDocument>) => {
        const patternColumn = ev.detail;
        const pattern = patternColumn.pattern;
        const p = this.patternMap.get(pattern);
        const pc = this.patternColumnMap.get(patternColumn);
        const index = p.columns.indexOf(pc);
        p.columns.splice(index, 1);

        this.patternColumnMap.delete(patternColumn);
    };

    onCreatePatternEvent = (ev: CustomEvent<PatternEventDocument>) => {
        const patternEvent = ev.detail;
        const patternColumn = patternEvent.patternColumn;
        const pc = this.patternColumnMap.get(patternColumn);

        const pe = new PatternEvent();
        pe.time = patternEvent.time;
        pe.value = patternEvent.value;
        pe.data0 = patternEvent.data0;
        pe.data1 = patternEvent.data1;

        // TODO; insert at time
        pc.events.push(pe);
        this.patternEventMap.set(patternEvent, pe);
    };

    onUpdatePatternEvent = (ev: CustomEvent<PatternEventDocument>) => {
        const patternEvent = ev.detail;
        const pe = this.patternEventMap.get(patternEvent);

        pe.value = patternEvent.value;
        pe.data0 = patternEvent.data0;
        pe.data1 = patternEvent.data1;
    };

    onDeletePatternEvent = (ev: CustomEvent<PatternEventDocument>) => {
        const patternEvent = ev.detail;
        const patternColumn = patternEvent.patternColumn;

        const pc = this.patternColumnMap.get(patternColumn);
        const pe = this.patternEventMap.get(patternEvent);
        const index = pc.events.indexOf(pe);
        pc.events.splice(index, 1);
        this.patternEventMap.delete(patternEvent);
    };

    onCreateSequenceColumn = (ev: CustomEvent<SequenceColumnDocument>) => {
        const sequenceColumn = ev.detail;

        const sc = new SequenceColumn();
        this.player.sequence.columns.push(sc);

        this.sequenceColumnMap.set(sequenceColumn, sc);
    };

    onDeleteSequenceColumn = (ev: CustomEvent<SequenceColumnDocument>) => {
        const sequenceColumn = ev.detail;

        const sc = this.sequenceColumnMap.get(sequenceColumn);
        const index = this.player.sequence.columns.indexOf(sc);
        this.player.sequence.columns.splice(index, 1);

        this.sequenceColumnMap.delete(sequenceColumn);
    };

    onCreateSequenceEvent = (ev: CustomEvent<SequenceEventDocument>) => {
        const sequenceEvent = ev.detail;
        const sequenceColumn = sequenceEvent.sequenceColumn;
        const p = this.patternMap.get(sequenceEvent.pattern);
        const sc = this.sequenceColumnMap.get(sequenceColumn);

        const se = new SequenceEvent();
        se.time = sequenceEvent.time;
        se.pattern = p;
        sc.events.push(se);

        this.sequenceEventMap.set(sequenceEvent, se);
    };

    onUpdateSequenceEvent = (ev: CustomEvent<SequenceEventDocument>) => {
        const sequenceEvent = ev.detail;
        const p = this.patternMap.get(sequenceEvent.pattern);
        const se = this.sequenceEventMap.get(sequenceEvent);

        se.pattern = p;
    };

    onDeleteSequenceEvent = (ev: CustomEvent<SequenceEventDocument>) => {
        const sequenceEvent = ev.detail;
        const sequenceColumn = sequenceEvent.sequenceColumn;
        const sc = this.sequenceColumnMap.get(sequenceColumn);
        const se = this.sequenceEventMap.get(sequenceEvent);
        const index = sc.events.indexOf(se);

        sc.events.splice(index, 1);
    };
}
