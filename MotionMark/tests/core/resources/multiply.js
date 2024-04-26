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
(function() {

var SpiralIterator = Utilities.createClass(
    function(gridSize)
    {
        this.gridSize = gridSize;
        this.current = Point.zero;
        this.direction = this.directions.right;
        this.size = new Size(1, 1);
        this.count = 0;
    }, {

    directions: {
        top: 0,
        left: 1,
        bottom: 2,
        right: 3
    },

    moves: [
        new Size(0,  -1), // top
        new Size(-1,  0), // left
        new Size(0,  +1), // bottom
        new Size(+1,  0)  // right
    ],

    isDone: function() {
        return this.count >= this.gridSize.area();
    },

    next: function() {
        ++this.count;

        if (this.isDone())
            return;

        let direction = this.direction;
        let move = this.moves[direction];

        if (Math.abs(this.current.x) == Math.abs(this.current.y)) {
            // Turn left.
            direction = (direction + 1) % 4;

            if (this.current.x >= 0 && this.current.y >= 0) {
                if (this.size.width < Math.min(this.gridSize.width, this.gridSize.height))
                    this.size.expand(2, 2);
                else if (this.size.width < this.gridSize.width)
                    ++this.size.width;

                move = this.moves[this.directions.right];
            } else
                move = this.moves[direction];
        }

        if (this.count < this.size.area()) {
            this.current = this.current.add(move);
            this.direction = direction;
            return;
        }

        // Make a U-turn.
        this.direction = (this.direction + 1) % 4;

        if (this.direction == this.directions.left || this.direction == this.directions.right)
            this.current = this.current.add(this.moves[this.direction].multiply(this.size.width++));
        else
            this.current = this.current.add(this.moves[this.direction].multiply(this.size.height++));

        this.direction = (this.direction + 1) % 4;
    }
});

var Tile = Utilities.createClass(
    function(stage, coordinate, iteratorIndex)
    {
        this.stage = stage;
        this.coordinate = coordinate;
        this.iteratorIndex = iteratorIndex;

        this.roundedRect = Utilities.createElement('div', {
            class: "div-" + Stage.randomInt(0, 5)
        }, stage.element);

        this.distance = this.coordinate.length();
        this.step = Math.max(3, this.distance / 1.5);
        this.rotate = Stage.randomInt(0, 359);

        this.move();
        this.resize();
        this.hide();
    }, {

    move: function() {
        let tileSize = this.stage.tileSize;

        let location = this.stage.size.center;
        location = location.add(this.coordinate.multiply(tileSize));
        location = location.subtract(tileSize.multiply(0.5));

        this.roundedRect.style.left = location.x + 'px';
        this.roundedRect.style.top = location.y + 'px';
    },

    resize: function() {
        let tileSize = this.stage.tileSize;

        this.roundedRect.style.width = tileSize.width + 'px';
        this.roundedRect.style.height = tileSize.height + 'px';
    },

    show: function() {
        this.roundedRect.style.display = "block";
    },

    hide: function() {
        this.roundedRect.style.display = "none";
    },

    backgroundColor: function() {
        let influence = Math.max(.01, 1 - (this.distance * this.stage.distanceFactor * (1 + this.iteratorIndex)));
        let l = this.stage.l * Math.tan(influence);
        return this.stage.hslPrefix + l + "%," + influence + ")";
    },

    animate: function() {
        this.rotate += this.step;
        this.roundedRect.style.transform = "rotate(" + this.rotate + "deg)";
        this.roundedRect.style.backgroundColor = this.backgroundColor();
    }
});

var MultiplyStage = Utilities.createSubclass(Stage,
    function()
    {
        Stage.call(this);
        this.tiles = [];
        this.activeLength = 0;
        this.iteratorIndex = 0;
    }, {

    rowsCount: 59,

    initialize: function(benchmark, options) {
        Stage.prototype.initialize.call(this, benchmark, options);

        this.rowsCount = this.rowsCount;

        let tileSide = Math.round(this.size.height / this.rowsCount);
        let columnsCount = Math.floor(this.size.width / tileSide);
        if (columnsCount % 2 == 0)
            --columnsCount;

        this.tileSize = new Size(tileSide, tileSide);
        this.tileGrid = new Size(columnsCount, this.rowsCount);
        this.iterator = new SpiralIterator(this.tileGrid);

        while (!this.iterator.isDone())
            this.tiles.push(this.createTile());
    },

    createTile: function() {
        if (this.iterator.isDone()) {
            this.iterator = new SpiralIterator(this.tileGrid);
            this.iteratorIndex++;
        }
        let tile = new Tile(this, this.iterator.current, this.iteratorIndex);
        this.iterator.next();
        return tile;
    },

    complexity: function() {
        return this.activeLength;
    },

    activeTiles: function() {
        return this.tiles.slice(0, this.activeLength);
    },

    inactiveTiles: function(end) {
        return this.tiles.slice(this.activeLength, end);
    },

    reusableTune: function(count) {
        if (count == 0)
            return;

        if (count < 0) {
            this.activeLength = Math.max(this.activeLength + count, 0);
            for (var i = this.activeLength; i < this.tiles.length; ++i)
                this.tiles[i].hide();
            return;
        }

        let inactiveTiles = this.inactiveTiles(this.activeLength + count);
        for (let tile of inactiveTiles)
            tile.show();

        for (let i = inactiveTiles.length; i < count; ++i)
            this.tiles.push(this.createTile());

        this.activeLength += count;
    },

    reusableAnimate: function() {
        for (let tile of this.activeTiles())
            tile.animate();
    },

    tune: function(count) {
        this.reusableTune(count);

        let totalSpiralCount = this.tileGrid.area();
        let centerSpiralCount = this.tileGrid.height * this.tileGrid.height;
        let sideSpiralCount = totalSpiralCount - centerSpiralCount;
        let activeSideSpiralCount = Math.min(Math.max(this.activeLength - centerSpiralCount, 0), sideSpiralCount);
        let activeTotalSpiralCount = Math.min(this.activeLength, totalSpiralCount);
        this.distanceFactor = 1.5 * (1 - 0.5 * activeSideSpiralCount / sideSpiralCount) / Math.sqrt(activeTotalSpiralCount);
    },

    animate: function() {
        let progress = this._benchmark.timestamp % 10000 / 10000;
        let bounceProgress = Math.sin(2 * Math.abs(0.5 - progress));
        this.l = Utilities.lerp(bounceProgress, 20, 50);
        this.hslPrefix = "hsla(" + Utilities.lerp(progress, 0, 360) + ",100%,";

        this.reusableAnimate();
    }
});

var MultiplyBenchmark = Utilities.createSubclass(Benchmark,
    function(options)
    {
        Benchmark.call(this, new MultiplyStage(), options);
    }
);

window.benchmarkClass = MultiplyBenchmark;

}());
