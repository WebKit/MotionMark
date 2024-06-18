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

class GraphContainer {
    complexityGraph;
    timeGraph;

    constructor(run, settings) {
        let container = document.getElementById("test-graph-data");
        container.innerHTML = "";

        let size = Size.elementClientSize(container);
        let margins = new Insets(30, 30, 50, 40);

        this.complexityGraph = new ComplexityGraph(run, settings, size, margins);
        this.timeGraph = new TimeGraph(run, settings, size, margins);

        document.forms["graph-type"].addEventListener("change", this.onGraphTypeChanged.bind(this), true);
        this.onGraphTypeChanged();
    }

    setElementsVisibility(selector, visibility) {
        var nodeList = document.querySelectorAll(selector);
        if (visibility == "visible") {
            for (let i = 0; i < nodeList.length; ++i)
                nodeList[i].classList.remove("hidden");
        } else {
            for (let i = 0; i < nodeList.length; ++i)
                nodeList[i].classList.add("hidden");
        }
    }

    setTimeGraphVisibility(visibility) {
        this.setElementsVisibility("#time-graph", visibility);
        this.setElementsVisibility("form[name=time-graph-options]", visibility);
    }

    setComplexityGraphVisibility(visibility) {
        this.setElementsVisibility("#complexity-graph", visibility);
        this.setElementsVisibility("form[name=complexity-graph-options]", visibility);
    }

    onGraphTypeChanged() {
        let form = document.forms["graph-type"].elements;
        let isTimeSelected = form["graph-type"].value == "time";
        this.setTimeGraphVisibility(isTimeSelected ? "visible" : "hidden");
        this.setComplexityGraphVisibility(!isTimeSelected ? "visible" : "hidden");
    }
}
