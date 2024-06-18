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

class Timeline {
    marks;
    frames;

    constructor(marks, frames) {
        this.marks = marks || new Array();
        this.frames = frames || new Array();
    }

    markNextFrame(comment) {
        this.marks.push({ frameIndex: this.frames.length, comment: comment });
    }

    startNewFrame(timestamp, complexity) {
        this.frames.push({ timespan: new Timespan(timestamp), complexity: complexity });
    }

    endLastFrame(timestamp) {
        this.lastFrame().timespan.close(timestamp);
    }

    lastFrameIndex() {
        return this.frames.length - 1;
    }

    lastFrame() {
        return this.frames[this.lastFrameIndex()];
    }

    lastFrameLength() {
        let index = this.frames.length - 1;

        if (index >= 0 && this.frames[index].timespan.isOpen())
            --index;

        return index >= 0 ? this.frames[index].timespan.length : 0;
    }

    lastFrameComplexity() {
        if (!this.frames.length)
            return 0;
        return this.lastFrame().complexity;
    }

    currentFrameComplexity() {
        if (!this.frames.length)
            return 0;
        if (!this.lastFrame().timespan.isOpen())
            return 0;
        return this.lastFrame().complexity;
    }

    averageFrameLength(start, end) {
        if (!(start >= 0 && end <= this.frames.length))
            return 0;

        let frames = this.frames.slice(start, end);
        let frameLengths = frames.map((frame) => frame.timespan.length);

        return Math.mean(frameLengths);
    }

    frameLengthStdev() {
        if (this.frames.length < 2)
            return 0;
        let frameLengths = this.frames.map((frame) => frame.timespan.length);
        return Math.stdev(frameLengths);
    }

    points(range) {
        let frames = this.frames.slice(range.start, range.end);
        let points = frames.map(frame => new Point(frame.complexity, frame.timespan.length));
        points.sort((a, b) => a.x - b.x);
        return points;
    }

    calculateStatistics(settings) {
        if (this.controller == "fixed")
            return new FixedStatistics(this);
        return new WaveStatistics(this);
    }
}
