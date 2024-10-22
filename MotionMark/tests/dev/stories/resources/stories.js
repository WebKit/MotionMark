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

// Move to shared code

class MathHelpers {
    static random(min, max)
    {
        return min + Pseudo.random() * (max - min);
    }

    static rotatingColor(hueOffset, cycleLengthMs, saturation, lightness)
    {
        return "hsl("
            + MathHelpers.dateFractionalValue(cycleLengthMs, hueOffset) * 360 + ", "
            + ((saturation || .8) * 100).toFixed(0) + "%, "
            + ((lightness || .35) * 100).toFixed(0) + "%)";
    }

    // Returns a fractional value that wraps around within [0,1]
    static dateFractionalValue(cycleLengthMs, offset)
    {
        return (offset + Date.now() / (cycleLengthMs || 2000)) % 1;
    }
}

const textLabels = [
    { value: 'design' },
    { value: 'σχέδιο' },
    { value: '设计' },
    { value: 'дизайн' },
    { value: 'تصميم', rtl: true },
    { value: '디자인' },
    { value: 'conception' },
    { value: 'デザイン' },
    { value: 'עיצוב', rtl: true },
    { value: 'diseño' },
];

const fillImages = [
  'robert-bye-36K5WckeU3o-unsplash.jpg',
  'andrey-andreyev-dh8ONmfQyQQ-unsplash.jpg',
  'fabian-burghardt-A81818EFqGQ-unsplash.jpg',
  'jonatan-pie-7FfG8zcPcXU-unsplash.jpg',
  'josh-reid-meOFNlRbHmY-unsplash.jpg',
  'khamkeo-rBRZLPVLQg0-unsplash.jpg',
  'luke-stackpoole-eWqOgJ-lfiI-unsplash.jpg',
  'matt-palmer-gK1s6P92EIE-unsplash.jpg',
  'redcharlie-O7zkyNkQ1lM-unsplash.jpg',
  'roan-lavery-hUj3aAg0W3Q-unsplash.jpg',
];

class Rect {
    constructor(position, size)
    {
        this.position = position;
        this.size = size;
    }
    
    get x()
    {
        return this.position.x;
    }

    get y()
    {
        return this.position.y;
    }

    get width()
    {
        return this.size.width;
    }

    get height()
    {
        return this.size.height;
    }
}

class Size {
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }
}

// FIXME: Move to shared code.
class Animator {
    constructor(min, max)
    {
        this.min = min;
        this.max = max;
    }
    
    valueForTime(timestampMS)
    {
        return this.min;
    }
}

class SinusoidalAnimator extends Animator {
    constructor(min, max, wavelengthMS, phaseMS)
    {
        super(min, max);
        this.wavelengthMS = wavelengthMS;
        this.phaseMS = phaseMS;
    }

    valueForTime(timestampMS)
    {
        // Scale between 0 and 2PI
        const offset = 2 * Math.PI * ((timestampMS + this.phaseMS) % this.wavelengthMS) / this.wavelengthMS;
        const value = Math.sin(offset);
        return this.min + (this.max - this.min) * (0.5 + value / 2);
    }
}

class RampAnimator extends Animator {
    constructor(min, max, durationMS, phaseMS, alternate)
    {
        super(min, max);
        this.durationMS = durationMS;
        this.phaseMS = phaseMS;
    }

    valueForTime(timestampMS)
    {
        const offset = ((timestampMS + this.phaseMS) % this.durationMS) / this.durationMS;
        return Utilities.lerp(offset, this.min, this.max);
    }
}


Array.prototype.max = function()
{
  return Math.max.apply(null, this);
};

Array.prototype.min = function()
{
  return Math.min.apply(null, this);
};

Array.prototype.sum = function()
{
    return this.reduce((partialSum, a) => partialSum + a, 0);
};

class BoxItem {
    constructor(mainImage)
    {
        this.value = Stage.random(0.1, 1);
        
        const labelIndex = Math.floor(Stage.random(0, textLabels.length));
        this.label = textLabels[labelIndex].value;
        this.isRTL = textLabels[labelIndex].rtl || false;
        
        this.mainImage = mainImage.cloneNode();
        this.element = undefined;
    
        this.animator = new RampAnimator(1, 1.2, 5000, Stage.random(0, 1));
    }
    
