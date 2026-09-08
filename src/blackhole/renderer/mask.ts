const neighbors = 
[
    {x: 0, y: -1},
    {x: 0, y: 1},
    {x: -1, y: 0},
    {x: 1, y: 0},    
]

const enum pixelStatus
{
    PIXEL_DARK = 1,
    PIXEL_NOT_DARK = 2,
    PIXEL_VOID = 3
}
const step = 4;

export function returnMask(pixelData: Uint8Array, canvasWidth: number, canvasHeight: number) {
    const maskWidth = Math.floor(canvasWidth / step);
    const maskHeight = Math.floor(canvasHeight / step);
    const mask = new Uint8Array(maskWidth * maskHeight);
    for (let y = 0; y < maskHeight; y++) {
        for (let x = 0; x < maskWidth; x++) {
            const pixelX = x * step;
            const pixelY = y * step;
            const currentPixel = (pixelY * canvasWidth + pixelX) * 4;
            const alphaValue = pixelData[currentPixel + 3];
            if (alphaValue < 128) {
                mask[y * maskWidth + x] = pixelStatus.PIXEL_DARK;
            } else {
                mask[y * maskWidth + x] = pixelStatus.PIXEL_NOT_DARK;
            }
        }
    }
    return mask;
}

export function checkClickAgainstMask(inputX: number, inputY:number, mask: Uint8Array, maskWidth: number, maskHeight: number)
{
    let isInside: boolean;
    inputY = Math.floor((maskHeight - 1) - Math.floor(inputY / step));
    inputX = Math.floor(inputX / step)

    if(mask[Math.floor(inputY * maskWidth + inputX)] === pixelStatus.PIXEL_DARK)
    {
        isInside = true;
    }
    else
    {
        isInside = false;
    }
    console.log(mask[Math.floor(inputY * maskWidth + inputX)])
    return(isInside)
}