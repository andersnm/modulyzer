import { PatternPanel } from "../../components/PatternPanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { CopyCommand } from "./CopyCommand";
import { CutCommand } from "./CutCommand";
import { DoubleSubdivideCommand } from "./DoubleSubdivideCommand";
import { DuplicatePatternCommand } from "./DuplicatePatternCommand";
import { EditPatternCommand } from "./EditPatternCommand";
import { HalveSubdivideCommand } from "./HalveSubdivideCommand";
import { OctaveDownCommand } from "./OctaveDownCommand";
import { OctaveUpCommand } from "./OctaveUpCommand";
import { PasteCommand } from "./PasteCommand";

export function registerPatternEditorCommands(component: PatternPanel) {
    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", "Add a Column", new AddColumnCommand(component));
    component.registerCommand("edit-pattern", "hgi-stroke hgi-edit-03", "Edit Pattern Properties", new EditPatternCommand(component));
    component.registerCommand("cut", "hgi-stroke hgi-scissor-01", null, new CutCommand(component));
    component.registerCommand("copy", "hgi-stroke hgi-copy-01", null, new CopyCommand(component));
    component.registerCommand("paste", "hgi-stroke hgi-column-insert", null, new PasteCommand(component));

    component.registerCommand("octave-up", "hgi-stroke hgi-circle-arrow-up-01", null, new OctaveUpCommand(component));
    component.registerCommand("octave-down", "hgi-stroke hgi-circle-arrow-down-01", null, new OctaveDownCommand(component));
    component.registerCommand("double-subdivide", "hgi-stroke hgi-divide-sign-circle", "Double pattern length and subdivision", new DoubleSubdivideCommand(component));
    component.registerCommand("halve-subdivide", "hgi-stroke hgi-divide-sign-circle", "Halve pattern length and subdivision", new HalveSubdivideCommand(component));
    component.registerCommand("duplicate-pattern", "hgi-stroke hgi-copy-02", "Create a new duplicate pattern", new DuplicatePatternCommand(component));

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+X", "cut");
    component.registerHotkey("CTRL+C", "copy");
    component.registerHotkey("CTRL+V", "paste");
    component.registerHotkey("CTRL+D", "double-subdivide");
    component.registerHotkey("CTRL+H", "halve-subdivide");
    component.registerHotkey("Escape", "show-sequence-editor");
    component.registerHotkey("CTRL+Backspace", "edit-pattern");
    component.registerHotkey("CTRL+Enter", "add-column");
    component.registerHotkey("CTRL+SHIFT+Enter", "duplicate-pattern");
    component.registerHotkey("CTRL+SHIFT+ArrowUp", "octave-up");
    component.registerHotkey("CTRL+SHIFT+ArrowDown", "octave-down");
}
