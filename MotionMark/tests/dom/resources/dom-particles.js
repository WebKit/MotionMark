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

class DOMParticle extends Particle {
    constructor(stage)
    {
        super(stage);
    }
    
    initialize()
    {
        super.initialize();
        this.element = document.createElement("div");
        this.stage.element.appendChild(this.element);
    }

    reset()
    {
        super.reset();

        this.position = Stage.randomElementInArray(this.stage.emitLocation);

        var angle = Stage.randomInt(0, this.stage.emitSteps) / this.stage.emitSteps * Math.PI * 2 + Stage.dateCounterValue(100) * this.stage.emissionSpin;
        this.velocity = new Point(Math.sin(angle), Math.cos(angle))
            .multiply(Stage.random(.5, 2.5));

        this.element.style.width = this.size.x + "px";
        this.element.style.height = this.size.y + "px";
        this.stage.colorOffset = (this.stage.colorOffset + 1) % 360;
        this.element.style.backgroundColor = "hsl(" + this.stage.colorOffset + ", 70%, 45%)";
    }

    move()
    {
        this.element.style.transform = "translate(" + this.position.x + "px, " + this.position.y + "px)" + this.rotater.rotateZ();
    }
}

class DOMParticleStage extends ParticlesStage {
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
    }

    createParticle()
    {
        return new DOMParticle(this);
    }

    willRemoveParticle(particle)
    {
        particle.element.remove();
    }
}

class DOMParticleBenchmark extends Benchmark {
    constructor(options)
    {
        super(new DOMParticleStage(), options);
    }
}

window.benchmarkClass = DOMParticleBenchmark;
