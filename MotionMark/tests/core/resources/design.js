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

class TextStage extends Stage {
    static shadowFalloff = new UnitBezier(new Point(0.015, 0.750), new Point(0.755, 0.235));
    static shimmerAverage = 0;
    static shimmerMax = 0.5;
    static millisecondsPerRotation = 1000 / (.26 * Math.PI * 2);
    static gradients = [
        [10, 176, 176, 209, 148, 140],
        [171, 120, 154, 245, 196, 154],
        [224, 99, 99, 71, 134, 148],
        [101, 100, 117, 80, 230, 175],
        [232, 165, 30, 69, 186, 172]
    ];

    constructor()
    {
        super();

        this.testElements = [];
        this._offsetIndex = 0;
    }
    
    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this._template = document.getElementById("template");
    
        const templateSize = GeometryHelpers.elementClientSize(this._template);
        this._offset = this.size.subtract(templateSize).multiply(.5);
        this._maxOffset = templateSize.height / 4;

        this._template.style.left = this._offset.width + "px";
        this._template.style.top = this._offset.height + "px";

        this._stepProgress = 0;
    }

    tune(count)
    {
        if (count == 0)
            return;

        if (count < 0) {
            this._offsetIndex = Math.max(this._offsetIndex + count, 0);
            for (let i = this._offsetIndex; i < this.testElements.length; ++i)
                this.testElements[i].style.visibility = "hidden";

            this._stepProgress = 1 / this._offsetIndex;
            return;
        }

        this._offsetIndex = this._offsetIndex + count;
        this._stepProgress = 1 / this._offsetIndex;

        const index = Math.min(this._offsetIndex, this.testElements.length);
        for (let i = 0; i < index; ++i)
            this.testElements[i].style.visibility = "visible";

        if (this._offsetIndex <= this.testElements.length)
            return;

        for (let i = this.testElements.length; i < this._offsetIndex; ++i) {
            const clone = this._template.cloneNode(true);
            this.testElements.push(clone);
            this.element.insertBefore(clone, this.element.firstChild);
        }
    }

    animate(timeDelta) 
    {
        const angle = Stage.dateCounterValue(TextStage.millisecondsPerRotation);

        const gradient = TextStage.gradients[Math.floor(angle / (Math.PI * 2)) % TextStage.gradients.length];
        const offset = Stage.dateCounterValue(200);
        const maxX = Math.sin(angle) * this._maxOffset;
        const maxY = Math.cos(angle) * this._maxOffset;

        let progress = 0;
        for (let i = 0; i < this._offsetIndex; ++i) {
            const element = this.testElements[i];

            let colorProgress = TextStage.shadowFalloff.solve(progress);
            const shimmer = Math.sin(offset - colorProgress);
            colorProgress = Math.max(Math.min(colorProgress + Utilities.lerp(shimmer, TextStage.shimmerAverage, TextStage.shimmerMax), 1), 0);
            const r = Math.round(Utilities.lerp(colorProgress, gradient[0], gradient[3]));
            const g = Math.round(Utilities.lerp(colorProgress, gradient[1], gradient[4]));
            const b = Math.round(Utilities.lerp(colorProgress, gradient[2], gradient[5]));
            element.style.color = "rgb(" + r + "," + g + "," + b + ")";

            const x = Utilities.lerp(i / this._offsetIndex, 0, maxX);
            const y = Utilities.lerp(i / this._offsetIndex, 0, maxY);
            element.style.transform = "translate(" + Math.floor(x) + "px," + Math.floor(y) + "px)";

            progress += this._stepProgress;
        }
    }

    complexity()
    {
        return 1 + this._offsetIndex;
    }
}

class TextBenchmark extends Benchmark {
    constructor(options)
    {
        super(new TextStage(), options);
    }
}

window.benchmarkClass = TextBenchmark;
