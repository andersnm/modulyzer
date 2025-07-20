
export async function getOrCreateDirectory(startDir: FileSystemDirectoryHandle, ...paths: string[]) {
    for (let path of paths) {
        startDir = await startDir.getDirectoryHandle(path, { create: true });
    }

    return startDir;
}
