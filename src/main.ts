// import './style.css'
import { ShowAudioConfigurationCommand } from './commands/ShowAudioConfigurationCommand';
import { ShowCreateNewRecordingCommand } from './commands/ShowCreateNewRecordingCommand';
import { ShowExportRecordingCommand } from './commands/ShowExportRecordingCommand';
import { ShowSequenceEditorCommand } from './commands/ShowSequenceEditorCommand';
import { Appl } from './App';
import { ShowRecordingsCommand } from './commands/ShowRecordingsCommand';
import { ShowPatternsCommand } from './commands/ShowPatternsCommand';
import { ShowOpenWaveCommand } from './commands/ShowOpenWaveCommand';
import { ShowPatternEditorCommand } from './commands/ShowPatternEditorCommand';
import { ShowWaveEditorCommand } from './commands/ShowWaveEditorCommand';
import { ShowSaveAsCommand } from './commands/ShowSaveAsCommand';
import { RecordWaveCommand } from './commands/RecordWaveCommand';

const app = new Appl();
// app.registerCommand("play-current-recording", new PlayCurrentRecordingCommand(app))
app.registerCommand("show-audio-configuration", new ShowAudioConfigurationCommand(app))
app.registerCommand("show-create-new-recording", new ShowCreateNewRecordingCommand(app))
app.registerCommand("show-recordings", new ShowRecordingsCommand(app))
app.registerCommand("show-patterns", new ShowPatternsCommand(app))
app.registerCommand("show-pattern-editor", new ShowPatternEditorCommand(app))
app.registerCommand("show-wave-editor", new ShowWaveEditorCommand(app))
app.registerCommand("show-open-wave", new ShowOpenWaveCommand(app))
// app.registerCommand("show-export-recording", new ShowExportRecordingCommand(app))
app.registerCommand("show-sequence-editor", new ShowSequenceEditorCommand(app))
app.registerCommand("save", new ShowSaveAsCommand(app))
app.registerCommand("record-wave", new RecordWaveCommand(app))

// app.registerCommand("copy-selection", new CopySelectionCommand(app))
// app.registerCommand("cut-selection", new CutSelectionCommand(app))
// app.registerCommand("paste-selection", new PasteSelectionCommand(app))

// app.registerCommand("play-song", new PlayCurrentSongCommand(app))
// app.registerCommand("stop-song", new StopCurrentSongCommand(app))

// app.registerHotkey("CTRL+C", "copy-selection");
// app.registerHotkey("CTRL+X", "cut-selection");
// app.registerHotkey("CTRL+P", "paste-selection");
// app.registerHotkey("F4", "show-sequence");
// app.registerHotkey("F5", "play-song");
// app.registerHotkey("F8", "stop-song");

const el = app.render();

const mountPoint = document.querySelector("#app")!;
mountPoint.appendChild(el);

window["app"] =app;