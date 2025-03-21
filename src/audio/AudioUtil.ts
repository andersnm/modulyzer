async function getMicrophonePermission() {
    const permission = await navigator.permissions.query({name: "microphone" as PermissionName});
    return permission.state;
}

export async function tryGetMicrophonePermission(): Promise<PermissionState | "dismissed"> {
    const microphonePermission = await getMicrophonePermission();
    if (microphonePermission === "prompt") {
        try {
            // Request permission to an arbitrary audio device. This lets query for more details. Don't care about the returned device for now
            await navigator.mediaDevices.getUserMedia({audio: true, video: false});
        } catch (err) {
            if (err.message === "Permission dismissed") {
                return "dismissed";
            }
        }

        return await getMicrophonePermission();
    }

    return microphonePermission;
}