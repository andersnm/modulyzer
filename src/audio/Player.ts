import { Instrument, InstrumentFactory } from "./plugins/InstrumentFactory";

const SCHEDULE_INTERVAL = 0.5;

function areOverlapping(startA, endA, startB, endB) {
    if(startB < startA) {
        return endB > startA;
    }
    else {
        return startB < endA;
    }
}

export class PatternColumn {
    instrument: Instrument;
    pin: number;
    events: PatternEvent[] = [];
}

export class PatternEvent {
    time: number;
    value: number;
    data0: number;
    data1: number;
    channel: number;
}

export class Pattern {
    name: string;
    columns: PatternColumn[] = [];
    duration: number;
}

export class SequenceEvent {
    time: number;
    pattern: Pattern;
}

export class SequenceColumn {
    events: SequenceEvent[] = [];
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
    instrumentFactories: InstrumentFactory[];
    patterns: Pattern[] = [];
    instruments: Instrument[] = [];
    connections: Connection[] = [];
    waves: Wave[] = [];

    sequence: Sequence = new Sequence();
    bpm: number = 125;

    constructor(instrumentFactories: InstrumentFactory[], context: AudioContext) {
        console.log("INITING PLAYER", instrumentFactories)
        this.instrumentFactories = instrumentFactories;
        this.context = context;
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
