/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

class ProgressBar {
    constructor(element, ranges)
    {
        this._element = element;
        this._ranges = ranges;
        this._currentRange = 0;
        this._updateElement();
    }

    _updateElement()
    {
        this._element.style.width = (this._currentRange * (100 / this._ranges)) + "%";
    }

    incrementRange()
    {
        ++this._currentRange;
        this._updateElement();
    }
}

class DeveloperResultsTable extends ResultsTable {
    constructor(element, headers)
    {
        super(element, headers);
    }

    _addGraphButton(td, testName, testResult, testData)
    {
        var button = Utilities.createElement("button", { class: "small-button" }, td);
        button.textContent = Strings.text.graph + "…";
        button.testName = testName;
        button.testResult = testResult;
        button.testData = testData;

        button.addEventListener("click", function(e) {
            benchmarkController.showTestGraph(e.target.testName, e.target.testResult, e.target.testData);
        });
    }

    _isNoisyMeasurement(jsonExperiment, data, measurement, options)
    {
        const percentThreshold = 10;
        const averageThreshold = 2;

        if (measurement == Strings.json.measurements.percent)
            return data[Strings.json.measurements.percent] >= percentThreshold;

        if (jsonExperiment == Strings.json.frameLength && measurement == Strings.json.measurements.average)
            return Math.abs(data[Strings.json.measurements.average] - options["frame-rate"]) >= averageThreshold;

        return false;
    }

    _addTest(testName, testResult, options, testData)
    {
        var row = Utilities.createElement("tr", {}, this.tbody);

        var isNoisy = false;
        [Strings.json.complexity, Strings.json.frameLength].forEach(function (experiment) {
            var data = testResult[experiment];
            for (var measurement in data) {
                if (this._isNoisyMeasurement(experiment, data, measurement, options))
                    isNoisy = true;
            }
        }, this);

        this._flattenedHeaders.forEach(function (header) {
            var className = "";
            if (header.className) {
                if (typeof header.className == "function")
                    className = header.className(testResult, options);
                else
                    className = header.className;
            }

            if (header.text == Strings.text.testName) {
                if (isNoisy)
                    className += " noisy-results";
                var td = Utilities.createElement("td", { class: className }, row);
                td.textContent = testName;
                return;
            }

            var td = Utilities.createElement("td", { class: className }, row);
            if (header.title == Strings.text.graph) {
                this._addGraphButton(td, testName, testResult, testData);
            } else if (!("text" in header)) {
                td.textContent = testResult[header.title];
            } else if (typeof header.text == "string") {
                var data = testResult[header.text];
                if (typeof data == "number")
                    data = data.toFixed(2);
                td.textContent = data;
            } else
                td.textContent = header.text(testResult);
        }, this);
    }
}

class DebugBenchmarkRunnerClient extends BenchmarkRunnerClient {
    testsCount;
    progressBar;

    constructor(suites, options)
    {
        super(suites, options);
        this.testsCount = this.iterationCount * suites.reduce(function (count, suite) { return count + suite.tests.length; }, 0);
    }

    willStartFirstIteration()
    {
        super.willStartFirstIteration();
        this.progressBar = new ProgressBar(document.getElementById("progress-completed"), this.testsCount);
    }

    didRunTest(testData)
    {
        this.progressBar.incrementRange();
        super.didRunTest(testData);
    }
}

class DebugSectionsManager extends SectionsManager {
    setSectionHeader(sectionIdentifier, title)
    {
        document.querySelector("#" + sectionIdentifier + " h1").textContent = title;
    }

    populateTable(tableIdentifier, headers, scoreCalculator)
    {
        var table = new DeveloperResultsTable(document.getElementById(tableIdentifier), headers);
        table.showIterations(scoreCalculator);
    }
}

