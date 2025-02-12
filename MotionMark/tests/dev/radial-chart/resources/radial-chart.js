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

// Move to shared code
class Size {
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }
}


// To be moved.
class MathHelpers {
    static random(min, max)
    {
        return min + Pseudo.random() * (max - min);
    }

    static rotatingColor(hueOffset, cycleLengthMs, saturation, lightness)
    {
        return "hsl("
            + MathHelpers.dateFractionalValue(cycleLengthMs, hueOffset) * 360 + ", "
            + ((saturation || .8) * 100).toFixed(0) + "%, "
            + ((lightness || .35) * 100).toFixed(0) + "%)";
    }

    // Returns a fractional value that wraps around within [0,1]
    static dateFractionalValue(cycleLengthMs, offset)
    {
        return (offset + Date.now() / (cycleLengthMs || 2000)) % 1;
    }
    
    static cheapHash(s)
    {
        let hash = 0, i = 0, len = s.length;
        while ( i < len )
            hash  = ((hash << 5) - hash + s.charCodeAt(i++)) << 0;

        return hash + 2147483647 + 1;
    }
    
    // JavaScripts % operator is remainder, not modulo.
    static modulo(dividend, divisor)
    {
        const quotient = Math.floor(dividend / divisor);
        return dividend - divisor * quotient;
    }

    static normalizeRadians(radians)
    {
        return MathHelpers.modulo(radians, Math.PI * 2);
    }
}

class ItemData {
    constructor(deptNumber, label, imageURL)
    {
        this.deptNumber = deptNumber;
        this.label = label;
        this.imageURL = imageURL;

        this.hueOffset = MathHelpers.cheapHash(label) / 0xFFFFFFFF;
        this.colorLightness = MathHelpers.random(0.5, 0.7);
        this.colorSaturation = MathHelpers.random(0.2, 0.5);
    }
    
    loadImage()
    {
        return new Promise(resolve => {
            this.image = new Image();
            this.image.onload = resolve;
            this.image.src = this.imageURL;
        });
    }
}

class RandomWalk {
    constructor(min, max, stepFraction)
    {
        this.min = min;
        this.max = max;
        this.stepFraction = stepFraction;
        this.value = MathHelpers.random(this.min, this.max);
    }
    
    nextValue()
    {
        const scale = (this.max - this.min) * this.stepFraction;
        const delta = scale * 2 * (Pseudo.random() - 0.5);
        this.value = Math.max(Math.min(this.value + delta, this.max), this.min);
        return this.value;
    }
}

class SmoothWalk {
    static timeOrigin;
    constructor(min, max)
    {
        this.min = min;
        this.max = max;
        
        const minWaveLength = 200;
        const maxWaveLength = 2000;

        const amplitudeMin = 0.2;
        const amplitudeMax = 1;
        // We superimpose some sin functions to generate the values.
        this.wave1Phase = Pseudo.random();
        this.wave1Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave1Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);

        this.wave2Phase = Pseudo.random();
        this.wave2Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave2Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);

        this.wave3Phase = Pseudo.random();
        this.wave3Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave3Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);
        
        if (!SmoothWalk.timeOrigin)
            SmoothWalk.timeOrigin = new Date();
    }
    
    nextValue()
    {
        this.value = this.#computeValue();
        return this.value;
    }
    
    #computeValue()
    {
        const elapsedTime = Date.now() - SmoothWalk.timeOrigin;
        const wave1Value = this.wave1Amplitude * (0.5 + Math.sin(this.wave1Amplitude + elapsedTime / this.wave1Length) / 2);
        const wave2Value = this.wave2Amplitude * (0.5 + Math.sin(this.wave2Amplitude + elapsedTime / this.wave2Length) / 2);
        const wave3Value = this.wave3Amplitude * (0.5 + Math.sin(this.wave3Amplitude + elapsedTime / this.wave3Length) / 2);
        
        return this.min + (this.max - this.min) * (wave1Value + wave2Value + wave3Value) / (this.wave1Amplitude + this.wave2Amplitude + this.wave3Amplitude);
    }
}

const TwoPI = Math.PI * 2;
const Clockwise = false;
const CounterClockwise = true;

class RadialChart {
    constructor(stage, center, innerRadius, outerRadius)
    {
        this.stage = stage;
        this.center = center;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this._values = [];
        this.#computeDimensions();

        this.complexity = 1;
    }
    
    get complexity()
    {
        return this._complexity;
    }

