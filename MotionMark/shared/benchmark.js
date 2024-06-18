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

class Benchmark {
    suitesCollection;
    settings;
    testContainer;
    testFrame;
    testTitle;

    constructor(suitesCollection, settings, testContainer) {
        this.suitesCollection = suitesCollection;
        this.settings = settings;
        this.testContainer = testContainer;
    }

    appendTestFrame() {
        this.testFrame = document.createElement("iframe");
        this.testFrame.setAttribute("scrolling", "no");
        this.testContainer.insertBefore(this.testFrame, this.testContainer.firstChild);

        this.testTitle = document.createElement("p");
        this.testContainer.append(this.testTitle);
    }

    removeTestFrame() {
        if (!this.testFrame)
            return;

        this.testContainer.removeChild(this.testFrame);
        this.testFrame = null;

        this.testContainer.removeChild(this.testTitle);
        this.testTitle = null;

        // Restore the testContainer backgroundColor to its original value.
        this.testContainer.style.backgroundColor = "";
    }

    loadTest(index, length, test) {
        return new Promise((resolve) => {
            this.testFrame.onload = () => {
                resolve();
            };
            this.testFrame.src = "tests/" + test.url;
            this.testTitle.textContent = test.name + " | " + (index + 1) + " / " + length;
        });
    }

    async runTest(test) {
        let frameWindow = this.testFrame.contentWindow;
        let animatorClass = frameWindow.animatorClass;

        let animator = new animatorClass(test, this.settings);

        // Make the testContainer backgroundColor be the same as the stage backgroundColor.
        this.testContainer.style.backgroundColor = animator.stage.backgroundColor();

        return animator.run();
    }

    async run() {
        this.appendTestFrame();

        let enabledTests = this.suitesCollection.enabledTests;
        let runs = new Array;

        for (const [index, test] of enabledTests.entries()) {
            await this.loadTest(index, enabledTests.length, test);
            let timeline = await this.runTest(test);

            // Calculate the score of the timeline now rather than waiting
            // till the end to make showing the results faster at the end.
            let statistics = timeline.calculateStatistics(this.settings);
            runs.push({ testName: test.name, timeline: timeline, statistics: statistics });
        }

        this.removeTestFrame();
        return runs;
    }
}
