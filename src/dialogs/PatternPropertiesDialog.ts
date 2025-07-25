import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { PatternPropertiesPanel } from "../components/PatternPropertiesPanel";

export async function showPatternPropertiesDialog(app: Appl, pattern: PatternDocument) {
    const patternPanel = new PatternPropertiesPanel(app, pattern.name, pattern.duration, pattern.subdivision, pattern.swing);
    const result = await app.modalDialogContainer.showModal("Pattern Properties", patternPanel);

    if (!result) {
        return;
    }

    app.song.updatePattern(pattern, patternPanel.name, patternPanel.length, patternPanel.subdivision, patternPanel.swing);
}
