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

class SuitesTree {
    suites

    constructor(suites) {
        this.suites = suites;

        let treeElement = document.querySelector("#suites > .tree");
        this.createTreeElements(treeElement);
    }

    checkboxElement(element) {
        return element.querySelector("input[type='checkbox']:not(.expand-button)");
    }

    editElements() {
        return document.querySelectorAll("#suites input[type='number']");
    }

    updateSuiteCheckboxState(suiteCheckbox) {
        let enabledTestsCount = suiteCheckbox.testsElements.reduce((checkedCount, testElement) => {
            let testCheckbox = this.checkboxElement(testElement);
            return testCheckbox.checked ? checkedCount + 1 : checkedCount;
        }, 0);
        suiteCheckbox.checked = enabledTestsCount > 0;
        suiteCheckbox.indeterminate = enabledTestsCount > 0 && enabledTestsCount < suiteCheckbox.testsElements.length;
    }

    updateEditElementsState() {
        let settings = window.motionmark.settings;
        let showComplexityInputs = settings.valueForSetting("controller") == "fixed";

        let editElements = this.editElements();

        for (var i = 0; i < editElements.length; ++i) {
            let editElement = editElements[i];
            if (showComplexityInputs)
                editElement.classList.add("selected");
            else
                editElement.classList.remove("selected");
        }
    }

    onChangeTestCheckbox(event) {
        let suiteCheckbox = event.target.suiteCheckbox;
        this.updateSuiteCheckboxState(event.target.suiteCheckbox);

        let testIndex = event.target.testIndex;
        let tests = suiteCheckbox.suite.tests;
        tests[testIndex].enabled = event.target.checked;

        window.motionmark.updateStartButtonState();
    }

    onChangeSuiteCheckbox(event) {
        let selected = event.target.checked;

        for (const testElement of event.target.testsElements) {
            let testCheckbox = this.checkboxElement(testElement);
            testCheckbox.checked = selected;
        }

        for (let test of event.target.suite.tests)
            test.enabled = selected;

        window.motionmark.updateStartButtonState();
    }

    createSuiteElement(treeElement, index, suite) {
        let suiteElement = document.createHTMLElement("li", {}, treeElement);

        let expandElement = document.createHTMLElement("input", { 
            type: "checkbox",  
            class: "expand-button", 
            id: "suite-" + index }, suiteElement);

        let labelElement = document.createHTMLElement("label", { 
            class: "tree-label", 
            for: "suite-" + index }, suiteElement);

        let suiteCheckbox = document.createHTMLElement("input", { 
            type: "checkbox" }, labelElement);

        suiteCheckbox.suite = suite;
        suiteCheckbox.testsElements = [];
        suiteCheckbox.onchange = this.onChangeSuiteCheckbox.bind(this);

        labelElement.appendChild(document.createTextNode(" " + suite.name));
        return suiteElement;
    }

    createListElement(suiteElement) {
        return document.createHTMLElement("ul", { }, suiteElement);
    }

    createTestElement(listElement) {
        return document.createHTMLElement("li", { }, listElement);
    }

    createTestCheckbox(testElement, suiteCheckbox, testIndex, test) {
        let span = document.createHTMLElement("label", { 
            class: "tree-label" }, testElement);

        let testCheckbox = document.createHTMLElement("input", { 
            type: "checkbox" }, span);

        testCheckbox.testIndex = testIndex;
        testCheckbox.suiteCheckbox = suiteCheckbox;
        testCheckbox.checked = test.enabled;
        testCheckbox.onchange = this.onChangeTestCheckbox.bind(this);

        span.appendChild(document.createTextNode(" " + test.name + " "));
        return testCheckbox;
    }

    createTestLinkElement(testElement, suite, test) {
        let linkElement = document.createHTMLElement("span", { }, testElement);
        linkElement.classList.add("link");
        linkElement.textContent = "link";
        linkElement.suiteName = suite.name;
        linkElement.testName = test.name;
        return linkElement
    }

    createTestEditElement(testElement, testCheckbox, test) {
        let editElement = document.createHTMLElement("input", { 
            type: "number" }, testElement);

        editElement.relatedCheckbox = testCheckbox;
        editElement.value = test.complexity;
        return editElement;
    }

    createTreeElements(treeElement) {
        for (let [suiteIndex, suite] of this.suites.entries()) {
            let suiteElement = this.createSuiteElement(treeElement, suiteIndex, suite);

            let listElement = this.createListElement(suiteElement);
            let suiteCheckbox = this.checkboxElement(suiteElement);

            for (let [testIndex, test] of suite.tests.entries()) {
                let testElement = this.createTestElement(listElement);
                suiteCheckbox.testsElements.push(testElement);

                let testCheckbox = this.createTestCheckbox(testElement, suiteCheckbox, testIndex, test);
                testElement.appendChild(document.createTextNode(" "));

                this.createTestLinkElement(testElement, suiteCheckbox.suite, test);
                this.createTestEditElement(testElement, testCheckbox, test);
            }

            this.updateSuiteCheckboxState(suiteCheckbox);
        }
    }

    updateLocalStorageFromUI() {
        let editElements = this.editElements();
        let editIndex = 0;
        for (let suite of this.suites) {
            for (let testIndex = 0; testIndex < suite.tests.length; ++testIndex)
                suite.tests[testIndex].complexity = +editElements[editIndex++].value;
        }
        window.motionmark.suitesCollection.updateLocalStorageFromSuites();
    }
}
