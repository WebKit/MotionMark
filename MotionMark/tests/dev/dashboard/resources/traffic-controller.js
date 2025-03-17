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


class TrafficController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);
        
        const chartContainers = containerElement.querySelectorAll('.chart');
        
        this.firstChartContainer = chartContainers[0];
        this.secondChartContainer = chartContainers[1];
    }
    
    async initialize()
    {
        await super.initialize();
        
        this.generator = d3.randomUniform(0, 100);
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        this.#generateData(complexity);

        this.#buildChart(this.firstChartContainer);
        this.#buildChart(this.secondChartContainer);
    }
    
    #generateData(complexity)
    {
        function randomDomainComponent()
        {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            const len = alphabet.length;
            const generator = d3.randomInt(0, len);
            return `${alphabet[generator()]}${alphabet[generator()]}${alphabet[generator()]}`;
        }

        const dataLength = complexity / 2; // Because there are two charts.
        this.data = Array.from({ length: dataLength }, (element, i) => {
            return { name: randomDomainComponent(), value: this.generator() };
        });
    }

    #buildChart(container)
    {
        container.firstChild?.remove();

        const width = 200;
        
        const height = Math.min(width, 300);
        const radius = Math.min(width, height) / 2;

        this.arc = d3.arc()
            .innerRadius(radius * 0.67)
            .outerRadius(radius - 1);

        this.pie = d3.pie()
            .padAngle(1 / radius)
            .sort(null)
            .value(d => d.value);

        const color = d3.scaleOrdinal(d3.schemeObservable10);

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        const path = svg.datum(this.data).selectAll("path")
            .data(this.pie)
          .join("path")
            .attr("fill", (d, i) => color(d.data.name))
            .attr("class", "pie-wedge")
            .attr("d", this.arc)
          .append("title")
            .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`); // For tooltips.

        svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
          .selectAll()
          .data(this.pie(this.data))
          .join("text")
            .attr("transform", d => `translate(${this.arc.centroid(d)})`)
            .attr("class", "text-label")
            .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .text(d => d.data.name))
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan") // FIXME: Filtering changes complexity
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => d.data.value.toLocaleString("en-US")));

        container.appendChild(svg.node());
    }

    animate(timestamp)
    {
        const generator = d3.randomNormal(0, 2);
        for (const datum of this.data) {
            datum.value = Math.max(datum.value + generator(), 0);
        }
        
        const updateChart = (container) => {
            d3.select(container).selectAll(".pie-wedge")
              .data(this.pie(this.data))
              .join("path")
                .attr("d", this.arc)

            d3.select(container).selectAll(".text-label")
              .data(this.pie(this.data))
              .join("text")
                .attr("transform", d => `translate(${this.arc.centroid(d)})`);
                // FIXME: update the tspans based on angle.
        };
        
        updateChart(this.firstChartContainer);
        updateChart(this.secondChartContainer);
    }
}