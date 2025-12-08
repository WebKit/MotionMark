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

class RunData {
    constructor(version, options, runs = [])
    {
        this.version = version;
        this.options = options;
        this.runs = runs;
    }
    
    static resultsDataFromSingleRunData(singleRunData)
    {
        RunData.#migrateImportedData(singleRunData);
        
        if (!singleRunData.data instanceof Array) {
            console.error('Imported singleRunData.data is not an array. Bailing');
            return null;
        }
        
        return new RunData(singleRunData.version, singleRunData.options, singleRunData.data);
    }

    static resultsDataFromBenchmarkRunnerData(benchmarkData)
    {
        if (!benchmarkData instanceof Array) {
            console.log('Imported benchmarkData is not an array. Bailing');
            return null;
        }
        
        const runData = [];
        for (const run of benchmarkData) {
            RunData.#migrateImportedData(run);
            if (run.data.length !== 1) {
                console.error('Imported benchmarkData has a "data" array with an unexpected number of items. Bailing');
                return null;
            }
        
            runData.push(run.data[0]);
        }
        
        // Version and options data should be these same for each run. Use the first run's information.
        return new RunData(benchmarkData[0].version, benchmarkData[0].options, runData);
    }
    
    static #migrateImportedData(options)
    {
        if (!("version" in options))
            options.version = "1.0";
        
        if (!("frame-rate" in options)) {
            options.options["frame-rate"] = 60;
            console.log("No frame-rate data; assuming 60fps")
        }

        if (!("system-frame-rate" in options)) {
            options.options["system-frame-rate"] = 60;
            console.log("No system-frame-rate data; assuming 60fps")
        }
    }
}

class ScoreCalculator {
    constructor(runData)
    {
        this._runData = runData;
        this._results = null;
        this._targetFrameRate = runData.options["frame-rate"];
        this._systemFrameRate = runData.options["system-frame-rate"];

        const defaultBootstrapIterations = 2500;
        if (!Object.hasOwn(this._runData.options, Strings.json.bootstrapIterations))
            this._runData.options[Strings.json.bootstrapIterations] = defaultBootstrapIterations;
        
        if (this._runData.runs.length > 0)
            this._processData();
    }
    
    get targetFrameRate()
    {
        return this._targetFrameRate;
    }

    push(suitesSamplers)
    {
        this._runData.runs.push(suitesSamplers);
    }

    _processData()
    {
        this._results = {};
        this._results[Strings.json.results.iterations] = [];

        var iterationsScores = [];
        this._runData.runs.forEach(function(iteration, index) {
            var testsScores = [];
            var testsLowerBoundScores = [];
            var testsUpperBoundScores = [];

            var result = {};
            this._results[Strings.json.results.iterations][index] = result;

            var suitesResult = {};
            result[Strings.json.results.tests] = suitesResult;

            for (var suiteName in iteration) {
                var suiteData = iteration[suiteName];

                var suiteResult = {};
                suitesResult[suiteName] = suiteResult;

                for (var testName in suiteData) {
                    if (!suiteData[testName][Strings.json.result])
                        this.calculateScore(suiteData[testName]);

                    suiteResult[testName] = suiteData[testName][Strings.json.result];
                    delete suiteData[testName][Strings.json.result];

                    testsScores.push(suiteResult[testName][Strings.json.score]);
                    testsLowerBoundScores.push(suiteResult[testName][Strings.json.scoreLowerBound]);
                    testsUpperBoundScores.push(suiteResult[testName][Strings.json.scoreUpperBound]);
                }
            }

            result[Strings.json.score] = Statistics.geometricMean(testsScores);
            result[Strings.json.scoreLowerBound] = Statistics.geometricMean(testsLowerBoundScores);
            result[Strings.json.scoreUpperBound] = Statistics.geometricMean(testsUpperBoundScores);
            iterationsScores.push(result[Strings.json.score]);
        }, this);

        this._results[Strings.json.version] = this._runData.version;
        this._results[Strings.json.fps] = this._targetFrameRate;
        this._results[Strings.json.score] = Statistics.sampleMean(iterationsScores.length, iterationsScores.reduce(function(a, b) { return a + b; }));
        this._results[Strings.json.scoreLowerBound] = this._results[Strings.json.results.iterations][0][Strings.json.scoreLowerBound];
        this._results[Strings.json.scoreUpperBound] = this._results[Strings.json.results.iterations][0][Strings.json.scoreUpperBound];
    }

