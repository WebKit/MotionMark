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

class ComplexityGraph extends Graph {
    constructor(run, settings, size, margins) {
        super(run, settings);

        let svg = this.appendGraph("complexity-graph", size, margins);

        let xMin = d3.min(this.run.timeline.frames, (frame) => { 
            return frame.complexity;
        });

        let xMax = d3.max(this.run.timeline.frames, (frame) => { 
            return frame.complexity;
        });

        const yMin = Graph.msPerSecond / this.minFrameRate;
        const yMax = Graph.msPerSecond / this.maxFrameRate;

        const axisWidth = size.width - margins.left - margins.right;
        const axisHeight = size.height - margins.top - margins.bottom;

        let xScale = d3.scale.linear()
            .range([0, axisWidth])
            .domain([xMin, xMax]);

        let yScale = d3.scale.linear()
            .range([axisHeight, 0])
            .domain([yMin, yMax]);

        this.appendAxes(svg, xScale, yScale, axisHeight);
        this.appendData(svg, xScale, yScale);
        this.appendRegression(svg, xScale, yScale, xMin, xMax, this.run.statistics.regression);
    }

    appendAxes(svg, xScale, yScale, axisHeight) {
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .tickValues(this.tickValuesForFrameRate(this.settings.targetFrameRate, this.minFrameRate, this.maxFrameRate))
            .tickFormat((d) => { 
                return (Graph.msPerSecond / d).toFixed(0);
            })
            .orient("left");

        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + axisHeight + ")")
            .call(xAxis);

        // y-axis
        var yAxisGroup = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    }

    appendData(svg, xScale, yScale) {
        // series
        let group = svg.append("g")
            .attr("class", "series raw")
            .selectAll("line")
                .data(this.run.timeline.frames)
                .enter();

        group.append("line")
            .attr("x1", (frame) => { return xScale(frame.complexity) - 3; })
            .attr("x2", (frame) => { return xScale(frame.complexity) + 3; })
            .attr("y1", (frame) => { return yScale(frame.timespan.length) - 3; })
            .attr("y2", (frame) => { return yScale(frame.timespan.length) + 3; });

        group.append("line") 
            .attr("x1", (frame) => { return xScale(frame.complexity) - 3; })
            .attr("x2", (frame) => { return xScale(frame.complexity) + 3; })
            .attr("y1", (frame) => { return yScale(frame.timespan.length) + 3; })
            .attr("y2", (frame) => { return yScale(frame.timespan.length) - 3; });
    }

    appendLine(svg, xScale, yScale, point1, point2) {
        svg.append("line")
            .style("stroke", "white")
            .style("stroke-width", 2)
            .attr("x1", xScale(point1.x))
            .attr("y1", yScale(point1.y))
            .attr("x2", xScale(point2.x))
            .attr("y2", yScale(point2.y));
    }

    appendRegression(svg, xScale, yScale, xMin, xMax, regression) {
        let segment1 = regression.segment1;
        let segment2 = regression.segment2;
        let score = regression.score;

        let point1 = new Point(xMin, segment1.s + segment1.t * xMin);
        let point2 = new Point(score, segment1.s + segment1.t * score);
        let point3 = new Point(xMax, segment2.s + segment2.t * xMax);

        svg.append("circle")
            .attr("cx", xScale(point2.x))
            .attr("cy", yScale(point2.y))
            .attr("r", 3);

        this.appendLine(svg, xScale, yScale, point1, point2);
        this.appendLine(svg, xScale, yScale, point2, point3);
    }
}
