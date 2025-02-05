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

class BouncingCompositedImage extends BouncingParticle {
    constructor(stage)
    {
        super(stage);

        this.element = document.createElement("img");
        this.element.style.width = this.size.x + "px";
        this.element.style.height = this.size.y + "px";
        this.element.setAttribute("src", stage.imageSrc);

        if (stage.useFilters)
            this.element.style.filter = "hue-rotate(" + Stage.randomAngle() + "rad)";

        stage.element.appendChild(this.element);
        this._move();
    }

    _move()
    {
        this.element.style.transform = "translate3d(" + this.position.x + "px," + this.position.y + "px, 0) " + this.rotater.rotateZ();
    }

    animate(timeDelta)
    {
        super.animate(timeDelta);
        this._move();
    }
}

class CompositingTransformsStage extends BouncingParticlesStage {
    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.imageSrc = options["imageSrc"] || "../resources/yin-yang.svg";
        this.useFilters = options["filters"] == "yes";
    }

    createParticle()
    {
        return new BouncingCompositedImage(this);
    }

    particleWillBeRemoved(particle)
    {
        particle.element.remove();
    }
}

class CompositedTransformsBenchmark extends Benchmark {
    constructor(options)
    {
        super(new CompositingTransformsStage(), options);
    }
}

window.benchmarkClass = CompositedTransformsBenchmark;
