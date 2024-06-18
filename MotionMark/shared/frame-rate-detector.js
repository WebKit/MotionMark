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

class FrameRateDetector {
    progressElement;
    count;
    firstTimestamp;
    runResolve;

    constructor(progressElement) {
        this.progressElement = progressElement;
        this.count = 0;
    }

    run() {
        return new Promise((resolve, reject) => {
            requestAnimationFrame(this.animateLoop.bind(this));
            this.runResolve = resolve;
        });
    }

    averageFrameRate(timestamp) {
        return 1000. / ((timestamp - this.firstTimestamp) / this.count);
    }

    targetFrameRate(average) {
        const commonFrameRates = [15, 30, 45, 60, 90, 120, 144];

        const distanceFromFrameRates = commonFrameRates.map(rate => {
            return Math.abs(Math.round(rate - average));
        });

        let index = distanceFromFrameRates.indexOf(Math.min(...distanceFromFrameRates));
        return commonFrameRates[index];
    }

    animateLoop(timestamp) {
        if (!this.firstTimestamp)
            this.firstTimestamp = timestamp;

        ++this.count;

        let average = Math.round(this.averageFrameRate(timestamp));

        if (this.count >= 300) {
            this.runResolve(this.targetFrameRate(average));
            return;
        }

        if (this.progressElement)
            this.progressElement.textContent = average;

        requestAnimationFrame(this.animateLoop.bind(this));
    }
}
