/*
 * Copyright (C) 2025 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */


class SpriteSheet {
    constructor(svgFileURL, canvasSize)
    {
        this.mapURL = svgFileURL;
        this.canvas = document.createElement('canvas');
        this.canvas.width = canvasSize.width;
        this.canvas.height = canvasSize.height;
    }

    async prepare(jsonData)
    {
        const response = await fetch(this.mapURL);
        if (!response.ok) {
            const errorString = `Failed to load map ${url} with error ${response.status}`
            console.error(errorString);
            throw errorString;
        }

        const svgText = await response.text();
        
        const parser = new DOMParser();
        const svg = parser.parseFromString(svgText, 'image/svg+xml');
        
        const mapPaths = svg.getElementsByTagName('path');
        const deptToPathMap = {};
        for (let path of mapPaths)
            deptToPathMap[path.getAttribute('title')] = path;
        
        const width = this.canvas.width;
        const height = this.canvas.height;

        const ctx = this.canvas.getContext('2d');
        
        this.rowColCount = Math.ceil(Math.sqrt(jsonData.length));
        const cellWidth = this.canvas.width / this.rowColCount;
        const cellHeight = this.canvas.height / this.rowColCount;
        
        ctx.clearRect(0, 0, width, height);
        
        const svgRoot = svg.firstElementChild;
        
        const svgHostElement = Utilities.createSVGElement('svg', {
            'xmlns' : 'http://www.w3.org/2000/svg',
            'viewBox': `0 0 ${svgRoot.getAttribute('width')} ${svgRoot.getAttribute('height')}`,
        }, { }, document.body);
        
        for (let i = 0; i < jsonData.length; ++i) {
            const depName = jsonData[i]['dep_name'];
            const pathElement = deptToPathMap[depName];
            
            if (!pathElement)
                continue;

            svgHostElement.appendChild(pathElement);
            const bounds = pathElement.getBBox();
            pathElement.remove();
            
            const cellRect = this.#rectForCellAtIndex(i);

            const canvasPath = new Path2D(pathElement.getAttribute('d'));
            
            ctx.save();

            const cellPadding = 2;
            ctx.translate(cellRect.x + cellPadding, cellRect.y + cellPadding);

            // FIXME: Center
            const scale = Math.min((cellRect.width - cellPadding) / bounds.width, (cellRect.height - cellPadding) / bounds.height);
            ctx.scale(scale, scale);

            ctx.translate(-bounds.x, -bounds.y);

            ctx.fillStyle = 'rgb(0, 0, 128, 0.2)';
            ctx.fill(canvasPath);
            
            ctx.strokeStyle = 'black';
            
            const lineWidth = 0.5;
            ctx.lineWidth = 2 / scale;
            ctx.stroke(canvasPath);
            ctx.restore();
        }

        svgHostElement.remove();
    }
    
    drawCellAtIndex(ctx, index, destinationSize)
    {
        const cellRect = this.#rectForCellAtIndex(index);
        const destX = -destinationSize.width / 2;
        
        ctx.drawImage(this.canvas, cellRect.x, cellRect.y, cellRect.width, cellRect.height, destX, 0, destinationSize.width, destinationSize.height);
    }
    
    #rectForCellAtIndex(index)
    {
        const cellWidth = this.canvas.width / this.rowColCount;
        const cellHeight = this.canvas.height / this.rowColCount;

        const row = Math.floor(index / this.rowColCount);
        const col = index % this.rowColCount;

        const x = col * cellWidth;
        const y = row * cellHeight;
        
        return new Rect(new Position(x, y), new Size(cellWidth, cellHeight));        
    }
}

