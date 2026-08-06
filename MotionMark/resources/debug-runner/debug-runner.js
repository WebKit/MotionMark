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

class ComparisonResultsTable extends ResultsTable {
    constructor(element, headers, scoreCalculatorA, scoreCalculatorB)
    {
        super(element, headers);
        this.scoreCalculatorA = scoreCalculatorA;
        this.scoreCalculatorB = scoreCalculatorB;
    }

    _addTest(testName, testResultA, testResultB, optionsA, optionsB, testDataA, testDataB)
    {
        const row = Utilities.createElement("tr", {}, this.tbody);

        this._flattenedHeaders.forEach(function (header) {
            var className = "";
            if (header.className) {
                if (typeof header.className == "function")
                    className = header.className(testResultA, testResultB, optionsA, optionsB);
                else
                    className = header.className;
            }
            
            const td = Utilities.createElement("td", { class: className }, row);
            
            if (header.text == Strings.text.testName) {
                td.textContent = testName;
            } else if (header.title === Strings.text.graph) {
                var button = Utilities.createElement("button", { class: "small-button compare-button" }, td);
                button.textContent = "Compare Graph…";
                button.testName = testName;
                button.testResultA = testResultA;
                button.testResultB = testResultB;
                button.testDataA = testDataA;
                button.testDataB = testDataB;
                
                button.addEventListener("click", function(e) {
                    const target = e.currentTarget;
                    benchmarkController.showComparisonGraph(
                        target.testName,
                        target.testResultA,
                        target.testResultB,
                        target.testDataA,
                        target.testDataB
                    );
                });
            } else if (typeof header.text == "string") {
                var data = testResultB ? testResultB[header.text] : undefined;
                if (typeof data == "number")
                    data = data.toFixed(2);
                td.textContent = data !== undefined ? data : "N/A";
            } else if (typeof header.text == "function") {
                const rendered = header.text(testResultA, testResultB, optionsA, optionsB);
                if (rendered instanceof HTMLElement || rendered instanceof DocumentFragment) {
                    td.appendChild(rendered);
                } else {
                    td.textContent = rendered !== undefined ? rendered : "N/A";
                }
            }
        }, this);
    }

    _addIteration(iterationResultA, iterationResultB, iterationDataA, iterationDataB, optionsA, optionsB)
    {
        const testsResultsA = iterationResultA ? iterationResultA[Strings.json.results.tests] : {};
        const testsResultsB = iterationResultB ? iterationResultB[Strings.json.results.tests] : {};
        
        for (const suiteName in testsResultsB) {
            this._addEmptyRow();
            const suiteResultB = testsResultsB[suiteName];
            const suiteDataB = iterationDataB[suiteName];
            
            const suiteResultA = testsResultsA[suiteName] || {};
            const suiteDataA = (iterationDataA && iterationDataA[suiteName]) || {};
            
            for (let testName in suiteResultB) {
                const testResultB = suiteResultB[testName];
                const testDataB = suiteDataB[testName];
                
                const testResultA = suiteResultA[testName];
                const testDataA = suiteDataA[testName];
                
                this._addTest(testName, testResultA, testResultB, optionsA, optionsB, testDataA, testDataB);
            }
        }
    }

    showIterations()
    {
        this.clear();
        this._addHeader();
        this._addBody();

        const iterationsResultsA = this.scoreCalculatorA.results;
        const iterationsResultsB = this.scoreCalculatorB.results;
        
        iterationsResultsB.forEach(function(iterationResultB, index) {
            const iterationResultA = iterationsResultsA[index] || {};
            const iterationDataA = this.scoreCalculatorA.data[index];
            const iterationDataB = this.scoreCalculatorB.data[index];
            
            this._addIteration(
                iterationResultA,
                iterationResultB,
                iterationDataA,
                iterationDataB,
                this.scoreCalculatorA.options,
                this.scoreCalculatorB.options
            );
        }, this);
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
        this.#setupCompareDropTargets();
        this.baselineFileData = null;
        this.comparisonFileData = null;
        this.isComparisonMode = false;

        this.frameRateDetectionComplete = false;
        this.updateStartButtonState();

        let progressElement = document.querySelector("#frame-rate-detection span");
        await this.detectFrameRate(progressElement);
    }

