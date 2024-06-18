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

class CanvasArcSegment {
    center;
    radius;
    color;
    startAngle;
    endAngle;
    omega;
    counterclockwise;
    lineWidth;

    constructor(stage) {
        const rows = 4;
        const columns = 6;

        let width = stage.size.width / columns;
        let height = stage.size.height / rows;

        let row = Random.integer(0, rows - 1);
        let column = Random.integer(0, columns - (row % 2));

        this.center = new Point(width * (column + (row % 2) / 2), height * (row + .5));
        this.radius = 20 + Math.pow(Pseudo.random(), 5) * (Math.min(width, height) / 1.8);

        let colors = [
            "#101010", 
            "#808080", 
            "#c0c0c0"
        ];

        let additionalColors = [
            "#e01040",
            "#10c030",
            "#e05010"
        ];

        colors.push(additionalColors[(column + Math.ceil(row / 2)) % 3]);
        this.color = colors[Math.floor(Pseudo.random() * colors.length)];

        this.startAngle = Random.angle();
        this.endAngle = Random.angle();
        this.omega = (Pseudo.random() - 0.5) * 0.3;

        this.counterclockwise = Random.bool();
        this.lineWidth = 1 + Math.pow(Pseudo.random(), 5) * 30;
    }
}

class CanvasArcFillSegment extends CanvasArcSegment {
    draw(context) {
        this.startAngle += this.omega;
        this.endAngle += this.omega / 2;

        context.fillStyle = this.color;
        context.beginPath();
        context.lineTo(this.center.x, this.center.y);
        context.arc(this.center.x, this.center.y, this.radius, this.startAngle, this.endAngle, this.counterclockwise);
        context.lineTo(this.center.x, this.center.y);
        context.fill();
    }
}

class CanvasArcStrokeSegment extends CanvasArcSegment {
    draw(context) {
        this.startAngle += this.omega;
        this.endAngle += this.omega / 2;
        
        context.strokeStyle = this.color;
        context.lineWidth = this.lineWidth;
        context.beginPath();
        context.arc(this.center.x, this.center.y, this.radius, this.startAngle, this.endAngle, this.counterclockwise)
        context.stroke();
    }
}

class CanvasArcsStage extends ReusableSegmentsStage {
    segmentClasses = [
        CanvasArcFillSegment,
        CanvasArcStrokeSegment,
        CanvasArcStrokeSegment,
        CanvasArcStrokeSegment
    ];

    createSegment() {
        let segmentClass = Random.itemInArray(this.segmentClasses);
        return new segmentClass(this);
    }

    animate(timestamp, lastFrameLength) {
        let context = this.context;
        context.clearRect(0, 0, this.size.width, this.size.height);

        for (let segment of this.activeSegments())
            segment.draw(context);
    }
}

class CanvasArcsAnimator extends Animator {
    constructor(test, settings) {
        super(new CanvasArcsStage(), test, settings);
    }
}

window.animatorClass = CanvasArcsAnimator;
