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

class Tile {
    stage;
    coordinate;
    roundedRect;
    distance;
    step;
    rotate;

    constructor(stage, coordinate) {
        this.stage = stage;
        this.coordinate = coordinate;

        this.roundedRect = document.createHTMLElement('div', { 
            class: "div-" + Random.integer(0, 5)
        }, stage.element);

        this.distance = this.coordinate.length();
        this.step = Math.max(3, this.distance / 1.5);
        this.rotate = Random.integer(0, 359);

        this.move();
        this.resize();
        this.hide();
    }

    move() {
        let tileSize = this.stage.tileSize;

        let location = new Point(this.stage.rect.center());
        location.add(this.coordinate.scaled(tileSize));
        location.subtract(tileSize.scaled(0.5));

        this.roundedRect.style.left = location.x + 'px';
        this.roundedRect.style.top = location.y + 'px';
    }

    resize() {
        let tileSize = this.stage.tileSize;

        this.roundedRect.style.width = tileSize.width + 'px';
        this.roundedRect.style.height = tileSize.height + 'px';
    }

    show() {
        this.roundedRect.style.display = "block";
    }

    hide() {
        this.roundedRect.style.display = "none";
    }

    backgroundColor() {
        let influence = Math.max(.01, 1 - (this.distance * this.stage.distanceFactor));
        let l = this.stage.l * Math.tan(influence);
        return this.stage.hslPrefix + l + "%," + influence + ")";
    }

    animate(timestamp, lastFrameLength) {
        this.rotate += this.step;
        this.roundedRect.style.transform = "rotate(" + this.rotate + "deg)";
        this.roundedRect.style.backgroundColor = this.backgroundColor();
    }
}

class TilesStage extends ReusableParticlesStage {
    static rowsCount = 69;
    tileSize;
    tileGrid;
    iterator;
    distanceFactor;

    constructor() {
        super();

        let tileSide = Math.floor(this.size.height / TilesStage.rowsCount);
        this.tileSize = new Size(tileSide, tileSide);

        let columnsCount = Math.floor(this.size.width / tileSide);
        if (columnsCount % 2 == 0)
            --columnsCount;

        this.tileGrid = new Size(columnsCount, TilesStage.rowsCount);
        this.iterator = new SpiralIterator(this.tileGrid); 

        while (!this.iterator.isDone())
            this.particles.push(this.createParticle());
    }

    createParticle() {
        if (this.iterator.isDone())
            this.iterator = new SpiralIterator(this.tileGrid);
        let tile = new Tile(this, this.iterator.current);
        this.iterator.next();
        return tile;
    }

    tune(count) {
        super.tune(count);
        let centerSpiralCount = this.tileGrid.height * this.tileGrid.height;
        let sidePanelCount = this.tileGrid.area() - centerSpiralCount;
        let activeSidePanelCount = Math.max(this.activeLength - centerSpiralCount, 0);
        this.distanceFactor = 1.5 * (1 - 0.5 * activeSidePanelCount / sidePanelCount) / Math.sqrt(this.activeLength);
    }

    animate(timestamp, lastFrameLength) {
        let progress = timestamp % 10000 / 10000;
        let bounceProgress = Math.sin(2 * Math.abs(0.5 - progress));
        this.l = Math.lerp(bounceProgress, 20, 50);
        this.hslPrefix = "hsla(" + Math.lerp(progress, 0, 360) + ",100%,";
        super.animate(timestamp, lastFrameLength);
    }
}

class TilesAnimator extends Animator {
    constructor(test, settings) {
        super(new TilesStage(), test, settings);
    }
}

window.animatorClass = TilesAnimator;
