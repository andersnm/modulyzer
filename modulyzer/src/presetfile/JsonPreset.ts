import { Bank, Preset } from "../audio/SongDocument";

export function importJsonPresets(name: string, bankObject: any) {
    const bank = new Bank();
    bank.name = name;

    for (let preset of bankObject) {
        const p = new Preset();
        p.name = preset.name;
        p.parameters = { ...preset.parameters };
        bank.presets.push(p);
    }

    return bank;
}

export async function importJsonPreset(bankHandle: FileSystemFileHandle) {
    const bankFile = await bankHandle.getFile();
    const buffer = await bankFile.text();

    const bankObject = JSON.parse(buffer);
    return importJsonPresets(bankHandle.name, bankObject);
}

export async function saveJsonPreset(saveHandle: FileSystemFileHandle, bank: Bank) {
    const presetsFile = await saveHandle.createWritable({keepExistingData: false});
    await presetsFile.write(JSON.stringify(bank.presets, null, " "));
    await presetsFile.close();
}
