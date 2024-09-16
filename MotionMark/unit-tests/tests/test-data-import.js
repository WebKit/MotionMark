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

describe('Data Import', function() {
    it('Fetch test data', async function() {
        this.timeout(200);

        const url = "data/two-suite-single-iteration-test-data.json";
        const response = await fetch(url);
        expect(response.ok).to.be(true);

        this.json = await response.json();
        expect(this.json.version).to.be('1.4');
    });

    it('Validate imported data', function() {
        expect(this.json.options instanceof Object).to.be(true);
        expect(this.json.data instanceof Array).to.be(true);
    });

    it('Create results', function() {
        this.timeout(500);

        // Make the results analysis faster.
        this.json.options[Strings.json.bootstrapIterations] = 10;

        const calculator = new ScoreCalculator(this.json.version, this.json.options, this.json.data);
        this.results = calculator.results;
        expect(this.results instanceof Array).to.be(true);
    });

    it('Validate results', function() {

        // Check that we have results, not their exact values.
        const firstResults = this.results[0];

        expect(typeof firstResults[Strings.json.score]).to.be('number');
        expect(typeof firstResults[Strings.json.scoreLowerBound]).to.be('number');
        expect(typeof firstResults[Strings.json.scoreUpperBound]).to.be('number');
        
        expect(firstResults[Strings.json.results.tests] instanceof Object).to.be(true);

        const testsResults = firstResults[Strings.json.results.tests];
        expect(testsResults['MotionMark'] instanceof Object).to.be(true);

        const motionMarkResults = testsResults['MotionMark'];
        expect(motionMarkResults['Multiply'] instanceof Object).to.be(true);
        expect(motionMarkResults['Leaves'] instanceof Object).to.be(true);

        const multiplyResults = motionMarkResults['Multiply'];
        expect(typeof multiplyResults[Strings.json.score]).to.be('number');
        expect(typeof multiplyResults[Strings.json.scoreLowerBound]).to.be('number');
        expect(typeof multiplyResults[Strings.json.scoreUpperBound]).to.be('number');
    });
});
