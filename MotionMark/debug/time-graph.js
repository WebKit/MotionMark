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

class TimeGraph extends Graph {
    constructor(run, settings, size, margins) {
        super(run, settings);

        let svg = this.appendGraph("time-graph", size, margins);

        let complexityMax = d3.max(this.run.timeline.frames, (frame) => {
            if (frame.timespan.start > 0)
                return frame.complexity;
            return 0;
        });

        complexityMax *= 1.2;

        const yRightMin = Graph.msPerSecond / this.minFrameRate;
        const yRightMax = Graph.msPerSecond / this.maxFrameRate;

        const axisWidth = size.width - margins.left - margins.right;
        const axisHeight = size.height - margins.top - margins.bottom;

        // Axis scales
        let xScale = d3.scale.linear()
                .range([0, axisWidth])
                .domain([
                    Math.min(d3.min(this.run.timeline.frames, (frame) => { 
                        return frame.timespan.start;
                    }), 0),
                    d3.max(this.run.timeline.frames, (frame) => { 
                        return frame.timespan.start;
                    })]);

        let yLeftScale = d3.scale.linear()
                .range([axisHeight, Graph.graphTop])
                .domain([0, complexityMax]);

        let yRightScale = d3.scale.linear()
                .range([axisHeight, Graph.graphTop])
                .domain([yRightMin, yRightMax]);

        this.appendAxes(svg, xScale, yLeftScale, yRightScale, axisWidth, axisHeight);

        this.addData(svg, "complexity", 2, xScale, (frame) => { 
            return yLeftScale(frame.complexity);
        });

        this.addData(svg, "rawFPS", 1, xScale, (frame) => { 
            return yRightScale(frame.timespan.length);
        });
    }

    appendAxes(svg, xScale, yLeftScale, yRightScale, axisWidth, axisHeight) {
        let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickFormat((d) => { 
                    return (d / Graph.msPerSecond).toFixed(0);
                });

        let yAxisLeft = d3.svg.axis()
                .scale(yLeftScale)
                .orient("left");

        let yAxisRight = d3.svg.axis()
                .scale(yRightScale)
                .tickValues(this.tickValuesForFrameRate(this.settings.targetFrameRate, this.minFrameRate, this.maxFrameRate))
                .tickFormat((d) => { 
                    return (Graph.msPerSecond / d).toFixed(0);
                })
                .orient("right");

        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("fill", "rgb(235, 235, 235)")
            .attr("transform", "translate(0," + axisHeight + ")")
            .call(xAxis)
            .append("text")
                .attr("class", "label")
                .attr("x", axisWidth)
                .attr("y", -6)
                .attr("fill", "rgb(235, 235, 235)")
                .style("text-anchor", "end")
                .text("time");

        // yLeft-axis
        svg.append("g")
            .attr("class", "yLeft axis")
            .attr("fill", "#7ADD49")
            .call(yAxisLeft)
            .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("fill", "#7ADD49")
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(Strings.text.complexity);

        // yRight-axis
        svg.append("g")
            .attr("class", "yRight axis")
            .attr("fill", "#FA4925")
            .attr("transform", "translate(" + axisWidth + ", 0)")
            .call(yAxisRight)
            .append("text")
                .attr("class", "label")
                .attr("x", 9)
                .attr("y", -20)
                .attr("fill", "#FA4925")
                .attr("dy", ".71em")
                .style("text-anchor", "start")
                .text(Strings.text.frameRate);
    }

    addData(svg, name, pointRadius, xScale, yCoordinateCallback) {
        let svgGroup = svg.append("g").attr("id", name);

        svgGroup.append("path")
            .datum(this.run.timeline.frames)
            .attr("d", d3.svg.line()
                .x((frame) => {
                    return xScale(frame.timespan.start);
                })
                .y(yCoordinateCallback));

        svgGroup.selectAll("circle")
            .data(this.run.timeline.frames)
            .enter()
            .append("circle")
            .attr("cx", (frame) => {
                return xScale(frame.timespan.start);
            })
            .attr("cy", yCoordinateCallback)
            .attr("r", pointRadius);
    }
}
