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

class CanvasLineSegment {
    slope;
    start;
    direction;
    lineWidth;
    color;
    length;
    omega;

    constructor(stage) {
        let angle = Random.angle();
        this.slope = new Size(Math.cos(angle), Math.sin(angle));

        let circle = Random.itemInArray(stage.circles);

        this.start = new Point(circle.center);
        this.start.add(this.slope.scaled(circle.radius));

        this.direction = Pseudo.random() > 0.5 ? -1 : 1;
        this.lineWidth = Math.pow(Pseudo.random(), 12) * 20 + 3;
        this.color = circle.strokeStyle;

        this.length = Math.pow(Pseudo.random(), 8) * CanvasLinesStage.lineLengthMaximum + CanvasLinesStage.lineMinimum;
        this.omega = Pseudo.random() * 3 + 0.2;
    }

    draw(context) {
        this.length += Math.sin(Random.dateCounterValue(100) * this.omega);

        let end = new Point(this.start);
        end.add(this.slope.scaled(this.direction * this.length));

        context.lineWidth = this.lineWidth;
        context.strokeStyle = this.color;

        context.beginPath();
        context.moveTo(this.start.x, this.start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
    }
}

class CanvasLinesStage extends ReusableSegmentsStage {
    static lineMinimum = 20;
    static lineLengthMaximum = 40;
    circles;
    halfSize;
    twoFifthsSizeX;

    constructor() {
        super();

        let radius = this.size.width / 8 - .4 * (CanvasLinesStage.lineMinimum + CanvasLinesStage.lineLengthMaximum);

        this.circles = [
            { 
                center: new Point( 5.5 / 32 * this.size.width, 2.1 / 3 * this.size.height),
                radius: radius,
                strokeStyle: "#e01040", fillStyle: "#70051d"
            },
            { 
                center: new Point(12.5 / 32 * this.size.width, 0.9 / 3 * this.size.height),
                radius: radius,
                strokeStyle: "#10c030", fillStyle: "#016112"
            },
            { 
                center: new Point(19.5 / 32 * this.size.width, 2.1 / 3 * this.size.height),
                radius: radius,
                strokeStyle: "#744CBA", fillStyle: "#2F0C6E"
            },
            { 
                center: new Point(26.5 / 32 * this.size.width, 0.9 / 3 * this.size.height),
                radius: radius,
                strokeStyle: "#e05010", fillStyle: "#702701"
            },
        ];

        this.halfSize = this.size.scaled(.5);
        this.twoFifthsSizeX = this.size.width * .4;
    }

    createSegment() {
        return new CanvasLineSegment(this);
    }

    createLinearGradient() {
        let angle = Random.dateFractionalValue(3000) * Math.PI * 2;
        let slope = new Size(Math.cos(angle), Math.sin(angle));
        let delta = slope.scaled(this.twoFifthsSizeX);
        let start = new Point(this.halfSize);
        let end = new Point(this.halfSize);

        start.add(delta);
        end.subtract(delta);

        let gradientStep = 0.5 + 0.5 * Math.sin(Random.dateFractionalValue(5000) * Math.PI * 2);
        let colorStopStep = Math.lerp(gradientStep, -.1, .1);
        let brightnessStep = Math.round(Math.lerp(gradientStep, 32, 64));
        let color1Step = "rgba(" + brightnessStep + "," + brightnessStep + "," + (brightnessStep << 1) + ",.4)";
        let color2Step = "rgba(" + (brightnessStep << 1) + "," + (brightnessStep << 1) + "," + brightnessStep + ",.4)";

        let context = this.context;
        let gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);

        gradient.addColorStop(0, color1Step);
        gradient.addColorStop(.2 + colorStopStep, color1Step);
        gradient.addColorStop(.8 - colorStopStep, color2Step);
        gradient.addColorStop(1, color2Step);

        return gradient;
    }

    drawCircles(gradient) {
        let context = this.context;
        context.lineWidth = 15;

        for (let circle of this.circles) {
            context.strokeStyle = circle.strokeStyle;
            context.fillStyle = circle.fillStyle;

            context.beginPath();
            context.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI*2);
            context.stroke();
            context.fill();

            context.fillStyle = gradient;
            context.fill();
        }
    }

    animate(timestamp, lastFrameLength) {
        let context = this.context;
        context.clearRect(0, 0, this.size.width, this.size.height);

        let gradient = this.createLinearGradient();
        this.drawCircles(gradient);

        for (let segment of this.activeSegments())
            segment.draw(context);
    }
}

class CanvasLinesAnimator extends Animator {
    constructor(test, settings) {
        super(new CanvasLinesStage(), test, settings);
    }
}

window.animatorClass = CanvasLinesAnimator;