    calculateScore(data)
    {
        const result = {};
        data[Strings.json.result] = result;
        const samples = data[Strings.json.samples];
        const desiredFrameLength = 1000 / this._targetFrameRate;
        const complexityKey = Strings.json.complexity;

        function findRegression(series, profile) {
            const minIndex = Math.round(.025 * series.length);
            const maxIndex = Math.round(.975 * (series.length - 1));
            const minComplexity = series.getFieldInDatum(minIndex, complexityKey);
            const maxComplexity = series.getFieldInDatum(maxIndex, complexityKey);

            if (Math.abs(maxComplexity - minComplexity) < 20 && maxIndex - minIndex < 20) {
                minIndex = 0;
                maxIndex = series.length - 1;
                minComplexity = series.getFieldInDatum(minIndex, complexityKey);
                maxComplexity = series.getFieldInDatum(maxIndex, complexityKey);
            }

            const frameTypeIndex = series.fieldMap[Strings.json.frameType];
            const complexityIndex = series.fieldMap[complexityKey];
            const frameLengthIndex = series.fieldMap[Strings.json.frameLength];
            const regressionOptions = { desiredFrameLength: desiredFrameLength };
            if (profile)
                regressionOptions.preferredProfile = profile;

            const regressionSamples = series.slice(minIndex, maxIndex + 1);
            const animationSamples = regressionSamples.data.filter((sample) => sample[frameTypeIndex] == Strings.json.animationFrameType);
            const regressionData = animationSamples.map((sample) => [ sample[complexityIndex], sample[frameLengthIndex] ]);

            const regression = new Regression(regressionData, minIndex, maxIndex, regressionOptions);
            return {
                minComplexity: minComplexity,
                maxComplexity: maxComplexity,
                samples: regressionSamples,
                regression: regression,
            };
        }

        // Convert these samples into SampleData objects if needed
        [complexityKey, Strings.json.controller].forEach(function(seriesName) {
            const series = samples[seriesName];
            if (series && !(series instanceof SampleData))
                samples[seriesName] = new SampleData(series.fieldMap, series.data);
        });

        const isRampController = this._runData.options[Strings.json.controller] == "ramp";
        let predominantProfile = "";
        if (isRampController) {
            var profiles = {};
            data[Strings.json.controller].forEach(function(regression) {
                if (regression[Strings.json.regressions.profile]) {
                    var profile = regression[Strings.json.regressions.profile];
                    profiles[profile] = (profiles[profile] || 0) + 1;
                }
            });

            var maxProfileCount = 0;
            for (var profile in profiles) {
                if (profiles[profile] > maxProfileCount) {
                    predominantProfile = profile;
                    maxProfileCount = profiles[profile];
                }
            }
        }

        const regressionResult = findRegression(samples[complexityKey], predominantProfile);
        const calculation = regressionResult.regression;
        result[complexityKey] = {};
        result[complexityKey][Strings.json.regressions.segment1] = [
            [regressionResult.minComplexity, calculation.s1 + calculation.t1 * regressionResult.minComplexity],
            [calculation.complexity, calculation.s1 + calculation.t1 * calculation.complexity]
        ];
        result[complexityKey][Strings.json.regressions.segment2] = [
            [calculation.complexity, calculation.s2 + calculation.t2 * calculation.complexity],
            [regressionResult.maxComplexity, calculation.s2 + calculation.t2 * regressionResult.maxComplexity]
        ];
        result[complexityKey][complexityKey] = calculation.complexity;
        result[complexityKey][Strings.json.measurements.stdev] = Math.sqrt(calculation.error / samples[complexityKey].length);

        result[Strings.json.fps] = data.targetFPS;

        if (isRampController) {
            const timeComplexity = new Experiment;
            data[Strings.json.controller].forEach(function(regression) {
                timeComplexity.sample(regression[complexityKey]);
            });

            const experimentResult = {};
            result[Strings.json.controller] = experimentResult;
            experimentResult[Strings.json.score] = timeComplexity.mean();
            experimentResult[Strings.json.measurements.average] = timeComplexity.mean();
            experimentResult[Strings.json.measurements.stdev] = timeComplexity.standardDeviation();
            experimentResult[Strings.json.measurements.percent] = timeComplexity.percentage();

            var frameTypeIndex = regressionResult.samples.fieldMap[Strings.json.frameType];
            var animationSamplesData = regressionResult.samples.data.filter(
                (sample) => sample[frameTypeIndex] == Strings.json.animationFrameType);
            const bootstrapIterations = this._runData.options[Strings.json.bootstrapIterations];
            const bootstrapResult = Regression.bootstrap(animationSamplesData, bootstrapIterations, function(resampleData) {
                const complexityIndex = regressionResult.samples.fieldMap[complexityKey];
                resampleData.sort(function(a, b) {
                    return a[complexityIndex] - b[complexityIndex];
                });

                const resample = new SampleData(regressionResult.samples.fieldMap, resampleData);
                const bootstrapRegressionResult = findRegression(resample, predominantProfile);
                if (bootstrapRegressionResult.regression.t2 < 0) {
                  // A positive slope means the frame rate decreased with increased complexity (which is the expected
                  // benavior). OTOH, a negative slope means the framerate increased as the complexity increased. This
                  // likely means the max complexity needs to be increased. None-the-less, if the slope is negative use
                  // the max-complexity as the computed complexity (intersection of the two lines) does not tell us
                  // the point when the browser could not handle the complexity, rather it tells us when the framerate
                  // increased.
                  return bootstrapRegressionResult.maxComplexity;
                }
                return bootstrapRegressionResult.regression.complexity;
            }, .8);

            result[complexityKey][Strings.json.bootstrap] = bootstrapResult;
            result[Strings.json.score] = bootstrapResult.median;
            result[Strings.json.scoreLowerBound] = bootstrapResult.confidenceLow;
            result[Strings.json.scoreUpperBound] = bootstrapResult.confidenceHigh;
        } else {
            const marks = data[Strings.json.marks];
            let samplingStartIndex = 0, samplingEndIndex = -1;
            if (Strings.json.samplingStartTimeOffset in marks)
                samplingStartIndex = marks[Strings.json.samplingStartTimeOffset].index;
            if (Strings.json.samplingEndTimeOffset in marks)
                samplingEndIndex = marks[Strings.json.samplingEndTimeOffset].index;

            const averageComplexity = new Experiment;
            const averageFrameLength = new Experiment;
            const controllerSamples = samples[Strings.json.controller];
            controllerSamples.forEach(function (sample, i) {
                if (i >= samplingStartIndex && (samplingEndIndex == -1 || i < samplingEndIndex)) {
                    averageComplexity.sample(controllerSamples.getFieldInDatum(sample, complexityKey));
                    var smoothedFrameLength = controllerSamples.getFieldInDatum(sample, Strings.json.smoothedFrameLength);
                    if (smoothedFrameLength && smoothedFrameLength != -1)
                        averageFrameLength.sample(smoothedFrameLength);
                }
            });

            var experimentResult = {};
            result[Strings.json.controller] = experimentResult;
            experimentResult[Strings.json.measurements.average] = averageComplexity.mean();
            experimentResult[Strings.json.measurements.concern] = averageComplexity.concern(Experiment.DEFAULT_CONCERN);
            experimentResult[Strings.json.measurements.stdev] = averageComplexity.standardDeviation();
            experimentResult[Strings.json.measurements.percent] = averageComplexity.percentage();

            experimentResult = {};
            result[Strings.json.frameLength] = experimentResult;
            experimentResult[Strings.json.measurements.average] = 1000 / averageFrameLength.mean();
            experimentResult[Strings.json.measurements.concern] = averageFrameLength.concern(Experiment.DEFAULT_CONCERN);
            experimentResult[Strings.json.measurements.stdev] = averageFrameLength.standardDeviation();
            experimentResult[Strings.json.measurements.percent] = averageFrameLength.percentage();

            result[Strings.json.score] = averageComplexity.score(Experiment.DEFAULT_CONCERN);
            result[Strings.json.scoreLowerBound] = result[Strings.json.score] - averageFrameLength.standardDeviation();
            result[Strings.json.scoreUpperBound] = result[Strings.json.score] + averageFrameLength.standardDeviation();
        }
    }

