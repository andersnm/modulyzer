import { Appl } from "../App";
import { InstrumentDocument } from "../audio/SongDocument";
import { findAvailableNote } from "../commands/WaveEditor/PasteNewWaveCommand";
import { CreateWavePanel } from "../components/CreateWavePanel";

export async function showCreateNewWaveDialog(app: Appl, instrument: InstrumentDocument) {
    const note = findAvailableNote(instrument.waves);
    const panel = new CreateWavePanel(app, note);

    const result = await app.modalDialogContainer.showModal("Create Wave", panel);
    if (!result) {
        return null;
    }

    const channelCount = panel.channels;
    const sampleRate = app.device?.context.sampleRate ?? 44100;
    const sampleCount = panel.duration * sampleRate;

    const buffers: Float32Array[] = [];
    for (let i = 0; i < channelCount; i++) {
        buffers.push(new Float32Array(sampleCount));
    }

    return app.song.createWave(instrument, panel.name, panel.note, sampleCount, sampleRate, buffers);
}
