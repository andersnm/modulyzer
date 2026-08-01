import { Appl } from "./App";
import { InstrumentDocument } from "./audio/SongDocument";
import { getNoteForKey } from "./components/PatternEditorHelper";

const keys = new Map<number, InstrumentDocument>();

export function noteKeyDown(app: Appl, instrument: InstrumentDocument, ev: KeyboardEvent) {

    if (ev.repeat) {
        return false;
    }

    if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) {
        return false;
    }

    const note = getNoteForKey(ev.code, 4);
    console.log("key down note " + note)
    if (note !== -1) {
        // Send midi to instrumnt
        const instrumenteer = app.playerSongAdapter.instrumentMap.get(instrument);
        instrumenteer.instrument.sendMidi(app.device.context.currentTime, 0x90, note, 127);
        keys.set(note, instrument);
        return true;
    }

    return false;
}

export function noteKeyUp(app: Appl, instrument: InstrumentDocument, ev: KeyboardEvent) {
    const note = getNoteForKey(ev.code, 4);
    console.log("key up note " + note)
    if (note !== -1) {
        const instrumenteer = app.playerSongAdapter.instrumentMap.get(instrument);
        instrumenteer.instrument.sendMidi(app.device.context.currentTime, 0x90, note, 0);
        keys.delete(note);
        return true;
    }

    return false;
}

export function noteKeyStopAll(app: Appl) {
    for (let [note, instrument] of keys) {
        const instrumenteer = app.playerSongAdapter.instrumentMap.get(instrument);
        instrumenteer.instrument.sendMidi(app.device.context.currentTime, 0x90, note, 0);
    }

    keys.clear();
}
