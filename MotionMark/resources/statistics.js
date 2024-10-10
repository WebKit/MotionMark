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

class Pseudo {
    static initialRandomSeed = 49734321;
    static randomSeed = 49734321;

    static resetRandomSeed()
    {
        Pseudo.randomSeed = Pseudo.initialRandomSeed;
    }

    static random()
    {
        var randomSeed = Pseudo.randomSeed;
        randomSeed = ((randomSeed + 0x7ed55d16) + (randomSeed << 12))  & 0xffffffff;
        randomSeed = ((randomSeed ^ 0xc761c23c) ^ (randomSeed >>> 19)) & 0xffffffff;
        randomSeed = ((randomSeed + 0x165667b1) + (randomSeed << 5))   & 0xffffffff;
        randomSeed = ((randomSeed + 0xd3a2646c) ^ (randomSeed << 9))   & 0xffffffff;
        randomSeed = ((randomSeed + 0xfd7046c5) + (randomSeed << 3))   & 0xffffffff;
        randomSeed = ((randomSeed ^ 0xb55a4f09) ^ (randomSeed >>> 16)) & 0xffffffff;
        Pseudo.randomSeed = randomSeed;
        return (randomSeed & 0xfffffff) / 0x10000000;
    }
}

class Statistics {
    static sampleMean(numberOfSamples, sum)
    {
        if (numberOfSamples < 1)
            return 0;
        return sum / numberOfSamples;
    }

    // With sum and sum of squares, we can compute the sample standard deviation in O(1).
    // See https://rniwa.com/2012-11-10/sample-standard-deviation-in-terms-of-sum-and-square-sum-of-samples/
    static unbiasedSampleStandardDeviation(numberOfSamples, sum, squareSum)
    {
        if (numberOfSamples < 2)
            return 0;
        return Math.sqrt((squareSum - sum * sum / numberOfSamples) / (numberOfSamples - 1));
    }

    static geometricMean(values)
    {
        if (!values.length)
            return 0;
        var roots = values.map(function(value) { return Math.pow(value, 1 / values.length); })
        return roots.reduce(function(a, b) { return a * b; });
    }

    // Cumulative distribution function
    static cdf(value, mean, standardDeviation)
    {
        return 0.5 * (1 + Statistics.erf((value - mean) / (Math.sqrt(2 * standardDeviation * standardDeviation))));
    }

    // Approximation of Gauss error function, Abramowitz and Stegun 7.1.26
    static erf(value)
    {
          var sign = (value >= 0) ? 1 : -1;
          value = Math.abs(value);

          var a1 = 0.254829592;
          var a2 = -0.284496736;
          var a3 = 1.421413741;
          var a4 = -1.453152027;
          var a5 = 1.061405429;
          var p = 0.3275911;

          var t = 1.0 / (1.0 + p * value);
          var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-value * value);
          return sign * y;
    }

    static largestDeviationPercentage(low, mean, high)
    {
        return Math.max(Math.abs(low / mean - 1), (high / mean - 1));
    }
}

class Experiment {
    static DEFAULT_CONCERN = 5;
    static DEFAULT_CONCERN_SIZE = 100;

    constructor(includeConcern)
    {
        if (includeConcern)
            this._maxHeap = Heap.createMaxHeap(Experiment.DEFAULT_CONCERN_SIZE);
        this.reset();
    }

    reset()
    {
        this._sum = 0;
        this._squareSum = 0;
        this._numberOfSamples = 0;
        if (this._maxHeap)
            this._maxHeap.init();
    }

    get sampleCount()
    {
        return this._numberOfSamples;
    }

    sample(value)
    {
        this._sum += value;
        this._squareSum += value * value;
        if (this._maxHeap)
            this._maxHeap.push(value);
        ++this._numberOfSamples;
    }

    mean()
    {
        return Statistics.sampleMean(this._numberOfSamples, this._sum);
    }

    standardDeviation()
    {
        return Statistics.unbiasedSampleStandardDeviation(this._numberOfSamples, this._sum, this._squareSum);
    }

    cdf(value)
    {
        return Statistics.cdf(value, this.mean(), this.standardDeviation());
    }

    percentage()
    {
        var mean = this.mean();
        return mean ? this.standardDeviation() * 100 / mean : 0;
    }

    concern(percentage)
    {
        if (!this._maxHeap)
            return this.mean();

        var size = Math.ceil(this._numberOfSamples * percentage / 100);
        var values = this._maxHeap.values(size);
        return values.length ? values.reduce(function(a, b) { return a + b; }) / values.length : 0;
    }

    score(percentage)
    {
        return Statistics.geometricMean([this.mean(), Math.max(this.concern(percentage), 1)]);
    }
}

