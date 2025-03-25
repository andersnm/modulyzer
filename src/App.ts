import { RecordingsPanel } from "./components/RecordingsPanel";
import { ApplicationBase, ButtonToolbar, DomText, FullScreen, GridFrameContainer, IComponent, TabFrameContainer, visitNodeAndChildNodesBreadth, visitNodeAndChildNodesDepth } from "./nutz";
import { MenuBar } from "./nutz/Menubar";
import { ModalDialogContainer } from "./nutz/ModalDialogContainer";
import { mainMenu, MenuItem } from './menu/menu';
import { tryGetMicrophonePermission } from "./audio/AudioUtil";
import { AudioDevice } from "./audio/AudioDevice";
import { RecordingPanel } from "./components/RecordingPanel";
import { SongDocument, WaveDocumentEx } from "./audio/SongDocument";
import { InstrumentFactory } from "./audio/plugins/InstrumentFactory";
import { MasterFactory } from "./audio/plugins/Master";
import { ComboDelayFactory } from "./audio/plugins/ComboDelay";
import { OscillatorFactory } from "./audio/plugins/Oscillator";
import { MixerPanel } from "./components/MixerPanel";
import { ReverbFactory } from "./audio/plugins/Reverb";
import { Dx7Factory } from "./audio/plugins/Dx7";
import { Player } from "./audio/Player";
import { WaveTrackerFactory } from "./audio/plugins/WaveTracker";
import { Open303Factory } from "./audio/plugins/Open303";

function patternEventNoteOn(time: number, note: number, velocity: number = 127, channel: number = 0) {
    return { 
        time: time,
        value: note,
        data0: velocity,
        data1: 1,  // wait wat
        channel: channel,
    };
}

function patternEventNoteOff(time: number, note: number, channel: number = 0) {
    return { 
        time: time,
        value: note,
        data0: 0,
        data1: 0,
        channel: channel,
    };
}

const songTemplate = {
    instruments: [
        {
            ref: "@modulyzer/Master",
            name: "Master",
            x: 0, y: 0,
        },
        {
            ref: "@modulyzer/Dx7",
            name: "DX",
            // ref: "@modulyzer/Oscillator",
            // name: "Osc",
            x: -0.7, y: 0,
        },
        {
            ref: "@modulyzer/Reverb",
            name: "Reverb",
            x: -0.3, y: 0,
        },
    ],
    connections: [
        {
            from: 1,
            to: 2,
        },
        {
            from: 2,
            to: 0,
        }
    ],
    patterns: [
        {
            name: "00",
            duration: 32,
            columns: [
                {
                    instrument: 1,
                    pin: 0,
                    events: [
                        // TODO; integer time, player scales by bpm
                        patternEventNoteOn(0, 60),
                        patternEventNoteOff(1, 60),

                        patternEventNoteOn(4, 64),
                        patternEventNoteOff(5, 64),
                
                        patternEventNoteOn(8, 69),
                        patternEventNoteOff(9, 69),
                
                        patternEventNoteOn(14, 73),
                        patternEventNoteOff(15, 73),

                        // //  channel 1
                        patternEventNoteOn(0, 64, 127, 1),
                        patternEventNoteOff(3, 64, 1),

                        // patternEventNoteOn(6, 39, 127, 1),
                        // patternEventNoteOff(11, 39, 1),

                        // // c 2
                        // patternEventNoteOn(0, 57, 127, 2),
                        // patternEventNoteOff(13, 57, 2),

                    ]
                },
                // {
                //     instrument: 1,
                //     pin: 1,
                //     events: [],
                // },
            ]
        }
    ],
    waves: [],
    sequence: {
        columns: [
            {
                events: [
                    {
                        time: 0,
                        pattern: 0,
                    },
                    // {
                    //     time: 8,
                    //     pattern: 0,
                    // },
                    // {
                    //     time: 12,
                    //     pattern: 0,
                    // },
                ]
            }
        ],
    },
};

class ElementComponent implements IComponent {
    constructor(private container: HTMLElement) {

    }
    getDomNode(): Node {
        return this.container;
    }
}

