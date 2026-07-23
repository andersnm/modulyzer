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
    instrumenteer: Instrumenteer;
    name: string;
    columns: PatternColumn[] = [];
    duration: number;
    subdivision: number = 4;
    swing: number = 0.5;
}

export class SequenceEvent {
    time: number;
}

export class SequencePatternEvent extends SequenceEvent {
    pattern: Pattern;
}

export class SequenceWaveEvent extends SequenceEvent {
    wave: Wave;
}

export abstract class SequenceColumn {
    events: SequenceEvent[];
}

export class SequencePatternColumn extends SequenceColumn {
    events: SequencePatternEvent[] = [];
}

export class SequenceWaveColumn extends SequenceColumn {
    events: SequenceWaveEvent[] = [];
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
    instrumenteer: Instrumenteer;
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


function visitPlayingSequenceEvents(
    sequence: Sequence,
    rangeStartBeat: number,
    rangeEndBeat: number,
    bpm: number,
    fn: (
        ev: SequenceEvent,
        localBeat: number,
        durationBeats: number,
        eventStartBeat: number
    ) => void,
): void {

    for (const column of sequence.columns) {
        for (const ev of column.events) {

            const eventStartBeat = ev.time;

            // Determine event length
            let eventLengthBeats: number;
            if (ev instanceof SequencePatternEvent) {
                const pattern = ev.pattern;
                eventLengthBeats = pattern.duration / pattern.subdivision;
            } else if (ev instanceof SequenceWaveEvent) {
                const wave = ev.wave;
                const beatsPerSecond = bpm / 60;
                eventLengthBeats = wave.sampleCount / wave.sampleRate * beatsPerSecond;
            } else {
                continue;
            }

            const eventEndBeat = eventStartBeat + eventLengthBeats;

            // Skip events outside the range
            if (eventEndBeat <= rangeStartBeat) continue;
            if (eventStartBeat >= rangeEndBeat) continue;

            const localBeat = rangeStartBeat - eventStartBeat;
            fn(ev, localBeat, rangeEndBeat - rangeStartBeat, eventStartBeat);
        }
    }
}

function visitPlayingPatterns(
    sequence: Sequence,
    rangeStartBeat: number,
    rangeEndBeat: number,
    fn: (pattern: Pattern, patternLocalBeat: number, durationBeats: number, patternStartBeat: number) => void,
): void {

    visitPlayingSequenceEvents(sequence, rangeStartBeat, rangeEndBeat, 125, (ev, localBeat, durationBeats, eventStartBeat) => {
        if (ev instanceof SequencePatternEvent) {
            fn(ev.pattern, localBeat, durationBeats, eventStartBeat);
        }
    });
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

        if (startBeat > 0) {
            this.scheduleResumeNotes(this.currentBeat);
        }

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

    getCurrentlyPlayingNotes(pattern, atRow): PatternEvent[] {
        const noteMap = new Map<number, PatternEvent>();
        for (let column of pattern.columns) {
            if (column.type !== "midinote") {
                continue;
            }

            for (let event of column.events) {
                // event.time
                if (event.time > atRow) {
                    break; // assume sorted
                }

                if (event.data0 !== 0) {
                    noteMap.set(event.value, event);
                } else {
                    noteMap.delete(event.value);
                }
            }
        }

        return [ ... noteMap.values() ];
    }

    scheduleResumeNotes(startBeat: number) {
        const secondsPerBeat = 60 / this.bpm;

        visitPlayingPatterns(this.sequence, startBeat, startBeat, (pattern, patternLocalBeat, durationBeats, patternStartBeat) => {
            for (let column of pattern.columns) {
                const instrumenteer = column.instrumenteer;
                if (instrumenteer.factory.identifier !== "@modulyzer/WaveTracker") {
                    continue; // TODO: support other instruments
                }

                const notes = this.getCurrentlyPlayingNotes(pattern, patternLocalBeat);

                for (let noteEvent of notes) {
                    const noteStartBeat = patternStartBeat + noteEvent.time / pattern.subdivision;
                    const beatDelta = startBeat - noteStartBeat;
                    const offsetSec = beatDelta * secondsPerBeat;
                    instrumenteer.instrument.resumeNote(this.device.context.currentTime, noteEvent.value, noteEvent.data0, offsetSec);
                }

            }
        });
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

            this.scheduleSequence(beat, timeSec, chunkBeats);

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
        visitPlayingSequenceEvents(this.sequence, this.currentBeat, this.currentBeat, this.bpm, (ev, patternLocalBeat) => {
            if (ev instanceof SequencePatternEvent) {
                if (ev.pattern === pattern) {
                    result = result ?? patternLocalBeat;
                }
            }
        });

        return result;
    }
}
