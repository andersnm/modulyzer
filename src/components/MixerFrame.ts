import { Appl } from "../App";
import { GridFrameContainer, IComponent, TabFrameContainer, VInset, VOutset } from "../nutz";
import { MixerPanel } from "./MixerPanel";
import { PinsPanel } from "./PinsPanel";

export class MixerFrame implements IComponent {
    app: Appl;
    container: GridFrameContainer;
    list: PinsPanel;
    view: MixerPanel;

    constructor(app: Appl) {
        this.app = app;
        this.container = new GridFrameContainer();
        this.list = new PinsPanel(app);
        this.view = new MixerPanel(app);

        this.container.addFrame("left", this.list, undefined, 1);
        this.container.addFrame("main", this.view);
    }

    getDomNode(): Node {
        return this.container.getDomNode();
    }
}
