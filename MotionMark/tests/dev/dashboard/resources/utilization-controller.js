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


class UtilizationController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);
    }
    
    async initialize()
    {
        await super.initialize();
        this.generator = d3.randomLogNormal(0, 1);
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        this.#generateData(complexity);
        this.#buildChart(this.containerElement);
    }
    
    #generateData(complexity)
    {
        const divisor = Math.max(Math.floor(complexity / 10), 1);

        // This means our work is not quite proportional to complexity.
        const dataLength = divisor * Math.ceil(complexity / divisor);

        // console.log(`utilization complexity ${complexity} divisor ${divisor} dataLength ${dataLength}`);

        this.data = Array.from({ length: dataLength }, (element, i) => {
            return { date: `${Math.floor(i / divisor)}`, process: `process ${i % divisor}`, usage: this.generator() };
        });
    }

    #buildChart(container)
    {
        this.chartNode?.remove();
        
        const containerBounds = container.getBoundingClientRect();

        // Specify the chart’s dimensions (except for the height).
        const width = containerBounds.width;
        const availableHeight = containerBounds.height;
        const marginTop = 30;
        const marginRight = 10;
        const marginBottom = 0;
        const marginLeft = 30;

        // Determine the series that need to be stacked.
        this.series = d3.stack()
            .keys(d3.union(this.data.map(d => d.process))) // distinct series keys, in input order
            .value(([, D], key) => { const value = D.get(key); return value.usage }) // get value for each series key and stack
          (d3.index(this.data, d => d.date, d => d.process)); // group by stack then series key

        // Compute the height from the number of stacks.
        const height = (availableHeight - marginTop - marginBottom);

        // Prepare the scales for positional and color encodings.
        this.xScale = d3.scaleLinear()
            .domain([0, d3.max(this.series, d => d3.max(d, d => d[1]))])
            .range([marginLeft, width - marginRight]);

        this.yScale = d3.scaleBand()
            .domain(d3.groupSort(this.data, D => -d3.sum(D, d => d.usage), d => d.date))
            .range([marginTop, height])
            .padding(0.08);

        const color = d3.scaleOrdinal(d3.schemeObservable10);
            // .domain(series.map(d => d.key))
            // .range(d3.schemeSpectral[series.length])
            // .unknown("#ccc");

        // A function to format the value in the tooltip.
        const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Append a group for each series, and a rect for each element in the series.
        svg.append("g")
          .selectAll()
          .data(this.series)
          .join("g")
            .attr("fill", d => color(d.key))
            .attr("class", "rect-group")
          .selectAll("rect")
          .data(D => D.map(d => (d.key = D.key, d)))
          .join("rect")
            .attr("x", d => this.xScale(d[0]))
            .attr("y", d => this.yScale(d.data[0]))
            .attr("height", this.yScale.bandwidth())
            .attr("width", d => this.xScale(d[1]) - this.xScale(d[0]))
          .append("title")
            .text(d => `${d.data[0]} ${d.key}\n${formatValue(d.data[1].get(d.key).usage)}`);

        // Append the horizontal axis.
        svg.append("g")
            .attr("transform", `translate(0,${marginTop})`)
            .call(d3.axisTop(this.xScale).ticks(width / 100, "s"))
            .call(g => g.selectAll(".domain").remove());

        // Append the vertical axis.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(this.yScale).tickSizeOuter(0))
            .call(g => g.selectAll(".domain").remove());

        this.chartNode = svg.node();
        container.appendChild(this.chartNode);
    }

    animate(timestamp)
    {
        const normalGenerator = d3.randomNormal(0, 0.1);
        for (const item of this.data)
            item.usage = Math.max(item.usage + normalGenerator(), 0);

        this.series = d3.stack()
          .keys(d3.union(this.data.map(d => d.process))) // distinct series keys, in input order
          .value(([, D], key) => D.get(key)?.usage) // get value for each series key and stack
        (d3.index(this.data, d => d.date, d => d.process)); // group by stack then series key

        d3.select(this.containerElement).selectAll(".rect-group")
          .data(this.series)
          .join("g")
          .selectAll("rect")
          .data(D => D.map(d => (d.key = D.key, d)))
          .join("rect")
            .attr("x", d => this.xScale(d[0]))
            .attr("y", d => this.yScale(d.data[0]))
            .attr("height", this.yScale.bandwidth())
            .attr("width", d => this.xScale(d[1]) - this.xScale(d[0]))
    }
}