export class Appl extends ApplicationBase implements IComponent {
    fullscreen: FullScreen;
    menuBar: MenuBar;
    bpmInput: HTMLInputElement;
    toolbar: HTMLElement;
    frame: GridFrameContainer;
    sidebarTabs: TabFrameContainer;
    mainTabs: TabFrameContainer;

    device: AudioDevice;
    song: SongDocument;
    player: Player;

    modalDialogContainer: ModalDialogContainer;
    // recordings: RecordingsPanel;

    domObserver: MutationObserver;

    instrumentFactories: InstrumentFactory[] = [
        new MasterFactory(),
        new ComboDelayFactory(),
        new OscillatorFactory(),
        new ReverbFactory(),
        new Dx7Factory(),
        new WaveTrackerFactory(),
        new Open303Factory(),
    ];

    constructor() {
        super();

        this.song = new SongDocument();

        this.device = new AudioDevice();

        this.frame = new GridFrameContainer();
        this.fullscreen = new FullScreen(this.frame);

        this.menuBar = new MenuBar(this);
        this.menuBar.bindMenu(mainMenu);

        // NOTE: toolbar input button assigns to bpmInput
        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "",
                icon: "hgi-stroke hgi-folder-02",
                click: () => this.uploadProject(),
            },
            {
                type: "button",
                label: "",
                icon: "hgi-stroke hgi-download-04",
                click: () => this.executeCommand("save"),
            },
            // 
            {
                type: "button",
                label: "Play",
                icon: "hgi-stroke hgi-next",
                click: () => this.player.play(),
            },
            {
                type: "button",
                label: "Stop",
                icon: "hgi-stroke hgi-record",
                click: () => this.player.stop(),
            },
            {
                type: "separator",
            },
            {
                type: "button",
                label: "BPM -",
                icon: "",
                click: () => {
                    this.song.setBpm(this.song.bpm - 1);
                },
            },
            {
                type: "input",
                // label: "BPM",
                init: (el: HTMLInputElement) => {
                    el.type = "number";
                    el.min = "16";
                    el.max = "280";
                    el.value = this.song.bpm.toString();
                    el.className = "rounded-lg p-1 bg-neutral-600 text-white text-center";
                    this.bpmInput = el;
                },
                change: (el) => {
                    const i = parseInt(this.bpmInput.value);
                    if (!isNaN(i)) {
                        this.song.setBpm(i);
                    }
                },
            },
            {
                type: "button",
                label: "BPM +",
                icon: "",
                click: () => {
                    this.song.setBpm(this.song.bpm + 1);
                },
            },
        ]);

        this.sidebarTabs = new TabFrameContainer(true);
        this.sidebarTabs.setTabsPosition("bottom");

        this.mainTabs = new TabFrameContainer(false);

        this.frame.addFrame("top", 100, this.menuBar);
        
        // TODO; buttons and bpm+slider \ vu on same row
        this.frame.addFrame("top", 100, new ElementComponent(this.toolbar));
        this.frame.addFrame("left", 100, this.sidebarTabs);
        this.frame.addFrame("main", 100, this.mainTabs);

        this.modalDialogContainer = new ModalDialogContainer();

        this.song.addEventListener("updateDocument", (ev: CustomEvent<SongDocument>) => {
            this.bpmInput.value = this.song.bpm.toString();
        });

        // Emit events for mounts and unmounts
        this.domObserver = new MutationObserver((mutationList: MutationRecord[], observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    for (let node of mutation.addedNodes) {
                        visitNodeAndChildNodesBreadth(node, (subnode) => {
                            // console.log("OBSERVA", subnode);
                            subnode.dispatchEvent(new CustomEvent("nutz:mounted"));
                        });
                    }

                    for (let node of mutation.removedNodes) {
                        visitNodeAndChildNodesDepth(node, subnode => {
                            subnode.dispatchEvent(new CustomEvent("nutz:unmounted"));
                        });
                        
                    }
                }
            }
        });

        // observe the whole body - want to interact with modals opened in the body
        const config = { childList: true, subtree: true };
        this.domObserver.observe(document.body, config);
        // this.domObserver.observe(this.fullscreen.getDomNode(), config);
    }

    async init() {

        // await this.storage.open();
        this.executeCommand("show-patterns");
        this.executeCommand("show-recordings");

        const permission = await tryGetMicrophonePermission();

        this.executeCommand("show-audio-configuration");
        this.executeCommand("show-sequence-editor");
        this.executeCommand("show-pattern-editor");

        // recording panel = waveeditorpanel - redigerer én wave i prosjekte.
        const wq = new RecordingPanel(this);
        this.mainTabs.addTab("Wave", wq);

        const mq = new MixerPanel(this);
        this.mainTabs.addTab("Mixer", mq);

        // re-focus
        this.executeCommand("show-patterns");
        this.executeCommand("show-sequence-editor");
    }

    async setAudioDevice(outputDeviceId, inputDeviceId) {
        await this.device.create(outputDeviceId, inputDeviceId);

        this.player = new Player(this.song, this.instrumentFactories, this.device.context);
    }

    render() {
        this.init();
        return this.fullscreen.getDomNode();
    }

    getDomNode(): Node {
        return this.fullscreen.getDomNode();
    }

    uploadProject() {
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const json = JSON.parse(reader.result as string);
                    this.song.importProjectJson(json);
                    // callback(reader.result);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    recordWave: WaveDocumentEx = null;
    recordOffset: number = 0;

    startRecordWave(wave: WaveDocumentEx, offset: number = 0) {

        if (this.recordWave) {
            this.stopRecordWave();
            return;
        }

        this.recordWave = wave;
        this.recordOffset = offset;
        this.device.recorder.addEventListener("input", this.onInput);
    }

    stopRecordWave() {
        if (!this.recordWave) {
            return;
        }

        this.device.recorder.removeEventListener("input", this.onInput);
        this.recordWave = null;
        this.recordOffset = 0;
    }

    onInput = (ev: CustomEvent<Float32Array[]>) => {
        const inputs = ev.detail;
        const inputLength = inputs[0].length;
        const outputLength = this.recordWave.sampleCount;

        if (this.recordOffset + inputLength >= outputLength) {
            // TODO; leaves some silence at end
            console.log("reached end of recording")
            this.stopRecordWave();
            return;
        }

        this.song.replaceWaveBuffer(this.recordWave, this.recordOffset, inputs);

        for (let i = 0; i < this.recordWave.buffers.length; i++) {
            const output = this.recordWave.buffers[i];
            const input = inputs[i % inputs.length];

            for (let j = 0; j < input.length; j++) {
                output[this.recordOffset + j] = input[j];
            }
        }

        this.recordOffset += inputLength;
        // notify document
    };
};



