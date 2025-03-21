import { InstrumentFactory } from "../audio/plugins/InstrumentFactory";
import { PatternColumnDocument, PatternDocument } from "../audio/SongDocument";

export function formatNote(note: number) {
    const octave = Math.floor(note / 12) - 1;
    const notenum = (note % 12);
    const notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"]
    return notes[notenum] + octave;
}

export function formatU8(value: number) {
    let hex = value.toString(16).toUpperCase();
    while (hex.length < 2) {
        hex = "0" + hex;
    }

    return hex;
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
    for (let renderColumn of renderColumns) {
        for (let cursorColumn of renderColumn.cursorColumns) {
            if (position >= cursorColumn.position && (position < cursorColumn.position + cursorColumn.size)) {
                return cursorColumn;
            }
        }
    }
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

export function getPatternRenderColumns(instrumentFactories: InstrumentFactory[], pattern: PatternDocument, maxPolyphonic: number): RenderColumnInfo[] {
    const renderColumns: RenderColumnInfo[] = [];

    let position = 0;
    for (let patternColumn of pattern.columns) {

        const factory = instrumentFactories.find(f => f.getIdentifier() === patternColumn.instrument.instrumentId);
        const pins = factory.getPins();
        const pin = pins[patternColumn.pin];

        if (!pin) {
            console.log(pins)
            console.log(factory)
            console.log(patternColumn)
            
        }

        if (pin.type === "note") {

            // compute N columns of (note+velocity)
            for (let i = 0; i < maxPolyphonic; i++) {
                // note column
                const noteCursorColumns: CursorColumnInfo[] = [];

                const noteRenderColumn: RenderColumnInfo = { type: "note", channel: i, position, patternColumn, cursorColumns: noteCursorColumns };
                renderColumns.push(noteRenderColumn);

                // base note
                noteCursorColumns.push({ type: "u4-basenote", position, size: 2, renderColumn: noteRenderColumn, channel: i })
                position += 2;

                // octave
                noteCursorColumns.push({ type: "u4-octave", position, size: 1, renderColumn: noteRenderColumn, channel: i })
                position += 1 + 1; // + spacer

                // velocity column
                const veloCursorColumns: CursorColumnInfo[] = [];
                const veloRenderColumn: RenderColumnInfo = { type: "velo", channel: i, position: position, patternColumn, cursorColumns: veloCursorColumns };
                renderColumns.push(veloRenderColumn);

                // velocity upper hex
                veloCursorColumns.push({ type: "u4-velo-upper", position, size: 1, renderColumn: veloRenderColumn, channel: i })
                position += 1;

                // velocity lower hex
                veloCursorColumns.push({ type: "u4-velo-lower", position, size: 1, renderColumn: veloRenderColumn, channel: i })
                position += 1 + 1; // + spacer
            }

        } else {
            const cursorColumns: CursorColumnInfo[] = [];
            const renderColumn: RenderColumnInfo = { type: "u8", channel: 0, position, patternColumn, cursorColumns };
            renderColumns.push(renderColumn);

            // value upper hex
            cursorColumns.push({ type: "u4-upper", position, size: 1, renderColumn, channel: 0 })
            position += 1;

            // value lower hex
            cursorColumns.push({ type: "u4-lower", position, size: 1, renderColumn, channel: 0 })
            position += 1 + 1; // + spacer
        }
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