    ensureElement()
    {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'box';
            if (this.isRTL)
                this.element.classList.add('rtl');
                
            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'badge';
            const badgeImage = document.createElement('img');
            
            // FIXME: Need more badge images.
            badgeImage.src = '../../core/resources/debugger100.png';
            badgeContainer.appendChild(badgeImage);
            this.element.appendChild(badgeContainer);
            this.element.appendChild(this.mainImage);

            const childBox = document.createElement('div');
            childBox.className = 'overlay';
            const childSpan = document.createElement('span');
            childSpan.textContent = this.label;

            childBox.appendChild(childSpan);
            this.element.appendChild(childBox);
        }
        
        return this.element;
    }
    
    animate(timestamp)
    {
        const scale =  this.animator.valueForTime(timestamp);
        this.element.style.setProperty('--image-scale', scale);
    }

    applyStyle(data)
    {
        const edgeInset = 4;
        this.element.style.left = `${data.x.toFixed(2) + edgeInset}px`;
        this.element.style.top = `${data.y.toFixed(2) + edgeInset}px`;
        this.element.style.width = `${Math.max(data.width - 2 * edgeInset, 0).toFixed(2)}px`;
        this.element.style.height = `${Math.max(data.height - 2 * edgeInset, 0).toFixed(2)}px`;        
    }
}

class LayoutState {
    constructor(position, size)
    {
        this.currentPosition = position;
        this.remainingSize = size;
    }
}

class TreeMapLayout {
    constructor(areaSize, data)
    {
        this.areaSize = areaSize;
        this.originalData = data;
        this.data = this.#normalizeData(this.originalData);
    }
    
    #normalizeData(data)
    {
        const factor = (this.areaSize.width * this.areaSize.height) / data.sum();
        return data.map((x) => (x * factor));
    }
    
    layout()
    {
        this.layoutResults = [];
        const inputData = [...this.data];
        this.#squarishLayoutIterative(inputData);        
    }
    
    #squarishLayoutIterative(items)
    {
        const layoutState = new LayoutState(new Point(0, 0), structuredClone(this.areaSize));
        const remainingItems = [...items];
        let itemsInCurrentRow = [];
        
        let { value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize);
        
        while (remainingItems.length > 1) {
            const rowWithChild = [...itemsInCurrentRow, remainingItems[0]]

            if (itemsInCurrentRow.length === 0 || TreeMapLayout.#worstRatio(itemsInCurrentRow, availableSpace) >= TreeMapLayout.#worstRatio(rowWithChild, availableSpace)) {
                remainingItems.shift();
                itemsInCurrentRow = rowWithChild;
                continue;
            }

            this.#layoutRow(itemsInCurrentRow, availableSpace, currentlyVertical, layoutState);
            ({ value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize));
            
            itemsInCurrentRow = [];
        }

        this.#layoutLastRow(itemsInCurrentRow, remainingItems, availableSpace, layoutState);
    }

    static #worstRatio(rowValues, width)
    {
        const rowMax = rowValues.max();
        const rowMin = rowValues.min();
        const sumSquared = Math.pow(rowValues.sum(), 2);
        const widthSquared = Math.pow(width, 2);
        return Math.max((widthSquared * rowMax) / sumSquared, sumSquared / (widthSquared * rowMin));
    }

