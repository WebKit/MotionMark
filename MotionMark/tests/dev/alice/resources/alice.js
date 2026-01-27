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



class ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        this.stage = stage;
        this._container = stage.container;
        this._itemSize = itemSize;
        this._stageSize = stageSize;
    }
    
    get itemSize()
    {
        return _itemSize;
    }
    
    set itemSize(size)
    {
        this._itemSize = size;
    }
    
    arrangeItems()
    {
    }
    
    animateItems()
    {       
    }
}

class RandomPlacementLayout extends ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        super(stage, itemSize, stageSize);
        this._drifting = true;
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

        for (const item of this.stage.items) {
            const element = item.element;

            const x = Stage.randomInt(-allowedMinXClip, this._stageSize.width - allowedMaxXClip);
            const y = Stage.randomInt(-allowedMinYClip, this._stageSize.height - allowedMaxYClip);
            
            console.log(`allowedMinYClip ${allowedMinYClip} allowedMaxYClip ${allowedMaxYClip} y ${y} item height ${this._itemSize.height}`);
        
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            
            if (this._drifting) {
                const driftScalarMin = -0.5;
                const driftScalarMax = 0.5;
                item.velocity = item.velocity || new Size(Stage.random(driftScalarMin, driftScalarMax), Stage.random(driftScalarMin, driftScalarMax));
            }
        }
    }

    animateItems()
    {
        if (!this._drifting)
            return;

        if (0) {
            // FIXME: Gecko doesn't supported the CSS Typed OM.
            for (const item of this.stage.items) {
                const leftValue = item.element.attributeStyleMap.get('left');
                leftValue.value += item.velocity.width;
                item.element.attributeStyleMap.set('left', leftValue);

                const topValue = item.element.attributeStyleMap.get('top');
                topValue.value += item.velocity.height;
                item.element.attributeStyleMap.set('top', topValue);
            }
        } else {
            for (const item of this.stage.items) {
                let leftValue = parseFloat(item.element.style.left);
                leftValue += item.velocity.width;
                item.element.style.left = `${leftValue.toFixed(2)}px`;

                let topValue = parseFloat(item.element.style.top);
                topValue += item.velocity.height;
                item.element.style.top = `${topValue.toFixed(2)}px`;
            }
        }
    }
}

class FanLayout3D extends ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        super(stage, itemSize, stageSize);
        this._container.classList.add('layout-fan');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;
        const startAngle = -80;
        const endAngle = 80;
        const angleIncrement = (endAngle - startAngle) / (itemCount - 1);
        
        for (let i = 0; i < this.stage.items.length; ++ i) {
            const child = this.stage.items[i].element;
            child.style.transform = `rotate3d(0, 1, 0, ${startAngle + angleIncrement * i}deg) translateZ(-50vw)`;
        }
    }
}

class Grid2DLayout extends ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        super(stage, itemSize, stageSize);
        this._container.classList.add('grid-2d');
    }

    arrangeItems()
    {
        const itemCount = this._container.children.length;

        const stageAspectRatio = this._stageSize.width / this._stageSize.height;
        const itemAspectRatio = this._itemSize.width / this._itemSize.height;
        const rowsToColsRatio = stageAspectRatio / itemAspectRatio;
        
        const columnCount = Math.ceil(Math.sqrt(itemCount / rowsToColsRatio));
        const rowCount = Math.ceil(itemCount / columnCount);

        const cellSize = new Size(this._stageSize.width / columnCount, this._stageSize.height / rowCount);
        const scale = Math.min(cellSize.width / this._itemSize.width, cellSize.height / this._itemSize.height);

        for (let i = 0; i < this.stage.items.length; ++ i) {
            const child = this.stage.items[i].element;

            const row = Math.floor(i / columnCount);
            const col = i % columnCount;

            child.style.translate = `${col * cellSize.width}px ${row * cellSize.height}px`;
            child.style.scale = scale;
        }
    }
}

class PictureWallLayout3D extends ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        super(stage, itemSize, stageSize);
        this.oneUpFront = true;
        this._container.classList.add('picture-wall');
    }

    arrangeItems()
    {
        let itemCount = this.stage.items.length;
        
        if (this.oneUpFront && itemCount > 0)
            --itemCount;

        const stageAspectRatio = this._stageSize.width / this._stageSize.height;
        const itemAspectRatio = this._itemSize.width / this._itemSize.height;
        const rowsToColsRatio = stageAspectRatio / itemAspectRatio;
        
        const columnCount = Math.ceil(Math.sqrt(itemCount / rowsToColsRatio));
        const rowCount = Math.ceil(itemCount / columnCount);

        const cellSize = new Size(this._stageSize.width / columnCount, this._stageSize.height / rowCount);
        const scale = Math.min(cellSize.width / this._itemSize.width, cellSize.height / this._itemSize.height);

        const startAngle = 60;
        const endAngle = -60;
        const angleIncrement = (endAngle - startAngle) / (columnCount - 1);
        
        const totalWidth = cellSize.width * columnCount;
        // Compute a radius such that the totalWidth covers the circumference of the arc between startAngle and endAngle.
        const radius = totalWidth / (((startAngle - endAngle) / 360) * 2 * Math.PI);

        let startIndex = 0;
        let offset = 0;
        if (this.oneUpFront) {
            startIndex = 1;
            offset = -1;
            const firstElement = this.stage.items[0].element;
            firstElement.classList.add('one-up');
            firstElement.style.transform = `translate(0, ${(this._stageSize.height - this._itemSize.height) / 2}px)`;
        }
        
        for (let i = startIndex; i < this.stage.items.length; ++ i) {
            const indexInGrid = i + offset;
            const child = this.stage.items[i].element;

            const row = Math.floor(indexInGrid / columnCount);
            const col = indexInGrid % columnCount;

            child.style.transform = `translate(0, ${row * cellSize.height}px) rotate3d(0, 1, 0, ${startAngle + angleIncrement * col}deg) translateZ(${-radius}px) scale(${scale})`;
        }
    }
}

