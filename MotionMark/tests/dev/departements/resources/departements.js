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
    constructor(deptNumber, label, area, population)
    {
        this.deptNumber = deptNumber;
        this.label = label;
        this.area = area;
        this.population = population;

        this.hueOffset = MathHelpers.cheapHash(label) / 0xFFFFFFFF;
        this.colorLightness = MathHelpers.random(0.5, 0.7);
        this.colorSaturation = MathHelpers.random(0.2, 0.5);
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
        const endcapFraction = 0.25;
        this.endcapRadius = outerRadius - endcapFraction * (outerRadius - innerRadius);

        this.complexity = 1;
        
        this.#setupPattern();
    }
    
    get complexity()
    {
        return this._complexity;
    }

    set complexity(value)
    {
        this._complexity = value;
    }
    
    draw(ctx)
    {
        this.numSpokes = this._complexity;
        this.wedgeAngleRadians = TwoPI / this.numSpokes;
        this.angleOffsetRadians = Math.PI / 2; // Start at the top, rather than the right.

        for (let i = 0; i < this.numSpokes; ++i) {
            const instance = this.stage.instanceForIndex(i);

            this.#drawWedge(ctx, i, instance);
            //this.#drawBadge(ctx, i, instance);
            this.#drawMap(ctx, i, instance);
            this.#drawWedgeLabels(ctx, i, instance);
        }

        this.#drawGraphAxes(ctx);
    }
    
    #setupPattern()
    {
        this.patternCanvas = document.createElement('canvas');
        const patternSize = 10;
        this.patternCanvas.height = patternSize;
        this.patternCanvas.width = patternSize;
        
        const ctx = this.patternCanvas.getContext('2d');
        ctx.clearRect(0, 0, patternSize, patternSize);
        
        const circleRadius = 2.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, patternSize, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(patternSize, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(patternSize, patternSize, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(patternSize / 2, patternSize / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();
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
    
    #wedgeWidthAtRadius(outerRadius)
    {
        return 2 * outerRadius * Math.sin(this.wedgeAngleRadians / 2);
    }
    
    #pathForWedge(index, innerRadius, outerRadius)
    {
        const startAngleRadians = this.#wedgeStartAngle(index);
        const endAngleRadians = startAngleRadians + this.wedgeAngleRadians;

        const path = new Path2D();

        const firstStartPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, innerRadius));
        const firstEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(startAngleRadians, outerRadius));

        path.moveTo(firstStartPoint.x, firstStartPoint.y);
        path.lineTo(firstEndPoint.x, firstEndPoint.y);

        path.arc(this.center.x, this.center.y, outerRadius, startAngleRadians, endAngleRadians, Clockwise);

        const secondEndPoint = this.center.add(GeometryHelpers.createPointOnCircle(endAngleRadians, innerRadius));
        path.lineTo(secondEndPoint.x, secondEndPoint.y);
        path.arc(this.center.x, this.center.y, innerRadius, endAngleRadians, startAngleRadians, CounterClockwise);
        path.closePath();

        return path;
    }

    #drawWedge(ctx, index, instance)
    {
        const wedgePath = this.#pathForWedge(index, this.innerRadius, this.endcapRadius);

        const areaRadius = this.innerRadius + (this.endcapRadius - this.innerRadius) * (instance.area / this.stage.maxArea);
        const areaWedgePath = this.#pathForWedge(index, this.innerRadius, areaRadius);

        const populationRadius = this.innerRadius + (this.endcapRadius - this.innerRadius) * (instance.population / this.stage.maxPopulation);
        const populationWedgePath = this.#pathForWedge(index, this.innerRadius, populationRadius);

        const gradient = ctx.createRadialGradient(this.center.x, this.center.y, this.innerRadius, this.center.x, this.center.y, areaRadius);
        
        const colorCycleLengthMS = 1200;
        gradient.addColorStop(0, MathHelpers.rotatingColor(instance.hueOffset, colorCycleLengthMS, instance.colorSaturation, instance.colorLightness));
        gradient.addColorStop(0.9, MathHelpers.rotatingColor(instance.hueOffset + 0.4, colorCycleLengthMS, instance.colorSaturation, instance.colorLightness));

        ctx.save();
        ctx.clip(wedgePath);

        ctx.fillStyle = gradient;
        ctx.fill(areaWedgePath);

        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = 'rgb(0, 0, 0, 0.2)';
        ctx.fill(populationWedgePath);

        const pattern = ctx.createPattern(this.patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fill(populationWedgePath);

        ctx.restore();
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

        const labelSize = ctx.measureText(instance.label);

        {
            ctx.save();

            ctx.translate(outerLabelLocation.x, outerLabelLocation.y);

            ctx.font = '12px "Helvetica Neue", Helvetica, sans-serif';
            ctx.fillStyle = 'black';
        
            let textOffset = 0;
            if (!isRightSide)
                textOffset = -labelSize.width * 1.25; // Not sure why the fudge is needed.

            ctx.fillText(instance.label, textOffset, 0);
            ctx.restore();
        }
        
        const wedgeArrowEnd = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.outerRadius));
        const wedgeArrowEndAngle = MathHelpers.normalizeRadians(midAngleRadians + Math.PI);
        
        // FIXME: Chrome doens't support labelSize.emHeightAscent.
        const arrowStart = new Point(outerLabelLocation.x, outerLabelLocation.y - labelSize.actualBoundingBoxAscent / 2);
        const arrowPath = this.#pathForArrow(arrowStart, wedgeArrowEnd, wedgeArrowEndAngle);

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

        const wedgePath = this.#pathForWedge(index, this.innerRadius, this.outerRadius);
        ctx.clip(wedgePath);

        ctx.translate(imageCenterPoint.x, imageCenterPoint.y);
        ctx.rotate(imageAngle);

        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        
        const imageSize = new Size(20, 20);
        ctx.drawImage(instance.image, -imageSize.width / 2, 0, imageSize.width, imageSize.height);
        ctx.restore();
    }
    
    #drawMap(ctx, index, instance)
    {
        const midAngleRadians = this.#wedgeStartAngle(index) + 0.5 * this.wedgeAngleRadians;
        const imageAngle = midAngleRadians + Math.PI / 2;

        const imageInset = 10;
        const imageCenterPoint = this.center.add(GeometryHelpers.createPointOnCircle(midAngleRadians, this.outerRadius - imageInset));

        ctx.save();

        const wedgePath = this.#pathForWedge(index, this.endcapRadius, this.outerRadius);
        ctx.clip(wedgePath);
        
        const color = MathHelpers.rotatingColor(instance.hueOffset, 0, instance.colorSaturation, instance.colorLightness + 0.2);
        ctx.fillStyle = color;
        ctx.fill(wedgePath);

        ctx.translate(imageCenterPoint.x, imageCenterPoint.y);
        ctx.rotate(imageAngle);

        const sizeFactor = 0.7;
        const horizontalSpace = sizeFactor * this.#wedgeWidthAtRadius(this.outerRadius - imageInset);
        const padding = 4
        const verticalSpace = this.outerRadius - this.endcapRadius - padding;

        const mapSize = Math.min(horizontalSpace, verticalSpace);

        const imageSize = new Size(mapSize, mapSize);        
        this.stage.spriteSheet.drawCellAtIndex(ctx, index, imageSize);
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

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        const dpr = window.devicePixelRatio || 1;
        this.canvasDPR = Math.min(Math.floor(dpr), 2); // Just use 1 or 2.
        
        const canvasClientRect = this._canvasObject.getBoundingClientRect();

        this._canvasObject.width = canvasClientRect.width * dpr;
        this._canvasObject.height = canvasClientRect.height * dpr;

        this.canvasSize = new Size(this._canvasObject.width / this.canvasDPR, this._canvasObject.height / this.canvasDPR);
        this._complexity = 0;

        const jsonData = await this.#loadDataJSON();
        await this.#loadImages();
        
        const mapURL = 'resources/france-departments.svg';
        const canvasSize = new Size(2000, 2000);
        this.spriteSheet = new SpriteSheet(mapURL, canvasSize);
        await this.spriteSheet.prepare(jsonData);

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
        
        let maxArea = 0;
        let maxPopulation = 0; 
        for (const item of jsonData) {
            this.instanceData.push(new ItemData(item['number'], item['name'], item['area'], item['population']));
            
            maxArea = Math.max(maxArea, item['area']);
            maxPopulation = Math.max(maxPopulation, item['population']);
        }
        
        this.maxArea = maxArea;
        this.maxPopulation = maxPopulation;

        return jsonData;
    }

    async #loadImages()
    {
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
        
        const debugging = false;
        if (debugging) {
            const pattern = this.charts[0].patternCanvas;
            context.drawImage(pattern, 0, 0, pattern.width, pattern.height);
            context.drawImage(this.spriteSheet.canvas, 0, 0, this.spriteSheet.canvas.width / 2, this.spriteSheet.canvas.height / 2);
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
}

window.benchmarkClass = RadialChartBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 95;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1500;
    }
    
    results()
    {
        return [];
    }
}

// Testing
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {

    });

}, false);
