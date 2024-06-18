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

class CanvasSegment {
    static strokeColors = [
        "#101010",
        "#808080", 
        "#c0c0c0", 
        "#101010", 
        "#808080", 
        "#c0c0c0",
        "#e01040"
    ];
    strokeColor;
    lineWidth;
    isSplit;

    constructor() {
        this.strokeColor = Random.itemInArray(CanvasSegment.strokeColors);
        this.lineWidth = Math.pow(Pseudo.random(), 5) * 20 + 1;
        this.isSplit = Pseudo.random() > 0.5;
    }
}

class CanvasLineToSegment extends CanvasSegment {
    point;

    constructor(stage) {
        super();
        this.point = stage.randomPoint();
    }

    draw(context) {
        context.lineTo(this.point.x, this.point.y);
    }
}

class CanvasQuadraticSegment extends CanvasSegment {
    controlPoint;
    endPoint;

    constructor(stage) {
        super();
        this.controlPoint = stage.randomPoint();
        this.endPoint = stage.randomPoint();
    }

    draw(context) {
        context.quadraticCurveTo(this.controlPoint.x, this.controlPoint.y, this.endPoint.x, this.endPoint.y);
    }
}

class CanvasBezierSegment extends CanvasSegment {
    controlPoint1;
    controlPoint2;
    endPoint;

    constructor(stage) {
        super();
        this.controlPoint1 = stage.randomPoint();
        this.controlPoint2 = stage.randomPoint();
        this.endPoint = stage.randomPoint();
    }

    draw(context) {
        context.bezierCurveTo(this.controlPoint1.x, this.controlPoint1.y, this.controlPoint2.x, this.controlPoint2.y, this.endPoint.x, this.endPoint.y);
    }
}

class PathsStage extends ReusableSegmentsStage {
    segmentClasses = [
        CanvasLineToSegment,
        CanvasQuadraticSegment,
        CanvasBezierSegment
    ];

    gridSize = new Size(80, 40);
    offsets = [
        new Point(-4, 0),
        new Point(2, 0),
        new Point(1, -2),
        new Point(1, 2),
    ];

    coordinate;

    constructor() {
        super();

        let context = this.context;
        context.lineJoin = "bevel";
        context.lineCap = "butt";

        this.coordinate = new Point(this.gridSize.width / 2, this.gridSize.height / 2);
    }

    randomPoint() {
        let offset = Random.itemInArray(this.offsets);

        this.coordinate.add(offset);
        if (this.coordinate.x < 0 || this.coordinate.x > this.gridSize.width)
            this.coordinate.x -= offset.x * 2;

        if (this.coordinate.y < 0 || this.coordinate.y > this.gridSize.height)
            this.coordinate.y -= offset.y * 2;

        let x = (this.coordinate.x + .5) * this.size.width / (this.gridSize.width + 1);
        let y = (this.coordinate.y + .5) * this.size.height / (this.gridSize.height + 1);

        return new Point(x, y);
    }

    createSegment() {
        let segmentClass = Random.itemInArray(this.segmentClasses);
        return new segmentClass(this);
    }

    beginPath(segment) {
        let context = this.context;
        context.lineWidth = segment.lineWidth;
        context.strokeStyle = segment.strokeColor;
        context.beginPath();
    }

    animate() {
        let context = this.context;
        context.clearRect(0, 0, this.size.width, this.size.height);

        let center = this.rect.center();
        context.beginPath();
        context.moveTo(center.x, center.y);

        for (let segment of this.activeSegments()) {
            if (segment.isSplit) {
                context.stroke();
                this.beginPath(segment);
            }

            segment.draw(context);

            if (Pseudo.random() > 0.995)
                segment.isSplit = !segment.isSplit;
        }

        context.stroke();
    }
}

class PathsAnimator extends Animator {
    constructor(test, settings) {
        super(new PathsStage(), test, settings);
    }
}

window.animatorClass = PathsAnimator;