// import { AudioConfiguration, AudioConfigurationConfirm, AudioConfigurationProps } from './components/AudioConfiguration';
// import { RecordingsPanel } from './components/RecordingsPanel';
// import { AudioStorage } from './audio/AudioStorage';
// import { CreateNewPanel, CreateNewPanelProps } from './components/CreateNewPanel';
// import { Recorder, RecorderBuffer } from './audio/Recorder';
// import { RecordingPanel } from './components/RecordingPanel';
// import { AudioDevice } from './audio/AudioDevice';
// import { IWaveDocument, WaveDocument } from './audio/WaveDocument';
// import { ComputableModel, DeepWatchProxy, FrameContainer, Fullscreen, InternalStats, ModalOverlay, ModalPanelDialog, NutzComponent, NutzElement, NutzFor, NutzObject, NutzSlot, NutzText, TabFrameContainer, Tabs, TabsTab, deepWatch } from 'nutzui';
// import { HistoryView } from './components/HistoryView';
// import { editMenu, fileMenu, mainMenu, MenuItem, viewMenu } from './menu/menu';
// import { NutzPlatform } from 'nutzui/dist/core/Nutz';
// // import { ModalMenu, ModalMenuContainer } from './components/ModalMenuContainer';
// // import { Menubar } from './components/Menubar';
// import { ModalDialogContainer } from './components/ModalDialogContainer';
// import { InstrumentsPanel } from './components/InstrumentsPanel';

