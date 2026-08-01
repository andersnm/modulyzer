export type RectType = [number, number, number, number];
export type PointType = [number, number];

export function ptInRect(pt: PointType, rect: RectType) {
    const [ x, y ] = pt;
    const [ left, top, right, bottom ] = rect;
    return x >= left && x < right && y >= top && y < bottom;
}

export function rectCenter(rect: RectType): PointType {
    return [
        (rect[2] - rect[0]) / 2 + rect[0],
        (rect[3] - rect[1]) / 2 + rect[1],
    ]
}
