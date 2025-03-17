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


class DomainsController extends ChartController {
    constructor(stage, containerElement)
    {
        super(stage, containerElement);
        

    }
    
    async initialize()
    {
        await super.initialize();
        
        this.valueGenerator = d3.randomLogNormal(0, 1);
        
    }

    set complexity(complexity)
    {
        super.complexity = complexity;

        this.#generateData(complexity);
        this.#buildChart(this.containerElement);
    }
    
    #generateData(complexity)
    {
        this.leafNodes = [];
        
        // FIXME: Share.
        const randomDomainComponent = () => {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            const len = alphabet.length;
            const generator = d3.randomInt(0, len);
            return `${alphabet[generator()]}${alphabet[generator()]}${alphabet[generator()]}`;
        };

        const maxBreadth = 10;
        const maxDepth = 4;

        this.data = {
            name: 'com',
            children: []
        };
        
        const leafNodes = new Set();
        
        const insertNode = (node, path) => {
            if (path.length === 0)
                return;

            const nodeIndex = path.shift();
            
            if (nodeIndex >= node.children.length) {
                const newNode = {
                    name: randomDomainComponent(),
                    value: this.valueGenerator(),
                    children: []
                };
                
                if (node.children.length === 0)
                    leafNodes.delete(node);
                
                node.children.push(newNode);
                leafNodes.add(newNode);
                return;
            }

            const childNode = node.children[nodeIndex];
            insertNode(childNode, path);
        };

        const pathGenerator = d3.randomInt(0, maxBreadth);
        for (let i = 0; i < complexity; ++i) {
            const path = [];
            for (let p = 0; p < maxDepth; ++p)
                path.push(pathGenerator());

            insertNode(this.data, path);
        }
        
        this.leafNodes = Array.from(leafNodes);
    }

    #buildChart(container)
    {
        this.chartNode?.remove();

        // Specify the chart’s colors and approximate radius (it will be adjusted at the end).
        const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.data.children.length + 1));
        const radius = 200 / 2;

        // Prepare the layout.
        this.partition = data => d3.partition()
          .size([2 * Math.PI, radius])
        (d3.hierarchy(this.data)
          .sum(d => d.value)
          .sort((a, b) => b.value - a.value));

        const arc = d3.arc()
          .startAngle(d => d.x0)
          .endAngle(d => d.x1)
          .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
          .padRadius(radius / 2)
          .innerRadius(d => d.y0)
          .outerRadius(d => d.y1 - 1);

        const root = this.partition(this.data);

        const width = 300;
        const height = 300;

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add an arc for each element, with a title for tooltips.
        const format = d3.format(",d");
        svg.append("g")
            .attr("fill-opacity", 0.6)
          .selectAll("path")
          .data(root.descendants().filter(d => d.depth))
          .join("path")
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr("d", arc)
          .append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

        // Add a label for each element.
        svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("font-family", "sans-serif")
          .selectAll("text")
          .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
          .join("text")
            .attr("transform", function(d) {
              const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
              const y = (d.y0 + d.y1) / 2;
              return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .text(d => d.data.name);

        this.chartNode = svg.node();
        container.appendChild(this.chartNode);
    }

    animate(timestamp)
    {
        // Mutate some leaf nodes
        const numLeafMutations = Math.floor(this.leafNodes.length / 20);
        const generator = d3.randomInt(this.leafNodes.length);
        for (let i = 0; i < numLeafMutations; ++i) {
            const targetNode = this.leafNodes[generator()];
            targetNode.value = this.valueGenerator();
        }

        // Incremental chart updates are hard. Let's rebuild the whole thing like a developer would probably do.
        this.#buildChart(this.containerElement);
    }
}