window.optionsManager = new class OptionsManager {
    valueForOption(name)
    {
        var formElement = document.forms["benchmark-options"].elements[name];
        if (formElement.type == "checkbox")
            return formElement.checked;
        else if (formElement.constructor === HTMLCollection) {
            for (var i = 0; i < formElement.length; ++i) {
                var radio = formElement[i];
                if (radio.checked)
                    return formElement.value;
            }
            return null;
        }
        return formElement.value;
    }

    updateUIFromLocalStorage()
    {
        var formElements = document.forms["benchmark-options"].elements;

        for (var i = 0; i < formElements.length; ++i) {
            var formElement = formElements[i];
            var name = formElement.id || formElement.name;
            var type = formElement.type;

            var value = localStorage.getItem(name);
            if (value === null)
                continue;

            if (type == "number")
                formElements[name].value = +value;
            else if (type == "checkbox")
                formElements[name].checked = value == "true";
            else if (type == "radio")
                formElements[name].value = value;
        }
    }

    updateLocalStorageFromUI()
    {
        var formElements = document.forms["benchmark-options"].elements;
        var options = {};

        for (var i = 0; i < formElements.length; ++i) {
            var formElement = formElements[i];
            var name = formElement.id || formElement.name;
            var type = formElement.type;

            if (type == "number")
                options[name] = +formElement.value;
            else if (type == "checkbox")
                options[name] = formElement.checked;
            else if (type == "radio") {
                var radios = formElements[name];
                if (radios.constructor === HTMLCollection) {
                    for (var j = 0; j < radios.length; ++j) {
                        var radio = radios[j];
                        if (radio.checked) {
                            options[name] = radio.value;
                            break;
                        }
                    }
                } else
                    options[name] = formElements[name].value;
            }

            try {
                localStorage.setItem(name, options[name]);
            } catch (e) {}
        }

        return options;
    }

    updateDisplay()
    {
        document.body.classList.remove("display-minimal");
        document.body.classList.remove("display-progress-bar");

        document.body.classList.add("display-" + optionsManager.valueForOption("display"));
    }

    updateTiles()
    {
        document.body.classList.remove("tiles-big");
        document.body.classList.remove("tiles-classic");

        document.body.classList.add("tiles-" + optionsManager.valueForOption("tiles"));
    }
};

