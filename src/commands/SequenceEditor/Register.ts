import { SequencePanel } from "../../components/SequencePanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { CopyCommand } from "./CopyCommand";
import { CutCommand } from "./CutCommand";
import { PasteCommand } from "./PasteCommand";
import { PlaySongFromCursorCommand } from "./PlaySongFromCursorCommand";
import { SetLoopEndCommand } from "./SetLoopEndCommand";
import { SetLoopStartCommand } from "./SetLoopStartCommand";

export function registerSequenceEditorCommands(component: SequencePanel) {
    component.registerCommand("cut", "hgi-stroke hgi-scissor-01", "Cut", new CutCommand(component));
    component.registerCommand("copy", "hgi-stroke hgi-copy-01", "Copy", new CopyCommand(component));
    component.registerCommand("paste", "hgi-stroke hgi-column-insert", "Paste", new PasteCommand(component));

    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", null, new AddColumnCommand(component));
    component.registerCommand("set-loop-start", null, null, new SetLoopStartCommand(component));
    component.registerCommand("set-loop-end", null, null, new SetLoopEndCommand(component));

    component.registerCommand("play-song-from-cursor", null, null, new PlaySongFromCursorCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("F6", "play-song-from-cursor");
    component.registerHotkey("CTRL++", "add-column");
    component.registerHotkey("CTRL+X", "cut");
    component.registerHotkey("CTRL+C", "copy");
    component.registerHotkey("CTRL+V", "paste");
    component.registerHotkey("CTRL+B", "set-loop-start");
    component.registerHotkey("CTRL+E", "set-loop-end");
}
