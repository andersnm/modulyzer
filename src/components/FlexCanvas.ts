import { resizeCanvas } from "../FlexCanvasHelper";

export function FlexCanvas() {
    const canvas = document.createElement("canvas");

    const onResize = async (ev) => {
        await resizeCanvas(canvas);
    }
    
    const onMounted = async (ev) => {
        await resizeCanvas(canvas);
        window.addEventListener("resize", onResize)
    }
    
    const onUnmounted = (ev) => {
        window.removeEventListener("resize", onResize)
    }
    
    canvas.addEventListener("nutz:mounted", onMounted);
    canvas.addEventListener("nutz:unmounted", onUnmounted);

    return canvas;
}