window.suitesManager = new class SuitesManager {
    _treeElement()
    {
        return document.querySelector("#suites > .tree");
    }

    _suitesElements()
    {
        return document.querySelectorAll("#suites > ul > li");
    }

    _checkboxElement(element)
    {
        return element.querySelector("input[type='checkbox']:not(.expand-button)");
    }

    _editElement(element)
    {
        return element.querySelector("input[type='number']");
    }

    _editsElements()
    {
        return document.querySelectorAll("#suites input[type='number']");
    }

    _localStorageNameForTest(suiteName, testName)
    {
        return suiteName + "/" + testName;
    }

    _updateSuiteCheckboxState(suiteCheckbox)
    {
        var numberEnabledTests = 0;
        suiteCheckbox.testsElements.forEach(function(testElement) {
            var testCheckbox = this._checkboxElement(testElement);
            if (testCheckbox.checked)
                ++numberEnabledTests;
        }, this);
        suiteCheckbox.checked = numberEnabledTests > 0;
        suiteCheckbox.indeterminate = numberEnabledTests > 0 && numberEnabledTests < suiteCheckbox.testsElements.length;
    }

    isAtLeastOneTestSelected()
    {
        var suitesElements = this._suitesElements();

        for (var i = 0; i < suitesElements.length; ++i) {
            var suiteElement = suitesElements[i];
            var suiteCheckbox = this._checkboxElement(suiteElement);

            if (suiteCheckbox.checked)
                return true;
        }

        return false;
    }

    _onChangeSuiteCheckbox(event)
    {
        var selected = event.target.checked;
        event.target.testsElements.forEach(function(testElement) {
            var testCheckbox = this._checkboxElement(testElement);
            testCheckbox.checked = selected;
        }, this);
        benchmarkController.updateStartButtonState();
    }

    _onChangeTestCheckbox(suiteCheckbox)
    {
        this._updateSuiteCheckboxState(suiteCheckbox);
        benchmarkController.updateStartButtonState();
    }

    _createSuiteElement(treeElement, suite, id)
    {
        var suiteElement = Utilities.createElement("li", {}, treeElement);
        var expand = Utilities.createElement("input", { type: "checkbox",  class: "expand-button", id: id }, suiteElement);
        var label = Utilities.createElement("label", { class: "tree-label", for: id }, suiteElement);

        var suiteCheckbox = Utilities.createElement("input", { type: "checkbox" }, label);
        suiteCheckbox.suite = suite;
        suiteCheckbox.onchange = this._onChangeSuiteCheckbox.bind(this);
        suiteCheckbox.testsElements = [];

        label.appendChild(document.createTextNode(" " + suite.name));
        return suiteElement;
    }

    _createTestElement(listElement, test, suiteCheckbox)
    {
        var testElement = Utilities.createElement("li", {}, listElement);
        var span = Utilities.createElement("label", { class: "tree-label" }, testElement);

        var testCheckbox = Utilities.createElement("input", { type: "checkbox" }, span);
        testCheckbox.test = test;
        testCheckbox.onchange = function(event) {
            this._onChangeTestCheckbox(event.target.suiteCheckbox);
        }.bind(this);
        testCheckbox.suiteCheckbox = suiteCheckbox;

        suiteCheckbox.testsElements.push(testElement);
        span.appendChild(document.createTextNode(" " + test.name + " "));

        testElement.appendChild(document.createTextNode(" "));
        var link = Utilities.createElement("span", {}, testElement);
        link.classList.add("link");
        link.textContent = "link";
        link.suiteName = Utilities.stripUnwantedCharactersForURL(suiteCheckbox.suite.name);
        link.testName = test.name;
        link.onclick = function(event) {
            var element = event.target;
            var title = "Link to run “" + element.testName + "” with current options:";
            var url = location.href.split(/[?#]/)[0];
            var options = optionsManager.updateLocalStorageFromUI();
            Utilities.extendObject(options, {
                "suite-name": element.suiteName,
                "test-name": Utilities.stripUnwantedCharactersForURL(element.testName)
            });
            var complexity = suitesManager._editElement(element.parentNode).value;
            if (complexity)
                options.complexity = complexity;
            prompt(title, url + Utilities.convertObjectToQueryString(options));
        };

        var complexity = Utilities.createElement("input", { type: "number" }, testElement);
        complexity.relatedCheckbox = testCheckbox;
        complexity.oninput = function(event) {
            var relatedCheckbox = event.target.relatedCheckbox;
            relatedCheckbox.checked = true;
            this._onChangeTestCheckbox(relatedCheckbox.suiteCheckbox);
        }.bind(this);
        return testElement;
    }

    createElements()
    {
        var treeElement = this._treeElement();

        Suites.forEach(function(suite, index) {
            var suiteElement = this._createSuiteElement(treeElement, suite, "suite-" + index);
            var listElement = Utilities.createElement("ul", {}, suiteElement);
            var suiteCheckbox = this._checkboxElement(suiteElement);

            suite.tests.forEach(function(test) {
                this._createTestElement(listElement, test, suiteCheckbox);
            }, this);
        }, this);
    }

    updateEditsElementsState()
    {
        var editsElements = this._editsElements();
        var showComplexityInputs = optionsManager.valueForOption("controller") == "fixed";

        for (var i = 0; i < editsElements.length; ++i) {
            var editElement = editsElements[i];
            if (showComplexityInputs)
                editElement.classList.add("selected");
            else
                editElement.classList.remove("selected");
        }
    }

    updateUIFromLocalStorage()
    {
        var suitesElements = this._suitesElements();

        for (var i = 0; i < suitesElements.length; ++i) {
            var suiteElement = suitesElements[i];
            var suiteCheckbox = this._checkboxElement(suiteElement);
            var suite = suiteCheckbox.suite;

            suiteCheckbox.testsElements.forEach(function(testElement) {
                var testCheckbox = this._checkboxElement(testElement);
                var testEdit = this._editElement(testElement);
                var test = testCheckbox.test;

                var str = localStorage.getItem(this._localStorageNameForTest(suite.name, test.name));
                if (str === null)
                    return;

                var value = JSON.parse(str);
                testCheckbox.checked = value.checked;
                testEdit.value = value.complexity;
            }, this);

            this._updateSuiteCheckboxState(suiteCheckbox);
        }

        benchmarkController.updateStartButtonState();
    }

    updateLocalStorageFromUI()
    {
        var suitesElements = this._suitesElements();
        var suites = [];

        for (var i = 0; i < suitesElements.length; ++i) {
            var suiteElement = suitesElements[i];
            var suiteCheckbox = this._checkboxElement(suiteElement);
            var suite = suiteCheckbox.suite;

            var tests = [];
            suiteCheckbox.testsElements.forEach(function(testElement) {
                var testCheckbox = this._checkboxElement(testElement);
                var testEdit = this._editElement(testElement);
                var test = testCheckbox.test;

                if (testCheckbox.checked) {
                    test.complexity = testEdit.value;
                    tests.push(test);
                }

                var value = { checked: testCheckbox.checked, complexity: testEdit.value };
                try {
                    localStorage.setItem(this._localStorageNameForTest(suite.name, test.name), JSON.stringify(value));
                } catch (e) {}
            }, this);

            if (tests.length)
                suites.push(new Suite(suiteCheckbox.suite.name, tests));
        }

        return suites;
    }

    suitesFromQueryString(suiteName, testName)
    {
        suiteName = decodeURIComponent(suiteName);
        testName = decodeURIComponent(testName);

        var suites = [];
        var suiteRegExp = new RegExp(suiteName, "i");
        var testRegExp = new RegExp(testName, "i");

        for (var i = 0; i < Suites.length; ++i) {
            var suite = Suites[i];
            if (!Utilities.stripUnwantedCharactersForURL(suite.name).match(suiteRegExp))
                continue;

            var test;
            for (var j = 0; j < suite.tests.length; ++j) {
                suiteTest = suite.tests[j];
                if (Utilities.stripUnwantedCharactersForURL(suiteTest.name).match(testRegExp)) {
                    test = suiteTest;
                    break;
                }
            }

            if (!test)
                continue;

            suites.push(new Suite(suiteName, [test]));
        };

        return suites;
    }

    updateLocalStorageFromJSON(results)
    {
        for (var suiteName in results[Strings.json.results.tests]) {
            var suiteResults = results[Strings.json.results.tests][suiteName];
            for (var testName in suiteResults) {
                var testResults = suiteResults[testName];
                var data = testResults[Strings.json.controller];
                var complexity = Math.round(data[Strings.json.measurements.average]);

                var value = { checked: true, complexity: complexity };
                try {
                    localStorage.setItem(this._localStorageNameForTest(suiteName, testName), JSON.stringify(value));
                } catch (e) {}
            }
        }
    }
}

class DebugBenchmarkController extends BenchmarkController {
    async initialize()
    {
        this.updateUIStrings();
        this.graphController = new GraphController;

        document.forms["benchmark-options"].addEventListener("change", (event) => { this.onBenchmarkOptionsChanged(event) }, true);
        document.forms["graph-type"].addEventListener("change", () => { this.graphController.onGraphTypeChanged() }, true);
        document.forms["time-graph-options"].addEventListener("change", () => { this.graphController.onTimeGraphOptionsChanged() }, true);
        document.forms["complexity-graph-options"].addEventListener("change", () => { this.graphController.onComplexityGraphOptionsChanged() }, true);
        optionsManager.updateUIFromLocalStorage();
        optionsManager.updateDisplay();
        optionsManager.updateTiles();

        if (benchmarkController.startBenchmarkImmediatelyIfEncoded())
            return;

        benchmarkController.addOrientationListenerIfNecessary();
        suitesManager.createElements();
        suitesManager.updateUIFromLocalStorage();
        suitesManager.updateEditsElementsState();

        this.#setupDropTarget();

        this.frameRateDetectionComplete = false;
        this.updateStartButtonState();

        let progressElement = document.querySelector("#frame-rate-detection span");
        await this.detectFrameRate(progressElement);
    }
    
    #setupDropTarget()
    {
        var dropTarget = document.getElementById("drop-target");
        function stopEvent(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        dropTarget.addEventListener("dragenter", (e) => {
            dropTarget.classList.add("drag-over");
            stopEvent(e);
        }, false);

        dropTarget.addEventListener("dragover", stopEvent, false);

        dropTarget.addEventListener("dragleave", (e) => {
            dropTarget.classList.remove("drag-over");
            stopEvent(e);
        }, false);

        dropTarget.addEventListener("drop", (e) => {
            stopEvent(e);

            if (!e.dataTransfer.files.length) {
                dropTarget.classList.remove("drag-over");
                return;
            }

            dropTarget.textContent = 'Processing…';

            var file = e.dataTransfer.files[0];

            var reader = new FileReader();
            reader.filename = file.name;
            reader.onload = (e) => {
                const data = JSON.parse(e.target.result);
                
                let results;
                if (data['debugOutput'] instanceof Array)
                    results = RunData.resultsDataFromBenchmarkRunnerData(data['debugOutput']);
                else
                    results = RunData.resultsDataFromSingleRunData(data);

                this.ensureRunnerClient([ ], { });
                this.runnerClient.scoreCalculator = new ScoreCalculator(results);
                this.showResults();
            };

            reader.readAsText(file);
            document.title = "File: " + reader.filename;
        }, false);
    }

    frameRateDeterminationComplete(targetFrameRate)
    {
        let frameRateLabelContent = Strings.text.usingFrameRate.replace("%s", targetFrameRate);
        
        if (!targetFrameRate) {
            frameRateLabelContent = Strings.text.frameRateDetectionFailure;
            targetFrameRate = 60;
        }

        document.getElementById("frame-rate-detection").textContent = frameRateLabelContent;
        document.getElementById("system-frame-rate").value = targetFrameRate;
        document.getElementById("frame-rate").value = targetFrameRate;

        this.frameRateDetectionComplete = true;
        this.updateStartButtonState();
    }

    updateStartButtonState()
    {
        var startButton = document.getElementById("start-button");
        if ("isInLandscapeOrientation" in this && !this.isInLandscapeOrientation) {
            startButton.disabled = true;
            return;
        }
        
        startButton.disabled = (!suitesManager.isAtLeastOneTestSelected()) || !this.frameRateDetectionComplete;
    }

    onBenchmarkOptionsChanged(event)
    {
        switch (event.target.name) {
        case "controller":
            suitesManager.updateEditsElementsState();
            break;
        case "display":
            optionsManager.updateDisplay();
            break;
        case "tiles":
            optionsManager.updateTiles();
            break;
        }
    }

    startBenchmark()
    {
        benchmarkController.determineCanvasSize();
        benchmarkController.options = Utilities.mergeObjects(this.benchmarkDefaultParameters, optionsManager.updateLocalStorageFromUI());
        benchmarkController.suites = suitesManager.updateLocalStorageFromUI();
        this._startBenchmark(benchmarkController.suites, benchmarkController.options, "running-test");
    }

    startBenchmarkImmediatelyIfEncoded()
    {
        benchmarkController.determineCanvasSize();
        benchmarkController.options = Utilities.convertQueryStringToObject(location.search);
        if (!benchmarkController.options)
            return false;

        benchmarkController.suites = suitesManager.suitesFromQueryString(benchmarkController.options["suite-name"], benchmarkController.options["test-name"]);
        if (!benchmarkController.suites.length)
            return false;

        setTimeout(function() {
            this._startBenchmark(benchmarkController.suites, benchmarkController.options, "running-test");
        }.bind(this), 0);
        return true;
    }

    restartBenchmark()
    {
        this._startBenchmark(benchmarkController.suites, benchmarkController.options, "running-test");
    }

    showResults()
    {
        if (!this.addedKeyEvent) {
            document.addEventListener("keypress", this.handleKeyPress, false);
            this.addedKeyEvent = true;
        }

        const scoreCalculator = this.runnerClient.scoreCalculator;
        if (scoreCalculator.options["controller"] == "ramp")
            Headers.details[3].disabled = true;
        else {
            Headers.details[1].disabled = true;
            Headers.details[4].disabled = true;
        }

        if (scoreCalculator.options[Strings.json.configuration]) {
            document.body.classList.remove("small", "medium", "large");
            document.body.classList.add(scoreCalculator.options[Strings.json.configuration]);
        }

        const score = scoreCalculator.score;
        const confidence = ((scoreCalculator.scoreLowerBound / score - 1) * 100).toFixed(2) +
            "% / +" + ((scoreCalculator.scoreUpperBound / score - 1) * 100).toFixed(2) + "%";
        const fps = scoreCalculator._systemFrameRate;
        sectionsManager.setSectionVersion("results", scoreCalculator.version);
        sectionsManager.setSectionScore("results", score.toFixed(2), confidence, fps);
        sectionsManager.populateTable("results-header", Headers.testName, scoreCalculator);
        sectionsManager.populateTable("results-score", Headers.score, scoreCalculator);
        sectionsManager.populateTable("results-data", Headers.details, scoreCalculator);
        sectionsManager.showSection("results", true);

        suitesManager.updateLocalStorageFromJSON(scoreCalculator.results[0]);
    }

    showTestGraph(testName, testResult, testData)
    {
        sectionsManager.setSectionHeader("test-graph", testName);
        sectionsManager.showSection("test-graph", true);
        this.graphController.updateGraphData(testResult, testData, this.runnerClient.scoreCalculator.options);
    }
}

window.benchmarkControllerClass = DebugBenchmarkController;
window.benchmarkRunnerClientClass = DebugBenchmarkRunnerClient;
window.sectionsManagerClass = DebugSectionsManager;
