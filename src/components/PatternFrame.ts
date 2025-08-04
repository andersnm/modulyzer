import { Appl } from "../App";
import { InstrumentDocument, PatternColumnDocument, PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { GridFrame } from "../nutz";
import { PatternPanel } from "./PatternPanel";
import { PatternsPanel } from "./PatternsPanel";

export class PatternFrame extends GridFrame {
    app: Appl;
    patternList: PatternsPanel;
    patternView: PatternPanel;

    instrument: InstrumentDocument | null = null;
    pattern: PatternDocument | null = null;

    constructor(app: Appl) {
        super(app);

        this.app = app;

        registerPatternEditorCommands(this);

        this.patternList = new PatternsPanel(app, this);
        this.patternList.list.addEventListener("change", this.onSelectPattern);
        this.patternList.instrumentDropdown.instrumentSelect.addEventListener("change", this.onSelectInstrument);

        this.patternView = new PatternPanel(app, this);

        this.grid.addFrame("left", this.patternList.getDomNode() as HTMLElement, undefined, 1);
        this.grid.addFrame("main", this.patternView.getDomNode() as HTMLElement);

        this.container.tabIndex = 0;
        this.container.addEventListener("focus", this.onFocus);
        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {
        // NOTE: Validate document objects on (re)mount. It's one of two approaches. EITHER:
        //   - Detach event handlers when view is hidden, and validate the document objects here, OR
        //   - Let the event handlers run also when hidden and maintain document objects, no need 
        //     for validation, but needs some kind of "destroy()"-pattern to detach the handlers.
        if (!this.app.song.validPattern(this.pattern)) {
            if (!this.app.song.validInstrument(this.instrument)) {
                this.instrument = this.app.song.instruments[0] ?? null;
            }

            this.pattern = this.instrument?.patterns[0] ?? null;
        }

        this.patternList.bindInstruments(this.app.song.instruments);
        this.setInstrument(this.instrument)
        this.patternList.bindPatternList(this.instrument?.patterns ?? []);
        this.setPattern(this.pattern);

        this.app.song.addEventListener("createPattern", this.onUpdatePattern);
        this.app.song.addEventListener("updatePattern", this.onUpdatePattern);
        this.app.song.addEventListener("deletePattern", this.onDeletePattern);
        this.app.song.addEventListener("createPatternColumn", this.onUpdatePatternColumn);
        this.app.song.addEventListener("deletePatternColumn", this.onUpdatePatternColumn);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createPattern", this.onUpdatePattern);
        this.app.song.removeEventListener("updatePattern", this.onUpdatePattern);
        this.app.song.removeEventListener("deletePattern", this.onDeletePattern);
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

    onDeletePattern = (ev: CustomEvent<PatternDocument>) => {
        if (ev.detail.instrument !== this.instrument) {
            return;
        }

        this.patternList.bindPatternList(this.instrument.patterns);

        if (this.pattern === ev.detail) {
            this.setPattern(null);

            if (ev.detail.instrument.patterns.length > 0) {
                this.setPattern(ev.detail.instrument.patterns[0]);
            }
        }
    };

    onUpdatePatternColumn = (ev: CustomEvent<PatternColumnDocument>) => {
        if (ev.detail.pattern.instrument !== this.instrument) {
            return;
        }

        this.patternList.bindPatternList(this.instrument.patterns);
    };

    setPattern(pattern: PatternDocument) {
        this.pattern = pattern;
        this.patternView.setPattern(pattern);
        this.patternList.setPattern(pattern);
    }

    setInstrument(instrument: InstrumentDocument) {
        this.instrument = instrument;

        this.patternList.setInstrument(instrument);
        this.patternList.bindPatternList(instrument.patterns);
    }
}
