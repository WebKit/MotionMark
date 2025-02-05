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

// === PAINT OBJECTS ===

class CanvasLineSegment {
    constructor(stage)
    {
        var radius = Stage.randomInt(10, 100);
        var center = Stage.randomPosition(stage.size);
        var delta = GeometryHelpers.createPointOnCircle(Stage.randomAngle(), radius/2);

        this._point1 = center.add(delta);
        this._point2 = center.subtract(delta);
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 100);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.moveTo(this._point1.x, this._point1.y);
        context.lineTo(this._point2.x, this._point2.y);
        context.stroke();
    }
}

class CanvasLinePoint {
    constructor(stage, coordinateMaximumFactor)
    {
        var pointMaximum = new Point(Math.min(stage.size.x, coordinateMaximumFactor * stage.size.x), Math.min(stage.size.y, coordinateMaximumFactor * stage.size.y));
        this._point = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
    }

    draw(context)
    {
        context.lineTo(this._point.x, this._point.y);
    }
}

class CanvasQuadraticSegment {
    constructor(stage)
    {
        var maxSize = Stage.randomInt(20, 200);
        var toCenter = Stage.randomPosition(stage.size).subtract(new Point(maxSize/2, maxSize/2));

        this._point1 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point2 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point3 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 50);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.moveTo(this._point1.x, this._point1.y);
        context.quadraticCurveTo(this._point2.x, this._point2.y, this._point3.x, this._point3.y);
        context.stroke();
    }
}

class CanvasQuadraticPoint {
    constructor(stage, coordinateMaximumFactor)
    {
        var pointMaximum = Stage.randomPosition(new Point(Math.min(stage.size.x, coordinateMaximumFactor * stage.size.x), Math.min(stage.size.y, coordinateMaximumFactor * stage.size.y)));
        this._point1 = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
        this._point2 = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
    }

    draw(context)
    {
        context.quadraticCurveTo(this._point1.x, this._point1.y, this._point2.x, this._point2.y);
    }
}

class CanvasBezierSegment {
    constructor(stage)
    {
        var maxSize = Stage.randomInt(20, 200);
        var toCenter = Stage.randomPosition(stage.size).subtract(new Point(maxSize/2, maxSize/2));

        this._point1 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point2 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point3 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point4 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 50);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.moveTo(this._point1.x, this._point1.y);
        context.bezierCurveTo(this._point2.x, this._point2.y, this._point3.x, this._point3.y, this._point4.x, this._point4.y);
        context.stroke();
    }
}

class CanvasBezierPoint {
    constructor(stage, coordinateMaximumFactor)
    {
        var pointMaximum = Stage.randomPosition(new Point(Math.min(stage.size.x, coordinateMaximumFactor * stage.size.x), Math.min(stage.size.y, coordinateMaximumFactor * stage.size.y)));
        this._point1 = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
        this._point2 = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
        this._point3 = Stage.randomPosition(pointMaximum).add(new Point((stage.size.x - pointMaximum.x) / 2, (stage.size.y - pointMaximum.y) / 2));
    }

    draw(context)
    {
        context.bezierCurveTo(this._point1.x, this._point1.y, this._point2.x, this._point2.y, this._point3.x, this._point3.y);
    }
}

class CanvasArcToSegment {
    constructor(stage)
    {
        var maxSize = Stage.randomInt(20, 200);
        var toCenter = Stage.randomPosition(stage.size).subtract(new Point(maxSize/2, maxSize/2));

        this._point1 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point2 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._point3 = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._radius = Stage.randomInt(20, 200);
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 50);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.moveTo(this._point1.x, this._point1.y);
        context.arcTo(this._point2.x, this._point2.y, this._point3.x, this._point3.y, this._radius);
        context.stroke();
    }
}

class CanvasArcToSegmentFill extends CanvasArcToSegment {
    constructor(stage)
    {
        super(stage);
    }

    draw(context) {
        context.fillStyle = this._color;
        context.beginPath();
        context.moveTo(this._point1.x, this._point1.y);
        context.arcTo(this._point2.x, this._point2.y, this._point3.x, this._point3.y, this._radius);
        context.fill();
    }
}

