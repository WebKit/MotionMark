/*
 * Copyright (C) 2015-2024 Apple Inc. All rights reserved.
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

class MultiplyStage extends Stage {
    static visibleCSS = [["display", "none", "block"]];
    static totalRows = 71;

    constructor()
    {
        super();
        this.tiles = [];
        this._offsetIndex = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const tileSize = Math.round(this.size.height / MultiplyStage.totalRows);
        if (options.visibleCSS)
            MultiplyStage.visibleCSS = options.visibleCSS;

        // Fill the scene with elements
        let x = Math.round((this.size.width - tileSize) / 2);
        let y = Math.round((this.size.height - tileSize) / 2);
        const tileStride = tileSize;
        let direction = 0;
        let spiralCounter = 2;
        let nextIndex = 1;
        const maxSide = Math.floor(y / tileStride) * 2 + 1;
        this._centerSpiralCount = maxSide * maxSide;
        for (let i = 0; i < this._centerSpiralCount; ++i) {
            this._addTile(x, y, tileSize, Stage.randomInt(0, 359));

            if (i == nextIndex) {
                direction = (direction + 1) % 4;
                spiralCounter++;
                nextIndex += spiralCounter >> 1;
            }
            if (direction == 0)
                x += tileStride;
            else if (direction == 1)
                y -= tileStride;
            else if (direction == 2)
                x -= tileStride;
            else
                y += tileStride;
        }

        this._sidePanelCount = maxSide * Math.floor((this.size.width - x) / tileStride) * 2;
        for (let i = 0; i < this._sidePanelCount; ++i) {
            let sideX = x + Math.floor(Math.floor(i / maxSide) / 2) * tileStride;
            let sideY = y - tileStride * (i % maxSide);

            if (Math.floor(i / maxSide) % 2 == 1)
                sideX = this.size.width - sideX - tileSize + 1;
            this._addTile(sideX, sideY, tileSize, Stage.randomInt(0, 359));
        }
    }

    _addTile(x, y, tileSize, rotateDeg)
    {
        const tile = Utilities.createElement("div", { class: "div-" + Stage.randomInt(0,6) }, this.element);
        const halfTileSize = tileSize / 2;
        tile.style.left = x + 'px';
        tile.style.top = y + 'px';
        tile.style.width = tileSize + 'px';
        tile.style.height = tileSize + 'px';
        const visibleCSS = MultiplyStage.visibleCSS[this.tiles.length % MultiplyStage.visibleCSS.length];
        tile.style[visibleCSS[0]] = visibleCSS[1];

        const distance = 1 / tileSize * this.size.multiply(0.5).subtract(new Point(x + halfTileSize, y + halfTileSize)).length();
        this.tiles.push({
            element: tile,
            rotate: rotateDeg,
            step: Math.max(3, distance / 1.5),
            distance: distance,
            active: false,
            visibleCSS: visibleCSS,
        });
    }

    complexity()
    {
        return this._offsetIndex;
    }

    tune(count)
    {
        this._offsetIndex = Math.max(0, Math.min(this._offsetIndex + count, this.tiles.length));
        this._distanceFactor = 1.5 * (1 - 0.5 * Math.max(this._offsetIndex - this._centerSpiralCount, 0) / this._sidePanelCount) / Math.sqrt(this._offsetIndex);
    }

    animate()
    {
        var progress = this._benchmark.timestamp % 10000 / 10000;
        var bounceProgress = Math.sin(2 * Math.abs( 0.5 - progress));
        var l = Utilities.lerp(bounceProgress, 20, 50);
        var hslPrefix = "hsla(" + Utilities.lerp(progress, 0, 360) + ",100%,";

        for (var i = 0; i < this._offsetIndex; ++i) {
            var tile = this.tiles[i];
            tile.active = true;
            tile.element.style[tile.visibleCSS[0]] = tile.visibleCSS[2];
            tile.rotate += tile.step;
            tile.element.style.transform = "rotate(" + tile.rotate + "deg)";

            var influence = Math.max(.01, 1 - (tile.distance * this._distanceFactor));
            tile.element.style.backgroundColor = hslPrefix + l * Math.tan(influence / 1.25) + "%," + influence + ")";
        }

        for (var i = this._offsetIndex; i < this.tiles.length && this.tiles[i].active; ++i) {
            var tile = this.tiles[i];
            tile.active = false;
            tile.element.style[tile.visibleCSS[0]] = tile.visibleCSS[1];
        }
    }
}

class MultiplyBenchmark extends Benchmark {
    constructor(options)
    {
        super(new MultiplyStage(), options);
    }
}

window.benchmarkClass = MultiplyBenchmark;
