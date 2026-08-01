type DeepArray<T> = T | DeepArray<T>[];

export function domAppendNodes(domElement: ChildNode, childNodes: DeepArray<Node>): Node {
    if (childNodes === undefined || childNodes === null) {
        return;
    }

    if (Array.isArray(childNodes)) {
        for (let childNode of childNodes) {
            domAppendNodes(domElement, childNode);
        }
    } else {
        domElement.appendChild(childNodes);
    }

    return domElement;
}

export function domAfterNodes(domElement: ChildNode, childNodes: ChildNode[]) {
    let next = domElement;
    for (let childNode of childNodes) {
        next.after(childNode);
        next = childNode;
    }
}

export function domRemoveBetween(placeholderStart: ChildNode, placeholderEnd: ChildNode) {

    if (placeholderStart.parentElement !== placeholderEnd.parentElement) {
        throw new Error("domRemoveBetween expects parameters with same parent")
    }

    while (placeholderStart.nextSibling && placeholderStart.nextSibling !== placeholderEnd) {
        if (!placeholderStart.parentElement) throw new Error("Internal error");
        placeholderStart.parentElement.removeChild(placeholderStart.nextSibling)
    }
}


export function visitNodeAndChildNodesDepth(node: Node, handler: (node: Node) => void) {
    // unmount depth-first, want to unwatch everything inside, before we tear down the parent,

    if (node.nodeType === Node_ELEMENT_NODE) {
        const childNodes = [...node.childNodes].reverse();
        for (let childNode of childNodes) {
            visitNodeAndChildNodesDepth(childNode, handler);
        }
    }

    handler(node);
}

const Node_ELEMENT_NODE = 1;

export function visitNodeAndChildNodesBreadth(node: Node, handler: (node: Node) => void) {
    // mount breadth-first, mount parents before child nodes
    handler(node);

    if (node.nodeType === Node_ELEMENT_NODE) {
        for (let childNode of node.childNodes) {
            visitNodeAndChildNodesBreadth(childNode, handler);
        }
    }
}

export function isFocusable(el: HTMLElement): boolean {
    if (!el.isConnected) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;

    if ((el as any).disabled) return false;

    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && !isNaN(parseInt(tabindex))) {
        return true;
    }

    const focusableTags = ["A", "INPUT", "BUTTON", "SELECT", "TEXTAREA"];
    if (focusableTags.includes(el.tagName)) {
        if (el.tagName === "A") {
            return (el as HTMLAnchorElement).href !== "";
        }
        return true;
    }

    if (el.hasAttribute("contenteditable")) return true;

    return false;
}
