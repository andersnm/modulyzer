import { Appl } from "../App";
import { InstrumentDocument, PatternColumnDocument, PatternDocument } from "../audio/SongDocument";
import { GridFrameContainer, IComponent } from "../nutz";
import { PatternPanel } from "./PatternPanel";
import { PatternsPanel } from "./PatternsPanel";

export class PatternFrame implements IComponent {
    app: Appl;
    container: GridFrameContainer;
    patternList: PatternsPanel;
    patternView: PatternPanel;

    instrument: InstrumentDocument | null = null;
    pattern: PatternDocument | null = null;

    constructor(app: Appl) {
        this.app = app;
        this.container = new GridFrameContainer();
        this.patternList = new PatternsPanel(app, this);
        this.patternList.list.addEventListener("change", this.onSelectPattern);
        // this.patternList.list.addEventListener("dblclick", this.onDblClick);
        this.patternList.instrumentDropdown.instrumentSelect.addEventListener("change", this.onSelectInstrument);

        this.patternView = new PatternPanel(app);

        this.container.addFrame("left", this.patternList, undefined, 1);
        this.container.addFrame("main", this.patternView);

        this.container.outer.tabIndex = 0;
        this.container.outer.addEventListener("focus", this.onFocus);
        this.container.outer.addEventListener("nutz:mounted", this.onMounted);
        this.container.outer.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {

        this.patternList.bindInstruments(this.app.song.instruments);

        if (!this.instrument) {
            this.instrument = this.app.song.instruments[0] ?? null;
            this.pattern = this.instrument?.patterns[0] ?? null;
        }

        this.patternList.setInstrument(this.instrument);
        this.patternList.setPattern(this.pattern);

        this.patternView.setPattern(this.pattern);

        this.app.song.addEventListener("createPattern", this.onUpdatePattern);
        this.app.song.addEventListener("updatePattern", this.onUpdatePattern);
        this.app.song.addEventListener("deletePattern", this.onUpdatePattern);
        this.app.song.addEventListener("createPatternColumn", this.onUpdatePatternColumn);
        this.app.song.addEventListener("deletePatternColumn", this.onUpdatePatternColumn);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createPattern", this.onUpdatePattern);
        this.app.song.removeEventListener("updatePattern", this.onUpdatePattern);
        this.app.song.removeEventListener("deletePattern", this.onUpdatePattern);
        this.app.song.removeEventListener("createPatternColumn", this.onUpdatePatternColumn);
        this.app.song.removeEventListener("deletePatternColumn", this.onUpdatePatternColumn);
    };

    onFocus = () => {
        (this.patternView.getDomNode() as HTMLElement).focus();
    };

    onSelectPattern = (ev: CustomEvent<number>) => {
        this.pattern = this.instrument.patterns[ev.detail];
        this.patternView.setPattern(this.pattern);
    };

    onSelectInstrument = (ev: Event) => {
        const name = this.patternList.instrumentDropdown.instrumentSelect.value;
        const instrument = this.app.song.instruments.find(i => i.name === name);
        this.setInstrument(instrument);

        const pattern = instrument?.patterns[0] ?? null;
        this.setPattern(pattern);
    };

    onUpdatePattern = (ev: CustomEvent<PatternDocument>) => {
        if (ev.detail.instrument !== this.instrument) {
            return;
        }

        this.patternList.bindPatternList(this.instrument.patterns);
    };

    onUpdatePatternColumn = (ev: CustomEvent<PatternColumnDocument>) => {
        if (ev.detail.pattern.instrument !== this.instrument) {
            return;
        }

        this.patternList.bindPatternList(this.instrument.patterns);
    };

    getDomNode(): Node {
        return this.container.getDomNode();
    }

    setPattern(pattern: PatternDocument) {
        this.pattern = pattern;
        this.patternView.setPattern(pattern);
        this.patternList.setPattern(pattern);
    }

    setInstrument(instrument: InstrumentDocument, pattern: PatternDocument = null) {
        this.instrument = instrument;

        this.patternList.setInstrument(instrument);
        this.patternList.bindPatternList(instrument.patterns);
    }
}
