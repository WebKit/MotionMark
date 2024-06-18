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

class SuitesCollection {
    suites;

    constructor(suites) {
        this.suites = suites;
    }

    testLocalStorageName(suiteName, testName) {
        return suiteName + "/" + testName;
    }

    updateSuitesFromLocalStorage() {
        for (let suite of this.suites) {
            for (let test of suite.tests) {
                let str = localStorage.getItem(this.testLocalStorageName(suite.name, test.name));
                if (str === null)
                    return;
                let value = JSON.parse(str);
                test.enabled = value.enabled;
                test.complexity = value.complexity;
            }
        }
    }

    updateLocalStorageFromSuites() {
        for (let suite of this.suites) {
            for (let test of suite.tests) {
                let value = { enabled: test.enabled, complexity: test.complexity };
                try {
                    localStorage.setItem(this.testLocalStorageName(suite.name, test.name), JSON.stringify(value));
                } catch (e) { }
            }
        }
    }

    updateSuitesFromRuns(runs) {
        let runIndex = 0;
        for (let suite of this.suites) {
            for (let testIndex = 0; testIndex < suite.tests.length; ++testIndex) {
                if (!suite.tests[testIndex].enabled)
                    continue;
                suite.tests[testIndex].complexity = Math.round(runs[runIndex++].timeline.score);
            }
        }
    }

    get enabledTests() {
    	return [].concat(...this.suites.map((suite) => suite.tests.filter((test) => test.enabled)));
    }
}
