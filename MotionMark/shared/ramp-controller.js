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

class RampController extends Controller {
    static rampLength = 3000;
    static warmupLength = 200;
    static stepLength = 100;
    complexityRange;
    stepTimespan;

    constructor(timeline, settings, complexityRange) {
        super(timeline, settings);

        this.complexityRange = complexityRange;
        this.rampProgressDuration = RampController.rampLength - RampController.warmupLength - RampController.stepLength;

        this.timeline.markNextFrame("ramp");
    }

    nextStepComplexity(timestamp) {
        let progress = (timestamp - this.startTimestamp) / this.rampProgressDuration;
        if (progress >= 1)
            return 0;
        return Math.floor(Math.lerp(progress, this.complexityRange.end, this.complexityRange.start));
    }

    nextComplexity(timestamp) {
        if (this.stepTimespan == undefined) {
            this.stepTimespan = new Timespan(timestamp, RampController.warmupLength);
            return this.complexityRange.end;
        }

        if (this.stepTimespan.contains(timestamp))
            return this.lastFrameComplexity();

        // Start after the warmup.
        if (this.startTimestamp == undefined)
            this.startTimestamp = timestamp;

        let nextStepComplexity = this.nextStepComplexity(timestamp);
        if (nextStepComplexity == 0)
            return 0;

        this.stepTimespan = new Timespan(timestamp, RampController.stepLength);
        return nextStepComplexity;
    }

    nextComplexityRange() {
        return this.complexityRange;
    }
}
