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

class CanvasImageTile {
    constructor(stage, source)
    {
        this._context = stage.context;
        this._size = stage.tileSize;
        this.source = source;
    }

    getImageData()
    {
        this._imagedata = this._context.getImageData(this.source.x, this.source.y, this._size.width, this._size.height);
    }

    putImageData(destination)
    {
        this._context.putImageData(this._imagedata, destination.x, destination.y);
    }
}

class TiledCanvasImageStage extends Stage {
    constructor(element, options)
    {
        super();
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.context = this.element.getContext("2d");
        this._setupTiles();
    }

    _setupTiles()
    {
        const maxTilesPerRow = 50;
        const maxTilesPerCol = 50;

        this.tileSize = this.size.multiply(new Point(1 / maxTilesPerRow, 1 / maxTilesPerCol));

        this._tiles = new Array(maxTilesPerRow * maxTilesPerCol);

        var source = Point.zero;
        for (var index = 0; index < this._tiles.length; ++index) {
            this._tiles[index] = new CanvasImageTile(this, source);
            source = this._nextTilePosition(source);
        }

        this._ctiles = 0;
    }

    _nextTilePosition(destination)
    {
        var next = destination.add(this.tileSize);

        if (next.x >= this._size.width)
            return new Point(0, next.y >= this._size.height ? 0 : next.y);

        return new Point(next.x, destination.y);
    }

    tune(count)
    {
        this._ctiles += count;

        this._ctiles = Math.max(this._ctiles, 0);
        this._ctiles = Math.min(this._ctiles, this._tiles.length);
    }

    _drawBackground()
    {
        var size = this._benchmark._stage.size;
        var gradient = this.context.createLinearGradient(0, 0, size.width, 0);
        gradient.addColorStop(0, "red");
        gradient.addColorStop(1, "white");
        this.context.save();
            this.context.fillStyle = gradient;
            this.context.fillRect(0, 0, size.width, size.height);
        this.context.restore();
    }

    animate(timeDelta)
    {
        this._drawBackground();

        if (!this._ctiles)
            return;

        this._tiles.shuffle();

        var destinations = new Array(this._ctiles);
        for (var index = 0; index < this._ctiles; ++index) {
            this._tiles[index].getImageData();
            destinations[index] = this._tiles[index].source;
        }

        destinations.shuffle();

        for (var index = 0; index < this._ctiles; ++index)
            this._tiles[index].putImageData(destinations[index]);
    }

    complexity()
    {
        return this._ctiles;
    }
}

class TiledCanvasImageBenchmark extends Benchmark {
    constructor(options)
    {
        super(new TiledCanvasImageStage(), options);
    }
}

window.benchmarkClass = TiledCanvasImageBenchmark;
