import { AudioDevice } from "./AudioDevice";
import { Instrumenteer } from "./Instrumenteer";
import { InstrumentFactory } from "./plugins/InstrumentFactory";
import { PatternColumnType } from "./SongDocument";

const SCHEDULE_INTERVAL = 0.5;

export class PatternColumn {
    instrumenteer: Instrumenteer;
    type: "midinote" | "midiparameter";
    parameterName?: string; // if type == "midiparameter"
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
    subdivision: number = 4;
    swing: number = 0.5;
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
    from: Instrumenteer;
    to: Instrumenteer;
    gainNode: GainNode;
}

export class Wave {
    name: string;
    note: number;
    sampleRate: number;
    sampleCount: number;
    buffers: Float32Array[];
    audioBuffer: AudioBuffer;
}

interface PatternPlayerEvent {
    instrumenteer: Instrumenteer;
    time: number;
    type: PatternColumnType;
    parameterName?: string;
    value: number;
    data0: number;
}

class PatternPlayer {
    pattern: Pattern;
    currentBeat: number = 0;

    constructor(pattern: Pattern, currentBeat: number) {
        this.pattern = pattern;
        this.currentBeat = currentBeat;
    }

    getSwingTime(patternTimeInBeats: number): number {
        const withinBeat = patternTimeInBeats - Math.floor(patternTimeInBeats);

        const firstHalfProportion = this.pattern.swing;
        const secondHalfProportion = 1 - this.pattern.swing;

        // Adjust the time based on the swing factor
        if (withinBeat < 0.5) {
            return Math.floor(patternTimeInBeats) + withinBeat * firstHalfProportion * 2;
        } else {
            return Math.floor(patternTimeInBeats) + 0.5 * firstHalfProportion * 2 +
                   (withinBeat - 0.5) * secondHalfProportion * 2;
        }
    }

    process(durationBeats: number, result: PatternPlayerEvent[]) {
        for (let column of this.pattern.columns) {
            const instrumenteer = column.instrumenteer;

            for (let event of column.events) {
                const eventTime = this.getSwingTime(event.time / this.pattern.subdivision);

                if (eventTime >= this.currentBeat && eventTime < this.currentBeat + durationBeats) {
                    const deltaBeats = eventTime - this.currentBeat;
                    result.push({
                        instrumenteer, time: deltaBeats, type: column.type, parameterName: column.parameterName, value: event.value, data0: event.data0
                    });
                }
            }
        }

        this.currentBeat += durationBeats;

        return result;
    }
}

export class Player extends EventTarget {
    device: AudioDevice;
    playing: boolean = false;
    startTime: number;
    currentTime: number;
    currentBeat: number;
    instrumentFactories: InstrumentFactory[];
    patterns: Pattern[] = [];
    instruments: Instrumenteer[] = [];
    connections: Connection[] = [];

    sequence: Sequence = new Sequence();
    bpm: number = 125;
    loopStart: number = 0;
    loopEnd: number = 8;
    playingPatterns: PatternPlayer[] = [];

    constructor(instrumentFactories: InstrumentFactory[], device: AudioDevice) {
        super();
        this.instrumentFactories = instrumentFactories;
        this.device = device;
    }

    getInstrumentFactoryById(id: string) {
        for (let instrumentFactory of this.instrumentFactories) {
            if (instrumentFactory.identifier === id) {
                return instrumentFactory;
            }
        }

        return null;
    }

    playInterval;

    play(startBeat: number = 0) {
        if (this.playing) {
            return;
        }

        this.playing = true;

        this.currentTime = 0;
        this.currentBeat = startBeat;
        this.startTime = this.device.context.currentTime;

        // schedule 1 second first, then reschedule after 500ms to fill so we remain 1 second ahead
        this.scheduleSequence(SCHEDULE_INTERVAL);

        this.playInterval = setInterval(() => {

            const until = this.device.context.currentTime + SCHEDULE_INTERVAL;
            const duration = until - (this.startTime + this.currentTime);

            // console.log("Player time", this.currentTime, "Duration", duration, "Dvic time", this.context.currentTime, "relative to", this.startTime, " compute beat", this.currentBeat);
            this.scheduleSequence(duration);
        }, SCHEDULE_INTERVAL * 1000 / 2);

        this.dispatchEvent(new CustomEvent("playing"))
    }

    stop() {
        if (!this.playing) {
            return;
        }

        clearInterval(this.playInterval);
        this.playInterval = null;
        this.playing = false;

        for (let instrumenteer of this.instruments) {
            instrumenteer.instrument.sendMidi(0, 0xB0, 0x7b, 0);
        }

        this.playingPatterns.length = 0;

        this.dispatchEvent(new CustomEvent("stopped"))
    }

    scheduleSequence(durationSec: number) {
        const beatsPerSecond = this.bpm / 60;

        const epsilon = 1e-10;
        let durationBeats = durationSec * beatsPerSecond;

        while (durationBeats > epsilon) {
            // Chunk at tempo changes and end loop
            const chunkBeats = Math.min(durationBeats, this.loopEnd - this.currentBeat);

            this.scheduleSequenceChunk(chunkBeats);

            durationBeats -= chunkBeats;

            // console.log("Loop check", this.currentBeat, this.loopEnd, durationBeats, chunkBeats)
            if (this.currentBeat >= this.loopEnd) {
                // console.log("Looping")
                this.currentBeat = this.loopStart;
            }
        }
    }

    scheduleSequenceChunk(durationBeats: number) {
        for (let column of this.sequence.columns) {
            for (let ev of column.events) {
                const p = ev.pattern;

                // convert sequence time to beats
                const evTime = ev.time / 1; // this.tpb;

                if (evTime >= this.currentBeat && evTime < this.currentBeat + durationBeats) {
                    const pp = new PatternPlayer(ev.pattern, this.currentBeat - evTime);
                    this.playingPatterns.push(pp);
                }
            }
        }

        const beatsPerSecond = this.bpm / 60;
        const durationSec = durationBeats / beatsPerSecond;
        const patternEvents: PatternPlayerEvent[] = [];
        for (let i = 0; i < this.playingPatterns.length; ) {
            const pp = this.playingPatterns[i];
            pp.process(durationBeats, patternEvents);
            if (pp.currentBeat >= (pp.pattern.duration / pp.pattern.subdivision)) {
                // console.log("Reached end of pattern")
                this.playingPatterns.splice(i, 1);
            } else {
                i++;
            }
        }

        for (let ev of patternEvents) {
            if (ev.instrumenteer.muted) {
                continue;
            }

            const evTime = ev.time * (durationSec / durationBeats);
            const playTime = this.startTime + this.currentTime + evTime;
            if (ev.type === "midinote") {
                ev.instrumenteer.instrument.sendMidi(playTime, 0x90, ev.value, ev.data0);
            } else if (ev.type === "midiparameter") {
                const parameter = ev.instrumenteer.instrument.parameters.find(p => p.name === ev.parameterName);
                if (!parameter) {
                    throw new Error("Unknown parameter " + ev.parameterName);
                }

                const value = Math.floor(parameter.convertMidiToValue(ev.value));
                parameter.setValue(playTime, value);
            } else {
                throw new Error("Unknown pattern event type " + ev.type);
            }
        }

        this.currentTime += durationSec;
        this.currentBeat += durationBeats;
    }
}
