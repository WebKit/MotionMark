/*
 * Copyright (C) 2025 Apple Inc. All rights reserved.
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


class ThroughputController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);

    }
    
    async initialize()
    {
        await super.initialize();

        this.randomGenerator = d3.randomPoisson(10);
        this.deltaRandomSource = d3.randomLogNormal(0, 1);
        this.deltaRandomGenerator = () => {
            return Math.min(0.3 * Math.abs(this.deltaRandomSource()), 1);
        };
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        const dataLength = complexity;
        this.outboundData = Array.from({ length: dataLength }, () => { return this.randomGenerator(); });

        // Use deltas so the inbound and outbound data appear to be roughly correlated.
        this.deltaData = Array.from({ length: dataLength }, () => { return this.deltaRandomGenerator(); });
        
        this.inboundData = this.outboundData.map((item, index) => {
            return Math.max(item * this.deltaData[index], 0);
        });

        this.#buildChart();
    }

    #buildChart()
    {
        const containerRect = this.containerElement.getBoundingClientRect();
        
        const marginTop = 30;
        const marginRight = 20;
        const marginBottom = 20;
        const marginLeft = 30;

        const width = containerRect.width - marginLeft - marginRight;
        const height = containerRect.height - marginTop - marginBottom;

        const graphMaxY = 20;
        this.xScale = d3.scaleLinear(d3.extent(this.outboundData, (d, i) => i), [marginLeft, width - marginRight]);
        this.yScale = d3.scaleLinear([0, graphMaxY], [height - marginBottom, marginTop]);

        this.area = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(this.yScale(0))
            .y1((d, i) => this.yScale(this.outboundData[i]));

        this.area2 = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(this.yScale(0))
            .y1((d, i) => this.yScale(this.inboundData[i]));

        this.outboundLine = d3.line()
            .x((d, i) => this.xScale(i))
            .y((d, i) => this.yScale(this.outboundData[i]));

        this.inboundLine = d3.line()
            .x((d, i) => this.xScale(i))
            .y((d, i) => this.yScale(this.inboundData[i]));

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        svg.append("defs")
            .append("clipPath")
                .attr("id", "graph-clip")
            .append("rect")
                .attr("x", marginLeft)
                .attr("y", marginTop)
                .attr("width", width)
                .attr("height", height);       

        svg.append("path")
            .attr("class", "outbound-data-path")
            .attr("clip-path", "url(#graph-clip)")
            .attr("d", this.area(this.outboundData));

        svg.append("path")
            .attr("fill", "none")
            .attr("class", "outbound-line")
            .attr("d", this.outboundLine(this.outboundData));

        svg.append("path")
            .attr("clip-path", "url(#graph-clip)")
            .attr("class", "inbound-data-path")
            .attr("d", this.area2(this.inboundData));

        svg.append("path")
            .attr("fill", "none")
            .attr("class", "inbound-line")
            .attr("d", this.inboundLine(this.inboundData));

        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(this.xScale).ticks(0));

        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(this.yScale).ticks(height / 40))
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1));

        this.chartNode?.remove();
        this.chartNode = svg.node();
        this.containerElement.appendChild(this.chartNode);
    }

    animate(timestamp)
    {
        this.outboundData.push(this.randomGenerator());
        this.outboundData.shift();

        this.deltaData.push(this.deltaRandomGenerator());
        this.deltaData.shift();

        const lastIndex = this.outboundData.length - 1;
        this.inboundData.push(Math.max(this.outboundData[lastIndex] * this.deltaData[lastIndex], 0));
        this.inboundData.shift();

        d3.selectAll(".outbound-data-path")
            .data(this.outboundData)
            .attr("d", this.area(this.outboundData));

        d3.selectAll(".outbound-line")
            .data(this.outboundData)
            .attr("d", this.outboundLine(this.outboundData));

        d3.selectAll(".inbound-data-path")
            .data(this.inboundData)
            .attr("d", this.area2(this.inboundData));

        d3.selectAll(".inbound-line")
            .data(this.inboundData)
            .attr("d", this.inboundLine(this.inboundData));
    }
}