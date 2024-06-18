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

class DebugResults extends Results {
    scoreElement;
    confidenceElement;
    nameBody;
    scoreBody;
    graphBody;
    dataHead;
    dataBody;

    constructor(runs, settings) {
        super(runs, settings);

        this.scoreElement = document.querySelector("#results .score");
        this.confidenceElement = document.querySelector("#results .confidence");

        this.nameBody = document.querySelector("#results-header tbody");
        this.scoreBody = document.querySelector("#results-score tbody");
        this.graphBody = document.querySelector("#results-graph tbody");
        this.dataHead = document.querySelector("#results-data thead");
        this.dataBody = document.querySelector("#results-data tbody");

        this.nameBody.innerHTML = "";
        this.scoreBody.innerHTML = "";
        this.graphBody.innerHTML = "";
        this.dataHead.innerHTML = "";
        this.dataBody.innerHTML = "";
    }

    createTableCell(tableBody) {
        let row = document.createHTMLElement("tr", { }, tableBody);
        return document.createHTMLElement("td", { }, row);
    };

    populateScore() {
        let score = this.score;
        let scoreConfidenceLowPercent = this.scoreConfidenceLowPercent;
        let scoreConfidenceHighPercent = this.scoreConfidenceHighPercent;
        let targetFrameRate = this.settings.targetFrameRate;

        this.scoreElement.textContent = `${score.toFixed(2)} @ ${targetFrameRate}fps`;
        this.confidenceElement.textContent = scoreConfidenceLowPercent.toFixed(2) + "% / +" + scoreConfidenceHighPercent.toFixed(2) + "%";
    }

    addGraphButton(parent, showTestGraph, run) {
        var button = document.createHTMLElement("button", { 
            class: "small-button"
        }, parent);

        button.textContent = Strings.text.graph + "…";
        button.run = run;

        button.addEventListener("click", (e) => {
            showTestGraph(e.target.run);
        });
    }

    populateRunsSummary(showTestGraph) {
        for (let run of this.runs) {
            // Name + Score
            this.createTableCell(this.nameBody).textContent = run.testName;
            this.createTableCell(this.scoreBody).textContent = run.statistics.score.toFixed(2);

            // Graph
            this.addGraphButton(this.createTableCell(this.graphBody), showTestGraph, run);
        }
    }

    populateRunsHeader(descriptors) {
        let row = document.createHTMLElement("tr", { }, this.dataHead);

        for (let descriptor of descriptors) {
            let cell = document.createHTMLElement("th", { colspan: descriptor.columns.length }, row);
            cell.textContent = descriptor.text;
        }
    }

    populateRunsBody(descriptors) {
        for (let run of this.runs) {
            let row = document.createHTMLElement("tr", { }, this.dataBody);

            for (let descriptor of descriptors) {
                for (let column of descriptor.columns) {
                    let className;

                    if (typeof column.className == "function")
                        className = column.className(run.statistics);
                    else
                        className = column.className;

                    let cell = document.createHTMLElement("td", { class: className }, row);
                    cell.textContent = column.text(run.statistics);
                }
            }
        }
    }

    populateRunsTable(descriptors) {
        this.populateRunsHeader(descriptors);
        this.populateRunsBody(descriptors);
    }

    populateResults(showTestGraph) {
        this.populateScore();
        this.populateRunsSummary(showTestGraph);
        this.populateRunsDetails();
    }
}
