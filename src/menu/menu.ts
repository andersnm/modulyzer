export interface MenuItem {
    label: string;
    action?: string;
    icon?: string; // ?? ref for icon manager w/sized icons
    items?: MenuItem[];
    // open?: boolean; // is actually state?? can use index stuff??? or 
}

export const fileMenu: MenuItem[] = [
    {
        label: "New...",
        action: "show-create-new-recording"
    },
    {
        icon: "hgi-stroke hgi-folder-02",
        label: "Open...",
        action: "show-create-new-recording"
    },
    {
        icon: "hgi-stroke hgi-download-04",
        label: "Export...",
        action: "show-export-recording"
    },
];

export const waveMenu: MenuItem[] = [
];

export const editMenu: MenuItem[] = [
    {
        icon: "hgi-arrow-left-double",
        label: "Undo",
        action: "YYY"
    },
    {
        icon: "hgi-arrow-right-double",
        label: "Redo",
        action: "YYY"
    },

    {
        icon: "hgi-scissor-01",
        label: "Cut",
        action: "cut-selection"
    },
    {
        icon: "hgi-copy-01",
        label: "Copy",
        action: "copy-selection"
    },
    {
        icon: "hgi-column-insert",
        label: "Paste",
        action: "paste-selection"
    },

    {
        icon: "hgi-crop",
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

const sidebarMenu: MenuItem[] = [
    {
        label: "Waves",
        action: "show-waves"
    },
    {
        label: "Patterns",
        action: "show-patterns",
    },
];

export const viewMenu: MenuItem[] = [
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
        label: "Audio Configuration",
        action: "show-audio-configuration",
    },
    {
        label: "Sidebar",
        action: "",
        items: sidebarMenu
    }

];

export const mainMenu: MenuItem[] = [
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

export const sequencerMenu: MenuItem[] = [
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