    set complexity(value)
    {
        this._complexity = value;
        if (this._complexity < this._values.length) {
            this._values.length = this._complexity;
            return;
        }
        
        const startIndex = this._values.length;
        for (let i = startIndex; i < this._complexity; ++i)
            this._values.push(new SmoothWalk(this.innerRadius, this.outerRadius, 1 / 100));
    }
    
    draw(ctx)
    {
        this.numSpokes = this._complexity;
        this.wedgeAngleRadians = TwoPI / this.numSpokes;
        this.angleOffsetRadians = Math.PI / 2; // Start at the top, rather than the right.

        for (let i = 0; i < this.numSpokes; ++i) {
            const instance = this.stage.instanceForIndex(i);

            this.#drawWedge(ctx, i, instance);
            this.#drawBadge(ctx, i, instance);
            this.#drawWedgeLabels(ctx, i, instance);
        }

        this.#drawGraphAxes(ctx);
    }
    
    #computeDimensions()
    {

    }

    #drawGraphAxes(ctx)
    {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.innerRadius, 0, TwoPI, Clockwise);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.outerRadius, 0, TwoPI, Clockwise);
        ctx.stroke();

        for (let i = 0; i < this.numSpokes; ++i) {
            const angleRadians = this.#wedgeStartAngle(i);

            const startPoint = this.center.add(GeometryHelpers.createPointOnCircle(angleRadians, this.innerRadius));
            const endPoint = this.center.add(GeometryHelpers.createPointOnCircle(angleRadians, this.outerRadius));

            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
        }
    }
    
    #wedgeStartAngle(index)
    {
        return index * this.wedgeAngleRadians - this.angleOffsetRadians;
    }
    
    #pathForWedge(index, outerRadius)
    {
        const startAngleRadians = this.#wedgeStartAngle(index);
        const endAngleRadians = startAngleRadians + this.wedgeAngleRadians;

        const path = new Path2D();

        const firstStartPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, this.innerRadius));
        const firstEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, outerRadius));

        path.moveTo(firstStartPoint.x, firstStartPoint.y);
        path.lineTo(firstEndPoint.x, firstEndPoint.y);

        path.arc(this.center.x, this.center.y, outerRadius, startAngleRadians, endAngleRadians, Clockwise);

        const secondEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(endAngleRadians, this.innerRadius));
        path.lineTo(secondEndPoint.x, secondEndPoint.y);
        path.arc(this.center.x, this.center.y, this.innerRadius, endAngleRadians, startAngleRadians, CounterClockwise);
        path.closePath();

        return path;
    }

    #drawWedge(ctx, index, instance)
    {
        const outerRadius = this._values[index].nextValue();
        const wedgePath = this.#pathForWedge(index, outerRadius);

        const gradient = ctx.createRadialGradient(this.center.x, this.center.y, this.innerRadius, this.center.x, this.center.y, outerRadius);
        
        const colorCycleLengthMS = 1200;
        gradient.addColorStop(0, MathHelpers.rotatingColor(instance.hueOffset, colorCycleLengthMS, instance.colorSaturation, instance.colorLightness));
        gradient.addColorStop(0.9, MathHelpers.rotatingColor(instance.hueOffset + 0.4, colorCycleLengthMS, instance.colorSaturation, instance.colorLightness));

        ctx.fillStyle = gradient;
        ctx.fill(wedgePath);
    }
    
    #drawWedgeLabels(ctx, index, instance)
    {
        const midAngleRadians = MathHelpers.normalizeRadians(this.#wedgeStartAngle(index) + 0.5 * this.wedgeAngleRadians);

        const textInset = -15;
        const textCenterPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.innerRadius - textInset));

        const labelAngle = midAngleRadians + Math.PI / 2;
        
        {
            ctx.save();
            ctx.font = '12px "Helvetica Neue", Helvetica, sans-serif';

            // Numbers on inner ring.
            ctx.translate(textCenterPoint.x, textCenterPoint.y);
            ctx.rotate(labelAngle);
        
            const textSize = ctx.measureText(instance.deptNumber);

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeText(instance.deptNumber, -textSize.width / 2, 0);

            {
                ctx.save();
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 5;
                ctx.fillStyle = 'white';
                ctx.fillText(instance.deptNumber, -textSize.width / 2, 0);
                ctx.restore();
            }

            ctx.restore();
        }

        // Labels around outside.
        const labelDistance = 20;
        const labelHorizontalOffset = 60;
        const outsideMidSegmentPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.outerRadius + labelDistance));
        let outerLabelLocation = outsideMidSegmentPoint;
        const isRightSide = midAngleRadians < Math.PI /2 || midAngleRadians > Math.PI * 1.5;
        if (isRightSide)
            outerLabelLocation = outsideMidSegmentPoint.add(new Point(labelHorizontalOffset, 0));
        else
            outerLabelLocation = outsideMidSegmentPoint.add(new Point(-labelHorizontalOffset, 0));

        {
            ctx.save();

            ctx.translate(outerLabelLocation.x, outerLabelLocation.y);

            ctx.font = '12px "Helvetica Neue", Helvetica, sans-serif';
            ctx.fillStyle = 'black';
        
            let textOffset = 0;
            if (!isRightSide)
                textOffset = -ctx.measureText(instance.label).width;

            ctx.fillText(instance.label, textOffset, 0);
            ctx.restore();
        }
        
        const wedgeArrowEnd = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.outerRadius));
        const wedgeArrowEndAngle = MathHelpers.normalizeRadians(midAngleRadians + Math.PI);
        const arrowPath = this.#pathForArrow(outerLabelLocation, wedgeArrowEnd, wedgeArrowEndAngle);

        // Arrow.
        {
            ctx.save();
            ctx.strokeStyle = 'gray';
            ctx.setLineDash([4, 2]);
            ctx.stroke(arrowPath);
            ctx.restore();
        }

        // Arrowhead.
        {
            ctx.save();
            const arrowheadPath = this.#pathForArrowHead();

            ctx.translate(wedgeArrowEnd.x, wedgeArrowEnd.y);
            const arrowheadSize = 12;
            ctx.scale(arrowheadSize, arrowheadSize);
            ctx.rotate(midAngleRadians);

            ctx.fillStyle = 'gray';
            ctx.fill(arrowheadPath);

            ctx.restore();
        }
    }
    
    #drawBadge(ctx, index, instance)
    {
        const midAngleRadians = this.#wedgeStartAngle(index) + 0.5 * this.wedgeAngleRadians;
        const imageAngle = midAngleRadians + Math.PI / 2;

        const imageInset = 30;
        const imageCenterPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.outerRadius - imageInset));

        ctx.save();

        const wedgePath = this.#pathForWedge(index, this.outerRadius);
        ctx.clip(wedgePath);

        ctx.translate(imageCenterPoint.x, imageCenterPoint.y);
        ctx.rotate(imageAngle);

        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        
        const imageSize = new Size(20, 20);
        ctx.drawImage(instance.image, -imageSize.width / 2, 0, imageSize.width, imageSize.height);
        ctx.restore();
    }
    
    #locationForOuterLabel(index)
    {
        const labelsPerSide = this.numSpokes / 2;

        const horizonalEdgeOffset = 100;
        const verticalEdgeOffset = 20;
        const verticalSpacing = this.outerRadius * 2 / labelsPerSide;

        if (index <= labelsPerSide) {
            // Right side, going down.
            const labelX = horizonalEdgeOffset + this.center.x + this.outerRadius;
            const labelY = verticalEdgeOffset + index * verticalSpacing;

            return new Point(labelX, labelY);
            
        } else {
            // Left side, going up.
            const bottomY = this.center.y + this.outerRadius;

            const labelX = this.center.x - (horizonalEdgeOffset + this.outerRadius);
            const labelY = bottomY - (index - labelsPerSide) * verticalSpacing;

            return new Point(labelX, labelY);
        }
    }
    
    #pathForArrow(startPoint, endPoint, endAngle)
    {
        const arrowPath = new Path2D();
        arrowPath.moveTo(startPoint.x, startPoint.y);
        // Compute a bezier path that keeps the line horizontal at the start and end.
        
        const distance = startPoint.subtract(endPoint).length();

        const controlPointProportion = 0.5;
        const controlPoint1 = startPoint.add({ x: controlPointProportion * (endPoint.x - startPoint.x), y: 0});
        
        const controlPoint2Offset = new Point(controlPointProportion * distance * Math.cos(endAngle), controlPointProportion * distance * Math.sin(endAngle));
        const controlPoint2 = endPoint.subtract(controlPoint2Offset);

        arrowPath.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);
        return arrowPath;
    }

    #pathForArrowHead()
    {
        // Arrowhead points left.
        const arrowHeadPath = new Path2D();
        const pointyness = 0.5;
        const breadth = 0.4;
        
        arrowHeadPath.moveTo(0, 0);
        arrowHeadPath.quadraticCurveTo(pointyness, 0, 1, breadth);
        arrowHeadPath.lineTo(1, -breadth);
        arrowHeadPath.quadraticCurveTo(pointyness, 0, 0, 0);
        arrowHeadPath.closePath();
        
        return arrowHeadPath;
    }
}

