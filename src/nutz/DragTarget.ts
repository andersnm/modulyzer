export abstract class DragTarget {
    abstract move(e: PointerEvent): void;
    abstract up(e: PointerEvent): void;
}