    get data()
    {
        return this._runData.runs;
    }

    get results()
    {
        if (this._results)
            return this._results[Strings.json.results.iterations];
        this._processData();
        return this._results[Strings.json.results.iterations];
    }

    get options()
    {
        return this._runData.options;
    }

    get version()
    {
        return this._runData.version;
    }

    _getResultsProperty(property)
    {
        if (this._results)
            return this._results[property];
        this._processData();
        return this._results[property];
    }

    get score()
    {
        return this._getResultsProperty(Strings.json.score);
    }

    get scoreLowerBound()
    {
        return this._getResultsProperty(Strings.json.scoreLowerBound);
    }

    get scoreUpperBound()
    {
        return this._getResultsProperty(Strings.json.scoreUpperBound);
    }
}

class ResultsTable {
    constructor(element, headers)
    {
        this.element = element;
        this._headers = headers;

        this._flattenedHeaders = [];
        this._headers.forEach(function(header) {
            if (header.disabled)
                return;

            if (header.children)
                this._flattenedHeaders = this._flattenedHeaders.concat(header.children);
            else
                this._flattenedHeaders.push(header);
        }, this);

        this._flattenedHeaders = this._flattenedHeaders.filter(function (header) {
            return !header.disabled;
        });

        this.clear();
    }

