import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { GridFrameContainer, IComponent } from "../nutz";
import { PatternPanel } from "./PatternPanel";
import { PatternsPanel } from "./PatternsPanel";

export class PatternFrame implements IComponent {
    app: Appl;
    container: GridFrameContainer;
    patternList: PatternsPanel;
    patternView: PatternPanel;

    constructor(app: Appl) {
        this.app = app;
        this.container = new GridFrameContainer();
        this.patternList = new PatternsPanel(app);
        this.patternList.list.addEventListener("change", this.onSelectPattern);

        this.patternView = new PatternPanel(app);

        this.container.addFrame("left", this.patternList, undefined, 1);
        this.container.addFrame("main", this.patternView);

        this.container.outer.tabIndex = 0;
        this.container.outer.addEventListener("focus", this.onFocus);
    }

    onFocus = () => {
        (this.patternView.getDomNode() as HTMLElement).focus();
    };

    onSelectPattern = (ev: CustomEvent<number>) => {
        const pattern = this.app.song.patterns[ev.detail];
        this.patternView.setPattern(pattern);
    };

    getDomNode(): Node {
        return this.container.getDomNode();
    }

    setPattern(pattern: PatternDocument) {
        if (pattern) {
            this.patternView.setPattern(pattern);

            const index = this.app.song.patterns.indexOf(pattern);
            this.patternList.list.setSelectedIndex(index);
        } else {
            this.patternView.setPattern(null);
            this.patternList.list.setSelectedIndex(-1);
        }
    }
}
