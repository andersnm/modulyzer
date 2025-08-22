import { InstrumentFactory } from "../audio/plugins/InstrumentFactory";
import { InstrumentDocument, PatternColumnDocument, PatternColumnType, PatternDocument, PatternEventDocument, SongDocument } from "../audio/SongDocument";
import { ClipboardMidiEvent, ClipboardPattern } from "../commands/PatternEditor/Clipboard";

export function formatNote(note: number) {
    const octave = Math.floor(note / 12) - 1;
    const notenum = (note % 12);
    const notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"]
    return (notes[notenum] + octave).toString();
}

export function formatU8(value: number) {
    let hex = value.toString(16).toUpperCase();
    while (hex.length < 2) {
        hex = "0" + hex;
    }

    return hex;
}

export function bindNoteDropdown(noteSelect: HTMLSelectElement, note: number) {
    for (let i = 21; i <= 108; i++) {
        const option = document.createElement("option");
        option.text = formatNote(i);
        option.value = i.toString();
        option.selected = i === note;

        noteSelect.options.add(option);
    }
}

export interface RenderColumnInfo {
    type: "note" | "velo" | "u8" | "u16";
    channel: number;
    position: number;
    patternColumn: PatternColumnDocument;
    cursorColumns: CursorColumnInfo[];
}

export interface CursorColumnInfo {
    type: "u4-basenote" | "u4-octave" | "u4-velo-lower" | "u4-velo-upper" | "u4-lower" | "u4-upper";
    position: number;
    tabStep: number;
    size: number;
    renderColumn: RenderColumnInfo;
    channel: number;
}

export function getCursorColumnAt(renderColumns: RenderColumnInfo[], index: number) {
    let currentCursorColumnIndex = 0;
    for (let renderColumn of renderColumns) {
        for (let cursorColumn of renderColumn.cursorColumns) {
            if (index === currentCursorColumnIndex) {
                return cursorColumn;
            }

            currentCursorColumnIndex++;
        }
    }
}

export function getCursorColumnAtPosition(renderColumns: RenderColumnInfo[], position: number) {
    // NOTE: This must always match something
    let lastColumn: CursorColumnInfo | null = null;
    for (let renderColumn of renderColumns) {
        for (let cursorColumn of renderColumn.cursorColumns) {

            if (position < 0) {
                return cursorColumn;
            }

            // Within bounds of column
            if (position >= cursorColumn.position && (position < cursorColumn.position + cursorColumn.size)) {
                return cursorColumn;
            }

            // Return the last column with the greatest lesser position if there is no exact match at the position
            // I.e clicking in the space between columns returns the column to the left of the space
            if (position < cursorColumn.position) {
                return lastColumn;
            }

            lastColumn = cursorColumn;
        }
    }

    return lastColumn;
}

export function getCursorColumnIndex(renderColumns: RenderColumnInfo[], column: CursorColumnInfo) {
    let index = 0;
    for (let renderColumn of renderColumns) {
        for (let cursorColumn of renderColumn.cursorColumns) {
            if (column === cursorColumn) {
                return index;
            }

            index++;
        }
    }

    return -1;
}

export function getCursorColumns(renderColumns: RenderColumnInfo[]): CursorColumnInfo[] {
    const cursorColumns = [];
    for (let renderColumn of renderColumns) {
        cursorColumns.push(...renderColumn.cursorColumns)
    }

    return cursorColumns;
}

