/*
Utility class to create a canvas which resizes automatically in a flexbox
container.

Flexbox doesn't quite obey "overflow: hidden" on flexbox container when the 
child is a canvas with "width: 100%; height: 100%" and its width/height
properties adjusted to the container size.

The flexbox will grow and shrink horizontally just fine, but strangely only
grow vertically! Thus a naive approach will not let the canvas shrink. To
workaround, a global "resize" handler is installed to undefine the height/width
properties of the canvas, which triggers a DOM re-layout, which triggers a
ResizeObserver which re-assigns the correct width/height properties.
*/

export function FlexCanvas() {
    let mountedParentElement: HTMLElement = null;

    const canvas = document.createElement("canvas");
    canvas.classList.add("w-full");
    canvas.classList.add("h-full");

    const onResize = () => {
        if (!canvas.offsetWidth || !canvas.offsetHeight) {
            return;
        }

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        canvas.dispatchEvent(new CustomEvent("resize"));
    }

    const observer = new ResizeObserver(onResize);

    const onGlobalResize = () => {
        canvas.height = undefined;
        canvas.width = undefined;
    }

    const onMounted = () => {
        onGlobalResize();

        window.addEventListener("resize", onGlobalResize);
        mountedParentElement = canvas.parentElement;
        observer.observe(mountedParentElement);
    }
    
    const onUnmounted = () => {
        window.removeEventListener("resize", onGlobalResize);
        observer.unobserve(mountedParentElement);
        mountedParentElement = null;
    }

    canvas.addEventListener("nutz:mounted", onMounted);
    canvas.addEventListener("nutz:unmounted", onUnmounted);

    return canvas;
}
