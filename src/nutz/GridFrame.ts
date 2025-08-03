import { CommandFrame } from "./CommandFrame";
import { ICommandHost } from "./CommandHost";
import { FrameWhere, GridFrameContainer } from "./GridFrameContainer";

/** 
 * Base class for a view component with a CommandHost and a GridFrameContainer.
 */
export class GridFrame extends CommandFrame {
    grid: GridFrameContainer;

    constructor(parent: ICommandHost) {
        super(parent);

        this.grid = new GridFrameContainer();
        this.container.appendChild(this.grid.getDomNode());
    }
}
