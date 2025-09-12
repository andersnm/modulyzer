/*
    crop: "hgi-crop",
    open: hgi-folder-02
    undo: "hgi-arrow-left-double",
    redo: "hgi-arrow-right-double",
    cut: "hgi-scissor-01",
    copy: "hgi-copy-01",
    paste: "hgi-column-insert",
*/
export interface CommandMenuItem {
    label: string;
    action?: string;
    checked?: boolean;
    items?: CommandMenuItem[];
}

export const fileMenu: CommandMenuItem[] = [
    {
        label: "New...",
        action: "clear-song"
    },
    {
        label: "Open...",
        action: "open-song"
    },
    {
        label: "Save As...",
        action: "save-song"
    },
];

export const waveMenu: CommandMenuItem[] = [
];

export const editMenu: CommandMenuItem[] = [
    {
        label: "Undo",
        action: "YYY"
    },
    {
        label: "Redo",
        action: "YYY"
    },

    {
        label: null,
    },

    {
        label: "Cut",
        action: "cut-selection"
    },
    {
        label: "Copy",
        action: "copy-selection"
    },
    {
        label: "Paste",
        action: "paste-selection"
    },

    {
        label: "Crop",
        action: "YYY"
    },

    {
        label: "Zoom Selection",
        action: "zoom-selection"
    },
    {
        label: "Zoom In",
        action: "zoom-in"
    },
    {
        label: "Zoom Out",
        action: "zoom-out"
    },

    {
        label: "Wave",
        action: "",
        items: [
            {
                label: "Fade In",
                action: "YYY"
            },
            {
                label: "Fade Out",
                action: "YYY"
            },
        ]
    },
];

// TODO; dfin action lobally, wit labls (translatabl)
// build mnus wit action rfs only

const sidebarMenu: CommandMenuItem[] = [
    {
        label: "Waves",
        action: "show-waves"
    },
    {
        label: "Patterns",
        action: "show-patterns",
    },
    {
        label: "Pins",
        action: "show-pins",
    },
];

export const viewMenu: CommandMenuItem[] = [
    {
        label: "Sequence",
        action: "show-sequence-editor"
    },
    {
        label: "Pattern",
        action: "show-pattern-editor"
    },
    {
        label: "Mixer",
        action: "show-mixer"
    },
    {
        label: "Wave",
        action: "show-wave-editor"
    },
    {
        label: "Audio Configuration...",
        action: "show-audio-configuration",
    },
    {
        label: "Home Directory...",
        action: "show-filesystem-configuration",
    },
    {
        label: "Sidebar",
        action: "",
        items: sidebarMenu
    }

];

export const mainMenu: CommandMenuItem[] = [
    {
        label: "File",
        action: "",
        items: fileMenu,
    },
    {
        label: "Edit",
        action: "",
        items: editMenu,
    },
    {
        label: "View",
        action: "",
        items: viewMenu,
    },
];

export const sequencerMenu: CommandMenuItem[] = [
    {
        label: "Add Column",
        action: "sequence-add-track",
    },
    {
        label: "Delete Column",
        action: "sequence-delete-track",
    },
    {
        label: "Column Properties...",
        action: "show-sequence-properties",
    }
];

export const patternMenu: CommandMenuItem[] = [
    {
        label: "Add Column...",
        action: "add-column"
    },
    {
        label: "Duplicate",
        action: "duplicate-pattern"
    },
    {
        label: "Properties...",
        action: "edit-pattern"
    },
];

export const patternListMenu: CommandMenuItem[] = [
    {
        label: "Edit",
        action: "goto-pattern-editor"
    },
    {
        label: "Delete",
        action: "delete-pattern"
    },
    {
        label: "Duplicate",
        action: "duplicate-pattern"
    },
    {
        label: "Properties...",
        action: "edit-pattern"
    },

    {
        label: null, // Separator
    },

    {
        label: "Create new",
        action: "create-pattern"
    },
];

export const waveListMenu: CommandMenuItem[] = [
    {
        label: "Edit",
        action: "goto-wave-editor"
    },
    {
        label: "Delete",
        action: "delete-wave"
    },
    {
        label: "Properties...",
        action: "edit-wave"
    },

    {
        label: null, // Separator
    },

    {
        label: "Create new...",
        action: "create-wave"
    },
    {
        label: "Paste new",
        action: "paste-new-wave"
    },
    {
        label: "Open...",
        action: "open-wave"
    },
];

export const presetMenu: CommandMenuItem[] = [
    {
        label: "Load local bank...",
        action: "import-local-bank",
    },
    {
        label: "Import DX7 sysex...",
        action: "import-dx7-sysex-bank",
    },
    {
        label: "Save local bank...",
        action: "save-local-bank",
    },
];

export const waveInstrumentMenu: CommandMenuItem[]= [
    {
        label: "New Wave...",
        action: "create-wave",
    },
    {
        label: "Open...",
        action: "open-wave",
    },
    {
        label: "Paste New",
        action: "paste-new-wave",
    },
];

