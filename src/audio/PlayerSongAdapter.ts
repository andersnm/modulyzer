import { Connection, Pattern, PatternColumn, PatternEvent, Player, SequenceColumn, SequenceEvent, Wave } from "./Player";
import { CcChangeDetail, Instrument } from "./plugins/InstrumentFactory";
import { ConnectionDocument, InstrumentDocument, PatternColumnDocument, PatternDocument, PatternEventDocument, SequenceColumnDocument, SequenceEventDocument, SongDocument, WaveDocument } from "./SongDocument";

function findByValue<K, V>(map: Map<K, V>, value: V): K | undefined {
    for (const entry of map.entries()) {
        if (entry[1] === value) {
            return entry[0];
        }
    }
    return undefined;
}

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
    waveMap: Map<WaveDocument, Wave>  = new Map();

    constructor(song: SongDocument) {
        this.song = song;
    }

    attachPlayer(player: Player) {
        if (this.player) {
            this.detachPlayer();
        }

        this.player = player;

        this.song.addEventListener("updateDocument", this.onUpdateDocument);
        this.song.addEventListener("createInstrument", this.onCreateInstrument);
        this.song.addEventListener("deleteInstrument", this.onDeleteInstrument);
        this.song.addEventListener("createConnection", this.onCreateConnection);
        this.song.addEventListener("deleteConnection", this.onDeleteConnection);
        this.song.addEventListener("createWave", this.onCreateWave);
        this.song.addEventListener("updateWave", this.onUpdateWave);
        this.song.addEventListener("createPattern", this.onCreatePattern);
        this.song.addEventListener("updatePattern", this.onUpdatePattern);
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

        this.player.addEventListener("playing", this.onPlaying);
        this.player.addEventListener("stopped", this.onStopped);

        this.player.bpm = this.song.bpm;
        this.player.loopStart = this.song.loopStart;
        this.player.loopEnd = this.song.loopEnd;

        for (let i of this.song.instruments) {
            this.onCreateInstrument(new CustomEvent("createInstrument", { detail: i }));

            for (let w of i.waves) {
                this.onCreateWave(new CustomEvent("createWave", { detail: w }));
            }
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
    }

    detachPlayer() {
        this.song.removeEventListener("updateDocument", this.onUpdateDocument);
        this.song.removeEventListener("createInstrument", this.onCreateInstrument);
        this.song.removeEventListener("deleteInstrument", this.onDeleteInstrument);
        this.song.removeEventListener("createConnection", this.onCreateConnection);
        this.song.removeEventListener("deleteConnection", this.onDeleteConnection);
        this.song.removeEventListener("createWave", this.onCreateWave);
        this.song.removeEventListener("updateWave", this.onUpdateWave);
        this.song.removeEventListener("createPattern", this.onCreatePattern);
        this.song.removeEventListener("updatePattern", this.onUpdatePattern);
        this.song.removeEventListener("deletePattern", this.onDeletePattern);
        this.song.removeEventListener("createPatternColumn", this.onCreatePatternColumn);
        this.song.removeEventListener("deletePatternColumn", this.onDeletePatternColumn);
        this.song.removeEventListener("createPatternEvent", this.onCreatePatternEvent);
        this.song.removeEventListener("updatePatternEvent", this.onUpdatePatternEvent);
        this.song.removeEventListener("deletePatternEvent", this.onDeletePatternEvent);
        this.song.removeEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.song.removeEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
        this.song.removeEventListener("createSequenceEvent", this.onCreateSequenceEvent);
        this.song.removeEventListener("updateSequenceEvent", this.onUpdateSequenceEvent);
        this.song.removeEventListener("deleteSequenceEvent", this.onDeleteSequenceEvent);

        this.player.removeEventListener("playing", this.onPlaying);
        this.player.removeEventListener("stopped", this.onStopped);
        this.player = null;
    }

    onPlaying = () => {
        this.song.dispatchEvent(new CustomEvent("playing"));
    };

    onStopped = () => {
        this.song.dispatchEvent(new CustomEvent("stopped"));
    };

    onUpdateDocument = (ev: CustomEvent<SongDocument>) => {
        this.player.bpm = ev.detail.bpm;
        this.player.loopStart = ev.detail.loopStart;
        this.player.loopEnd = ev.detail.loopEnd;
    };

    onCreateInstrument = (ev: CustomEvent<InstrumentDocument>) => {
        const i = ev.detail;
        const factory = this.player.getInstrumentFactoryById(i.instrumentId);
        if (!factory) {
            console.error("Unknown instrument " + i.instrumentId, i);
            return;
        }

        const instrument = factory.createInstrument(this.player.context, this.player);
        instrument.addEventListener("ccchange", this.onInstrumentCcChange);

        this.player.instruments.push(instrument);
        this.instrumentMap.set(i, instrument);

        // Set CCs for all controller pins to initial or default
        const pins = factory.getPins();
        for (let pin of pins) {
            if (pin.type !== "controller" || pin.value === undefined) {
                continue;
            }

            const ccValue = i.ccs[pin.value];
            if (ccValue !== undefined) {
                instrument.sendMidi(0, 0xB0, pin.value, ccValue);
            } else {
                const pinDefault = pin.default ?? 64;
                instrument.sendMidi(0, 0xB0, pin.value, pinDefault);
            }
        }
    };

    onInstrumentCcChange = (ev: CustomEvent<CcChangeDetail>) => {
        // Only called for CCs with a pin
        // TODO: reverse instrument map
        const instrument = findByValue(this.instrumentMap, ev.detail.instrument);
        if (!instrument) {
            console.error("Document/player out of sync", ev.detail.instrument)
            return;
        }

        // NOTE/TODO?: No dispatch here, PinsPanel subscribes to ccchange too
        instrument.ccs[ev.detail.value] = ev.detail.data;
    };

    onDeleteInstrument = (ev: CustomEvent<InstrumentDocument>) => {
        const i = ev.detail;

        const instrument = this.instrumentMap.get(i);
        instrument.removeEventListener("ccchange", this.onInstrumentCcChange);

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

    onCreateWave = (ev: CustomEvent<WaveDocument>) => {
        const w = ev.detail;

        const instrument = this.instrumentMap.get(w.instrument);

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
        instrument.waves.push(wave);

        this.waveMap.set(w, wave);
    };

    onUpdateWave = (ev: CustomEvent<WaveDocument>) => {
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
        p.subdivision = pattern.subdivision;
        this.player.patterns.push(p);

        this.patternMap.set(pattern, p);
    };

    onUpdatePattern = (ev: CustomEvent<PatternDocument>) => {
        const pattern = ev.detail;
        const p = this.patternMap.get(pattern);

        p.name = pattern.name;
        p.duration = pattern.duration;
        p.subdivision = pattern.subdivision;
        p.swing = pattern.swing / 100;
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

        this.insertPatternEventAtTime(pc, pe);
        this.patternEventMap.set(patternEvent, pe);
    };

    insertPatternEventAtTime(pc: PatternColumn, pe: PatternEvent) {
        // Insert sorted by time, events at the same time are sorted by
        // ascending velocity/cc value - note offs before notes
        let ti = pc.events.findIndex(e => e.time >= pe.time);
        if (ti !== -1) {
            const te = pc.events[ti];
            if (te.time > pe.time) {
                pc.events.splice(ti, 0, pe);
            } else {
                // Scan events at same timestamp
                let se = te;
                while (se.time === pe.time && se.data0 < pe.data0) {
                    ti++;
                    if (ti >= pc.events.length) {
                        break;
                    }

                    se = pc.events[ti];
                }

                pc.events.splice(ti, 0, pe);
            }
        } else {
            pc.events.push(pe);
        }
    }

    onUpdatePatternEvent = (ev: CustomEvent<PatternEventDocument>) => {
        const patternEvent = ev.detail;
        const pe = this.patternEventMap.get(patternEvent);

        pe.value = patternEvent.value;
        pe.data0 = patternEvent.data0;
        pe.data1 = patternEvent.data1;

        if (pe.time !== patternEvent.time) {
            pe.time = patternEvent.time;

            const patternColumn = patternEvent.patternColumn;
            const pc = this.patternColumnMap.get(patternColumn);
            const idx = pc.events.indexOf(pe);
            pc.events.splice(idx, 1);
            this.insertPatternEventAtTime(pc, pe);
        }
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
