export interface ClipboardMidiEvent {
    time: number;
    command: number;
    value: number;
    data0: number;
}

export interface ClipboardPatternColumn {
    events: ClipboardMidiEvent[];
}

export interface ClipboardPattern {
    width: number;
    height: number;
    columns: ClipboardPatternColumn[];
}

export interface ClipboardSequence {
    width: number;
    height: number;
    columns: ClipboardSequenceEvent[][]
}

export interface ClipboardSequenceEvent {
    time: number;
    patternIndex: number;
}

export async function readClipboardPattern(): Promise<ClipboardPattern> {
    return await readClipboardJson("application/x-modulyzer-pattern") as ClipboardPattern;
}

export async function readClipboardSequence(): Promise<ClipboardSequence> {
    return await readClipboardJson("application/x-modulyzer-sequence") as ClipboardSequence;
}

export async function readClipboardJson(mimeType: string): Promise<any> {
    const items = await navigator.clipboard.read();

    let blob: Blob
    for (let item of items) {
        console.log(item)
        blob = await item.getType("web " + mimeType);
        if (blob) {
            break;
        }
    }

    if (!blob) {
        return;
    }

    const json = await blob.text();

    return JSON.parse(json);
}

export async function writeClipboardPattern(clipboardObject: ClipboardPattern): Promise<void> {
    return await writeClipboardJson(clipboardObject, "application/x-modulyzer-pattern");
}

export async function writeClipboardSequence(clipboardObject: ClipboardSequence): Promise<void> {
    return await writeClipboardJson(clipboardObject, "application/x-modulyzer-sequence");
}

export async function writeClipboardJson(clipboardObject: any, mimeType: string): Promise<void> {
    const blob = new Blob([JSON.stringify(clipboardObject)], {
        type: mimeType
    });
    const items = [ new ClipboardItem({["web " + mimeType]: blob}) ];
    await navigator.clipboard.write(items);
}
