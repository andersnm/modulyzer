import { PatternsPanel } from "../../components/PatternsPanel";
import { DeletePatternCommand } from "./DeletePatternCommand";
import { DuplicatePatternCommand } from "./DuplicatePatternCommand";
import { EditPatternCommand } from "./EditPatternCommand";
import { GotoPatternEditorCommand } from "./GotoPatternEditorCommand";

export function registerPatternListCommands(component: PatternsPanel) {
    component.registerCommand("edit-pattern", "hgi-stroke hgi-edit-03", "Edit Pattern Properties", new EditPatternCommand(component));
    component.registerCommand("delete-pattern", "hgi-stroke hgi-delete", "Delete Pattern", new DeletePatternCommand(component));
    component.registerCommand("goto-pattern-editor", "hgi-stroke hgi-music-note-square-01", "Open in Pattern Editor", new GotoPatternEditorCommand(component));

    component.registerCommand("duplicate-pattern", "hgi-stroke hgi-copy-02", "Create a new duplicate pattern", new DuplicatePatternCommand(component));

    // component.registerHotkey("CTRL+SHIFT+ArrowDown", "octave-down");
}
