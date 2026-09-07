import { input } from "motion/react-client";

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

export function returnMask(pixelData:Uint8Array, canvasWidth:number, canvasHeight:number)
{
    let mask = new Uint8Array(canvasHeight / step * canvasWidth / step);
    let maskWidth = canvasWidth / step;
    let maskHeight = canvasHeight / step;
    let startX = Math.floor(maskWidth * (0.5 + 0.3 * (canvasHeight / canvasWidth)));
    let startY = Math.floor(maskHeight * 0.5)
    let queue = [[startX, startY]];
    mask[startY * maskWidth + startX] = pixelStatus.PIXEL_DARK;

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
                    let currentPixel = (neighborY * canvasWidth + neighborX) * step * 4;
                    if(pixelData[currentPixel] + pixelData[currentPixel + 1]  + pixelData[currentPixel + 2] <= 30)
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


export function checkClickAgainstMask(inputX: number, inputY:number, mask: Uint8Array, maskHeight: number, maskWidth: number)
{
    let isInside: boolean;
    inputY = (maskHeight - 1) - Math.floor(inputY / step);
    inputX = Math.floor(inputX / step)

    if(mask[inputY * maskWidth + inputX] === pixelStatus.PIXEL_DARK)
    {
        isInside = true;
    }
    else
    {
        isInside = false;
    }
    return(isInside)
}