class CanvasArcSegment {
    constructor(stage)
    {
        var maxSize = Stage.randomInt(20, 200);
        var toCenter = Stage.randomPosition(stage.size).subtract(new Point(maxSize/2, maxSize/2));

        this._point = Stage.randomPosition(new Point(maxSize, maxSize)).add(toCenter);
        this._radius = Stage.randomInt(20, 200);
        this._startAngle = Stage.randomAngle();
        this._endAngle = Stage.randomAngle();
        this._counterclockwise = Stage.randomBool();
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 50);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.arc(this._point.x, this._point.y, this._radius, this._startAngle, this._endAngle, this._counterclockwise);
        context.stroke();
    }
}

class CanvasArcSegmentFill extends CanvasArcSegment {
    constructor(stage)
    {
        super(stage);
    }
    
    draw(context)
    {
        context.fillStyle = this._color;
        context.beginPath();
        context.arc(this._point.x, this._point.y, this._radius, this._startAngle, this._endAngle, this._counterclockwise);
        context.fill();
    }
}

class CanvasRect {
    constructor(stage)
    {
        this._width = Stage.randomInt(20, 200);
        this._height = Stage.randomInt(20, 200);
        this._point = Stage.randomPosition(stage.size).subtract(new Point(this._width/2, this._height/2));
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 20);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.rect(this._point.x, this._point.y, this._width, this._height);
        context.stroke();
    }
}

class CanvasRectFill extends CanvasRect {
    constructor(stage)
    {
        super(stage);
    }

    draw(context)
    {
        context.fillStyle = this._color;
        context.beginPath();
        context.rect(this._point.x, this._point.y, this._width, this._height);
        context.fill();
    }
}

class CanvasEllipse {
    constructor(stage)
    {
        this._radius = new Point(Stage.randomInt(20, 200), Stage.randomInt(20, 200));
        var toCenter = Stage.randomPosition(stage.size).subtract(this._radius.multiply(.5));

        this._center = Stage.randomPosition(this._radius).add(toCenter);
        this._rotation = Stage.randomAngle();
        this._startAngle = Stage.randomAngle();
        this._endAngle = Stage.randomAngle();
        this._anticlockwise = Stage.randomBool();
        this._color = Stage.randomColor();
        this._lineWidth = Stage.randomInt(1, 20);
    }

    draw(context)
    {
        context.strokeStyle = this._color;
        context.lineWidth = this._lineWidth;
        context.beginPath();
        context.ellipse(this._center.x, this._center.y, this._radius.width, this._radius.height, this._rotation, this._startAngle, this._endAngle, this._anticlockwise);
        context.stroke();
    }
}

class CanvasEllipseFill extends CanvasEllipse {
    constructor(stage)
    {
        super(stage);
    }

    draw(context)
    {
        context.fillStyle = this._color;
        context.beginPath();
        context.ellipse(this._center.x, this._center.y, this._radius.width, this._radius.height, this._rotation, this._startAngle, this._endAngle, this._anticlockwise);
        context.fill();
    }
}

class CanvasStroke {
    static objectTypes = [
        CanvasQuadraticSegment,
        CanvasBezierSegment,
        CanvasArcToSegment,
        CanvasArcSegment,
        CanvasRect,
        CanvasEllipse
    ];
    
    constructor(stage)
    {
        this._object = new (Stage.randomElementInArray(CanvasStroke.objectTypes))(stage);
    }

    draw(context)
    {
        this._object.draw(context);
    }
}

class CanvasFill {
    static objectTypes = [
        CanvasArcToSegmentFill,
        CanvasArcSegmentFill,
        CanvasRectFill,
        CanvasEllipseFill
    ];

    constructor(stage)
    {
        this._object = new (Stage.randomElementInArray(CanvasFill.objectTypes))(stage);
    }

    draw(context)
    {
        this._object.draw(context);
    }
}

// === STAGES ===

