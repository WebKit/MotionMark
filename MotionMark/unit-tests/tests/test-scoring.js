/*
 * Copyright (C) 2026 Apple Inc. All rights reserved.
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

describe('Scoring', function() {
    describe('Windowed profile', function() {
        before(async function() {
            // Scoring runs the full bootstrap, which is slow with the windowed profile.
            this.timeout(10000);

            const url = "data/two-suite-single-iteration-test-data.json";
            const response = await fetch(url);
            expect(response.ok).to.be(true);

            const json = await response.json();

            // The bootstrap uses a seeded random number generator, so the scores are deterministic.
            json.options["score-profile"] = Strings.json.profiles.window;

            this.calculator = new ScoreCalculator(RunData.resultsDataFromSingleRunData(json));
            this.results = this.calculator.results;
            this.testsData = json.data[0]['MotionMark'];
        });

        it('Uses the windowed profile', function() {
            expect(this.calculator.scoreProfile).to.be(Strings.json.profiles.window);

            for (const testName of ['Multiply', 'Leaves']) {
                for (const regression of this.testsData[testName][Strings.json.controller])
                    expect(regression[Strings.json.regressions.profile]).to.be(Strings.json.profiles.window);
            }
        });

        it('Computes the expected complexities', function() {
            const motionMarkResults = this.results[0][Strings.json.results.tests]['MotionMark'];

            const multiplyComplexity = motionMarkResults['Multiply'][Strings.json.complexity][Strings.json.complexity];
            expect(multiplyComplexity.toFixed(2)).to.be('4677.42');

            const leavesComplexity = motionMarkResults['Leaves'][Strings.json.complexity][Strings.json.complexity];
            expect(leavesComplexity.toFixed(2)).to.be('4900.47');
        });

        it('Computes the expected scores', function() {
            const firstResults = this.results[0];
            expect(firstResults[Strings.json.score].toFixed(2)).to.be('4787.75');
            expect(firstResults[Strings.json.scoreLowerBound].toFixed(2)).to.be('4752.79');
            expect(firstResults[Strings.json.scoreUpperBound].toFixed(2)).to.be('4820.44');

            const motionMarkResults = firstResults[Strings.json.results.tests]['MotionMark'];

            const multiplyResults = motionMarkResults['Multiply'];
            expect(multiplyResults[Strings.json.score].toFixed(2)).to.be('4683.73');
            expect(multiplyResults[Strings.json.scoreLowerBound].toFixed(2)).to.be('4653.51');
            expect(multiplyResults[Strings.json.scoreUpperBound].toFixed(2)).to.be('4710.77');

            const leavesResults = motionMarkResults['Leaves'];
            expect(leavesResults[Strings.json.score].toFixed(2)).to.be('4894.07');
            expect(leavesResults[Strings.json.scoreLowerBound].toFixed(2)).to.be('4854.19');
            expect(leavesResults[Strings.json.scoreUpperBound].toFixed(2)).to.be('4932.67');
        });
    });
});
