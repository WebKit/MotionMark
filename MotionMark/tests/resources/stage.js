/*
 * Copyright (C) 2015-2025 Apple Inc. All rights reserved.
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

class Rotater {
    constructor(rotateInterval)
    {
        this._timeDelta = 0;
        this._rotateInterval = rotateInterval;
        this._isSampling = false;
    }

    get interval()
    {
        return this._rotateInterval;
    }

    next(timeDelta)
    {
        this._timeDelta = (this._timeDelta + timeDelta) % this._rotateInterval;
    }

    degree()
    {
        return (360 * this._timeDelta) / this._rotateInterval;
    }

    rotateZ()
    {
        return "rotateZ(" + Math.floor(this.degree()) + "deg)";
    }

    rotate(center)
    {
        return "rotate(" + Math.floor(this.degree()) + ", " + center.x + "," + center.y + ")";
    }
}

class Stage {
    constructor()
    {
    }

    async initialize(benchmark)
    {
        this._benchmark = benchmark;
        this._element = document.getElementById("stage");
        this._element.setAttribute("width", document.body.offsetWidth);
        this._element.setAttribute("height", document.body.offsetHeight);
        this._size = GeometryHelpers.elementClientSize(this._element).subtract(Insets.elementPadding(this._element).size);
    }

    get element()
    {
        return this._element;
    }

    get size()
    {
        return this._size;
    }

    complexity()
    {
        return 0;
    }

    tune()
    {
        throw "Not implemented";
    }

    animate()
    {
        throw "Not implemented";
    }

    clear()
    {
        return this.tune(-this.tune(0));
    }

    static random(min, max)
    {
        return (Pseudo.random() * (max - min)) + min;
    }

    static randomBool()
    {
        return !!Math.round(Pseudo.random());
    }

    static randomSign()
    {
        return Pseudo.random() >= .5 ? 1 : -1;
    }

    static randomInt(min, max)
    {
        return Math.floor(this.random(min, max + 1));
    }

    static randomPosition(maxPosition)
    {
        return new Point(this.randomInt(0, maxPosition.x), this.randomInt(0, maxPosition.y));
    }

    static randomSquareSize(min, max)
    {
        var side = this.random(min, max);
        return new Point(side, side);
    }

    static randomVelocity(maxVelocity)
    {
        return this.random(maxVelocity / 8, maxVelocity);
    }

    static randomAngle()
    {
        return this.random(0, Math.PI * 2);
    }

    static randomColor()
    {
        var min = 32;
        var max = 256 - 32;
        return "#"
            + this.randomInt(min, max).toString(16)
            + this.randomInt(min, max).toString(16)
            + this.randomInt(min, max).toString(16);
    }

    static randomStyleMixBlendMode()
    {
        var mixBlendModeList = [
          'normal',
          'multiply',
          'screen',
          'overlay',
          'darken',
          'lighten',
          'color-dodge',
          'color-burn',
          'hard-light',
          'soft-light',
          'difference',
          'exclusion',
          'hue',
          'saturation',
          'color',
          'luminosity'
        ];

        return mixBlendModeList[this.randomInt(0, mixBlendModeList.length)];
    }

    static randomStyleFilter()
    {
        var filterList = [
            'grayscale(50%)',
            'sepia(50%)',
            'saturate(50%)',
            'hue-rotate(180)',
            'invert(50%)',
            'opacity(50%)',
            'brightness(50%)',
            'contrast(50%)',
            'blur(10px)',
            'drop-shadow(10px 10px 10px gray)'
        ];

        return filterList[this.randomInt(0, filterList.length)];
    }

    static randomElementInArray(array)
    {
        return array[Stage.randomInt(0, array.length - 1)];
    }

    static rotatingColor(cycleLengthMs, saturation, lightness)
    {
        return "hsl("
            + Stage.dateFractionalValue(cycleLengthMs) * 360 + ", "
            + ((saturation || .8) * 100).toFixed(0) + "%, "
            + ((lightness || .35) * 100).toFixed(0) + "%)";
    }

    // Returns a fractional value that wraps around within [0,1]
    static dateFractionalValue(cycleLengthMs)
    {
        return (Date.now() / (cycleLengthMs || 2000)) % 1;
    }

    // Returns an increasing value slowed down by factor
    static dateCounterValue(factor)
    {
        return Date.now() / factor;
    }

    static randomRotater()
    {
        return new Rotater(this.random(1000, 10000));
    }
}
