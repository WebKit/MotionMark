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

class Regression {
    segment1;
    segment2;

    constructor(points) {
        this.segment1 = {
            s: 0,
            t: 0,
            e: Number.MAX_VALUE
        };

        this.segment2 = {
            s: 0,
            t: 0,
            e: Number.MAX_VALUE
        };

        this.calculateRegression(points);
    }

    setOptimal(segment1, segment2) {
        if (segment1.e + segment2.e > this.segment1.e + this.segment2.e)
            return false;

        this.segment1 = segment1;
        this.segment2 = segment2;
        return true;
    }

    calculateRegression(points) {
        let a1 = 0, b1 = 0, c1 = 0, d1 = 0, h1 = 0, k1 = 0;
        let a2 = 0, b2 = 0, c2 = 0, d2 = 0, h2 = 0, k2 = 0;

        for (var j = 0; j < points.length; ++j) {
            let x = points[j].x;
            let y = points[j].y;

            a2 += 1;
            b2 += x;
            c2 += x * x;
            d2 += y;
            h2 += x * y;
            k2 += y * y;
        }

        for (let j = 0; j < points.length - 1; ++j) {
            let x = points[j].x;
            let y = points[j].y;
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

            if (j == 0) {
                // Let segment1 be any line through (x0, y0) which meets segment2 at
                // a point (x’, y’) where x[0] < x' < x[1]. segment1 has no error.
                let xMid = (x + points[j + 1].x) / 2;
                let yMid = s2 + t2 * xMid;
                let tMid = (yMid - y) / (xMid - x);
                segment1 = {
                    s: y - tMid * x,
                    t: tMid,
                    e: 0
                };
            } else {
                segment1 = {
                    s: s1,
                    t: t1,
                    e: k1 + (a1 * s1 * s1) + (c1 * t1 * t1) - (2 * d1 * s1) - (2 * h1 * t1) + (2 * b1 * s1 * t1)
                };
            }

            if (j == points.length - 2) {
                // Let segment2 be any line through (x[n - 1], y[n - 1]) which meets segment1
                // at a point (x’, y’) where x[n - 2] < x' < x[n - 1]. segment2 has no error.
                let xMid = (x + points[j + 1].x) / 2;
                let yMid = s1 + t1 * xMid;
                let tMid = (yMid - points[j + 1].y) / (xMid - points[j + 1].x);
                segment2 = {
                    s: y - tMid * x,
                    t: tMid,
                    e: 0
                };
            } else {
                segment2 = {
                    s: s2,
                    t: t2,
                    e: k2 + (a2 * s2 * s2) + (c2 * t2 * t2) - (2 * d2 * s2) - (2 * h2 * t2) + (2 * b2 * s2 * t2)
                };
            }

            if (this.setOptimal(segment1, segment2))
                continue

            let G = A + B * x - C * y;
            let H = D + E * x - F * y;

            let I = c1 - 2 * b1 * x + a1 * xx;
            let K = c2 - 2 * b2 * x + a2 * xx;

            let lambda = (G * F + G * K - H * C) / (I * H + G * K);
            if (!(lambda > 0 && lambda < 1))
                continue;

            let lambda1 = 1 - lambda;

            segment1 = {
                s: (A + lambda  * (-h1 * x + d1 * xx + c1 * y - b1 * xy)) / (C - lambda * I),
                t: (B + lambda  * (h1 - d1 * x - b1 * y + a1 * xy)) / (C - lambda * I),
                e: (k1 + a1 * s1 * s1 + c1 * t1 * t1 - 2 * d1 * s1 - 2 * h1 * t1 + 2 * b1 * s1 * t1) - lambda * Math.pow(y - (s1 + t1 * x), 2)
            };

            segment2 = {
                s: (D + lambda1 * (-h2 * x + d2 * xx + c2 * y - b2 * xy)) / (F + lambda1 * K),
                t: (E + lambda1 * (h2 - d2 * x - b2 * y + a2 * xy)) / (F + lambda1 * K),
                e: (k2 + a2 * s2 * s2 + c2 * t2 * t2 - 2 * d2 * s2 - 2 * h2 * t2 + 2 * b2 * s2 * t2) + lambda1 * Math.pow(y - (s2 + t2 * x), 2)
            };

            this.setOptimal(segment1, segment2);
        }
    }

    get score() {
        // The score is the x coordinate of the intersection of segment1 and segment2.
        return (this.segment1.s - this.segment2.s) / (this.segment2.t - this.segment1.t);
    }

    get error() {
        return this.segment1.e + this.segment2.e;
    }
}
