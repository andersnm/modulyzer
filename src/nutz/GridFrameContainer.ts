import { IComponent } from "./IComponent";

export type FrameWhere = "top" | "bottom" | "left" | "right" | "main";
export type FrameStack = "vertical" | "horizontal";

export interface FrameInfo2 {
    where: FrameWhere;
    content: IComponent;
    stack?: FrameStack;
    gap?: number;
}

export class GridFrameContainer implements IComponent {
    outer: HTMLElement;
    frames: FrameInfo2[] = [];

    constructor() {
        this.outer = document.createElement("div");
        this.outer.className = "flex flex-1";
    }

    addFrame(where: FrameWhere, content: IComponent, stack?: FrameStack, gap?: number) {
        this.frames.push({
            where,
            content,
            stack,
            gap,
        });

        this.bind();
        // invalidate();
    }

    bind() {
        while (this.outer.childNodes.length > 0) this.outer.removeChild(this.outer.lastChild);

        // recurse depth first, then 
        let index = this.frames.length - 1;

        let innerFrame = this.renderFrame(this.frames[index], null);
        index--;

        while (index >= 0) {
            innerFrame = this.renderFrame(this.frames[index], innerFrame);
            index--;
        }

        this.outer.appendChild(innerFrame);
    }

    getDomNode(): Node {
        return this.outer;
    }

    renderFrame(frame: FrameInfo2, innerFrame: HTMLElement): HTMLElement {
        const { where, stack, gap } = frame;
    
        // can we react if stack changes? dont think so anymore
        const flexStacking = stack === "horizontal" ? "flex-row" : "flex-col";

        if (where === "left") {
            const outer = document.createElement("div");
            outer.className = "flex flex-row flex-1 frame-left " + "gap-" + (gap??0);

            const inner = document.createElement("div");
            inner.className = "flex " + flexStacking + " w-80 border-transparent";

            const frameContent = frame.content.getDomNode();
            inner.appendChild(frameContent);

            outer.appendChild(inner);

            if (innerFrame) {
                outer.appendChild(innerFrame); // render next frame here
            }

            return outer;
        } else if (where === "top") {
            const outer = document.createElement("div");
            outer.className = "flex flex-col flex-1 frame-top " + "gap-" + (gap??0);;

            const inner = document.createElement("div");
            inner.className = "flex " + flexStacking + " border-transparent";

            const frameContent = frame.content.getDomNode();
            inner.appendChild(frameContent);

            outer.appendChild(inner);

            if (innerFrame) {
                outer.appendChild(innerFrame); // render next frame here
            }

            return outer;
        } else if (where === "bottom") {
            const outer = document.createElement("div");
            outer.className = "flex flex-col flex-1 frame-bottom " + "gap-" + (gap??0);;

            const inner = document.createElement("div");
            inner.className = "flex " + flexStacking + " border-transparent";

            const frameContent = frame.content.getDomNode();
            inner.appendChild(frameContent);

            if (innerFrame) {
                outer.appendChild(innerFrame); // render next frame here
            }

            outer.appendChild(inner);

            return outer;
        } else if (where === "main") {
            // vi trenger en div run denne for å unngå at denne legger til flere items directe i forrige split
            const inner = document.createElement("div");
            inner.className = "flex " + flexStacking + " flex-1 frame-main";

            const frameContent = frame.content.getDomNode();
            inner.appendChild(frameContent); // childOrChildNodes

            return inner;
        } else {
            throw new Error("TODO; more frames")
        }
    }
}