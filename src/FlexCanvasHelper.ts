const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function getCanvasContainerSize(c) {

    let offsetWidth = 0;
    let offsetHeight = 0;

    // WTF IS THIS NEEDED
    let count = 0;
    while (offsetWidth === 0 || offsetHeight === 0) {
        await nextTick();
        offsetWidth = c.parentElement.offsetWidth;
        offsetHeight = c.parentElement.offsetHeight;
        count ++;
        if (count > 100) {
            console.log("Cannot get canvas container size");
            break;
        }
    }

    return [ offsetWidth, offsetHeight ];
}

export async function resizeCanvas(c) {
    const originalDisplay = 'block'; // c.style.display;
    c.style.display = 'none';
    await nextTick();

    const [ offsetWidth, offsetHeight ] = await getCanvasContainerSize(c);

    c.width = offsetWidth - 1;
    c.height = offsetHeight - 1;

    c.style.display = originalDisplay;
    c.dispatchEvent(new CustomEvent("resize"));
}
