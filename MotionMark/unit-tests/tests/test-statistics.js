/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

describe('Statistics', function() {
    describe('sampleMean()', function() {
        it('sampleMean should compute the mean', function() {
            expect(Statistics.sampleMean(10, 100)).to.be(10);
        });

        it('sampleMean with zero samples should be zero', function() {
            expect(Statistics.sampleMean(0, 100)).to.be(0);
        });
    });

    describe('geometricMean()', function() {
        it('geometricMean should compute the geometric mean', function() {
            const values = [6, 2, 3, 5];
            const result = Statistics.geometricMean(values).toFixed(3);
            expect(result).to.be('3.663')
        });

        it('geometricMean with a zero should compute to zero', function() {
            const values = [6, 2, 0, 5];
            const result = Statistics.geometricMean(values).toFixed(3);
            expect(result).to.be('0.000')
        });
    });

    describe('Regression (_windowedFit)', function() {
        it('scores highest complexity window sustaining >= 90% of target FPS', function() {
            // 20 samples => windowSize = 2. Target frame length = 16.67ms (60 FPS).
            const desiredFrameLength = 1000 / 60;
            const samples = [];
            for (let c = 1; c <= 10; ++c) {
                const frameLength = c <= 5 ? desiredFrameLength : desiredFrameLength * 2;
                samples.push([c, frameLength, c * 20]);
                samples.push([c, frameLength, c * 20 + 10]);
            }

            const regression = new Regression(samples, 0, samples.length - 1, {
                desiredFrameLength: desiredFrameLength,
                preferredProfile: Strings.json.profiles.window,
            });
            expect(regression.complexity.toFixed(3)).to.be('5.000');
        });

        it('returns non-zero FPS-scaled minimum complexity when all windows fail 90% target FPS', function() {
            // 20 samples => windowSize = 2. Target = 16.67ms (60 FPS).
            // c = 1 samples at t = 10, 20, 30, 40 have frame lengths 20, 20, 50, 50 ms
            // (sorted by complexity asc, frameTime desc => [50, 50, 20, 20]).
            // First c = 1 window [50, 50] has error = 16.67 / 50 = 0.333 (< 0.9).
            // Best c = 1 window [20, 20] has error = 16.67 / 20 = 0.833 (< 0.9).
            // Higher-complexity windows (c = 2..6 at 50ms) also fail 0.9 and must not inflate the score.
            const desiredFrameLength = 1000 / 60;
            const samples = [
                [1, 20, 10],
                [1, 20, 20],
                [1, 50, 30],
                [1, 50, 40],
                [2, 50, 50],
                [2, 50, 60],
                [2, 50, 70],
                [2, 50, 80],
                [3, 50, 90],
                [3, 50, 100],
                [3, 50, 110],
                [3, 50, 120],
                [4, 50, 130],
                [4, 50, 140],
                [5, 50, 150],
                [5, 50, 160],
                [6, 50, 170],
                [6, 50, 180],
                [6, 50, 190],
                [6, 50, 200],
            ];

            const windowRegression = new Regression(samples, 0, samples.length - 1, {
                desiredFrameLength: desiredFrameLength,
                preferredProfile: Strings.json.profiles.window,
            });
            expect(windowRegression.complexity.toFixed(3)).to.be('0.833');

            const strictRegression = new Regression(samples, 0, samples.length - 1, {
                desiredFrameLength: desiredFrameLength,
                preferredProfile: Strings.json.profiles.windowStrict,
            });
            expect(strictRegression.complexity.toFixed(3)).to.be('0.333');
        });

        it('seeds bestComplexity from first full window when fewer than windowSize samples sit at minComplexity', function() {
            // 20 samples => windowSize = 2, with only 1 sample at c = 1 and remaining samples at c >= 2.
            // First full window spans [c = 1, c = 2] (averageComplexity = 1.5 > minComplexity = 1)
            // at 50ms (error = 1/3 < 0.9), so bestComplexity == 0 seeds 1.5 * (1/3) = 0.500.
            const desiredFrameLength = 1000 / 60;
            const samples = [[1, 50, 10]];
            for (let i = 1; i < 20; ++i) {
                samples.push([2 + Math.floor(i / 4), 50, (i + 1) * 10]);
            }

            const regression = new Regression(samples, 0, samples.length - 1, {
                desiredFrameLength: desiredFrameLength,
                preferredProfile: Strings.json.profiles.window,
            });
            expect(regression.complexity.toFixed(3)).to.be('0.500');
        });
    });
});