export function getPatternRenderColumns(instrumentFactories: InstrumentFactory[], pattern: PatternDocument): RenderColumnInfo[] {
    const renderColumns: RenderColumnInfo[] = [];

    let position = 0;
    let tabStep = 0;
    let previousInstrument: InstrumentDocument;
    let previousColumnType: PatternColumnType;

    for (let patternColumn of pattern.columns) {

        if (patternColumn.type === "midinote") {

            // increment tabStep if already added columns for instrument, and need new tabStep for notes
            if (previousInstrument === patternColumn.instrument) {
                tabStep++;
            }

            // get polyphonic channels from instrument (or do we specify 0/1..maxPoly on instrument itself
            const factory = instrumentFactories.find(f => f.identifier === patternColumn.instrument.instrumentId);

            // compute N columns of (note+velocity)
            for (let i = 0; i < factory.maxPolyphony; i++) {
                // note column
                const noteCursorColumns: CursorColumnInfo[] = [];

                const noteRenderColumn: RenderColumnInfo = { type: "note", channel: i, position, patternColumn, cursorColumns: noteCursorColumns };
                renderColumns.push(noteRenderColumn);

                // base note
                noteCursorColumns.push({ type: "u4-basenote", position, tabStep, size: 2, renderColumn: noteRenderColumn, channel: i })
                position += 2;

                // octave
                noteCursorColumns.push({ type: "u4-octave", position, tabStep, size: 1, renderColumn: noteRenderColumn, channel: i })
                position += 1 + 1; // + spacer

                // velocity column
                const veloCursorColumns: CursorColumnInfo[] = [];
                const veloRenderColumn: RenderColumnInfo = { type: "velo", channel: i, position: position, patternColumn, cursorColumns: veloCursorColumns };
                renderColumns.push(veloRenderColumn);

                // velocity upper hex
                veloCursorColumns.push({ type: "u4-velo-upper", position, tabStep, size: 1, renderColumn: veloRenderColumn, channel: i })
                position += 1;

                // velocity lower hex
                veloCursorColumns.push({ type: "u4-velo-lower", position, tabStep, size: 1, renderColumn: veloRenderColumn, channel: i })
                position += 1 + 1; // + spacer

                tabStep++;
            }

        } else if (patternColumn.type === "midiparameter") {
            // increment tabStep if first column from an instrument - except if previous were note from any instrument
            if (previousInstrument !== patternColumn.instrument && previousColumnType !== "midinote") {
                tabStep++;
            }

            const cursorColumns: CursorColumnInfo[] = [];
            const renderColumn: RenderColumnInfo = { type: "u8", channel: 0, position, patternColumn, cursorColumns };
            renderColumns.push(renderColumn);

            // value upper hex
            cursorColumns.push({ type: "u4-upper", position, tabStep, size: 1, renderColumn, channel: 0 })
            position += 1;

            // value lower hex
            cursorColumns.push({ type: "u4-lower", position, tabStep, size: 1, renderColumn, channel: 0 })
            position += 1 + 1; // + spacer
        } else {
            throw new Error("Unknown column type " + patternColumn.type);
        }

        previousInstrument = patternColumn.instrument;
        previousColumnType = patternColumn.type;
    }

    return renderColumns;
}

export function getRenderColumnWidth(type: string) {
    let columnWidth: number;
    switch (type) {
        case "note":
            columnWidth = 4;
            break;
        case "u8":
        case "velo":
            columnWidth = 3;
            break;
        case "u16":
            columnWidth = 5;
            break;
    }

    return columnWidth;
}

export function getRenderColumnPosition(renderColumns: RenderColumnInfo[], column: RenderColumnInfo) {
    let x = 0;
    for (let renderColumn of renderColumns) {
        if (renderColumn === column) {
            return x;
        }

        x += getRenderColumnWidth(renderColumn.type);
    }

    return -1
}

function getPreviousPatternEvent(patternColumn: PatternColumnDocument, time: number, channel: number) {
    return patternColumn.events.reduce((prev, e) => (e.channel === channel && (e.time < time)) ? e : prev, null);
}

function getNextPatternEvent(patternColumn: PatternColumnDocument, time: number, channel: number, note?: number, velocity?: number) {
    return patternColumn.events.find(e => e.channel === channel && e.time > time && (note === undefined || e.value === note) && (velocity === undefined || e.data0 === velocity));
}

