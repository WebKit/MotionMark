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

class RunsOverlay {
    runs;
    settings;

	constructor(runs, settings) {
        this.runs = runs;
        this.settings = settings;
        document.addEventListener("keypress", this.keypressHandler.bind(this), false);
	}

    keypressHandler(event) {
        switch (event.charCode) {
        case 106: // j
            this.show();
            break;
        case 27:  // esc
            this.hide();
            break;
        case 115: // s
            this.selectText(event.target);
            break;
        }
    }

    show() {
        if (document.getElementById("overlay"))
            return;

        let overlay = document.createHTMLElement("div", {
            id: "overlay"
        }, document.body);

        let container = document.createHTMLElement("div", { }, overlay);

        var header = document.createHTMLElement("h3", { }, container);
        header.textContent = "Debug Output";

        let data = document.createHTMLElement("div", { }, container);
        data.textContent = "Please wait...";

        let outputRuns = this.runs.map(run => ({ 
            testName: run.testName,
            timeline: run.timeline
        }));

        setTimeout(() => {
            let output = {
                version: Strings.version,
                settings: this.settings,
                runs: outputRuns
            };

            data.textContent = JSON.stringify(output, null, 1);
        }, 0);

        data.onclick = function() {
            let selection = window.getSelection();
            selection.removeAllRanges();
            let range = document.createRange();
            range.selectNode(data);
            selection.addRange(range);
        };

        let button = document.createHTMLElement("button", { }, container);
        button.textContent = "Done";
        button.onclick = this.hide.bind(this);
    }

    hide() {
        let overlay = document.getElementById("overlay");
        if (!overlay)
            return;
        document.body.removeChild(overlay);
    }

    selectText() {

    }
}