    #setupDropTarget()
    {
        var dropTarget = document.getElementById("drop-target");
        if (!dropTarget) return;
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
            dropTarget.classList.remove("drag-over");

            if (!e.dataTransfer.files.length) {
                return;
            }

            dropTarget.textContent = 'Processing…';
            this.handleResultsFile(e.dataTransfer.files[0]);
        }, false);
    }

    #setupCompareDropTargets()
    {
        const dropTargetA = document.getElementById("drop-target-a");
        const dropTargetB = document.getElementById("drop-target-b");
        
        if (!dropTargetA || !dropTargetB) return;
        
        const stopEvent = (e) => {
            e.stopPropagation();
            e.preventDefault();
        };

        // Add global window protection to prevent accidental outer drops from navigating the tab
        if (!window.comparisonGlobalDragWired) {
            window.addEventListener("dragover", stopEvent, false);
            window.addEventListener("drop", stopEvent, false);
            window.comparisonGlobalDragWired = true;
        }
        
        // Target A with Drag Counter to completely avoid children visual flickers
        let dragCounterA = 0;
        dropTargetA.addEventListener("dragenter", (e) => {
            stopEvent(e);
            dragCounterA++;
            dropTargetA.classList.add("drag-over");
        }, false);
        
        dropTargetA.addEventListener("dragover", stopEvent, false);
        
        dropTargetA.addEventListener("dragleave", (e) => {
            stopEvent(e);
            dragCounterA--;
            if (dragCounterA === 0) {
                dropTargetA.classList.remove("drag-over");
            }
        }, false);
        
        dropTargetA.addEventListener("drop", (e) => {
            stopEvent(e);
            dragCounterA = 0;
            dropTargetA.classList.remove("drag-over");
            if (e.dataTransfer.files.length) {
                const innerDZ = dropTargetA.querySelector(".drop-zone");
                if (innerDZ) innerDZ.textContent = 'Processing…';
                this.handleResultsFileA(e.dataTransfer.files[0]);
            }
        }, false);

        // Target B with Drag Counter
        let dragCounterB = 0;
        dropTargetB.addEventListener("dragenter", (e) => {
            stopEvent(e);
            dragCounterB++;
            dropTargetB.classList.add("drag-over");
        }, false);
        
        dropTargetB.addEventListener("dragover", stopEvent, false);
        
        dropTargetB.addEventListener("dragleave", (e) => {
            stopEvent(e);
            dragCounterB--;
            if (dragCounterB === 0) {
                dropTargetB.classList.remove("drag-over");
            }
        }, false);
        
        dropTargetB.addEventListener("drop", (e) => {
            stopEvent(e);
            dragCounterB = 0;
            dropTargetB.classList.remove("drag-over");
            if (e.dataTransfer.files.length) {
                const innerDZ = dropTargetB.querySelector(".drop-zone");
                if (innerDZ) innerDZ.textContent = 'Processing…';
                this.handleResultsFileB(e.dataTransfer.files[0]);
            }
        }, false);
    }

    switchPanelMode(mode) {
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.control-panel').forEach(panel => panel.classList.remove('active'));
        
        if (mode === 'run') {
            document.getElementById('btn-mode-run').classList.add('active');
            document.getElementById('panel-run').classList.add('active');
        } else {
            document.getElementById('btn-mode-compare').classList.add('active');
            document.getElementById('panel-compare').classList.add('active');
        }
    }

    loadResults() {
        document.getElementById("load-results-input").click();
    }

    loadResultsA() {
        document.getElementById("load-results-input-a").click();
    }

    loadResultsB() {
        document.getElementById("load-results-input-b").click();
    }

    handleResultsFile(fileOrInput) {
        const file = fileOrInput instanceof File ? fileOrInput : fileOrInput.files[0];
        if (!file)
            return;

        const reader = new FileReader();
        reader.filename = file.name;
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            const results = (data['debugOutput'] instanceof Array) ?
                RunData.resultsDataFromBenchmarkRunnerData(data['debugOutput']) :
                RunData.resultsDataFromSingleRunData(data);
            this.ensureRunnerClient([], {});
            this.runnerClient.scoreCalculator = new ScoreCalculator(results);
            this.isComparisonMode = false;
            
            // Re-show profile selector in results and graph views
            const resultsScoreProfileSelector = document.getElementById("results-score-profile");
            if (resultsScoreProfileSelector)
                resultsScoreProfileSelector.style.display = "inline-block";
            const graphScoreProfileSelector = document.getElementById("graph-score-profile");
            if (graphScoreProfileSelector)
                graphScoreProfileSelector.parentNode.style.display = "block";

            const dropTarget = document.getElementById("drop-target");
            if (dropTarget) dropTarget.textContent = 'Drop results here';

            this.showResults();
        };
        reader.readAsText(file);
        document.title = "File: " + reader.filename;
    }

    handleResultsFileA(fileOrInput) {
        const file = fileOrInput instanceof File ? fileOrInput : fileOrInput.files[0];
        if (!file)
            return;

        const reader = new FileReader();
        reader.filename = file.name;
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.baselineFileData = data;
                
                const indicator = document.getElementById("file-indicator-a");
                indicator.textContent = file.name;
                indicator.classList.add("loaded");
                
                const dropTarget = document.getElementById("drop-target-a");
                if (dropTarget) {
                    const innerDZ = dropTarget.querySelector(".drop-zone");
                    if (innerDZ) innerDZ.textContent = 'Baseline A Loaded';
                }
                
                this.updateCompareButtonState();
            } catch (err) {
                alert("Failed to parse JSON file A: " + err.message);
                const dropTarget = document.getElementById("drop-target-a");
                if (dropTarget) {
                    const innerDZ = dropTarget.querySelector(".drop-zone");
                    if (innerDZ) innerDZ.textContent = 'Drop Baseline A here';
                }
            }
        };
        reader.readAsText(file);
    }

    handleResultsFileB(fileOrInput) {
        const file = fileOrInput instanceof File ? fileOrInput : fileOrInput.files[0];
        if (!file)
            return;

        const reader = new FileReader();
        reader.filename = file.name;
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.comparisonFileData = data;
                
                const indicator = document.getElementById("file-indicator-b");
                indicator.textContent = file.name;
                indicator.classList.add("loaded");
                
                const dropTarget = document.getElementById("drop-target-b");
                if (dropTarget) {
                    const innerDZ = dropTarget.querySelector(".drop-zone");
                    if (innerDZ) innerDZ.textContent = 'Comparison B Loaded';
                }
                
                this.updateCompareButtonState();
            } catch (err) {
                alert("Failed to parse JSON file B: " + err.message);
                const dropTarget = document.getElementById("drop-target-b");
                if (dropTarget) {
                    const innerDZ = dropTarget.querySelector(".drop-zone");
                    if (innerDZ) innerDZ.textContent = 'Drop Comparison B here';
                }
            }
        };
        reader.readAsText(file);
    }

    updateCompareButtonState()
    {
        const btn = document.getElementById("compare-btn");
        if (btn) {
            if (this.baselineFileData && this.comparisonFileData) {
                btn.classList.remove("disabled");
                btn.disabled = false;
            } else {
                btn.classList.add("disabled");
                btn.disabled = true;
            }
        }
    }

    triggerComparison()
    {
        if (!this.baselineFileData || !this.comparisonFileData)
            return;
        
        this.isComparisonMode = true;
        
        // Construct baseline ScoreCalculator (Run A)
        const resultsA = (this.baselineFileData['debugOutput'] instanceof Array) ?
            RunData.resultsDataFromBenchmarkRunnerData(this.baselineFileData['debugOutput']) :
            RunData.resultsDataFromSingleRunData(this.baselineFileData);
            
        this.comparisonCalculatorA = new ScoreCalculator(resultsA);

        // Construct comparison ScoreCalculator (Run B)
        const resultsB = (this.comparisonFileData['debugOutput'] instanceof Array) ?
            RunData.resultsDataFromBenchmarkRunnerData(this.comparisonFileData['debugOutput']) :
            RunData.resultsDataFromSingleRunData(this.comparisonFileData);
            
        this.comparisonCalculatorB = new ScoreCalculator(resultsB);

        // Ensure runner client has correct configuration (fall back to Run B parameters)
        this.ensureRunnerClient([], {});
        this.runnerClient.scoreCalculator = this.comparisonCalculatorB;

        // Reset file drops displays securely
        const dropA = document.getElementById("drop-target-a");
        if (dropA) {
            const innerDZ = dropA.querySelector(".drop-zone");
            if (innerDZ) innerDZ.textContent = 'Drop Baseline A here';
        }
        const dropB = document.getElementById("drop-target-b");
        if (dropB) {
            const innerDZ = dropB.querySelector(".drop-zone");
            if (innerDZ) innerDZ.textContent = 'Drop Comparison B here';
        }

        // Show comparison results tables and score badge!
        this.showComparisonResults();
    }

    clearComparison()
    {
        this.baselineFileData = null;
        this.comparisonFileData = null;
        
        const indicatorA = document.getElementById("file-indicator-a");
        if (indicatorA) {
            indicatorA.textContent = "No file loaded";
            indicatorA.classList.remove("loaded");
        }

        const indicatorB = document.getElementById("file-indicator-b");
        if (indicatorB) {
            indicatorB.textContent = "No file loaded";
            indicatorB.classList.remove("loaded");
        }

        const dropA = document.getElementById("drop-target-a");
        if (dropA) {
            const innerDZ = dropA.querySelector(".drop-zone");
            if (innerDZ) innerDZ.textContent = 'Drop Baseline A here';
        }
        const dropB = document.getElementById("drop-target-b");
        if (dropB) {
            const innerDZ = dropB.querySelector(".drop-zone");
            if (innerDZ) innerDZ.textContent = 'Drop Comparison B here';
        }
        
        this.updateCompareButtonState();
    }

    showComparisonResults()
    {
        if (!this.addedKeyEvent) {
            document.addEventListener("keypress", this.handleKeyPress, false);
            this.addedKeyEvent = true;
        }

        const calcA = this.comparisonCalculatorA;
        const calcB = this.comparisonCalculatorB;

        const scoreA = calcA.score;
        const scoreB = calcB.score;
        const diff = scoreB - scoreA;
        const percent = (diff / scoreA) * 100;
        const percentStr = (percent >= 0 ? "+" : "") + percent.toFixed(2) + "%";
        const badgeClass = percent >= 0 ? "comp-badge-better" : "comp-badge-worse";

        // Version comparison string
        const versionStr = `Baseline A (v${calcA.version}) vs Comparison B (v${calcB.version})`;
        sectionsManager.setSectionVersion("results", versionStr);

        // Customize score display for comparison (XSS-safe DOM builder)
        const scoreElement = document.querySelector("#results .score");
        if (scoreElement) {
            scoreElement.replaceChildren();
            const badge = document.createElement("span");
            badge.className = `comparison-badge ${badgeClass}`;
            badge.textContent = percentStr;
            scoreElement.appendChild(badge);
        }
        
        // Customize confidence/metric displays (XSS-safe DOM builder)
        const confidenceElement = document.querySelector("#results .confidence");
        if (confidenceElement) {
            confidenceElement.replaceChildren();
            
            const rowDiv = document.createElement("div");
            rowDiv.className = "comparison-details-row";
            
            const createSpan = (labelText, scoreVal) => {
                const span = document.createElement("span");
                span.textContent = labelText + ": ";
                const strong = document.createElement("strong");
                strong.textContent = scoreVal;
                span.appendChild(strong);
                return span;
            };
            
            const createSeparator = () => {
                const sep = document.createElement("span");
                sep.className = "separator";
                sep.textContent = "|";
                return sep;
            };
            
            rowDiv.appendChild(createSpan("Baseline (A)", scoreA.toFixed(2)));
            rowDiv.appendChild(createSeparator());
            rowDiv.appendChild(createSpan("Comparison (B)", scoreB.toFixed(2)));
            rowDiv.appendChild(createSeparator());
            rowDiv.appendChild(createSpan("Change", (diff >= 0 ? "+" : "") + diff.toFixed(2)));
            
            confidenceElement.appendChild(rowDiv);
        }

        // Hide score profile in comparison view
        const resultsScoreProfileSelector = document.getElementById("results-score-profile");
        if (resultsScoreProfileSelector)
            resultsScoreProfileSelector.style.display = "none";

        // Populate comparison tables!
        const compHeaderTable = new ComparisonResultsTable(
            document.getElementById("results-header"),
            Headers.testName,
            calcA,
            calcB
        );
        compHeaderTable.showIterations();

        const compScoreTable = new ComparisonResultsTable(
            document.getElementById("results-score"),
            Headers.comparisonScore,
            calcA,
            calcB
        );
        compScoreTable.showIterations();

        const compDataTable = new ComparisonResultsTable(
            document.getElementById("results-data"),
            Headers.comparisonDetails,
            calcA,
            calcB
        );
        compDataTable.showIterations();

        sectionsManager.showSection("results", true);
        document.title = "Comparison: A vs B";
    }

    frameRateDeterminationComplete(targetFrameRate)
    {
        let frameRateLabelContent = Strings.text.usingFrameRate.replace("%s", targetFrameRate);

        if (!targetFrameRate) {
            frameRateLabelContent = Strings.text.frameRateDetectionFailure;
            targetFrameRate = 60;
        }

        const frD = document.getElementById("frame-rate-detection");
        if (frD) frD.textContent = frameRateLabelContent;
        
        const sysFr = document.getElementById("system-frame-rate");
        if (sysFr) sysFr.value = targetFrameRate;
        
        const fr = document.getElementById("frame-rate");
        if (fr) fr.value = targetFrameRate;

        this.frameRateDetectionComplete = true;
        this.updateStartButtonState();
    }

    updateStartButtonState()
    {
        var startButton = document.getElementById("start-button");
        if (!startButton) return;
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
        if (this.isComparisonMode) {
            this.showComparisonResults();
            return;
        }

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

        const resultsScoreProfileSelector = document.getElementById("results-score-profile");
        if (resultsScoreProfileSelector)
            resultsScoreProfileSelector.value = scoreCalculator.scoreProfile;

        const graphScoreProfileSelector = document.getElementById("graph-score-profile");
        if (graphScoreProfileSelector)
            graphScoreProfileSelector.value = scoreCalculator.scoreProfile;

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
        this._currentGraphParams = {
            testName: testName,
            testResult: testResult,
            testData: testData,
            isComparison: false
        };
        sectionsManager.setSectionHeader("test-graph", testName);
        sectionsManager.showSection("test-graph", true);
        this.graphController.isComparisonMode = false;
        this.graphController.restoreOriginalNav();

        const graphScoreProfileSelector = document.getElementById("graph-score-profile");
        if (graphScoreProfileSelector)
            graphScoreProfileSelector.parentNode.style.display = "block";

        this.graphController.updateGraphData(testResult, testData, this.runnerClient.scoreCalculator.options);
    }

    showComparisonGraph(testName, testResultA, testResultB, testDataA, testDataB)
    {
        this._currentGraphParams = {
            testName: testName,
            testResultA: testResultA,
            testResultB: testResultB,
            testDataA: testDataA,
            testDataB: testDataB,
            isComparison: true
        };
        
        sectionsManager.setSectionHeader("test-graph", "Compare: " + testName);
        sectionsManager.showSection("test-graph", true);
        
        // Hide score profile selection in comparison graph mode
        const graphScoreProfileSelector = document.getElementById("graph-score-profile");
        if (graphScoreProfileSelector)
            graphScoreProfileSelector.parentNode.style.display = "none";

        this.graphController.updateComparisonGraphData(
            testName,
            testResultA,
            testResultB,
            testDataA,
            testDataB,
            this.comparisonCalculatorA.options,
            this.comparisonCalculatorB.options
        );
    }

    reloadCurrentGraph() {
        if (!this._currentGraphParams)
            return;

        if (this._currentGraphParams.isComparison) {
            this.showComparisonGraph(
                this._currentGraphParams.testName,
                this._currentGraphParams.testResultA,
                this._currentGraphParams.testResultB,
                this._currentGraphParams.testDataA,
                this._currentGraphParams.testDataB
            );
            return;
        }

        const scoreCalculator = this.runnerClient.scoreCalculator;
        const testData = this._currentGraphParams.testData;
        const testName = this._currentGraphParams.testName;

        // find the updated testResult from scoreCalculator
        let updatedTestResult = null;
        scoreCalculator.results.forEach(iteration => {
            for (let suiteName in iteration[Strings.json.results.tests]) {
                const suite = iteration[Strings.json.results.tests][suiteName];
                if (suite[testName]) {
                    updatedTestResult = suite[testName];
                    return;
                }
            }
        });

        if (updatedTestResult) {
            this._currentGraphParams.testResult = updatedTestResult;
            this.showTestGraph(testName, updatedTestResult, testData);
        }
    }
}

window.benchmarkControllerClass = DebugBenchmarkController;
window.benchmarkRunnerClientClass = DebugBenchmarkRunnerClient;
window.sectionsManagerClass = DebugSectionsManager;

