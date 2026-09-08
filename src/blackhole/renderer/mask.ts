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

export function returnMask(pixelData:Uint8Array, canvasWidth:number, canvasHeight:number, blackHoleFocalLength: number, BlackHoledistance:number)
{
    let maskWidth = Math.floor(canvasWidth / step);
    let maskHeight = Math.floor(canvasHeight / step);
    let mask = new Uint8Array(maskWidth * maskHeight);
    let yOffset = (((2.598 * blackHoleFocalLength / BlackHoledistance) * canvasHeight) * 0.5) / step;
    let startX = Math.floor(maskWidth * (0.5 + 0.3 * (canvasHeight / canvasWidth)));
    let startTopY = Math.floor(maskHeight * 0.5 + yOffset) 
    let startBottomY = Math.floor(maskHeight * 0.5 - yOffset) 
    let queue = [[startX, startTopY], [startX, startBottomY]];
    mask[startTopY * maskWidth + startX] = pixelStatus.PIXEL_DARK;
    mask[startBottomY * maskWidth + startX] = pixelStatus.PIXEL_DARK;

    while(queue.length > 0)
    {
        let [x,y] = queue.shift()!;
        for(let i = 0; i < neighbors.length; i++)
        {
            let neighborX = x + neighbors[i].x;
            let neighborY = y + neighbors[i].y;                    
            if(0 <= neighborX && neighborX < maskWidth && 0 <= neighborY && neighborY < maskHeight)
            {
                if(mask[neighborY * maskWidth + neighborX] === 0)
                {
                    let currentPixel = ((neighborY * step) * canvasWidth + (neighborX * step)) * 4;
                    if(pixelData[currentPixel] + pixelData[currentPixel + 1]  + pixelData[currentPixel + 2] <= 100)
                    {
                        mask[neighborY * maskWidth + neighborX] = pixelStatus.PIXEL_DARK;
                        queue.push([neighborX, neighborY]);
                    }
                    else/*if(pixelData[currentPixel] + pixelData[currentPixel + 1]  + pixelData[currentPixel + 2] >= 30)*/
                    {
                        mask[neighborY * maskWidth + neighborX] = pixelStatus.PIXEL_NOT_DARK;
                    }
                    // else
                    // {
                    //     mask[neighborY * maskWidth + neighborX] = pixelStatus.PIXEL_VOID;
                    //     queue.push([neighborX, neighborY]);
                    // }
                }
            }
        }
    }
    return(mask);
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