// // import recordProcessorUrl from "./RecordWorklet.ts";

// // skal vi ha array med åpne recordings? eller bare 1 til å begynne med
// export interface DocumentTab {
//     label;
//     content: NutzObject[];
// }

// export interface AppProps {
//     // showAudioConfiguration: boolean;
//     // showCreateNewDialog: boolean;
//     // showStartRecording: boolean;
//     // showFileMenu: boolean;
//     // menu: MenuProps | null;
//     // menuPosition: [number, number];
//     // menus: ModalMenu[];
//     // inputDevices: any[];
//     // outputDevices: any[];
//     currentInputDeviceId: string;
//     currentOutputDeviceId: string;
//     // currentInputSampleRate: number;
//     // currentInputChannelCount: number;
//     // currentInputDeviceCapabilities?: MediaTrackCapabilities;
//     inputMode: "stereo" | "left" | "right";
//     // microphonePermission: PermissionState | "dismissed";

//     initialized: boolean;

//     documentTabs: DocumentTab[];
//     currentLeftTab: number;
//     currentMainTab: number;
//     // document: WaveDocument | null;

//     // audioConfiguration: AudioConfigurationProps; // yeah but dont support this yet
// }

// // can have app baseclass with commands, hotkeys, icons++ that are used by menu, maybe dialog resources; (win32 res-like stuff???)
// // wavedocuments = open recordings outside project, stuff being worked on - doesnt really fit
// export class App extends NutzComponent<AppProps> {
//     storage: AudioStorage;
//     device: AudioDevice;
//     waveDocuments: WaveDocument[] = [];
//     deepWatch: DeepWatchProxy;

//     constructor() {
//         super({ 
//             // showAudioConfiguration: false, // true,
//             // showCreateNewDialog: false,
//             // showStartRecording: false,
//             // showFileMenu: false,
//             // menu: null,
//             // menuPosition: [0, 0],
//             // menus: [],
//             // inputDevices: [],
//             // outputDevices: [],
//             currentInputDeviceId: null,
//             currentOutputDeviceId: null,
//             inputMode: "stereo",
//             // microphonePermission: "denied",
//             // currentInputChannelCount: 0,
//             // currentInputSampleRate: 0,
//             // recordingBuffer: new Float32Array(0),
//             // playPosition: 0,
//             documentTabs: [],
//             currentLeftTab: 0,
//             currentMainTab: 0,
//             initialized: false,
//         });

//         this.deepWatch = deepWatch;
//         this.storage = new AudioStorage();
//         this.device = new AudioDevice();
//     }

//     async getMicrophonePermission() {
//         const permission = await navigator.permissions.query({name: "microphone" as PermissionName});
//         return permission.state;
//     }

//     commands: { [key: string]: any} = {};

//     registerCommand(cmd: string, handler: any) {
//         this.commands[cmd] = handler;
//     }

//     executeCommand(cmd: string) {
//         const command = this.commands[cmd];
//         if (!command) {
//             throw new Error("No such command: " + cmd);
//         }

//         command.handle();
//     }

//     hotkeys: { [key: string]: any} = {};

//     registerHotkey(key: string, cmd: string) {
//         this.hotkeys[key] = cmd;
//     }

//     getHotkeyForCommand(cmd) {
//         for (let hotkeyKey of Object.keys(this.hotkeys)) {
//             const hotkey = this.hotkeys[hotkeyKey];
//             if (hotkey == cmd) {
//                 return hotkeyKey;
//             }
//         }
        
//         return null;
//     }

//     onKey = (e: KeyboardEvent) => {
//         let keyName = "";
//         if (e.shiftKey) {
//             keyName += "SHIFT+";
//         }
//         if (e.ctrlKey) {
//             keyName += "CTRL+";
//         }
//         if (e.altKey) {
//             keyName += "ALT+";
//         }