class Regression {
    // `samples` is [ [ complexity, frameLength ], [ complexity, frameLength ], ... ]
    // All samples are analyzed. startIndex, endIndex are just stored for use by the caller.
    constructor(samples, startIndex, endIndex, options)
    {
        this.startIndex = Math.min(startIndex, endIndex);
        this.endIndex = Math.max(startIndex, endIndex);

        this.s1 = 0;
        this.t1 = 0;
        this.n1 = 0;
        this.e1 = Number.MAX_VALUE;

        this.s2 = 0;
        this.t2 = 0;
        this.n2 = 0;
        this.e2 = Number.MAX_VALUE;

        this.complexity = 0;

        if (options.preferredProfile == Strings.json.profiles.flat) {
            this._calculateRegression(samples, {
                s1: options.desiredFrameLength,
                t1: 0,
                t2: 0
            });
            this.profile = Strings.json.profiles.flat;
        } else {
             this._calculateRegression(samples, {
                s1: options.desiredFrameLength,
                t1: 0
            });
            this.profile = Strings.json.profiles.slope;
        }

        this.stdev1 = Math.sqrt(this.e1 / this.n1);
        this.stdev2 = Math.sqrt(this.e2 / this.n2);
        this.error = this._error();
    }, {

    valueAt(complexity)
    {
        if (this.n1 == 1 || complexity > this.complexity)
            return this.s2 + this.t2 * complexity;
        return this.s1 + this.t1 * complexity;
    }

    _intersection: function(segment1, segment2)
    {
        return (segment1.s - segment2.s) / (segment2.t - segment1.t);
    },

    _error: function() {
        return this.e1 + this.e2;
    },

    _areEssentiallyEqual: function(n1, n2) {
        // Choose epsilon not too small to ensure the intersetion
        // of the two segements is not too far from sampled data.
        const epsilon = 0.0001;
        return Math.abs(n1 - n2) < epsilon;
    },

    _setOptimal: function(segment1, segment2, x, xn, options) {
        if (segment1.e + segment2.e > this.e1 + this.e2)
            return false;

        segment1.s = options.s1 !== undefined ? options.s1 : segment1.s;
        segment1.t = options.t1 !== undefined ? options.t1 : segment1.t;
        segment2.s = options.s2 !== undefined ? options.s2 : segment2.s;
        segment2.t = options.t2 !== undefined ? options.t2 : segment2.t;

        // The score is the x coordinate of the intersection of segment1 and segment2.
        let complexity = this._intersection(segment1, segment2);

        if (!this._areEssentiallyEqual(segment1.t, segment2.t)) {
            // If segment1 and segment2 are not parallel, then they have to meet
            // at complexity such that x <= complexity <= xn.
            if (!(complexity >= x && complexity <= xn))
                return false;
        } else {
            // If segment1 and segment2 are parallel, then they have to form one
            // single line.
            if (!this._areEssentiallyEqual(segment1.s, segment2.s))
                return false;
        }

        this.s1 = segment1.s;
        this.t1 = segment1.t;
        this.n1 = segment1.n;
        this.e1 = segment1.e;

        this.s2 = segment2.s;
        this.t2 = segment2.t;
        this.n2 = segment2.n;
        this.e2 = segment2.e;

        this.complexity = complexity;
        return true;
    },

    // A generic two-segment piecewise regression calculator. Based on Kundu/Ubhaya
    //
    // Minimize sum of (y - y')^2
    // where                        y = s1 + t1*x
    //                              y = s2 + t2*x
    //                y' = s1 + t1*x' = s2 + t2*x'   if x_0 <= x' <= x_n
    //
    // Allows for fixing s1, t1, s2, t2
    //
    // x is assumed to be complexity, y is frame length. Can be used for pure complexity-FPS
    // analysis or for ramp controllers since complexity monotonically decreases with time.
    _calculateRegression(samples, options)
    {
        const complexityIndex = 0;
        const frameLengthIndex = 1;

        // Sort by increasing complexity.
        let sortedSamples = samples.slice().sort((a, b) => a[complexityIndex] - b[complexityIndex]);

        let a1 = 0, b1 = 0, c1 = 0, d1 = 0, h1 = 0, k1 = 0;
        let a2 = 0, b2 = 0, c2 = 0, d2 = 0, h2 = 0, k2 = 0;

        for (let j = 0; j < sortedSamples.length; ++j) {
            let x = sortedSamples[j][complexityIndex];
            let y = sortedSamples[j][frameLengthIndex];

            a2 += 1;
            b2 += x;
            c2 += x * x;
            d2 += y;
            h2 += x * y;
            k2 += y * y;
        }

        for (let j = 0; j < sortedSamples.length - 1; ++j) {
            let x = sortedSamples[j][complexityIndex];
            let y = sortedSamples[j][frameLengthIndex];
            let xx = x * x;
            let xy = x * y;
            let yy = y * y;

            a1 += 1;
            b1 += x;
            c1 += xx;
            d1 += y;
            h1 += xy;
            k1 += yy;

            a2 -= 1;
            b2 -= x;
            c2 -= xx;
            d2 -= y;
            h2 -= xy;
            k2 -= yy;

            let A = (c1 * d1) - (b1 * h1);
            let B = (a1 * h1) - (b1 * d1);
            let C = (a1 * c1) - (b1 * b1);
            let D = (c2 * d2) - (b2 * h2);
            let E = (a2 * h2) - (b2 * d2);
            let F = (a2 * c2) - (b2 * b2);

            let s1 = A / C;
            let t1 = B / C;
            let s2 = D / F;
            let t2 = E / F;

            if (C == 0 || F == 0)
                continue;

            let segment1;
            let segment2;
            let xp = (j == 0) ? 0 : sortedSamples[j - 1][complexityIndex];

            if (j == 0) {
                // Let segment1 be any line through (x[0], y[0]) which meets segment2 at
                // a point (x’, y’) where x[0] < x' < x[1]. segment1 has no error.
                let xMid = (x + sortedSamples[j + 1][complexityIndex]) / 2;
                let yMid = s2 + t2 * xMid;
                let tMid = (yMid - y) / (xMid - x);
                segment1 = {
                    s: y - tMid * x,
                    t: tMid,
                    n: 1,
                    e: 0
                };
            } else {
                segment1 = {
                    s: s1,
                    t: t1,
                    n: j + 1,
                    e: k1 + (a1 * s1 * s1) + (c1 * t1 * t1) - (2 * d1 * s1) - (2 * h1 * t1) + (2 * b1 * s1 * t1)
                };
            }

            if (j == sortedSamples.length - 2) {
                // Let segment2 be any line through (x[n - 1], y[n - 1]) which meets segment1
                // at a point (x’, y’) where x[n - 2] < x' < x[n - 1]. segment2 has no error.
                let xMid = (x + sortedSamples[j + 1][complexityIndex]) / 2;
                let yMid = s1 + t1 * xMid;
                let tMid = (yMid - sortedSamples[j + 1][frameLengthIndex]) / (xMid - sortedSamples[j + 1][complexityIndex]);
                segment2 = {
                    s: y - tMid * x,
                    t: tMid,
                    n: 1,
                    e: 0
                };
            } else {
                segment2 = {
                    s: s2,
                    t: t2,
                    n: sortedSamples.length - (j + 1),
                    e: k2 + (a2 * s2 * s2) + (c2 * t2 * t2) - (2 * d2 * s2) - (2 * h2 * t2) + (2 * b2 * s2 * t2)
                };
            }

            if (this._setOptimal(segment1, segment2, x, sortedSamples[j + 1][complexityIndex], options))
                continue

            // These values remove the influence of this sample
            let G = A + B * x - C * y;
            let J = D + E * x - F * y;

            let I = c1 - 2 * b1 * x + a1 * xx;
            let K = c2 - 2 * b2 * x + a2 * xx;

            // Calculate lambda, which divides the weight of this sample between the two lines
            let lambda = (G * F + G * K - J * C) / (I * J + G * K);
            if (!(lambda > 0 && lambda < 1))
                continue;

            let lambda1 = 1 - lambda;

            segment1 = {
                s: (A + lambda  * (-h1 * x + d1 * xx + c1 * y - b1 * xy)) / (C - lambda * I),
                t: (B + lambda  * (h1 - d1 * x - b1 * y + a1 * xy)) / (C - lambda * I),
                n: j + 1,
                e: (k1 + a1 * s1 * s1 + c1 * t1 * t1 - 2 * d1 * s1 - 2 * h1 * t1 + 2 * b1 * s1 * t1) - lambda * Math.pow(y - (s1 + t1 * x), 2)
            };

            segment2 = {
                s: (D + lambda1 * (-h2 * x + d2 * xx + c2 * y - b2 * xy)) / (F + lambda1 * K),
                t: (E + lambda1 * (h2 - d2 * x - b2 * y + a2 * xy)) / (F + lambda1 * K),
                n: sortedSamples.length - (j + 1),
                e: (k2 + a2 * s2 * s2 + c2 * t2 * t2 - 2 * d2 * s2 - 2 * h2 * t2 + 2 * b2 * s2 * t2) + lambda1 * Math.pow(y - (s2 + t2 * x), 2)
            };

            this._setOptimal(segment1, segment2, x, sortedSamples[j + 1][complexityIndex], options);
        }
    }

    static bootstrap(samples, iterationCount, processResample, confidencePercentage)
    {
        var sampleLength = samples.length;
        var resample = new Array(sampleLength);

        var bootstrapEstimator = new Experiment;
        var bootstrapData = new Array(iterationCount);

        Pseudo.resetRandomSeed();
        for (var i = 0; i < iterationCount; ++i) {
            for (var j = 0; j < sampleLength; ++j)
                resample[j] = samples[Math.floor(Pseudo.random() * sampleLength)];

            var resampleResult = processResample(resample);
            bootstrapEstimator.sample(resampleResult);
            bootstrapData[i] = resampleResult;
        }

        bootstrapData.sort(function(a, b) { return a - b; });
        return {
            confidenceLow: bootstrapData[Math.round((iterationCount - 1) * (1 - confidencePercentage) / 2)],
            confidenceHigh: bootstrapData[Math.round((iterationCount - 1) * (1 + confidencePercentage) / 2)],
            median: bootstrapData[Math.round(iterationCount / 2)],
            mean: bootstrapEstimator.mean(),
            data: bootstrapData,
            confidencePercentage: confidencePercentage
        };
    }
}
