/*
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

class BenchmarkRunnerClient {
    iterationCount = 1;
    options = null;
    results = null;
    
    constructor(suites, options)
    {
        this.options = options;
    }

    get scoreCalculator()
    {
        return this._scoreCalculator;
    }

    set scoreCalculator(calculator)
    {
        this._scoreCalculator = calculator;
    }

    willStartFirstIteration()
    {
        this.scoreCalculator = new ScoreCalculator(new RunData(Strings.version, this.options));
    }

    didRunSuites(suitesSamplers)
    {
        this._scoreCalculator.push(suitesSamplers);
    }

    didRunTest(testData)
    {
        this._scoreCalculator.calculateScore(testData);
    }

    didFinishLastIteration()
    {
        benchmarkController.showResults();
    }
}

class SectionsManager {
    showSection(sectionIdentifier, pushState)
    {
        var sections = document.querySelectorAll("main > section");
        for (var i = 0; i < sections.length; ++i) {
            document.body.classList.remove("showing-" + sections[i].id);
        }
        document.body.classList.add("showing-" + sectionIdentifier);

        var currentSectionElement = document.querySelector("section.selected");
        console.assert(currentSectionElement);

        var newSectionElement = document.getElementById(sectionIdentifier);
        console.assert(newSectionElement);

        currentSectionElement.classList.remove("selected");
        newSectionElement.classList.add("selected");

        if (pushState)
            history.pushState({section: sectionIdentifier}, document.title);
    }

    setSectionVersion(sectionIdentifier, version)
    {
        document.querySelector("#" + sectionIdentifier + " .version").textContent = version;
    }

    setSectionScore(sectionIdentifier, score, confidence, fps)
    {
        if (fps && score)
            document.querySelector("#" + sectionIdentifier + " .score").textContent = `${score} @ ${fps}fps`;
        if (confidence)
            document.querySelector("#" + sectionIdentifier + " .confidence").textContent = confidence;
    }

    populateTable(tableIdentifier, headers, scoreCalculator)
    {
        var table = new ResultsTable(document.getElementById(tableIdentifier), headers);
        table.showIterations(scoreCalculator);
    }
}

class BenchmarkController {
    benchmarkDefaultParameters = {
        "test-interval": 30,
        "display": "minimal",
        "tiles": "big",
        "controller": "ramp",
        "kalman-process-error": 1,
        "kalman-measurement-error": 4,
        "time-measurement": "performance",
        "warmup-length": 2000,
        "warmup-frame-count": 30,
        "first-frame-minimum-length": 0,
        "system-frame-rate": 60,
        "frame-rate": 60,
    };

    async initialize()
    {
        this.updateUIStrings();
        benchmarkController.addOrientationListenerIfNecessary();

        this._startButton = document.getElementById("start-button");
        this._startButton.disabled = true;
        this._startButton.textContent = Strings.text.determininingFrameRate;

        await this.detectFrameRate();
    }
    
    async detectFrameRate(progressElement = undefined)
    {
        let targetFrameRate;
        try {
            targetFrameRate = await this.determineFrameRate(progressElement);
        } catch (e) {
            console.error('Frame rate detection failed ' + e);
        }
        this.frameRateDeterminationComplete(targetFrameRate);
    }
    
    updateUIStrings()
    {
        document.title = Strings.text.title.replace("%s", Strings.version);
        document.querySelectorAll(".version").forEach(function(e) {
            e.textContent = Strings.version;
        });
    }
    
    frameRateDeterminationComplete(frameRate)
    {
        const frameRateLabel = document.getElementById("frame-rate-label");

        let labelContent = "";
        if (!frameRate) {
            labelContent = Strings.text.frameRateDetectionFailure;
            frameRate = 60;
        } else if (frameRate != 60)
            labelContent = Strings.text.non60FrameRate.replace("%s", frameRate);
        else 
            labelContent = Strings.text.usingFrameRate.replace("%s", frameRate);

        frameRateLabel.innerHTML = labelContent;

        this.benchmarkDefaultParameters["system-frame-rate"] = frameRate;
        this.benchmarkDefaultParameters["frame-rate"] = frameRate;

        this._startButton.textContent = Strings.text.runBenchmark;
        this._startButton.disabled = false;
    }

    determineCanvasSize()
    {
        var match = window.matchMedia("(max-device-width: 760px)");
        if (match.matches) {
            document.body.classList.add("small");
            return;
        }

        match = window.matchMedia("(max-device-width: 1600px)");
        if (match.matches) {
            document.body.classList.add("medium");
            return;
        }

        match = window.matchMedia("(max-width: 1600px)");
        if (match.matches) {
            document.body.classList.add("medium");
            return;
        }

        document.body.classList.add("large");
    }

    determineFrameRate(detectionProgressElement)
    {
        return new Promise((resolve, reject) => {
            let firstTimestamp;
            let count = 0;

            const averageFrameRate = function(timestamp)
            {
                return 1000. / ((timestamp - firstTimestamp) / count);
            }

            const finish = function(average)
            {
                const commonFrameRates = [15, 30, 45, 60, 90, 120, 144];
                const distanceFromFrameRates = commonFrameRates.map(rate => {
                    return Math.abs(Math.round(rate - average));
                });

                let shortestDistance = Number.MAX_VALUE;
                let targetFrameRate = undefined;
                for (let i = 0; i < commonFrameRates.length; i++) {
                    if (distanceFromFrameRates[i] < shortestDistance) {
                        targetFrameRate = commonFrameRates[i];
                        shortestDistance = distanceFromFrameRates[i];
                    }
                }
                if (!targetFrameRate)
                    reject("Failed to map frame rate to a common frame rate");

                resolve(targetFrameRate);
            }

            const tick = function(timestamp)
            {
                if (!firstTimestamp)
                    firstTimestamp = timestamp;
                else if (detectionProgressElement)
                    detectionProgressElement.textContent = Math.round(averageFrameRate(timestamp));

                count++;

                if (count < 300)
                    requestAnimationFrame(tick);
                else
                    finish(averageFrameRate(timestamp));
            }

            requestAnimationFrame(tick);
        })
    }

    addOrientationListenerIfNecessary()
    {
        if (!("orientation" in window))
            return;

        this.orientationQuery = window.matchMedia("(orientation: landscape)");
        this._orientationChanged(this.orientationQuery);
        this.orientationQuery.addListener(this._orientationChanged);
    }

    _orientationChanged(match)
    {
        benchmarkController.isInLandscapeOrientation = match.matches;
        if (match.matches)
            document.querySelector(".portrait-orientation-check").classList.add("hidden");
        else
            document.querySelector(".portrait-orientation-check").classList.remove("hidden");

        benchmarkController.updateStartButtonState();
    }

    updateStartButtonState()
    {
        document.getElementById("start-button").disabled = !this.isInLandscapeOrientation;
    }

    _startBenchmark(suites, options, frameContainerID)
    {
        var configuration = document.body.className.match(/small|medium|large/);
        if (configuration)
            options[Strings.json.configuration] = configuration[0];

        this.ensureRunnerClient(suites, options);
        var frameContainer = document.getElementById(frameContainerID);
        var runner = new BenchmarkRunner(suites, frameContainer, this.runnerClient);
        runner.runMultipleIterations();

        sectionsManager.showSection("test-container");
    }
    
    ensureRunnerClient(suites, options)
    {
        this.runnerClient = new benchmarkRunnerClientClass(suites, options);
    }

    async startBenchmark()
    {
        benchmarkController.determineCanvasSize();

        let options = this.benchmarkDefaultParameters;
        this._startBenchmark(Suites, options, "test-container");
    }

    showResults()
    {
        if (!this.addedKeyEvent) {
            document.addEventListener("keypress", this.handleKeyPress, false);
            this.addedKeyEvent = true;
        }

        const scoreCalculator = this.runnerClient.scoreCalculator;
        const score = scoreCalculator.score;
        const confidence = "±" + (Statistics.largestDeviationPercentage(scoreCalculator.scoreLowerBound, score, scoreCalculator.scoreUpperBound) * 100).toFixed(2) + "%";
        const fps = scoreCalculator.targetFrameRate;
        sectionsManager.setSectionVersion("results", scoreCalculator.version);
        sectionsManager.setSectionScore("results", score.toFixed(2), confidence, fps);
        sectionsManager.populateTable("results-header", Headers.testName, scoreCalculator);
        sectionsManager.populateTable("results-score", Headers.score, scoreCalculator);
        sectionsManager.populateTable("results-data", Headers.details, scoreCalculator);
        sectionsManager.showSection("results", true);
    }

    handleKeyPress(event)
    {
        switch (event.charCode)
        {
        case 27:  // esc
            benchmarkController.hideDebugInfo();
            break;
        case 106: // j
            benchmarkController.showDebugInfo();
            break;
        case 115: // s
            benchmarkController.selectResults(event.target);
            break;
        }
    }

    hideDebugInfo()
    {
        var overlay = document.getElementById("overlay");
        if (!overlay)
            return;
        document.body.removeChild(overlay);
    }

    showDebugInfo()
    {
        if (document.getElementById("overlay"))
            return;

        var overlay = Utilities.createElement("div", {
            id: "overlay"
        }, document.body);
        var container = Utilities.createElement("div", {}, overlay);

        var header = Utilities.createElement("h3", {}, container);
        header.textContent = "Debug Output";

        var data = Utilities.createElement("div", {}, container);
        data.textContent = "Please wait...";
        setTimeout(() => {
            var output = {
                version: this.runnerClient.scoreCalculator.version,
                options: this.runnerClient.scoreCalculator.options,
                data: this.runnerClient.scoreCalculator.data
            };
            data.textContent = JSON.stringify(output, (key, value) => {
                if (typeof value === 'number')
                    return Utilities.toFixedNumber(value, 3);
                return value;
            }, 1);
        }, 0);
        data.onclick = () => {
            var selection = window.getSelection();
            selection.removeAllRanges();
            var range = document.createRange();
            range.selectNode(data);
            selection.addRange(range);
        };

        var button = Utilities.createElement("button", {}, container);
        button.textContent = "Done";
        button.onclick = () => {
            this.hideDebugInfo();
        };
    }

    selectResults(target)
    {
        target.selectRange = ((target.selectRange || 0) + 1) % 3;

        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        switch (target.selectRange) {
            case 0: {
                range.selectNode(document.getElementById("results-score"));
                break;
            }
            case 1: {
                range.setStart(document.querySelector("#results .score"), 0);
                range.setEndAfter(document.querySelector("#results-score"), 0);
                break;
            }
            case 2: {
                range.selectNodeContents(document.querySelector("#results .score"));
                break;
            }
        }
        selection.addRange(range);
    }
}

window.benchmarkControllerClass = BenchmarkController;
window.benchmarkRunnerClientClass = BenchmarkRunnerClient;
window.sectionsManagerClass = SectionsManager;

window.addEventListener("load", () => {

    window.sectionsManager = new sectionsManagerClass();
    window.benchmarkController = new benchmarkControllerClass();

    benchmarkController.initialize();
});