//         keyName += e.key.toUpperCase();
//         console.log("HAVE HOTKEY FOR", keyName);

//         const hotkeyCommand = this.hotkeys[keyName];
//         if (hotkeyCommand) {
//             this.executeCommand(hotkeyCommand);
//             // e.stopPropagation();
//             e.preventDefault();
//         }
//     };

//     async mounted() {
//         // TODO; might want a dialog to control migration of the db, and ui with error, so this belongs here indeed
//         await this.storage.open();
//         this.props.initialized = true; // hm? can show the frame now - or should we wait until device is ready too? need ui, so---

//         navigator.mediaDevices.addEventListener("devicechange", this.onDeviceChange);
//         window.addEventListener("keydown", this.onKey);

//         // this starts the audio device permissions negotiations using ui
//         this.executeCommand("show-audio-configuration");
//         this.onDeviceChange();
//     }

//     showModal(title: string, content: (resolve) => NutzObject[]): Promise<void> {
//         // instead of the bool stuff, more like the menu container
//         // this.modals = [ content ];
//         console.log("show modal", title, content)
//         return this.modalContainer.showModal(title, content);
//     }

//     async showMenu(menu, pt): Promise<void> {
//         // instead of the bool stuff, more like the menu container
//         // this.modals = [ content ];
//         console.log("show context menu", menu, pt);
//         const action = await this.menuContainer.showMenu(menu, pt);
//         console.log("context menu awaited", action);

//         if (action && action.action) {
//             this.executeCommand(action.action);
//         }
//     }

//     unmounted() {
//         navigator.mediaDevices.removeEventListener("devicechange", this.onDeviceChange);
//         window.removeEventListener("keydown", this.onKey);

//     }

//     async tryGetMicrophonePermission(): Promise<PermissionState | "dismissed"> {
//         const microphonePermission = await this.getMicrophonePermission();
//         if (microphonePermission === "prompt") {
//             try {
//                 // Request permission to an arbitrary audio device. This lets query for more details. Don't care about the returned device for now
//                 await navigator.mediaDevices.getUserMedia({audio: true, video: false});
//             } catch (err) {
//                 if (err.message === "Permission dismissed") {
//                     return "dismissed";
//                 }
//             }

//             return await this.getMicrophonePermission();
//         }

//         return microphonePermission;
//     }

//     onDeviceChange = async () => {
//         // console.log("NEW DEVICE CHANGE")

//         // const microphonePermission = await this.tryGetMicrophonePermission();
//         // if (microphonePermission !== "granted") {
//         //     this.executeCommand("show-audio-configuration");
//         //     return;
//         // }

//         // // TODO; this may only be needed in the audioconfiguration
//         // const mediaDevices = await navigator.mediaDevices.enumerateDevices();

//         // this.props.inputDevices = mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ text: d.label, value: d.deviceId }));
//         // this.props.outputDevices = mediaDevices.filter(d => d.kind === "audiooutput").map(d => ({ text: d.label, value: d.deviceId }));

//         // if (!this.props.currentInputDeviceId) {
//         //     this.props.currentInputDeviceId = this.props.inputDevices[0].value;
//         // }

//         // if (!this.props.currentOutputDeviceId) {
//         //     this.props.currentOutputDeviceId = this.props.outputDevices[0].value;
//         // }
//     };

//     // onDeviceChange2 = async () => {
//     //     console.log("DEVICE CHANGE")

//     //     // this is a global audio driver callback - "something changed, may require gui support"
//     //     // plugged/unplugged device, blocked microphone manually

//     //     // if granted, selected and active, do not show modal
//     //     // but should trigger the modal if prompt or denied
//     //     // close and reset audiocontext if device no longer exist?

//     //     this.props.microphonePermission = await this.getMicrophonePermission();

//     //     // denied - show instructions how to enable user must manually reconfigure chrome to allow
//     //     // prompt - request permission, continue
//     //     // granted - continue?

//     //     // Must have granted permission before calling enumerateDevices() to access to all devices and details

