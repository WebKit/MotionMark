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

class Graph {
    static graphTop = 10;
    static msPerSecond = 1000;
    run;
    settings;

    constructor(run, settings) {
        this.run = run;
        this.settings = settings;
    }

    get minFrameRate() {
        return this.settings.targetFrameRate / 4;
    }

    get maxFrameRate() {
        return this.settings.targetFrameRate * 1.5;
    }

    appendGraph(id, size, margins) {
        return d3.select("#test-graph-data").append("svg")
            .attr("id", id)
            .attr("width", size.width)
            .attr("height", size.height)
            .append("g")
                .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
    }

    tickValuesForFrameRate(frameRate, minValue, maxValue) {
        // Tick labels go up to 1.5x frame rate
        const buildInFrameRates = {
            15 : [5, 10, 15, 20],
            30 : [5, 10, 15, 20, 25, 30, 35, 40],
            45 : [30, 35, 40, 45, 50, 55, 60],
            60 : [30, 35, 40, 45, 50, 55, 60, 90],
            90 : [30, 35, 40, 45, 50, 55, 60, 90, 120],
            120 : [30, 40, 50, 60, 70, 80, 100, 120, 150],
            144 : [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 200],
        };
        
        let tickValues = buildInFrameRates[frameRate];
        if (!tickValues) {
            const minLabel = Math.round(minValue / 10) * 10;
            const maxLabel = Math.round(maxValue / 10) * 10;
            tickValues = [];
            let curValue = minLabel;
            while (curValue <= maxLabel) {
                tickValues.push(curValue);
                curValue += 20;
            }
        }
        
        tickValues = tickValues.map((x) => Graph.msPerSecond / x);
        return tickValues;
    }
}
