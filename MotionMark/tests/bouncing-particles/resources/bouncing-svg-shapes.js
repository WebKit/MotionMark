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

class BouncingSvgShape extends BouncingSvgParticle {
    constructor(stage)
    {
        super(stage, stage.shape);
        this._fill = stage.fill;

        this._createShape(stage);
        this._applyClipping(stage);
        this._applyFill(stage);

        this._move();
    }

    _createShape(stage)
    {
        switch (this._shape) {
        case "rect":
            var attrs = { x: 0, y: 0, width: this.size.x, height: this.size.y };
            this.element = Utilities.createSVGElement("rect", attrs, {}, stage.element);
            break;

        case "circle":
        default:
            var attrs = { cx: this.size.x / 2, cy: this.size.y / 2, r: Math.min(this.size.x, this.size.y) / 2 };
            this.element = Utilities.createSVGElement("circle", attrs, {}, stage.element);
            break;
        }
    }

    _applyFill(stage)
    {
        switch (this._fill) {
        case "gradient":
            var gradient = stage.createGradient(2);
            this.element.setAttribute("fill", "url(#" + gradient.getAttribute("id") + ")");
            break;

        case "solid":
        default:
            this.element.setAttribute("fill", Stage.randomColor());
            break;
        }
    }
}

class BouncingSvgShapesStage extends BouncingSvgParticlesStage {
    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.parseShapeParameters(options);
        this._gradientsCount = 0;
    }

    createGradient(stops)
    {
        var attrs = { id: "gradient-" + ++this._gradientsCount };
        var gradient = Utilities.createSVGElement("linearGradient", attrs, {}, this._ensureDefsIsCreated());

        for (var i = 0; i < stops; ++i) {
            attrs = { offset: i * 100 / (stops - 1) + "%", 'stop-color': Stage.randomColor() };
            Utilities.createSVGElement("stop", attrs, {}, gradient);
        }

        return gradient;
    }

    createParticle()
    {
        return new BouncingSvgShape(this);
    }

    particleWillBeRemoved(particle)
    {
        super.particleWillBeRemoved(particle);

        var fill = particle.element.getAttribute("fill");
        if (fill.indexOf("url(#") != 0)
            return;

        var gradient = this.element.querySelector(fill.substring(4, fill.length - 1));
        this._ensureDefsIsCreated().removeChild(gradient);
    }
}

class BouncingSvgShapesBenchmark extends Benchmark {
    constructor(options)
    {
        super(new BouncingSvgShapesStage(), options);
    }
}

window.benchmarkClass = BouncingSvgShapesBenchmark;