//     //     if (this.props.microphonePermission === "prompt") {
//     //         try {
//     //             // Request permission to an arbitrary audio device. This lets query for more details. Don't care about the returned device for now
//     //             await navigator.mediaDevices.getUserMedia({audio: true, video: false});
//     //         } catch (err) {
//     //             if (err.message === "Permission dismissed") {
//     //                 this.props.microphonePermission = "dismissed";
                    
//     //                 this.props.showAudioConfiguration = true;
//     //                 return;
//     //             }
//     //         }

//     //         this.props.microphonePermission = await this.getMicrophonePermission();
//     //         if (this.props.microphonePermission !== "granted") {
//     //             this.props.showAudioConfiguration = true;
//     //             return;
//     //         }
//     //     }

//     //     // if currentDevices still exist, are active then no need to show audioConfig
//     //     // this.props.showAudioConfiguration = true;

//     //     // This has two modes - after allowing userMedia we get a longer list!
//     //     const mediaDevices = await navigator.mediaDevices.enumerateDevices();

//     //     // does this throw??
//     //     // const context = new AudioContext();
//     //     // await context.resume();

//     //     this.props.inputDevices = mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ text: d.label, value: d.deviceId }));
//     //     this.props.outputDevices = mediaDevices.filter(d => d.kind === "audiooutput").map(d => ({ text: d.label, value: d.deviceId }));

//     //     if (!this.props.currentInputDeviceId) {
//     //         this.props.currentInputDeviceId = this.props.inputDevices[0].value;
//     //     }

//     //     if (!this.props.currentOutputDeviceId) {
//     //         this.props.currentOutputDeviceId = this.props.outputDevices[0].value;
//     //     }
//     // };

//     // onConfirmDevice = async (detail: AudioConfigurationConfirm) => {
//     //     console.log("DEVICE CONFIRM", detail)

//     //     await this.device.create(detail.outputDeviceId, detail.inputDeviceId);

//     //     // this.context = new AudioContext({sinkId: e.detail.outputDeviceId} as any);
//     //     // const workletUrl = new URL("../assets/RecordWorklet.js", import.meta.url);
//     //     // console.log("WORKLET URL", workletUrl);
//     //     // await this.context.audioWorklet.addModule(workletUrl);

//     //     // const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: e.detail.inputDeviceId}]}, video: false});
//     //     // this.inputNode = this.context.createMediaStreamSource(stream);
//     //     // connect it when recording

//     //     console.log("DEVICE CONFIRMED")

//     //     this.props.currentInputDeviceId = detail.inputDeviceId;
//     //     this.props.currentOutputDeviceId = detail.outputDeviceId;
//     //     this.props.inputMode = detail.inputMode;
//     //     this.props.showAudioConfiguration = false;
//     // };

//     // onProbeDevice = async (detail: AudioConfigurationConfirm) => {
//     //     const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: detail.inputDeviceId}]}, video: false});
//     //     const tracks = stream.getAudioTracks();
//     //     console.log("probing", tracks[0], tracks[0].getCapabilities())
//     //     const capabilities = tracks[0].getCapabilities();
//     //     this.props.currentInputSampleRate = capabilities.sampleRate.max;
//     //     this.props.currentInputChannelCount = capabilities.channelCount.max;
//     //     // const sampleRate = caps.sampleRate;
//     // };

//     // onCreateNew = async (panelProps: CreateNewPanelProps) => {
//     //     console.log("CREAATE NEW FROM ", panelProps);
//     //     // const panelProps = e.detail;

//     //     const sampleRate = this.props.currentInputSampleRate;

//     //     const sampleCount = panelProps.durationSec * sampleRate;
//     //     const buffers: Float32Array[] = [];
//     //     for (let i = 0; i < panelProps.channelCount; i++) {
//     //         buffers.push(new Float32Array(sampleCount));
//     //     }