export function editNote(song: SongDocument, patternColumn: PatternColumnDocument, time: number, channel: number, note: number) {
    const editNoteEvent = patternColumn.events.find(e => e.channel === channel && e.time == time && e.data0 !== 0);

    // cases:
    // update note / octave -> also update note off
    // update noteoff = insert new note over it
    // insert note before noteoff of another note
    // insert note outside any other notes

    if (editNoteEvent) {

        // find noteoff and update its value
        const nextPatternEvent = getNextPatternEvent(patternColumn, time, channel, editNoteEvent.value, 0);
        if (nextPatternEvent) {
            song.updatePatternEvent(editNoteEvent, editNoteEvent.time, note, editNoteEvent.data0, editNoteEvent.data1);
            song.updatePatternEvent(nextPatternEvent, nextPatternEvent.time, note, 0, channel);
        } else {
            console.warn("Not updating note off, missing note off, invalid pattern event")
        }

        return editNoteEvent;
    } else {
        // if previous note is a note -> split, find noteend and move it to here
        // if previous note is a noteoff or none -> insert plain
        const previousPatternEvent = getPreviousPatternEvent(patternColumn, time, channel);
        if (previousPatternEvent && previousPatternEvent.data0 !== 0) {
            // Insert in duration of another note: shorten previous note
            const noteoffForPrevious = getNextPatternEvent(patternColumn, previousPatternEvent.time, channel, previousPatternEvent.value, 0);
            if (noteoffForPrevious) {
                song.deletePatternEvent(patternColumn, noteoffForPrevious);
                song.createPatternEvent(patternColumn, time, previousPatternEvent.value, 0, 0, channel);
            } else {
                console.warn("Not shortening previous note, missing note off, invalid pattern event")
            }
        }

        const noteEvent = song.createPatternEvent(patternColumn, time, note, 127, 0, channel);
        song.createPatternEvent(patternColumn, time + 1, note, 0, 0, channel);
        return noteEvent;
    }
}

export function editNoteOff(song: SongDocument, patternColumn: PatternColumnDocument, time: number, channel: number) {
    const patternEvent = patternColumn.events.find(e => e.channel === channel && e.time == time);
    if (patternEvent) {
        console.log("Already note or noteoff here, not inserting noteoff")
        return;
    }

    const previousPatternEvent = getPreviousPatternEvent(patternColumn, time, channel); // patternColumn.events.reduce((prev, e) => (e.channel === cursorColumn.channel && (e.time < this.cursorTime)) ? e : prev, null);
    if (!previousPatternEvent) {
        console.log("Cannot set note off here, no previous note in channel", patternColumn.events);
        return;
    }

    if (previousPatternEvent.data0 == 0) {
        // if previous note is a noteoff: extend duration, delete old noteoff before new noteoff
        song.deletePatternEvent(patternColumn, previousPatternEvent);
    } else {
        // previous note is a note: shorten duration, find and delete its noteoff before new noteoff
        const nextPatternEvent = getNextPatternEvent(patternColumn, previousPatternEvent.time, channel, previousPatternEvent.value, 0);
        if (nextPatternEvent) {
            song.deletePatternEvent(patternColumn, nextPatternEvent);
        } else {
            console.warn("Could not find noteoff for previous note. Not shortening")
        }
    }

    song.createPatternEvent(patternColumn, time, previousPatternEvent.value, 0, 0, channel);
}

export function editValue(song: SongDocument, patternColumn: PatternColumnDocument, time: number, channel: number, value: number) {
    const patternEvent = patternColumn.events.find(e => e.channel === channel && e.time === time);
    if (patternEvent) {
        song.updatePatternEvent(patternEvent, patternEvent.time, value, patternEvent.data0, 0);
    } else {
        song.createPatternEvent(patternColumn, time, value, 0, 0, channel);
    }
}

export function editVelocity(song: SongDocument, patternEvent: PatternEventDocument, velocity: number) {
    if (velocity === 0) {
        throw new Error("Cannot edit velocity 0");
    }

    if (patternEvent) {
        song.updatePatternEvent(patternEvent, patternEvent.time, patternEvent.value, velocity, 0);
    } else {
        console.log("No note in this column/track to set velocity")
    }
}

