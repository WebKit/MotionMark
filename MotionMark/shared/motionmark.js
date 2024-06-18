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

class Motionmark {
    settings;
    orientation;
    suitesCollection;
    runsOverlay;

    constructor() {
        this.setVersion();
        this.detectStageSize();
        this.detectScreenOrientation();

        this.settings = new Settings();
        this.suitesCollection = new SuitesCollection(suites);
    }

    setVersion() {
        document.title = Strings.text.title.replace("%s", Strings.version);
        document.querySelectorAll(".version").forEach((e) => {
            e.textContent = Strings.version;
        });
    }

    detectStageSize() {
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

    detectScreenOrientation() {
        if (!("orientation" in window))
            return;

        this.orientationQuery = window.matchMedia("(orientation: landscape)");
        this.orientationChanged(this.orientationQuery);
        this.orientationQuery.addListener(this.orientationChanged);
    }

    orientationChanged(match) {
        this.orientation = match.matches ? "landscape" : "portrait";

        if (orientation == "landscape")
            document.querySelector(".portrait-orientation-check").classList.add("hidden");
        else
            document.querySelector(".portrait-orientation-check").classList.remove("hidden");

        this.updateStartButtonState();
    }

    async detectFrameRate(progressElement) {
        let startButton = document.getElementById("start-button");
        let startButtonText = startButton.innerHTML;

        startButton.disabled = true;
        startButton.innerHTML = Strings.text.determininingFrameRate;

        let detector = new FrameRateDetector(progressElement);
        let targetFrameRate = await detector.run();

        let frameRateLabel = document.getElementById("frame-rate-label");

        if (!targetFrameRate) {
            frameRateLabel.innerHTML = Strings.text.frameRateDetectionFailure;
            targetFrameRate = 60;
        } else if (targetFrameRate != 60)
            frameRateLabel.innerHTML = Strings.text.non60FrameRate.replace("%s", targetFrameRate);
        else 
            frameRateLabel.innerHTML = Strings.text.usingFrameRate.replace("%s", targetFrameRate);

        startButton.innerHTML = startButtonText;
        this.updateTargetFrameRate(targetFrameRate);
    }

    updateStartButtonState() {
        let startButton = document.getElementById("start-button");

        if (this.orientation == "portrait" || !this.settings.targetFrameRate) {
            startButton.disabled = true;
            return;
        }

        if (!this.suitesCollection.enabledTests.length) {
            startButton.disabled = true;
            return;
        }

        startButton.disabled = false;
    }

    updateTargetFrameRate(targetFrameRate) {
        this.settings.targetFrameRate = targetFrameRate;
        this.updateStartButtonState();
    }

    showSection(sectionIdentifier) {
        let sections = document.querySelectorAll("main > section");
        for (let i = 0; i < sections.length; ++i)
            document.body.classList.remove("showing-" + sections[i].id);

        document.body.classList.add("showing-" + sectionIdentifier);

        let currentSectionElement = document.querySelector("section.selected");
        console.assert(currentSectionElement);

        let newSectionElement = document.getElementById(sectionIdentifier);
        console.assert(newSectionElement);

        currentSectionElement.classList.remove("selected");
        newSectionElement.classList.add("selected");
    }

    async run() {
        this.showSection("test-container");

        let testContainer = document.getElementById("test-container");
        let benchmark = new Benchmark(this.suitesCollection, this.settings, testContainer);
        let runs = await benchmark.run();

        this.runsOverlay = new RunsOverlay(runs, this.settings);
        this.showResults(runs);
    }

    showResults(runs) {
        this.suitesCollection.updateSuitesFromRuns(runs);
        this.suitesCollection.updateLocalStorageFromSuites();

        this.populateResults(runs);
        this.showResultsSection();
    }

    showResultsSection() {
        this.showSection("results");
    }
}
