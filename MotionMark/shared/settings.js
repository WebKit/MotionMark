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

class Settings {
    internal =  {
        'initial-complexity': 1,
        'warmup-length': 2000,
        'warmup-frame-count': 30,
        'test-length': 30,
        'target-frame-rate': 60,
        'controller': "ramp",
        'time-measurement': "performance"
    };

    constructor(internal) {
        this.internal = this.internal || internal;
    }

    valueForSetting(name) {
        let formElement = document.forms["benchmark-settings"].elements[name];
        if (formElement.type == "checkbox")
            return formElement.checked;

        if (formElement.constructor !== HTMLCollection)
            return formElement.value;

        for (let i = 0; i < formElement.length; ++i) {
            let radio = formElement[i];
            if (radio.checked)
                return formElement.value;
        }

        return null;
    }

    updateUIFromLocalStorage() {
        let formElements = document.forms["benchmark-settings"].elements;

        for (let i = 0; i < formElements.length; ++i) {
            let formElement = formElements[i];
            let name = formElement.id || formElement.name;
            let type = formElement.type;

            let value = localStorage.getItem(name);
            if (value === null)
                continue;

            if (type == "number")
                formElements[name].value = +value;
            else if (type == "checkbox")
                formElements[name].checked = value == "true";
            else if (type == "radio")
                formElements[name].value = value;
        }
    }

    updateLocalStorageFromUI() {
        let formElements = document.forms["benchmark-settings"].elements;

        for (let i = 0; i < formElements.length; ++i) {
            let formElement = formElements[i];
            let name = formElement.id || formElement.name;
            let type = formElement.type;

            if (type == "number")
                this.internal[name] = +formElement.value;
            else if (type == "checkbox")
                this.internal[name] = formElement.checked;
            else if (type == "radio") {
                let radios = formElements[name];
                if (radios.constructor !== HTMLCollection)
                    this.internal[name] = radios.value;
                else {
                    for (let j = 0; j < radios.length; ++j) {
                        if (radio[j].checked) {
                            this.internal[name] = radio[j].value;
                            break;
                        }
                    }
                }
            }

            try {
                localStorage.setItem(name, this.internal[name]);
            } catch (e) {}
        }        
    }

    get initialComplexity() {
        return this.internal['initial-complexity'];
    }

    get warmupLength() {
        return this.internal['warmup-length'];
    }

    get warmupFrameCount() {
        return this.internal['warmup-frame-count'];
    }

    get testLength() {
        return this.internal['test-length'] * 1000;
    }

    get targetFrameRate() {
        return this.internal['target-frame-rate'];
    }

    set targetFrameRate(value) {
        this.internal['target-frame-rate'] = value;
    }

    get controller() {
        return this.internal['controller'];
    }

    get timeMasurement() {
        return this.internal['time-measurement'] * 1000;
    }
}