    clear()
    {
        this.element.textContent = "";
    }

    _addHeader()
    {
        const thead = Utilities.createElement("thead", {}, this.element);
        const row = Utilities.createElement("tr", {}, thead);

        this._headers.forEach(function (header) {
            if (header.disabled)
                return;

            const th = Utilities.createElement("th", {}, row);
            if (header.title != Strings.text.graph)
                th.innerHTML = header.title;
            if (header.children)
                th.colSpan = header.children.length;
        });
    }

    _addBody()
    {
        this.tbody = Utilities.createElement("tbody", {}, this.element);
    }

    _addEmptyRow()
    {
        const row = Utilities.createElement("tr", {}, this.tbody);
        this._flattenedHeaders.forEach(function (header) {
            return Utilities.createElement("td", { class: "suites-separator" }, row);
        });
    }

    _addTest(testName, testResult, options)
    {
        const row = Utilities.createElement("tr", {}, this.tbody);

        this._flattenedHeaders.forEach(function (header) {
            const td = Utilities.createElement("td", {}, row);
            if (header.text == Strings.text.testName) {
                td.textContent = testName;
            } else if (typeof header.text == "string") {
                var data = testResult[header.text];
                if (typeof data == "number")
                    data = data.toFixed(2);
                td.innerHTML = data;
            } else
                td.innerHTML = header.text(testResult);
        }, this);
    }

    _addIteration(iterationResult, iterationData, options)
    {
        const testsResults = iterationResult[Strings.json.results.tests];
        for (const suiteName in testsResults) {
            this._addEmptyRow();
            const suiteResult = testsResults[suiteName];
            const suiteData = iterationData[suiteName];
            for (let testName in suiteResult)
                this._addTest(testName, suiteResult[testName], options, suiteData[testName]);
        }
    }

    showIterations(scoreCalculator)
    {
        this.clear();
        this._addHeader();
        this._addBody();

        const iterationsResults = scoreCalculator.results;
        iterationsResults.forEach(function(iterationResult, index) {
            this._addIteration(iterationResult, scoreCalculator.data[index], scoreCalculator.options);
        }, this);
    }
}
