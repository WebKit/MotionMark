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

class WaveStatistics {
    framesLength;
    regression;
    bootstrap;
    rawRegression;
    ramps;

    constructor(timeline) {
        let indecies = this.rampsIndecies(timeline);
        let points = timeline.points(new Range(indecies[0], indecies[indecies.length - 1]));

        const bootstrapIterations = 2500;
        const confidencePercentage = 0.8;

        this.framesLength = timeline.frames.length;
        this.regression = new Regression(points);
        this.bootstrap = new Bootstrap(points, bootstrapIterations, confidencePercentage);

        let range = this.rampsRange(timeline);
        let rawPoints = timeline.points(range);

        this.rawRegression = new Regression(rawPoints);
        this.ramps = [];

        for (let i = 0; i < indecies.length - 1; ++i) {
            let points = timeline.points(new Range(indecies[i], indecies[i + 1]));
            this.ramps.push(new Regression(points));
        }
    }

    rampsIndecies(timeline) {
        let marks = timeline.marks.filter((mark) => mark.comment == "ramp");
        let indecies = Array.from(marks, (mark) => mark.frameIndex);
        indecies.push(timeline.frames.length);
        return indecies;
    }

    rampsRange() {
        let start = Math.round(.025 * this.framesLength);
        let end = Math.round(.975 * (this.framesLength - 1));

        if (end - start < 20)
            return new Range(start, end);

        return new Range(0, this.framesLength);
    }

    get score() {
        return this.regression.score;
    }

    get scoreConfidenceLow() {
        return this.bootstrap.confidenceLow;
    }

    get scoreConfidenceHigh() {
        return this.bootstrap.confidenceHigh;
    }

    get scoreConfidenceLowPercent() {
        return this.bootstrap.confidenceLowPercent;
    }

    get scoreConfidenceHighPercent() {
        return this.bootstrap.confidenceHighPercent;
    }

    get scoreConfidencePercent() {
        let score = this.score;
        let scoreConfidenceLow = this.scoreConfidenceLow;
        let scoreConfidenceHigh = this.scoreConfidenceHigh;
        return Math.max(Math.abs(scoreConfidenceLow / score - 1), (scoreConfidenceHigh / score - 1)) * 100;
    }

    get timeScore() {
        let scores = this.ramps.map(ramp => ramp.score);
        return Math.mean(scores);
    }

    get timeScoreStdev() {
        let scores = this.ramps.map(ramp => ramp.score);
        return Math.stdev(scores);
    }

    get rawScore() {
        return this.rawRegression.score;
    }

    get rawScoreStdev() {
        return Math.sqrt(this.rawRegression.error / this.framesLength);
    }
}