class SimpleCanvasPathStrokeStage extends SimpleCanvasStage {
    animate()
    {
        var context = this.context;
        context.clearRect(0, 0, this.size.x, this.size.y);
        context.lineWidth = Stage.randomInt(1, 20);
        context.strokeStyle = Stage.rotatingColor();
        context.beginPath();
        context.moveTo(this.size.x / 2, this.size.y / 2);
        for (var i = 0, length = this.offsetIndex; i < length; ++i)
            this.objects[i].draw(context);
        context.stroke();
    }
}

class SimpleCanvasPathFillStage extends SimpleCanvasStage {
    animate()
    {
        var context = this.context;
        context.clearRect(0, 0, this.size.x, this.size.y);
        context.fillStyle = Stage.rotatingColor();
        context.beginPath();
        context.moveTo(this.size.x / 2, this.size.y / 2);
        for (var i = 0, length = this.offsetIndex; i < length; ++i)
            this.objects[i].draw(context);
        context.fill();
    }
}

class CanvasLineSegmentStage extends SimpleCanvasStage {
    constructor()
    {
        super(CanvasLineSegment);
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.context.lineCap = options["lineCap"] || "butt";
    }
}

class CanvasLinePathStage extends SimpleCanvasPathStrokeStage {
    constructor()
    {
        super(CanvasLinePoint);
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.context.lineJoin = options["lineJoin"] || "bevel";
    }
}

class CanvasLineDashStage extends SimpleCanvasStage {
    constructor()
    {
        super(CanvasLinePoint);
        this._step = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.context.setLineDash([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        this.context.lineWidth = 1;
        this.context.strokeStyle = "#000";
    }

    animate()
    {
        var context = this.context;
        context.clearRect(0, 0, this.size.x, this.size.y);
        context.lineDashOffset = this._step++;
        context.beginPath();
        context.moveTo(this.size.x / 2, this.size.y / 2);
        for (var i = 0, length = this.offsetIndex; i < length; ++i)
            this.objects[i].draw(context);
        context.stroke();
    }
}

// === BENCHMARK ===

class CanvasPathBenchmark extends Benchmark {
    constructor(options)
    {
        var stage;
        switch (options["pathType"]) {
        case "line":
            stage = new CanvasLineSegmentStage();
            break;
        case "linePath": {
            if ("lineJoin" in options)
                stage = new CanvasLinePathStage();
            if ("lineDash" in options)
                stage = new CanvasLineDashStage();
            break;
        }
        case "quadratic":
            stage = new SimpleCanvasStage(CanvasQuadraticSegment);
            break;
        case "quadraticPath":
            stage = new SimpleCanvasPathStrokeStage(CanvasQuadraticPoint);
            break;
        case "bezier":
            stage = new SimpleCanvasStage(CanvasBezierSegment);
            break;
        case "bezierPath":
            stage = new SimpleCanvasPathStrokeStage(CanvasBezierPoint);
            break;
        case "arcTo":
            stage = new SimpleCanvasStage(CanvasArcToSegment);
            break;
        case "arc":
            stage = new SimpleCanvasStage(CanvasArcSegment);
            break;
        case "rect":
            stage = new SimpleCanvasStage(CanvasRect);
            break;
        case "ellipse":
            stage = new SimpleCanvasStage(CanvasEllipse);
            break;
        case "lineFill":
            stage = new SimpleCanvasPathFillStage(CanvasLinePoint);
            break;
        case "quadraticFill":
            stage = new SimpleCanvasPathFillStage(CanvasQuadraticPoint);
            break;
        case "bezierFill":
            stage = new SimpleCanvasPathFillStage(CanvasBezierPoint);
            break;
        case "arcToFill":
            stage = new SimpleCanvasStage(CanvasArcToSegmentFill);
            break;
        case "arcFill":
            stage = new SimpleCanvasStage(CanvasArcSegmentFill);
            break;
        case "rectFill":
            stage = new SimpleCanvasStage(CanvasRectFill);
            break;
        case "ellipseFill":
            stage = new SimpleCanvasStage(CanvasEllipseFill);
            break;
        case "strokes":
            stage = new SimpleCanvasStage(CanvasStroke);
            break;
        case "fills":
            stage = new SimpleCanvasStage(CanvasFill);
            break;
        }

        super(stage, options);
    }
}

window.benchmarkClass = CanvasPathBenchmark;
