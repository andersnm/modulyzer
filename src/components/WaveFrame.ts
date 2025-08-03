import { Appl } from "../App";
import { WaveDocument } from "../audio/SongDocument";
import { GridFrameContainer, IComponent } from "../nutz";
import { WavePanel } from "./WavePanel";
import { WavesPanel } from "./WavesPanel";

export class WaveFrame implements IComponent {
    app: Appl;
    container: GridFrameContainer;
    waveList: WavesPanel;
    waveView: WavePanel;

    constructor(app: Appl) {
        this.app = app;
        this.container = new GridFrameContainer();
        this.waveList = new WavesPanel(app);
        this.waveList.list.addEventListener("change", this.onSelectWave);
        this.waveList.instrumentDropdown.instrumentSelect.addEventListener("change", this.onSelectInstrument);

        this.waveView = new WavePanel(app);

        this.container.addFrame("left", this.waveList.getDomNode() as HTMLElement, undefined, 1);
        this.container.addFrame("main", this.waveView.getDomNode() as HTMLElement);
    }

    onSelectWave = (ev: CustomEvent<number>) => {
        const wave = this.waveList.instrument.waves[ev.detail];
        this.waveView.setWave(wave);
    };

    onSelectInstrument = (ev: Event) => {
        this.waveView.setWave(null);
        this.waveList.list.setSelectedIndex(-1);
        // who initializes to first?
        // want own event after pins are bound, now we dont know if pins are bound or not
    };

    getDomNode(): Node {
        return this.container.getDomNode();
    }

    setWave(wave: WaveDocument) {
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
