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

class Leaf extends ResettableParticle {
    static minSide = 20;
    static maxSide = 50;
    image;
    position;
    velocity;
    opacity;
    opacityRate;

    constructor(stage) {
        super(stage, Leaf.minSide, Leaf.maxSide);

        // Create the <img> element and set its source.
        this.image = document.createHTMLElement('img', { 
            src: Random.itemInArray(stage.images).src
        }, stage.element);

        // Move it to some initial position.
        this.reset();
        this.resize();
        this.move(0);
    }

    remove() {
        this.image.remove();
    }

    reset() {
        super.reset();

        this.opacity = .01;
        this.opacityRate = 0.02 * Random.number(1, 6);

        this.position = new Point(Random.number(0, this.bouncingRect.maxX), Random.number(-this.size.height, this.bouncingRect.maxY));
        this.velocity = new Point(Random.number(-6, -2), .1 * this.size.height + Random.number(-1, 1));
    }

    move(timestamp) {
        this.image.style.transform = "translate(" + this.position.x + "px, " + this.position.y + "px)" + this.rotator.rotateZ(timestamp);
        this.image.style.opacity = this.opacity;
    }

    resize() {
        this.image.style.width = this.size.width + "px";
        this.image.style.height = this.size.height + "px";

    }

    animate(timestamp, lastFrameLength) {
        this.position.x += this.velocity.x + 8; // * this.stage.focusX;
        this.position.y += this.velocity.y;

        this.opacity += this.opacityRate;
        if (this.opacity > 1) {
            this.opacity = 1;
            this.opacityRate *= -1;
        } else if (this.opacity < 0 || this.position.y > this.stage.size.height) {
            this.reset();
            this.resize();
        }

        if (this.position.x < -this.size.width || this.position.x > this.stage.size.width)
            this.position.x = this.position.x - Math.sign(this.position.x) * (this.size.width + this.stage.size.width);

        this.move(timestamp);
    }
}

class LeavesStage extends DisposableParticlesStage {
    imageSources = [
        "compass",
        "console",
        "contribute",
        "debugger",
        "inspector",
        "layout",
        "performance",
        "script",
        "shortcuts",
        "standards",
        "storage",
        "styles",
        "timeline"
    ];
    images = [];

    loadImages() {
        return this.imageSources.map((imageSource) => {
            return new Promise((resolve) => {
                let image = new Image;
                image.onload = (e) => {
                    resolve({ width: image.width, height: image.height });
                };
                image.src = "../core/images/" + imageSource + "100.png";
                this.images.push(image);             
            });
        });
    }

    createParticle() {
        return new Leaf(this);
    }

    removeParticle(leaf) {
        leaf.remove();
    }
}

class LeavesAnimator extends Animator {
    constructor(test, settings) {
        super(new LeavesStage(), test, settings);
    }

    async run() {
        await Promise.all(this.stage.loadImages());
        return super.run();
    }
}

window.animatorClass = LeavesAnimator;
