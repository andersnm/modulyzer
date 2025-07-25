import { Appl } from "../App";
import { WaveDocument } from "../audio/SongDocument";
import { WavePropertiesPanel } from "../components/WavePropertiesPanel";

export async function showWavePropertiesDialog(app: Appl, wave: WaveDocument) {
    const wavePanel = new WavePropertiesPanel(app, wave.name, wave.note);
    const result = await app.modalDialogContainer.showModal("Wave Properties", wavePanel);

    if (!result) {
        return;
    }

    app.song.updateWave(wave, wavePanel.name, wavePanel.note, wave.selection, wave.zoom);
}
