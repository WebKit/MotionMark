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

class Suit extends ResettableParticle {
    static sideMinimum = 30;
    static sideMaximum = 70;
    static shapeCounter = 0;
    static gradientCounter = 0;
    isClipPath;
    shape;
    gradient;
    transformSuffix;
    position;
    velocity;

    constructor(stage) {
        super(stage, Suit.sideMinimum, Suit.sideMaximum);

        this.isClipPath = ++stage.shapeCounter % 2;

        this.createShape();
        this.createGradient();

        // Move it to some initial position.
        this.reset();
        this.move(0);
    }

    createShape() {
        var shapeId = "#shape-" + Random.integer(1, this.stage.shapesCount);

        if (this.isClipPath) {
            this.shape = document.createSVGElement("rect", {
                "clip-path": "url(" + shapeId + ")"
            }, this.stage.element);
        } else {
            var shapePath = document.querySelector(shapeId + " path");
            this.shape = shapePath.cloneNode();
            this.stage.element.appendChild(this.shape);
        }
    }

    createGradient() {
        this.gradient = this.stage.defaultGradient.cloneNode(true);
        this.gradient.id = "gradient-" + Suit.gradientCounter++;
        this.stage.gradientsDefs.appendChild(this.gradient);
        this.shape.setAttribute("fill", "url(#" + this.gradient.id + ")");
    }

    resetShape() {
        if (this.isClipPath) {
            this.shape.setAttribute("width", this.size.width);
            this.shape.setAttribute("height", this.size.height);
            this.transformSuffix = " translate(-" + (this.size.width / 2) + ",-" + (this.size.height / 2) + ")";
        } else
            this.transformSuffix = " scale(" + this.size.width + ") translate(-.5,-.5)";
    }

    resetGradient() {
        let transform = this.stage.element.createSVGTransform();
        transform.setRotate(Random.integer(0, 359), 0, 0);
        this.gradient.gradientTransform.baseVal.initialize(transform);

        let stops = this.gradient.querySelectorAll("stop");
        stops[0].setAttribute("stop-color", "hsl(" + this.stage.colorOffset + ", 70%, 45%)");
        stops[1].setAttribute("stop-color", "hsl(" + ((this.stage.colorOffset + Random.integer(50,100)) % 360) + ", 70%, 65%)");
    }

    reset() {
        super.reset();

        this.position = new Point(Random.itemInArray(this.stage.emitLocations));

        var velocityMagnitude = Random.number(.5, 2.5);
        var angle = Random.integer(0, this.stage.emitSteps) / this.stage.emitSteps * Math.PI * 2 + Random.dateCounterValue(1000) * this.stage.emissionSpin + velocityMagnitude;
        this.velocity = new Point(Math.sin(angle) * velocityMagnitude, Math.cos(angle) * velocityMagnitude);

        this.stage.colorOffset = (this.stage.colorOffset + .5) % 360;

        this.resetShape();
        this.resetGradient();
    }

    move(timestamp) {
        this.shape.setAttribute("transform", "translate(" + this.position.x + "," + this.position.y + ") " + this.rotator.rotate(timestamp, Point.zero()) + this.transformSuffix);
    }

    animate(timestamp, lastFrameLength) {
        let timeDelta = lastFrameLength / 4;

        this.position.add(this.velocity.scaled(timeDelta));
        this.velocity.y += 0.03;

        // If particle is going to move off right side
        if (this.position.x > this.bouncingRect.maxX) {
            if (this.velocity.x > 0)
                this.velocity.x *= -1;
            this.position.x = this.bouncingRect.maxX;
        } else if (this.position.x < this.bouncingRect.x) {
            // If particle is going to move off left side
            if (this.velocity.x < 0)
                this.velocity.x *= -1;
            this.position.x = this.bouncingRect.x;
        }

        // If particle is going to move off bottom side
        if (this.position.y > this.bouncingRect.maxY) {
            // Adjust direction but maintain magnitude
            var magnitude = this.velocity.length();
            this.velocity.x *= 1.5 + .005 * this.size.width;
            this.velocity = this.velocity.normalized().scaled(magnitude);
            if (Math.abs(this.velocity.y) < 0.7)
                this.reset();
            else {
                if (this.velocity.y > 0)
                    this.velocity.y *= -0.999;
                this.position.y = this.bouncingRect.maxY;
            }
        } else if (this.position.y < this.bouncingRect.y) {
            // If particle is going to move off top side
            var magnitude = this.velocity.length();
            this.velocity.x *= 1.5 + .005 * this.size.width;
            this.velocity = this.velocity.normalized().scaled(magnitude);
            if (this.velocity.y < 0)
                this.velocity.y *= -0.998;
            this.position.y = this.bouncingRect.y;
        }

        this.move(timestamp);
    }
}

class SuitsStage extends DisposableParticlesStage {
    gradientsDefs;
    defaultGradient;
    shapesCount;
    emissionSpin;
    emitSteps;
    emitLocations;
    colorOffset;

    constructor() {
        super();

        this.gradientsDefs = document.getElementById("gradients");
        this.defaultGradient = document.getElementById("default-gradient");
        this.shapesCount = document.querySelectorAll(".shape").length;

        this.emissionSpin = Random.number(0, 3);
        this.emitSteps = Random.integer(4, 6);
        this.emitLocations = [
            new Point(this.size.width * .25, this.size.height * .333),
            new Point(this.size.width * .50, this.size.height * .250),
            new Point(this.size.width * .75, this.size.height * .333)
        ];

        this.colorOffset = Random.integer(0, 359);
    }

    createParticle() {
        return new Suit(this);
    }

    removeParticle(suit) {
        suit.shape.remove();
        suit.gradient.remove();
    }
}

class SuitsAnimator extends Animator {
    constructor(test, settings) {
        super(new SuitsStage(), test, settings);
    }
}

window.animatorClass = SuitsAnimator;