//     //     const recording = await this.storage.createRecording(sampleRate, buffers);
//     //     const document = await this.storage.createDocument(panelProps.name, sampleRate, buffers.length, sampleCount, recording.id); // , historyPosition: 0, history: [] });
//     //     // const documentId = await this.storage.createDocument({ name: panelProps.name, channelCount: buffers.length, sampleRate, sampleCount, recordingId, historyPosition: 0, history: [] });

//     //     this.props.showCreateNewDialog = false;

//     //     // refresh recordingspanel! recordings har listener på storage?
//     //     // open in tabs ->

//     // };

//     bufferSourceNode: AudioBufferSourceNode | null
//     playTimer = null;

//     onPlay = (panel: RecordingPanel) => {
//         // const panel = ev.detail;

//         // change to action

//         if (this.bufferSourceNode) {
//             this.bufferSourceNode.stop(); // triggers "ended" event which clears everything
//             return;
//         }


//         console.log("PLAY", this.device, panel.props)
//         const context = this.device.context!;
//         const myArrayBuffer = context.createBuffer(1, panel.document.recording.buffers[0].length, context.sampleRate);
//         const nowBuffering = myArrayBuffer.getChannelData(0);
//         nowBuffering.set(panel.document.recording.buffers[0])

//         this.bufferSourceNode = context.createBufferSource();
//         this.bufferSourceNode.buffer = myArrayBuffer;
//         this.bufferSourceNode.connect(context.destination);
//         this.bufferSourceNode.addEventListener("ended", () => {
//             // remove self
//             console.log("end of playback")
//             this.bufferSourceNode = null;
//             clearInterval(this.playTimer);
//         });

//         // if (this.props.selection)
//         this.bufferSourceNode.start();
//         const startTime = this.device.context.currentTime;

//         this.playTimer = setInterval(() => {
//             const playTime = this.device.context.currentTime - startTime;
//             // this.props.document.playPosition = playTime * this.device.context.sampleRate;
//             panel.document.setPlayPosition(playTime * this.device.context.sampleRate);
//             // console.log(this.props.playPosition, playTime, this.device.context.sampleRate)
//         }, 250);
//     };

//     onRecord = (panel: RecordingPanel) => {
//         // const panel = ev.detail;

//         if (panel.document.isRecording) {
//             console.warn("AM recording - treating record button as stop button");

//             panel.document.stopRecording();
//             return;
//         }

//         panel.document.beginRecording();
//     };

//     menuContainer: ModalMenuContainer
//     modalContainer: ModalDialogContainer;

//     render() {

//         const onCreateNew = () => {
//             // this is also a modal, but slightly different from the 
//             console.log("Show 'Create new' dialog");
//             this.executeCommand("show-create-new-recording");
//             // this.props.showCreateNewDialog = true;
//         };

//         const onDevice = () => {
//             console.log("Show audio device dialog");
//             this.executeCommand("show-audio-configuration");
//             // this.props.showAudioConfiguration = true;
//         };

//         const onMainMenuAction = (item: MenuItem) => {
//             console.log("MainMenu Aciton", item)
//             if (item && item.action) {
//                 this.executeCommand(item.action);
//             }
//         };

//         const select = async (document: IWaveDocument) => {
//             // show modal = must be present already? global app command here!
//             console.log("APP SELECT", document) // ITS A PROXY! sbhould lookup

//             // TODO; THIS IS NASTY-ISH! not sure how, the proxy document cannot be "put" in the db, which could be fixed different ways, but
//             // shouldnt have full document in the prop anyways
//             document = await this.storage.getWaveDocument(document.id);
//             // open document, add editor
//             // const document = id.detail;
//             const recording = await this.storage.getRecording(document.recordingId);

//             let documentIndex = this.waveDocuments.findIndex(d => d.document.id === document.id);

//             let currentDocument;// = this.waveDocuments.find(d => d.document.id === document.id);

