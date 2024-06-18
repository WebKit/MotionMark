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

class TextTable {
    static shimmerAverage = 0;
    static shimmerMax = 0.5;
    static shadowFalloff = new UnitBezier(new Point(0.015, 0.750), new Point(0.755, 0.235));
    table;

    constructor(table) {
        this.table = table;
    }

    show() {
        this.table.style.visibility = "visible";
    }

    hide() {
        this.table.style.visibility = "hidden";
    }

    move(progress, maxPosition) {
        let x = Math.lerp(progress, 0, maxPosition.x);
        let y = Math.lerp(progress, 0, maxPosition.y);
        this.table.style.transform = "translate(" + Math.floor(x) + "px," + Math.floor(y) + "px)";
    }

    setColor(progress, offset, gradient) {
        let colorProgress = TextTable.shadowFalloff.solve(progress);
        const shimmer = Math.sin(offset - colorProgress);
        colorProgress = Math.max(Math.min(colorProgress + Math.lerp(shimmer, TextTable.shimmerAverage, TextTable.shimmerMax), 1), 0);

        let r = Math.round(Math.lerp(colorProgress, gradient[0], gradient[3]));
        let g = Math.round(Math.lerp(colorProgress, gradient[1], gradient[4]));
        let b = Math.round(Math.lerp(colorProgress, gradient[2], gradient[5]));
        this.table.style.color = "rgb(" + r + "," + g + "," + b + ")";
    }

    animate(progress, maxPosition, offset, gradient) {
        this.move(progress, maxPosition);
        this.setColor(progress, offset, gradient);
    }
}

class TextTablesStage extends ReusableParticlesStage {
    gradients = [
        [ 10, 176, 176, 209, 148, 140],
        [171, 120, 154, 245, 196, 154],
        [224,  99,  99,  71, 134, 148],
        [101, 100, 117,  80, 230, 175],
        [232, 165,  30,  69, 186, 172]
    ];
    millisecondsPerRotation = 1000 / (.26 * Math.PI * 2);
    template;
    templateSize;
    offset;
    shadowFalloff;

    constructor() {
        super();

        this.template = document.getElementById("template");
        this.templateSize = Size.elementClientSize(this.template);

        this.offset = new Size(this.size);
        this.offset.subtract(this.templateSize);
        this.offset.divideBy(2);

        this.template.style.left = this.offset.width + "px";
        this.template.style.top = this.offset.height + "px";
    }

    createParticle() {
        let table = this.template.cloneNode(true);
        this.element.insertBefore(table, this.element.firstChild);
        return new TextTable(table);
    }

    animate(timestamp, lastFrameLength) {
        let activeParticles = this.activeParticles();
        if (activeParticles.length == 0)
            return;

        let angle = Random.dateCounterValue(this.millisecondsPerRotation);
        let gradient = this.gradients[Math.floor(angle / (Math.PI * 2)) % this.gradients.length];
        let offset = Random.dateCounterValue(200);
        let magnitude = Math.min(this.templateSize.height / 4, activeParticles.length * 2);
        let maxPosition = Point.fromVector(magnitude, angle);

        let step = 1 / activeParticles.length;
        let progress = 0;

        for (let particle of activeParticles) {
            particle.animate(progress, maxPosition, offset, gradient);
            progress += step;
        }
    }
}

class TextTableAnimator extends Animator {
    constructor(test, settings) {
        super(new TextTablesStage(), test, settings);
    }
}

window.animatorClass = TextTableAnimator;
