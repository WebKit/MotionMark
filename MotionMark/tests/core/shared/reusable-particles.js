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

class ReusableParticlesStage extends Stage {
    particles;
    activeLength;

    constructor() {
        super();
        this.particles = [];
        this.activeLength = 0;
    }

    complexity() {
        return this.activeLength;
    }

    activeParticles() {
        return this.particles.slice(0, this.activeLength);
    }

    inactiveParticles(end) {
        return this.particles.slice(this.activeLength, end);
    }

    tune(count) {
        if (count == 0)
            return;

        if (count < 0) {
            this.activeLength = Math.max(this.activeLength + count, 0);
            for (var i = this.activeLength; i < this.particles.length; ++i)
                this.particles[i].hide();
            return;
        }

        let inactiveParticles = this.inactiveParticles(this.activeLength + count);
        for (let particle of inactiveParticles)
            particle.show();

        for (let i = inactiveParticles.length; i < count; ++i)
            this.particles.push(this.createParticle());

        this.activeLength += count;
    }

    animate(timestamp, lastFrameLength) {
        for (let particle of this.activeParticles())
            particle.animate(timestamp, lastFrameLength);
    }
}