//             if (documentIndex === -1) {
//                 currentDocument = new WaveDocument(this.device, this.storage, document, recording);
//                 this.waveDocuments.push(currentDocument);
//                 this.props.documentTabs = [
//                     ...this.props.documentTabs,
//                     {
//                         label: currentDocument.document.name,
//                         content: [
//                             // problems revealed - not visible tabs are toDom()'ed, but not inserted. 
//                             // leads to interesting issues: mounted is called anyway (how? observer needs node and comp, unless it matches a "rogue" el-less component)
//                             // ANOTHER ISSUE; should not have component here - OR?
//                             // need extra lifecycle-destructor to have prop in constructor
//                             new RecordingPanel({
//                                 buffers: [],
//                                 play: e => this.onPlay(e), 
//                                 record: e => this.onRecord(e), // TODO; stoprecord? -> play button can stop
//                             }, this, currentDocument)
//                         ],
//                     }
//                 ];

//                 console.log("NOW DOCUTBS", this.props.documentTabs)
//                 // this.props.currentTab = this.waveDocuments.length - 1;
//                 // perhaps add some event listeners on the document? dont want whole thing reactive
//             } else {
//                 // currentDocument = this.waveDocuments[documentIndex];
//                 // this.props.currentTab = documentIndex;
//             }

//             // update tabs? have wavedocs in props? focus tab

//             // this.props.recordingId = id.detail;
//             // this.currentDocument = currentDocument; // selected-tab!

//             // this.props.recordingName = recording.name;
//             // this.props.recordingBuffer = recording.buffers[0];
//         };

//         this.menuContainer = new ModalMenuContainer({
//             // action: (menuItem) => {
//             //     console.log("MENU ACTION", menuItem)
//             //     this.executeCommand(menuItem.action);
//             // },
//             menus: [],
//         });

//         this.modalContainer = new ModalDialogContainer({
//             modals: [],
//         });

//         return [
//             this.modalContainer,
//             this.menuContainer,

//             // vil ha toolbar / menubar over framecontainer
//             new NutzSlot(() => {
//                 if (!this.props.initialized) {
//                     return new NutzText("Initializing...");
//                 } else {
//                     return new Fullscreen({
//                         // TODO; init-step while opening indexeddb
//                         // TODO; tabframecontainer!
//                         content: [
//                             new Menubar({
//                                 action: (item) => onMainMenuAction(item),
//                                 items: mainMenu,
//                             }, this.menuContainer),
//                             new TabFrameContainer({
//                                 frames: [
//                                     {
//                                         where: "left",
//                                         size: 20,
//                                         currentTab: this.props.currentLeftTab,
//                                         selectTab: (x) => this.props.currentLeftTab = x,
//                                         tabs: [
//                                             {
//                                                 title: "Instruments",
//                                                 content: [
//                                                     new InstrumentsPanel({ 
//                                                         recordings: [],
//                                                         createNew: e => onCreateNew(),
//                                                         device: e => onDevice(),
//                                                         select: e => select(e)
//                                                     }, this.storage),
//                                                 ],
//                                             },
//                                             {
//                                                 title: "Recordings",
//                                                 content: [
//                                                     new RecordingsPanel({ 
//                                                         recordings: [],
//                                                         createNew: e => onCreateNew(),
//                                                         device: e => onDevice(),
//                                                         select: e => select(e)
//                                                     }, this.storage),
//                                                 ],
//                                             },
//                                             {
//                                                 title: "Debug",
//                                                 content: [
//                                                     new InternalStats({})
//                                                 ],
//                                             },
//                                             {
//                                                 title: "History",
//                                                 content: () => [
//                                                     new HistoryView({ historyPosition: 0, rows: []}, this.waveDocuments[this.props.currentMainTab])
//                                                 ],
//                                             }

//                                         ],
                                        
//                                     }, // frame
//                                     {
//                                         where: "main",
//                                         stack: "vertical",
//                                         size: 100,
//                                         currentTab: this.props.currentMainTab,
//                                         selectTab: (x) => this.props.currentMainTab = x,
//                                         tabs: this.props.documentTabs.map(t => ({
//                                             title: t.label,
//                                             content: t.content
//                                         })),
//                                     }, // frame
//                                 ]
//                             })
//                         ]
//                     });
//                 }
//             }),
            
//         ]
//     }
// }