export function deleteValue(song: SongDocument, patternColumn: PatternColumnDocument, columnType: string, time: number, channel: number) {
    if (columnType === "note") {
        // Delete in a note column
        const editNoteEvent = patternColumn.events.find(e => e.time === time && e.channel === channel && e.data0 !== 0);
        const editNoteOffEvent = patternColumn.events.find(e => e.time === time && e.channel === channel && e.data0 === 0);

        if (editNoteEvent) {
            const noteOffEvent = getNextPatternEvent(patternColumn, time, channel, editNoteEvent.value, 0);
            if (noteOffEvent && noteOffEvent.data0 === 0) {
                // Delete note and its note-off - if there is a noteoff at the same time, leave the noteoff
                song.deletePatternEvent(patternColumn, editNoteEvent);
                song.deletePatternEvent(patternColumn, noteOffEvent);
                return true;
            } else {
                console.warn("Missing note-off, invalid pattern event, not deleting anything")
            }
        } else if (editNoteOffEvent) {
            // Delete noteoff = extend noteoff until next note or end of pattern
            const nextNoteEvent = getNextPatternEvent(patternColumn, time, channel, undefined);

            if (nextNoteEvent) {
                if (nextNoteEvent.data0 !== 0) {
                    song.deletePatternEvent(patternColumn, editNoteOffEvent);
                    song.createPatternEvent(patternColumn, nextNoteEvent.time, editNoteOffEvent.value, 0, 0, channel);
                    return true;
                } else {
                    console.warn("Next note is a noteoff, expected note, not extending the noteoff.", nextNoteEvent)
                }
            } else {
                song.deletePatternEvent(patternColumn, editNoteOffEvent);
                song.createPatternEvent(patternColumn, patternColumn.pattern.duration - 1, editNoteOffEvent.value, 0, 0, channel);
                return true;
            }
        }
    } else {
        // Delete in a non-note column, i.e cc/u8 value
        const patternEvent = patternColumn.events.find(e => e.time === time && e.channel === channel);
        song.deletePatternEvent(patternColumn, patternEvent);
        return true;
    }
}

export function deletePatternEvents(song: SongDocument, renderColumns: RenderColumnInfo[], start: number, end: number, startRow: number, endRow: number) {

    for (let i =  start; i <= end; i++) {
        const renderColumn = renderColumns[i];

        if (renderColumn.type === "velo") {
            // Deleted along with the note
            continue;
        }

        for (let j = startRow; j <= endRow; j++) {
            deleteValue(song, renderColumn.patternColumn, renderColumn.type, j, renderColumn.channel);
        }
    }
}

export function exportClipboardPattern(renderColumns: RenderColumnInfo[], start: number, end: number, startRow: number, endRow: number) {
    const clipboardObject: ClipboardPattern = {
        width: (end - start) + 1,
        height: (endRow - startRow) + 1,
        columns: [],
    };

    for (let i =  start; i <= end; i++) {
        const renderColumn = renderColumns[i];
        if (renderColumn.type === "note") {
            // Serialize notes and velo in this column/channel/track - should be selected visually too (TODO)
            const events = renderColumn.patternColumn.events
                .filter(e => e.time >= startRow && e.time <= endRow && e.channel === renderColumn.channel)
                .map(e => ({
                    time: e.time - startRow,
                    value: e.value,
                    data0: e.data0,
                } as ClipboardMidiEvent)
            );

            clipboardObject.columns.push({events});
        } else
        if (renderColumn.type === "velo") {
            // Not serializing velo alone, but keeping the column to sync back with rendercolumns
            clipboardObject.columns.push({events: []});
        } else {
            // All but note-columns are treated as basic value-columns
            const events = renderColumn.patternColumn.events
                .filter(e => e.time >= startRow && e.time <= endRow)
                .map(e => ({
                    time: e.time - startRow,
                    value: e.value,
                    data0: e.data0
                } as ClipboardMidiEvent));

            clipboardObject.columns.push({events});
        }
    }

    return clipboardObject;
}


function formatPatternName(i: number) {
    let name = i.toString(16).toUpperCase();
    while (name.length < 2)
        name = "0" + name;

    return name;
}

function patternNameExists(patterns: PatternDocument[], name: string) {
    return patterns.findIndex(p => p.name === name) !== -1;
}

export function getNewPatternName(patterns: PatternDocument[]) {
    let counter = 0;
    let name = formatPatternName(counter);
    while (patternNameExists(patterns, name)) {
        counter++;
        name = formatPatternName(counter)
    }

    return name;
}

export function getNoteForKey(code: string, octave: number) {
    const kbTop = [ "KeyQ", "Digit2", "KeyW", "Digit3", "KeyE", "KeyR", "Digit5", "KeyT", "Digit6", "KeyY", "Digit7", "KeyU", ];
    const kbBottom = [ "KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "KeyV", "KeyG", "KeyB", "KeyH", "KeyN", "KeyJ", "KeyM", ];

    const t = kbTop.findIndex(k => k === code);
    if (t !== -1) {
        return (octave + 1) * 12 + t;
    }

    const b = kbBottom.findIndex(k => k === code);
    if (b !== -1) {
        return octave * 12 + b;
    }

    return -1;
}