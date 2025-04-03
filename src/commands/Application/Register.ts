import { Appl } from '../../App';
import { ShowAudioConfigurationCommand } from '../ShowAudioConfigurationCommand';
import { CreateWaveCommand } from '../CreateWaveCommand';
import { ShowSequenceEditorCommand } from '../ShowSequenceEditorCommand';
import { ShowWavesCommand } from '../ShowWavesCommand';
import { ShowPatternsCommand } from '../ShowPatternsCommand';
import { OpenWaveCommand } from '../OpenWaveCommand';
import { ShowPatternEditorCommand } from '../ShowPatternEditorCommand';
import { ShowWaveEditorCommand } from '../ShowWaveEditorCommand';
import { SaveSongCommand } from '../SaveSongCommand';
import { RecordWaveCommand } from '../RecordWaveCommand';
import { PlayWaveCommand } from '../PlayWaveCommand';

export function registerApplicationCommands(app: Appl) {
    app.registerCommand("show-audio-configuration", new ShowAudioConfigurationCommand(app));
    app.registerCommand("show-waves", new ShowWavesCommand(app));
    app.registerCommand("show-patterns", new ShowPatternsCommand(app));
    app.registerCommand("show-pattern-editor", new ShowPatternEditorCommand(app));
    app.registerCommand("show-wave-editor", new ShowWaveEditorCommand(app));
    app.registerCommand("show-sequence-editor", new ShowSequenceEditorCommand(app));
    app.registerCommand("save-song", new SaveSongCommand(app));
    
    app.registerCommand("create-wave", new CreateWaveCommand(app));
    app.registerCommand("open-wave", new OpenWaveCommand(app));
    app.registerCommand("record-wave", new RecordWaveCommand(app));
    app.registerCommand("play-wave", new PlayWaveCommand(app));

    app.registerHotkey("F2", "show-pattern-editor");
    app.registerHotkey("SHIFT+F2", "show-patterns");
    // app.registerHotkey("F3", "show-mixer");
    // app.registerHotkey("SHIFT+F3", "show-pins");
    app.registerHotkey("F4", "show-sequence-editor");
    app.registerHotkey("F9", "show-wave-editor");
    app.registerHotkey("SHIFT+F9", "show-waves");

    app.registerHotkey("CTRL+S", "save-song");
}
