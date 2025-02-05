/*
 * Copyright (C) 2015-2025 Apple Inc. All rights reserved.
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

class Benchmark {
    constructor(stage, options)
    {
        this._animateLoop = this._animateLoop.bind(this);
        this._warmupLength = options["warmup-length"];
        this._frameCount = 0;
        this._warmupFrameCount = options["warmup-frame-count"];
        this._firstFrameMinimumLength = options["first-frame-minimum-length"];

        this._stage = stage;

        switch (options["time-measurement"])
        {
        case "performance":
            if (window.performance && window.performance.now)
                this._getTimestamp = performance.now.bind(performance);
            else
                this._getTimestamp = null;
            break;
        case "raf":
            this._getTimestamp = null;
            break;
        case "date":
            this._getTimestamp = Date.now;
            break;
        }

        options["test-interval"] *= 1000;
        switch (options["controller"])
        {
        case "fixed":
            this._controller = new FixedController(this, options);
            break;
        case "adaptive":
            this._controller = new AdaptiveController(this, options);
            break;
        case "ramp":
            this._controller = new RampController(this, options);
            break;
        }
    }

    // Subclasses should override this if they have setup to do prior to commencing.
    async initialize(options)
    {
        await this._stage.initialize(this, options);
    }

    get stage()
    {
        return this._stage;
    }

    get timestamp()
    {
        return this._currentTimestamp - this._benchmarkStartTimestamp;
    }

    backgroundColor()
    {
        var stage = window.getComputedStyle(document.getElementById("stage"));
        return stage["background-color"];
    }

    run()
    {
        return new Promise(resolve => {
            this._completionFunction = resolve;
            this._previousTimestamp = undefined;
            this._didWarmUp = false;
            this._stage.tune(this._controller.initialComplexity - this._stage.complexity());
            this._animateLoop();
        });
    }

    _animateLoop(timestamp)
    {
        timestamp = (this._getTimestamp && this._getTimestamp()) || timestamp;
        this._currentTimestamp = timestamp;

        if (this._controller.shouldStop(timestamp)) {
            this._completionFunction(this._controller.results());
            return;
        }

        if (!this._didWarmUp) {
            if (!this._previousTimestamp) {
                this._previousTimestamp = timestamp;
                this._benchmarkStartTimestamp = timestamp;
            } else if (timestamp - this._previousTimestamp >= this._warmupLength && this._frameCount >= this._warmupFrameCount) {
                this._didWarmUp = true;
                this._benchmarkStartTimestamp = timestamp;
                this._controller.start(timestamp, this._stage);
                this._previousTimestamp = timestamp;

                while (this._getTimestamp && this._getTimestamp() - timestamp < this._firstFrameMinimumLength) {
                }
            }

            this._stage.animate(0);
            ++this._frameCount;
            requestAnimationFrame(this._animateLoop);
            return;
        }

        this._controller.update(timestamp, this._stage);
        this._stage.animate(timestamp - this._previousTimestamp);
        this._previousTimestamp = timestamp;
        requestAnimationFrame(this._animateLoop);
    }
}
