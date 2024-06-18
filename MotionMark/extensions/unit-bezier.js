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

class UnitBezier {
	static epsilon = 1e-5;
    static derivativeEpsilon = 1e-6;

	a;
	b;
	c;

	constructor(point1, point2) {
        // First and last points in the Bézier curve are assumed to be (0,0) and (!,1)
        this.c = point1.scaled(3);

        this.b = point2.scaled(3);
        this.b.subtract(this.c.scaled(2));

        this.a = new Point(1, 1);
        this.a.subtract(this.c)
        this.a.subtract(this.b);
	}

    sampleX(t) {
        return ((this.a.x * t + this.b.x) * t + this.c.x) * t;
    }

    sampleY(t) {
        return ((this.a.y * t + this.b.y) * t + this.c.y) * t;
    }

    sampleDerivativeX(t) {
        return(3 * this.a.x * t + 2 * this.b.x) * t + this.c.x;
    }

    solveForT(x) {
        var t0, t1, t2, x2, d2, i;

        for (t2 = x, i = 0; i < 8; ++i) {
            x2 = this.sampleX(t2) - x;
            if (Math.abs(x2) < UnitBezier.epsilon)
                return t2;
            d2 = this.sampleDerivativeX(t2);
            if (Math.abs(d2) < UnitBezier.derivativeEpsilon)
                break;
            t2 = t2 - x2 / d2;
        }

        t0 = 0;
        t1 = 1;
        t2 = x;

        if (t2 < t0)
            return t0;
        if (t2 > t1)
            return t1;

        while (t0 < t1) {
            x2 = this.sampleX(t2);
            if (Math.abs(x2 - x) < UnitBezier.epsilon)
                return t2;
            if (x > x2)
                t0 = t2;
            else
                t1 = t2;
            t2 = (t1 - t0) * .5 + t0;
        }

        return t2;
    }

    solve(x) {
        return this.sampleY(this.solveForT(x));
    }
}