class RadialChartStage extends Stage {
    constructor(canvasObject)
    {
        super();
        this._canvasObject = canvasObject;
        this.charts = [];
        this.instanceData = [];
    }

    initialize(benchmark, options)
    {
        super.initialize(benchmark, options);
        
        const dpr = window.devicePixelRatio || 1;
        this.canvasDPR = Math.min(Math.floor(dpr), 2); // Just use 1 or 2.
        
        const canvasClientRect = this._canvasObject.getBoundingClientRect();

        this._canvasObject.width = canvasClientRect.width * dpr;
        this._canvasObject.height = canvasClientRect.height * dpr;

        this.canvasSize = new Size(this._canvasObject.width / this.canvasDPR, this._canvasObject.height / this.canvasDPR);
        this._complexity = 0;

        this.#startLoadingData(benchmark);

        this.context = this._canvasObject.getContext("2d");
        this.context.scale(this.canvasDPR, this.canvasDPR);
    }

    tune(count)
    {
        if (count == 0)
            return;

        this._complexity += count;
        // console.log(`tune ${count} - complexity is ${this._complexity}`);
        this.#setupCharts();
    }

    #startLoadingData(benchmark)
    {
        setTimeout(async () => {
            await this.#loadDataJSON();
            await this.#loadImages();

            benchmark.readyPromise.resolve();
        }, 0);
    }
    
