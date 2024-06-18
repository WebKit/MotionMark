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

class Animator {
    stage;
    controller;
    runResolve;
    startTimestamp;

    constructor(stage, test, settings) {
        this.stage = stage;

        if (settings.controller == "fixed")
            this.controller = new FixedController(test.complexity, settings);
        else
            this.controller = new WaveController(settings);
    }

    run() {
        return new Promise((resolve, reject) => {
            requestAnimationFrame(this.animateLoop.bind(this));
            this.runResolve = resolve;
        });
    }

    animateLoop(timestamp) {
        if (this.startTimestamp == undefined)
            this.startTimestamp = timestamp;

        this.controller.record(timestamp - this.startTimestamp);

        let complexity = this.controller.currentFrameComplexity();
        if (complexity == 0) {
            this.runResolve(this.controller.timeline);
            return;
        }

        this.stage.tune(complexity - this.stage.complexity());
        this.stage.animate(timestamp - this.startTimestamp, this.controller.lastFrameLength());

        requestAnimationFrame(this.animateLoop.bind(this));
    }
}
