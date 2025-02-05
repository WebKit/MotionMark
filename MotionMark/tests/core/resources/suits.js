/*
 * Copyright (C) 2015-2018 Apple Inc. All rights reserved.
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

class SuitsParticle extends Particle {
    static get sizeMinimum() { return 30; }
    static get sizeRange() { return 40; }
    static get hasGradient() { return true; }

    constructor(stage)
    {
        super(stage);
    }

    initialize()
    {
        super.initialize();

        this.isClipPath = this.stage.particleCounter % 2;
        var shapeId = "#shape-" + Stage.randomInt(1, this.stage.particleTypeCount);
        if (this.isClipPath) {
            this.element = Utilities.createSVGElement("rect", {
                x: 0,
                y: 0,
                "clip-path": "url(" + shapeId + ")"
            }, {}, this.stage.element);
        } else {
            var shapePath = document.querySelector(shapeId + " path");
            this.element = shapePath.cloneNode();
            this.stage.element.appendChild(this.element);
        }

        if (this.constructor.hasGradient) {
            this.gradient = document.getElementById("default-gradient").cloneNode(true);
            this.gradient.id = "gradient-" + this.stage.gradientsCounter++;
            this.stage.gradientsDefs.appendChild(this.gradient);
            this.element.setAttribute("fill", "url(#" + this.gradient.id + ")");
        }
    }

    reset()
    {
        super.reset();

        this.position = Stage.randomElementInArray(this.stage.emitLocation);

        var velocityMagnitude = Stage.random(.5, 2.5);
        var angle = Stage.randomInt(0, this.stage.emitSteps) / this.stage.emitSteps * Math.PI * 2 + Stage.dateCounterValue(1000) * this.stage.emissionSpin + velocityMagnitude;
        this.velocity = new Point(Math.sin(angle), Math.cos(angle))
            .multiply(velocityMagnitude);

        if (this.isClipPath) {
            this.element.setAttribute("width", this.size.x);
            this.element.setAttribute("height", this.size.y);
            this.transformSuffix = " translate(-" + this.size.center.x + ",-" + this.size.center.y + ")";
        } else
            this.transformSuffix = " scale(" + this.size.x + ") translate(-.5,-.5)";

        this.stage.colorOffset = (this.stage.colorOffset + .5) % 360;

        if (this.constructor.hasGradient) {
            var transform = this.stage.element.createSVGTransform();
            transform.setRotate(Stage.randomInt(0, 359), 0, 0);
            this.gradient.gradientTransform.baseVal.initialize(transform);

            var stops = this.gradient.querySelectorAll("stop");
            stops[0].setAttribute("stop-color", "hsl(" + this.stage.colorOffset + ", 70%, 45%)");
            stops[1].setAttribute("stop-color", "hsl(" + ((this.stage.colorOffset + Stage.randomInt(50,100)) % 360) + ", 70%, 65%)");
        } else
            this.element.setAttribute("fill", "hsl(" + this.stage.colorOffset + ", 70%, 65%)");
    }

    move()
    {
        this.element.setAttribute("transform", "translate(" + this.position.x + "," + this.position.y + ") " + this.rotater.rotate(Point.zero) + this.transformSuffix);
    }
}

class SuitsStage extends ParticlesStage {
    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.emissionSpin = Stage.random(0, 3);
        this.emitSteps = Stage.randomInt(4, 6);
        this.emitLocation = [
            new Point(this.size.x * .25, this.size.y * .333),
            new Point(this.size.x * .5, this.size.y * .25),
            new Point(this.size.x * .75, this.size.y * .333)
        ];
        this.colorOffset = Stage.randomInt(0, 359);

        this.particleTypeCount = document.querySelectorAll(".shape").length;
        this.gradientsDefs = document.getElementById("gradients");
        this.gradientsCounter = 0;
        this.particleCounter = 0;
    }

    createParticle()
    {
        this.particleCounter++;
        return new SuitsParticle(this);
    }

    willRemoveParticle(particle)
    {
        particle.element.remove();
        if (particle.gradient)
            particle.gradient.remove();
    }
}

class SuitsBenchmark extends Benchmark {
    constructor(options)
    {
        super(new SuitsStage(), options);
    }
}

window.benchmarkClass = SuitsBenchmark;
