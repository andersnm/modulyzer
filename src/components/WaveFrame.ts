import { Appl } from "../App";
import { InstrumentDocument, WaveDocument } from "../audio/SongDocument";
import { registerWaveEditorCommands } from "../commands/WaveEditor/Register";
import { GridFrame } from "../nutz";
import { WavePanel } from "./WavePanel";
import { WavesPanel } from "./WavesPanel";

export class WaveFrame extends GridFrame {
    app: Appl;
    waveList: WavesPanel;
    waveView: WavePanel;

    instrument: InstrumentDocument;
    wave: WaveDocument;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerWaveEditorCommands(this);

        this.waveList = new WavesPanel(app, this);
        this.waveList.list.addEventListener("change", this.onSelectWave);
        this.waveList.instrumentDropdown.instrumentSelect.addEventListener("change", this.onSelectInstrument);

        this.waveView = new WavePanel(app, this);

        this.grid.addFrame("left", this.waveList.getDomNode() as HTMLElement, undefined, 1);
        this.grid.addFrame("main", this.waveView.getDomNode() as HTMLElement);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        if (!this.app.song.validWave(this.wave)) {
            if (!this.app.song.validInstrument(this.instrument)) {
                const instruments = this.waveList.getWaveTableInstruments();
                this.instrument = instruments[0] ?? null;
            }

            this.wave = this.instrument?.waves[0] ?? null;
        }

        this.waveList.bindInstruments();
        this.setInstrument(this.instrument);
        this.waveList.bindWaves(this.instrument?.waves ?? []);
        this.setWave(this.wave);

        this.app.song.addEventListener("createInstrument", this.onUpdateInstrument);
        this.app.song.addEventListener("deleteInstrument", this.onDeleteInstrument);
        this.app.song.addEventListener("createWave", this.onCreateWave);
        this.app.song.addEventListener("updateWave", this.onUpdateWave);
        this.app.song.addEventListener("deleteWave", this.onDeleteWave);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("createInstrument", this.onUpdateInstrument);
        this.app.song.removeEventListener("deleteInstrument", this.onDeleteInstrument);
        this.app.song.removeEventListener("createWave", this.onCreateWave);
        this.app.song.removeEventListener("updateWave", this.onUpdateWave);
        this.app.song.removeEventListener("deleteWave", this.onDeleteWave);
    };

    onCreateWave = (ev: CustomEvent<WaveDocument>) => {
        if (ev.detail.instrument !== this.instrument) {
            return;
        }

        this.waveList.bindWaves(this.instrument.waves);
    }

    onUpdateWave = (ev: CustomEvent<WaveDocument>) => {
        if (ev.detail.instrument !== this.instrument) {
            return;
        }

        this.waveList.bindWaves(this.instrument.waves);

        if (ev.detail !== this.wave) {
            return;
        }

        this.waveView.waveEditor.buffers = ev.detail.buffers;
        this.waveView.waveEditor.redrawCanvas();

        this.waveView.waveScroll.buffers = ev.detail.buffers;
        this.waveView.waveScroll.redrawCanvas();
    };

    onDeleteWave = (ev: CustomEvent<WaveDocument>) => {
        if (ev.detail.instrument !== this.instrument) {
            return;
        }

        this.waveList.bindWaves(this.instrument.waves);

        if (ev.detail !== this.wave) {
            return;
        }

        this.setWave(null);
    };

    onUpdateInstrument = (e: CustomEvent<InstrumentDocument>) => {
        this.waveList.bindInstruments();

        if (e.detail !== this.instrument) {
            return;
        }

        this.setInstrument(null);
        this.setWave(null);
    };

    onDeleteInstrument = (e: CustomEvent<InstrumentDocument>) => {
        this.waveList.bindInstruments();

        if (e.detail !== this.instrument) {
            return;
        }

        const instruments = this.waveList.getWaveTableInstruments();
        this.instrument = instruments[0] ?? null;
        this.wave = this.instrument?.waves[0] ?? null;

        this.setInstrument(this.instrument);
        this.waveList.bindWaves(this.instrument?.waves ?? []);
        this.setWave(this.wave);
    }

    onSelectWave = (ev: CustomEvent<number>) => {
        const wave = this.instrument?.waves[ev.detail] ?? null;
        this.setWave(wave);
    };

    onSelectInstrument = (ev: Event) => {
        const instruments = this.waveList.getWaveTableInstruments();
        const name = this.waveList.instrumentDropdown.instrumentSelect.value;
        const instrument = instruments.find(i => i.name === name);

        const wave = instrument.waves[0] ?? null; // TODO: recall previous selection

        this.setInstrument(instrument);
        this.waveList.bindWaves(instrument.waves);
        this.setWave(wave);
    };

    setInstrument(instrument: InstrumentDocument) {
        this.instrument = instrument;
        this.waveList.setInstrument(instrument);
    }

    setWave(wave: WaveDocument) {
        this.wave = wave;

        if (wave) {
            this.waveView.setWave(wave);

            const index = wave.instrument.waves.indexOf(wave);
            this.waveList.list.setSelectedIndex(index);
        } else {
            this.waveView.setWave(null);
            this.waveList.list.setSelectedIndex(-1);
        }
    }
}
