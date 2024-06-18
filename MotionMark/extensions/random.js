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

    static resetRandomSeed() {
        Pseudo.randomSeed = Pseudo.initialRandomSeed;
    }

    static random() {
        var randomSeed = Pseudo.randomSeed;
        randomSeed = ((randomSeed + 0x7ed55d16) + (randomSeed <<  12)) & 0xffffffff;
        randomSeed = ((randomSeed ^ 0xc761c23c) ^ (randomSeed >>> 19)) & 0xffffffff;
        randomSeed = ((randomSeed + 0x165667b1) + (randomSeed <<   5)) & 0xffffffff;
        randomSeed = ((randomSeed + 0xd3a2646c) ^ (randomSeed <<   9)) & 0xffffffff;
        randomSeed = ((randomSeed + 0xfd7046c5) + (randomSeed <<   3)) & 0xffffffff;
        randomSeed = ((randomSeed ^ 0xb55a4f09) ^ (randomSeed >>> 16)) & 0xffffffff;
        Pseudo.randomSeed = randomSeed;
        return (randomSeed & 0xfffffff) / 0x10000000;
    }
}

class Random {
	static number(min, max) {
        return (Pseudo.random() * (max - min)) + min;
    }

    static bool()
    {
        return !!Math.round(Pseudo.random());
    }

	static integer(min, max) {
		return Math.floor(Random.number(min, max + 1));
	}

    static angle()
    {
        return Random.number(0, Math.PI * 2);
    }

    static rotator(min, max) {
        return new Rotator(Random.number(min, max));
    }

	static itemInArray(array) {
    	return array[Random.integer(0, array.length - 1)];;
  	}

    static dateCounterValue(factor)
    {
        // Returns an increasing value slowed down by factor
        return Date.now() / factor;
    }

    static dateFractionalValue(cycleLengthMs)
    {
        // Returns a fractional value that wraps around within [0,1]
        return (Date.now() / (cycleLengthMs || 2000)) % 1;
    }
}
