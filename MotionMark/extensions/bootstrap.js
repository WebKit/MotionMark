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

class Bootstrap {
    estimates;
    confidencePercentage;

    constructor(points, iterationCount, confidencePercentage) {
        this.estimates = new Array(iterationCount);
        this.confidencePercentage = confidencePercentage;
        this.calculateBootstrap(points);
    }

    calculateBootstrap(points) {
        let resample = new Array(points.length);

        for (let i = 0; i < this.estimates.length; ++i) {
            for (let j = 0; j < points.length; ++j)
                resample[j] = points[Math.floor(Pseudo.random() * points.length)];

            resample.sort((a, b) => a.x - b.x);

            let regression = new Regression(resample);
            this.estimates[i] = regression.score;
        }

        this.estimates.sort((a, b) => { return a - b; });
    }

    get median() {
        return this.estimates[Math.round(this.estimates.length / 2)];
    }

    get mean() {
        return Math.mean(this.estimates);
    }

    get confidenceLow() {
        return this.estimates[Math.round((this.estimates.length - 1) * (1 - this.confidencePercentage) / 2)];
    }

    get confidenceHigh() {
        return this.estimates[Math.round((this.estimates.length - 1) * (1 + this.confidencePercentage) / 2)];
    }

    get confidenceLowPercent() {
        return (this.confidenceLow / this.median - 1) * 100;
    }

    get confidenceHighPercent() {
        return (this.confidenceHigh / this.median - 1) * 100;
    }
}