class ZStackLayout3D extends ItemLayout {
    constructor(stage, itemSize, stageSize)
    {
        super(stage, itemSize, stageSize);
        this._container.classList.add('z-stack');
    }

    arrangeItems()
    {
        const itemCount = this.stage.items.length;

        const closeZ = 0;
        const distantZ = 2000;
        const zIncrement = (closeZ - distantZ) / (itemCount - 1);

        const xSpace = (this._stageSize.width - this._itemSize.width) / 2;
        const minX = -xSpace;
        const maxX = xSpace;
        const xIncrement = (maxX - minX) / (itemCount - 1);

        const ySpace = (this._stageSize.height - this._itemSize.height) / 2;
        const minY = -ySpace;
        const maxY = ySpace;
        const yIncrement = (maxY - minY) / (itemCount - 1);
        
        for (let i = 0; i < this.stage.items.length; ++ i) {
            const child = this.stage.items[i].element;
            child.style.transform = `translate(${minX + i * xIncrement}px, ${minY + i * yIncrement}px) rotate3d(0, 1, 0, -4deg) translateZ(${closeZ + i * zIncrement}px)`;
        }
    }
}

/* ------------------------------------------------------------ */

class Item {
    constructor(container, data)
    {
        this.data = data;
        this.#createElements(container);
    }
    
    remove()
    {
        this.element.remove();
    }
    
    measureSize(container)
    {
        const bounds = this.element.getBoundingClientRect();
        return new Size(bounds.width, bounds.height);
    }

    #createElements(container)
    {
        this.element = this.#createElement('section', 'item');
        this.wrapper = this.#createElement('div', 'wrapper');
        
        const writingMode = this.data['writing-mode'];
        if (writingMode)
            this.wrapper.style.writingMode = writingMode;

        const dir = this.data['direction'];
        if (dir)
            this.wrapper.style.direction = dir;

        this.heading = this.#createElement('h1', 'heading', this.data['chapter-title']);
        this.bodyText = this.#createElement('p', 'body-text', this.data['paragraph-1']);

        this.wrapper.appendChild(this.heading);
        this.wrapper.appendChild(this.bodyText);

        this.element.appendChild(this.wrapper);
        this.element.style.setProperty("--random", Stage.randomInt(0, 4000));
        
        container.appendChild(this.element);
    }

    #createElement(tagName, className, htmlContent)
    {
        const element = document.createElement(tagName);
        element.className = className;
        if (htmlContent)
            element.innerHTML = htmlContent;
        return element;
    }

    #colorizeWords(container)
    {
        const segmenter = new Intl.Segmenter([], { granularity: 'word' });
        const segmentedText = segmenter.segment(container.textContent);
        const words = [...segmentedText].filter(s => s.isWordLike).map(s => s.segment);

        container.textContent = '';
        for (let word of words) {
            const span = document.createElement('span');
            span.textContent = word;
            container.appendChild(span);
            container.appendChild(document.createTextNode(' '));
        }
    }
}

class AliceStage extends Stage {
    constructor()
    {
        super();

        Pseudo.randomSeed = Date.now();
        this.container = document.getElementById('container');
        this.container.innerText = '';

        this._complexity = 0;
        this._items = [];
    }
    
    get items()
    {
        return this._items;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const response = await fetch('resources/text-source.json');
        if (!response.ok)
            console.error(`Failed to fetch JSON`);

        const jsonData = await response.json();
        this.textData = jsonData.data;

        const stageRect = this.element.getBoundingClientRect();
        this._stageRect = new Rect(Point.zero, new Size(stageRect.width, stageRect.height));
        
        let approximateItemSize = new Size(10, 10);
        this.layout = new RandomPlacementLayout(this, approximateItemSize, new Size(stageRect.width, stageRect.height));

        // We have to measure the item size after setting up the style for the layout.
        const item = new Item(this.container, this.textData[0]);
        approximateItemSize = item.measureSize()
        item.remove();
        
        this.layout.itemSize = approximateItemSize;
    }

    tune(count)
    {
        if (count == 0)
            return;

        const newComplexity = this._complexity + count;
        if (newComplexity < this._complexity) {

            let itemsToRemove = this._items.splice(newComplexity);
            itemsToRemove.forEach((item) => item.remove());

        } else if (newComplexity > this._complexity) {
            
            for (let itemCount = this._complexity; itemCount < newComplexity; ++itemCount) {
                const dataIndex = itemCount % this.textData.length;
                const item = new Item(this.container, this.textData[dataIndex]);
                this._items.push(item);
            }
        }

        this._complexity = newComplexity;
        this.layout.arrangeItems();
    }

    animate()
    {
        this.layout.animateItems();
    }

    complexity()
    {
        return this._complexity;
    }
    
    #createHeading(textContent)
    {
        const heading = document.createElement('h1');
        heading.className = 'heading';
        heading.textContent = textContent;
        return heading;
    }
}

class AliceBenchmark extends Benchmark {
    constructor(options)
    {
        super(new AliceStage(), options);
    }
}

window.benchmarkClass = AliceBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 4;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1500;
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