    async #loadDataJSON()
    {
        const url = "resources/departements-region.json";
        const response = await fetch(url);
        if (!response.ok) {
            const errorString = `Failed to load data source ${url} with error ${response.status}`
            console.error(errorString);
            throw errorString;
        }
    
        const jsonData = await response.json();
        for (const item of jsonData) {
            // this.instanceData.push(new ItemData(item['dep_name'], `resources/department-shields${item['dep_name']}.png`));
            this.instanceData.push(new ItemData(item['num_dep'], item['dep_name'], `resources/department-shields/Ain.png`));
        }
    }

    async #loadImages()
    {
        let promises = [];
        for (const instance of this.instanceData) {
            promises.push(instance.loadImage());
        }
        
        await Promise.all(promises);
    }
    
    #setupCharts()
    {
        const maxSegmentsPerChart = 100;
        const numCharts = Math.ceil(this._complexity / maxSegmentsPerChart);

        const perChartComplexity = Math.ceil(this._complexity / numCharts);
        let remainingComplexity = this._complexity;

        // FIXME: Outer charts should have more items because there's more space.
        if (numCharts === this.charts.length) {
            for (let i = this.charts.length; i > 0; --i) {
                const chartComplexity = Math.min(perChartComplexity, remainingComplexity);
                
                this.charts[i - 1].complexity = chartComplexity;
                remainingComplexity -= chartComplexity;
            }
            return;
        }

        this.charts = [];

        const centerPoint = new Point(this.canvasSize.width / 2, this.canvasSize.height / 2);
        
        const outerRadius = this.canvasSize.height * 0.45;
        const annulusRadius = outerRadius / numCharts;
        
        for (let i = numCharts; i > 0; --i) {
            const outerRadius = i * annulusRadius;
            const innerRadius = outerRadius - (annulusRadius * 0.7)

            const chart = new RadialChart(this, centerPoint, innerRadius, outerRadius);
            const chartComplexity = Math.min(perChartComplexity, remainingComplexity);

            chart.complexity = chartComplexity;
            this.charts.push(chart);
            remainingComplexity -= chartComplexity;
        }
    }

    instanceForIndex(index)
    {
        return this.instanceData[index % this.instanceData.length];
    }

    animate()
    {
        const context = this.context;
        context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        
        for (const chart of this.charts) {
            chart.draw(context);
        }
    }

    complexity()
    {
        return this._complexity;
    }
}

class RadialChartBenchmark extends Benchmark {
    constructor(options)
    {
        const canvas = document.getElementById('stage-canvas');
        super(new RadialChartStage(canvas), options);
    }

    waitUntilReady()
    {
        this.readyPromise = new SimplePromise;
        return this.readyPromise;
    }
}

window.benchmarkClass = RadialChartBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 200;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 500;
    }
    
    results()
    {
        return [];
    }
}

// Testing
window.addEventListener('load', () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();

    benchmark.run().then(function(testData) {

    });

}, false);
