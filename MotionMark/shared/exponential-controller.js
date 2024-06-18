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

class ExponentialController extends Controller {
    minTierLength = 250;
    maxTierLength = 750;
    minFrameLength;
    maxFrameLength;
    warmupLength;
    lastTierComplexity;
    lastTierFrameLength;
    tierExponent;
    tierStartFrameIndex;
    minTierTimespan;
    maxTierTimespan;

    constructor(timeline, settings) {
        super(timeline, settings);

        // Add some tolerance; frame lengths shorter than this are considered to be @ the desired frame length
        this.minFrameLength = 1000 / (settings.targetFrameRate - 2);

        // During tier sampling get at least this slow to find the right complexity range
        this.maxFrameLength = 1000 / (settings.targetFrameRate / 2);

        this.warmupLength = settings.warmupLength;

        this.lastTierComplexity = 0;
        this.lastTierFrameLength = 0;

        // Initially start with a tier test to find the bounds
        // The number of objects in a tier test is 10^|_tier|
        this.tierExponent = -.5;
    }

    startNewTier(timestamp, minTierLength, maxTierLength) {
        this.tierStartFrameIndex = this.timeline.frames.length;
        this.minTierTimespan = new Timespan(timestamp, minTierLength);
        this.maxTierTimespan = new Timespan(timestamp, maxTierLength);
    }

    nextTierComplexity() {
        let lastFrameComplexity = this.lastFrameComplexity();

        if (lastFrameComplexity <= 50)
            this.tierExponent += 1/2;
        else if (lastFrameComplexity <= 10000)
            this.tierExponent += 1/4;
        else
            this.tierExponent += 1/8;

        return Math.max(Math.round(Math.pow(10, this.tierExponent)), lastFrameComplexity + 1);        
    }

    nextComplexity(timestamp) {
        let lastFrameComplexity = this.lastFrameComplexity();

        // Warmup tier.
        if (this.minTierTimespan == undefined) {
            this.startNewTier(timestamp, this.warmupLength, this.warmupLength);
            return lastFrameComplexity;
        }

        // We have not finished the minimum time for a tier.
        if (this.minTierTimespan.contains(timestamp))
            return lastFrameComplexity;

        let averageFrameLength = this.timeline.averageFrameLength(this.tierStartFrameIndex, this.timeline.frames.length);

        // The system frame rate is going below the target frame rate.
        if (averageFrameLength > this.minFrameLength) {
            // But we have not finished the maximum time for a tier.
            if (this.maxTierTimespan.contains(timestamp))
                return lastFrameComplexity;
        }

        // We reached our goal and the system frame rate is below the least frame rate.
        if (averageFrameLength > this.maxFrameLength)
            return 0;

        this.lastTierComplexity = lastFrameComplexity;
        this.lastTierFrameLength = averageFrameLength;

        // Start a new tier.
        this.startNewTier(timestamp, this.minTierLength, this.maxTierLength);
        return this.nextTierComplexity();
    }

    nextComplexityRange() {
        let lastFrameComplexity = this.lastFrameComplexity();
        let averageFrameLength = this.timeline.averageFrameLength(this.tierStartFrameIndex, this.timeline.frames.length);

        let minimumComplexity = this.settings.initialComplexity;
        let maximumComplexity;

        if (averageFrameLength <= this.lastTierFrameLength)
            maximumComplexity = lastFrameComplexity;
        else {
            let slope = (lastFrameComplexity - this.lastTierComplexity) / (averageFrameLength - this.lastTierFrameLength);
            maximumComplexity = Math.floor(this.lastTierComplexity + slope * (this.maxFrameLength - this.lastTierFrameLength));
        }

        return new Range(minimumComplexity, maximumComplexity - minimumComplexity);
    }
}
