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

export async function readClipboardPattern(): Promise<ClipboardPattern> {
    const items = await navigator.clipboard.read();

    let blob: Blob
    for (let item of items) {
        console.log(item)
        blob = await item.getType("web application/x-modulyzer-pattern");
        if (blob) {
            break;
        }
    }

    if (!blob) {
        return;
    }

    const json = await blob.text();

    return JSON.parse(json) as ClipboardPattern;
}

export async function writeClipboardPattern(clipboardObject: ClipboardPattern): Promise<void> {

    const blob = new Blob([JSON.stringify(clipboardObject)], {
        type: "application/x-modulyzer-pattern"
    });
    const items = [ new ClipboardItem({"web application/x-modulyzer-pattern": blob}) ];
    await navigator.clipboard.write(items);
}
