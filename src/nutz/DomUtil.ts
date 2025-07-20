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
