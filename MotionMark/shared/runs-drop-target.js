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

class RunsDropTarget {
    showResults;

	constructor(showResults) {
        this.showResults = showResults;
        this.setupDropTarget();
    }

    setupDropTarget() {
        let dropTarget = document.getElementById("drop-target");

        let stopEvent = (e) => {
            e.stopPropagation();
            e.preventDefault();
        }

        dropTarget.addEventListener("dragenter", (e) => {
            dropTarget.classList.add("drag-over");
            stopEvent(e);
        }, false);

        dropTarget.addEventListener("dragover", stopEvent, false);

        dropTarget.addEventListener("dragleave", (e) => {
            dropTarget.classList.remove("drag-over");
            stopEvent(e);
        }, false);

        dropTarget.addEventListener("drop", (e) => {
            stopEvent(e);

            if (!e.dataTransfer.files.length) {
                dropTarget.classList.remove("drag-over");
                return;
            }

            dropTarget.textContent = 'Processing…';

            let file = e.dataTransfer.files[0];

            let reader = new FileReader();
            reader.filename = file.name;
            reader.onload = (e) => {
                let input = JSON.parse(e.target.result);
                let settings = new Settings(input.settings);

                let runs = input.runs.map((run) => {
                    let marks = run.timeline.marks;
                    let frames = run.timeline.frames.map(frame => ({ 
                        timespan: new Timespan(frame.timespan.start, frame.timespan.length),
                        complexity: frame.complexity
                    }));

                    let timeline = new Timeline(marks, frames);
                    let statistics = timeline.calculateStatistics(settings);

                    return {
                        testName: run.testName,
                        timeline: timeline,
                        statistics: statistics
                    }
                });
                this.showResults(runs);
            };

            reader.readAsText(file);
            document.title = "File: " + reader.filename;
        }, false);
    }
}