    #layoutRow(rowValues, width, isVertical, layoutState)
    {
        const rowHeight = rowValues.sum() / width;

        rowValues.forEach((rowItem) => {
            const rowWidth = rowItem / rowHeight;
            const curXPos = layoutState.currentPosition.x;
            const curYPos = layoutState.currentPosition.y;

            let data;
            if (isVertical) {
                layoutState.currentPosition.y += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowHeight,
                    height: rowWidth,
                    dataIndex: this.layoutResults.length,
                };
            } else {
                layoutState.currentPosition.x += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowWidth,
                    height: rowHeight,
                    dataIndex: this.layoutResults.length,
                };
            }
            
            this.layoutResults.push(data);
        });

        if (isVertical) {
            layoutState.currentPosition.x += rowHeight;
            layoutState.currentPosition.y -= width;
            layoutState.remainingSize.width -= rowHeight;
        } else {
            layoutState.currentPosition.x -= width;
            layoutState.currentPosition.y += rowHeight;
            layoutState.remainingSize.height -= rowHeight;
        }
    }

    #layoutLastRow(rowValues, remainingItems, width, layoutState)
    {
        const isVertical = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize).vertical;
        if (rowValues.length)
            this.#layoutRow(rowValues, width, isVertical, layoutState);
        this.#layoutRow(remainingItems, width, isVertical, layoutState);
    }

    static #getSmallerDimension(remainingSpace)
    {
        if (remainingSpace.height ** 2 > remainingSpace.width ** 2)
            return { value: remainingSpace.width, vertical: false };

        return { value: remainingSpace.height, vertical: true };
    }
}

class FractalBoxesController {
    constructor(stage)
    {
        this.stage = stage;

        this.container = document.getElementById('container');
        this.container.innerText = '';

        const stageClientRect = this.container.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        this.nodeCount = 1;

        this._complexity = 0;        

        this.items = [];
    }

    set complexity(complexity)
    {
        if (complexity > this._complexity) {
            this.items.length = complexity;
          
            for (let i = this._complexity; i < this.items.length; ++i)
                this.items[i] = this.#createBox(i);
        } else {
            for (let i = complexity; i < this.items.length; ++i)
                this.items[i].element.remove();

            this.items.length = complexity;
        }
        
        this._complexity = complexity;
        
        const numericValues = this.items.map((x) => x.value);
        
        this.treeMap = new TreeMapLayout(this.stageSize, numericValues);
        this.treeMap.layout();
        
        let i = 0;
        for (const data of this.treeMap.layoutResults) {
            const item = this.items[data.dataIndex];
            const element = item.ensureElement();
            item.applyStyle(data);
            
            if (!element.parentElement)
                this.container.appendChild(element);
            ++i;
        }
    }
    
    #createBox(boxIndex)
    {
        return new BoxItem(this.stage.images[boxIndex % this.stage.images.length]);
    }
    
    animate()
    {
        const timestamp = Date.now();
        for (const boxItem of this.items)
            boxItem.animate(timestamp);
    }
}


class FractalBoxesStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    initialize(benchmark, options)
    {
        super.initialize(benchmark, options);
        this.controller = new FractalBoxesController(this);
        
        this.images = [];
        this.#startLoadingData(benchmark)
    }

    #startLoadingData(benchmark)
    {
        setTimeout(async () => {
            await this.#loadImages();
            benchmark.readyPromise.resolve();
        }, 0);
    }
    
    async #loadImages()
    {
        const promises = [];
        const imagePrefix = 'resources/images/';
        for (const imageURL of fillImages) {
            const loadingPromise = new Promise(resolve => {
                const image = new Image();
                image.onload = resolve;
                image.src = imagePrefix + imageURL;
                this.images.push(image);
            });
            promises.push(loadingPromise);
        }
        
        await Promise.all(promises);
    }
    
    tune(count)
    {
        if (count === 0)
            return;

        this._complexity += count;

        // console.log(`tune ${count} complexity ${this._complexity}`);
        this.controller.complexity = this._complexity;
    }

    animate()
    {
        this.controller.animate();
    }

    complexity()
    {
        return this._complexity;
    }
}

class FractalBoxesBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new FractalBoxesStage(stage), options);
    }

    waitUntilReady()
    {
        this.readyPromise = new SimplePromise;
        return this.readyPromise;
    }
}

window.benchmarkClass = FractalBoxesBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 10;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 5000;
    }
    
    update(timestamp, stage)
    {
        stage.tune(-1);
    }
    
    results()
    {
        return [];
    }
}

// Testing
window.addEventListener('load', () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController(benchmark);

    benchmark.run().then(function(testData) {

    });

}, false);
