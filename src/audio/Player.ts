import { AudioDevice, AudioDeviceBase } from "./AudioDevice";
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

function getSwingTime(pattern: Pattern, patternTimeInBeats: number): number {
    const withinBeat = patternTimeInBeats - Math.floor(patternTimeInBeats);

    const firstHalfProportion = pattern.swing;
    const secondHalfProportion = 1 - pattern.swing;

    // Adjust the time based on the swing factor
    if (withinBeat < 0.5) {
        return Math.floor(patternTimeInBeats) + withinBeat * firstHalfProportion * 2;
    } else {
        return Math.floor(patternTimeInBeats) + 0.5 * firstHalfProportion * 2 +
            (withinBeat - 0.5) * secondHalfProportion * 2;
    }
}

function collectPatternEvents(pattern: Pattern, currentBeat: number, durationBeats: number, result: PatternPlayerEvent[]) {
    for (let column of pattern.columns) {
        const instrumenteer = column.instrumenteer;

        for (let event of column.events) {
            const eventTime = getSwingTime(pattern, event.time / pattern.subdivision);

            if (eventTime >= currentBeat && eventTime < currentBeat + durationBeats) {
                const deltaBeats = eventTime - currentBeat;
                result.push({
                    instrumenteer, time: deltaBeats, type: column.type, parameterName: column.parameterName, value: event.value, data0: event.data0
                });
            }
        }
    }

    return result;
}

function visitPlayingPatterns(
    sequence: Sequence,
    rangeStartBeat: number,
    rangeEndBeat: number,
    fn: (pattern: Pattern, patternLocalBeat: number, durationBeats: number, patternStartBeat: number) => void,
): void {

    for (const column of sequence.columns) {
        for (const ev of column.events) {
            const pattern = ev.pattern;

            const patternStartBeat = ev.time; // sequence time in beats
            const patternLength = pattern.duration / pattern.subdivision;
            const patternEndBeat = patternStartBeat + patternLength;

            if (patternEndBeat <= rangeStartBeat) continue;
            if (patternStartBeat >= rangeEndBeat) continue;

            const patternLocalBeat = rangeStartBeat - patternStartBeat;
            fn(pattern, patternLocalBeat, rangeEndBeat - rangeStartBeat, patternStartBeat);
        }
    }
}

export class Player extends EventTarget {
    device: AudioDeviceBase<any>;
    playing: boolean = false;
    playInterval: number;
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

    constructor(instrumentFactories: InstrumentFactory[], device: AudioDeviceBase<any>) {
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

    play(startBeat: number = 0) {
        if (this.playing) {
            return;
        }

        this.playing = true;

        this.currentTime = 0;
        this.currentBeat = startBeat;
        this.startTime = this.device.context.currentTime;

        // schedule 1 second first, then reschedule after 500ms to fill so we remain 1 second ahead
        this.currentBeat = this.scheduleSequence(this.currentBeat, this.currentTime, SCHEDULE_INTERVAL);
        this.currentTime += SCHEDULE_INTERVAL;

        this.playInterval = setInterval(() => {

            const until = this.device.context.currentTime + SCHEDULE_INTERVAL;
            const duration = until - (this.startTime + this.currentTime);

            // console.log("Player time", this.currentTime, "Duration", duration, "Dvic time", this.context.currentTime, "relative to", this.startTime, " compute beat", this.currentBeat);
            this.currentBeat = this.scheduleSequence(this.currentBeat, this.currentTime, duration);
            this.currentTime += duration;
        }, SCHEDULE_INTERVAL * 1000 / 2);

        this.dispatchEvent(new CustomEvent("playing"))
    }

    async playOffline(): Promise<AudioBuffer> {
        const context = this.device.context;
        if (!(context instanceof OfflineAudioContext)) {
            throw new Error("Device context is not an OfflineAudioContext");
        }

        const totalBeats = this.loopEnd;

        let beat = 0;
        let timeSec = 0;
        this.startTime = this.device.context.currentTime; // TODO: Get rid on this.startTime in the scheduler

        const beatsPerSecond = this.bpm / 60;
        let remainingBeats = totalBeats;

        while (remainingBeats > 0) {
            const chunkBeats = Math.min(remainingBeats, this.loopEnd - beat);
            const chunkSec = chunkBeats / beatsPerSecond;

            this.scheduleSequence(
                beat,
                timeSec,
                chunkBeats
            );

            beat += chunkBeats;
            timeSec += chunkSec;
            remainingBeats -= chunkBeats;

            if (beat >= this.loopEnd) {
                beat = this.loopStart;
            }
        }

        const buffer = await context.startRendering();
        return buffer;
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

        this.dispatchEvent(new CustomEvent("stopped"))
    }

    scheduleSequence(currentBeat: number, currentTime: number, durationSec: number) {
        const beatsPerSecond = this.bpm / 60;

        const epsilon = 1e-10;
        let durationBeats = durationSec * beatsPerSecond;

        while (durationBeats > epsilon) {
            const chunkBeats = Math.min(durationBeats, this.loopEnd - currentBeat);
            const chunkSec = chunkBeats / beatsPerSecond;

            this.scheduleSequenceChunk(currentBeat, currentTime, chunkBeats);
            currentTime += chunkSec;
            currentBeat += chunkBeats;

            durationBeats -= chunkBeats;

            if (currentBeat >= this.loopEnd) {
                currentBeat = this.loopStart;
            }
        }

        return currentBeat;
    }

    scheduleSequenceChunk(currentBeat: number, currentTime: number, durationBeats: number) {
        const patternEvents: PatternPlayerEvent[] = [];
        visitPlayingPatterns(this.sequence, currentBeat, currentBeat + durationBeats, (pattern, patternLocalBeat, durationBeats) => {
            collectPatternEvents(pattern, patternLocalBeat, durationBeats, patternEvents);
        });

        const secondsPerBeat = 60 / this.bpm;

        for (let ev of patternEvents) {
            if (ev.instrumenteer.muted) {
                continue;
            }

            const evTimeSec = ev.time * secondsPerBeat;
            const playTime = this.startTime + currentTime + evTimeSec;
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
    }

    getPatternPlayPosition(pattern: Pattern): number | null {
        let result: number | null = null;
        visitPlayingPatterns(this.sequence, this.currentBeat, this.currentBeat, (p, patternLocalBeat) => {
            if (p === pattern) {
                result = result ?? patternLocalBeat;
            }
        });

        return result;
    }
}
