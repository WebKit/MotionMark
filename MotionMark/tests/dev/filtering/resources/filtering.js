
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


// FIXME: Share
class Size {
    static zero = new Size(0, 0);

    constructor(width, height)
    {
        this.width = width;
        this.height = height;
    }

    clone()
    {
        return new Point(this.width, this.height);
    }
}

class Position {
    static zero = new Position(0, 0);

    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    clone()
    {
        return new Point(this.x, this.y);
    }
}

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

/* ------------------------------------------------------------ */

class ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        this._container = container;
        this._itemSize = itemSize;
        this._stageSize = stageSize;
    }
    
    arrangeItems()
    {
    }
}

class RandomPlacementLayout extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('layout-random');
    }

    arrangeItems()
    {
        // Choose a position that keeps the element mostly on-screen; 80% of the height and width have to be visible.
        const fractionVisible = 1;
        const allowedMinXClip = (1 - fractionVisible) * this._itemSize.width;
        const allowedMinYClip = (1 - fractionVisible) * this._itemSize.height;
        const allowedMaxXClip = fractionVisible * this._itemSize.width;
        const allowedMaxYClip = fractionVisible * this._itemSize.height;

        for (const child of this._container.children) {

            const x = Stage.randomInt(-allowedMinXClip, this._stageSize.width - allowedMaxXClip);
            const y = Stage.randomInt(-allowedMinYClip, this._stageSize.height - allowedMaxYClip);
        
            child.style.left = `${x}px`;
            child.style.top = `${y}px`;
        }
    }
}

class StackLayout extends ItemLayout {
    constructor(container, itemSize, stageSize, maxOffset)
    {
        super(container, itemSize, stageSize);
        this._maxOffset = maxOffset;
    }
    
    arrangeItems()
    {
        const numItems = this._container.children.length;
        const offset = new Size(this._maxOffset.width / numItems, this._maxOffset.height / numItems);
        const minAlpha = 0.2;
        const maxAlpha = 1;

        for (let i = 0; i < this._container.children.length; ++i) {
            const child = this._container.children[i];
            child.style.left = `${i * offset.width}px`;
            child.style.top = `${i * offset.height}px`;
            
            child.style.setProperty("--fade-level", Utilities.lerp((i + 1) / numItems, minAlpha, maxAlpha));
        }
    }
    
}

/* ------------------------------------------------------------ */

class Item {
    constructor(container)
    {
        this.#createElements(container);
    }
    
    remove()
    {
        this.section.remove();
    }
    
    #createElements(container)
    {
        this.section = this.#createElement('section', 'unit');
        
        const textValues = [
            'Zoom',
            'Static',
            'Open',
            'Water',
            'Neon',
            'Lights'
        ];

        // Create six items, one of each type.
        const numItems = 6;
        for (let i = 0; i < numItems; ++i) {

            const item = this.#createElement('div', 'item');
            item.classList.add(`style-${i + 1}`)
            this.section.appendChild(item);

            const wrapper = this.#createElement('div', 'container');
            item.appendChild(wrapper);

            const content = this.#createElement('div', 'content', textValues[i]);
            wrapper.appendChild(content);
        }

        container.appendChild(this.section);
    }

    #createElement(tagName, className, htmlContent)
    {
        const element = document.createElement(tagName);
        element.className = className;
        if (htmlContent)
            element.innerHTML = htmlContent;
        return element;
    }
}

/* ------------------------------------------------------------ */


class FilteringStage extends Stage {
    constructor()
    {
        super();

       //Pseudo.randomSeed = Date.now();

       this.container = document.getElementById('container');
       this.container.innerText = '';

       this._animValue = 0;
       this._complexity = 0;
       this._items = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        const stageRect = this.element.getBoundingClientRect();
        this._stageRect = new Rect(Point.zero, new Size(stageRect.width, stageRect.height));

        const maxOffset = new Size(100, 100);
        this.layout = new StackLayout(this.container, new Size(), new Size(stageRect.width, stageRect.height), maxOffset);
    }

    tune(countDelta)
    {
        if (countDelta == 0)
            return;

        const newComplexity = this._complexity + countDelta;
        if (newComplexity < this._complexity) {

            let itemsToRemove = this._items.splice(newComplexity);
            itemsToRemove.forEach((item) => item.remove());

        } else if (newComplexity > this._complexity) {
            
            for (let itemCount = this._complexity; itemCount < newComplexity; ++itemCount) {
                const item = new Item(this.container);
                this._items.push(item);
            }
        }

        this._complexity = newComplexity;
        this.layout.arrangeItems();
    }

    animate()
    {
        //this.element.style.setProperty("--anim-value", ++this._animValue);
    }

    complexity()
    {
        return this._complexity;
    }
}

class FilteringBenchmark extends Benchmark {
    constructor(options)
    {
        super(new FilteringStage(), options);
        
        // setTimeout(() => {
        //     this.stage.tune(5);
        // }, 500);
        //
        // setTimeout(() => {
        //     this.stage.tune(-0);
        // }, 1000);
    }
}

window.benchmarkClass = FilteringBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 1;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 50000;
    }
    
    results()
    {
        return [];
    }
}

// This allows the test HTML file to be loaded directly and run the test with fixed complexity.
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    const benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {
        
    });

}, false);
