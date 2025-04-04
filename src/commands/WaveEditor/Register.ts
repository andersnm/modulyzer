import { WavePanel } from "../../components/WavePanel";
import { CopyCommand } from "./CopyCommand";
import { CropCommand } from "./CropCommand";
import { CutCommand } from "./CutCommand";
import { EditWaveCommand } from "./EditWaveCommand";
import { PasteCommand } from "./PasteCommand";
import { SaveWaveCommand } from "./SaveWaveCommand";
import { SelectAllCommand } from "./SelectAllCommand";
import { ZoomCommand } from "./ZoomCommand";
import { ZoomInCommand } from "./ZoomInCommand";
import { ZoomOutCommand } from "./ZoomOutCommand";

export function registerWaveEditorCommands(component: WavePanel) {
    component.registerCommand("save-wave", "hgi-stroke hgi-folder", null, new SaveWaveCommand(component));
    component.registerCommand("edit-wave", "hgi-stroke hgi-folder", null, new EditWaveCommand(component));
    component.registerCommand("cut", "hgi-stroke hgi-scissor-01", null, new CutCommand(component));
    component.registerCommand("copy", "hgi-stroke hgi-hgi-copy-01", null, new CopyCommand(component));
    component.registerCommand("paste", "hgi-stroke hgi-column-insert", null, new PasteCommand(component));
    component.registerCommand("crop", "hgi-stroke hgi-crop", null, new CropCommand(component));
    component.registerCommand("zoom", "hgi-stroke hgi-zoom-in-area", null, new ZoomCommand(component));
    component.registerCommand("zoom-in", "hgi-stroke hgi-zoom-in-area", null, new ZoomInCommand(component));
    component.registerCommand("zoom-out", "hgi-stroke hgi-zoom-in-area", null, new ZoomOutCommand(component));

    component.registerCommand("select-all", null, null, new SelectAllCommand(component));

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+C", "copy");
    component.registerHotkey("CTRL+X", "cut");
    component.registerHotkey("CTRL+V", "paste");
    component.registerHotkey("CTRL++", "zoom-in");
    component.registerHotkey("CTRL+-", "zoom-out");
    component.registerHotkey("SHIFT+S", "zoom");
    component.registerHotkey("CTRL+P", "crop");
    component.registerHotkey("CTRL+SHIFT+S", "save-wave");
    component.registerHotkey("CTRL+BACKSPACE", "edit-wave");
}
