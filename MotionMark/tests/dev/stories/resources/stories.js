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
    constructor(content, mainImage, badgeSVG)
    {
        this.value = Stage.random(0.1, 1);
        
        this.label = content.title;
        this.isRTL = content.rtl;
        this.paragraphText = content.body;
        
        this.mainImage = mainImage.cloneNode();
        this.element = undefined;
        
        this.badgeImage = document.createElement('img');
        this.badgeImage.src = this.#dataURIFromSVG(badgeSVG);
    
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
            
            badgeContainer.appendChild(this.badgeImage);
            this.element.appendChild(badgeContainer);
            this.element.appendChild(this.mainImage);

            const shadowBox = document.createElement('div');
            shadowBox.className = 'shadow';
            this.element.appendChild(shadowBox);

            const childBox = document.createElement('div');
            childBox.className = 'overlay';
            const childSpan = document.createElement('span');
            childSpan.textContent = this.label;

            childBox.appendChild(childSpan);
            
            const textContainer = document.createElement('div');
            textContainer.className = 'text-container';
            textContainer.textContent = this.paragraphText;
            this.element.appendChild(textContainer);

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
    
    #dataURIFromSVG(svgMarkup)
    {
        // From https://codepen.io/tigt/post/optimizing-svgs-in-data-uris
        function encodeSvg(svgString)
        {
            return svgString.replace('<svg',(~svgString.indexOf('xmlns')?'<svg':'<svg xmlns="http://www.w3.org/2000/svg"'))
                .replace(/"/g, '\'')
                .replace(/%/g, '%25')
                .replace(/#/g, '%23')       
                .replace(/{/g, '%7B')
                .replace(/}/g, '%7D')         
                .replace(/</g, '%3C')
                .replace(/>/g, '%3E')
                .replace(/\s+/g,' ');
        }
        return `data:image/svg+xml,${encodeSvg(svgMarkup)}`;
    }
}

class StoriesController {
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

        const itemWidth = this.stageSize.width / 6;
        const itemHeight = this.stageSize.height / 3;
        
        const xMax = this.stageSize.width - itemWidth;
        const yMax = this.stageSize.height - itemHeight;

        for (let i = 0; i < this._complexity; ++i) {
            const item = this.items[i];
            const element = item.ensureElement();

            const data = {
                // FIXME: Do some smarter layout that reduces overlap.
                x: Stage.randomInt(0, xMax),
                y: Stage.randomInt(0, yMax),
                width: itemWidth,
                height: itemHeight,
            };
            
            item.applyStyle(data);

            if (!element.parentElement)
                this.container.appendChild(element);
        }
    }
    
    #createBox(boxIndex)
    {
        const boxContent = this.stage.content[boxIndex % this.stage.content.length];
        const image = this.stage.images[boxIndex % this.stage.images.length];
        const badgeSVG = this.stage.badges[boxIndex % this.stage.badges.length].svg;

        return new BoxItem(boxContent, image, badgeSVG);
    }
    
    animate()
    {
        const timestamp = Date.now();
        for (const boxItem of this.items)
            boxItem.animate(timestamp);
    }
}


class StoriesStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.controller = new StoriesController(this);

        const response = await fetch('resources/stories-data.json');
        if (!response.ok)
            console.error(`Failed to fetch JSON`);
        
        const jsonData = await response.json();
        this.content = jsonData['content'];
        this.badges = jsonData['badges'];
        
        this.images = [];
        await this.#loadImages(jsonData['images']);
    }

    async #loadImages(fillImages)
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

class StoriesBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new StoriesStage(stage), options);
    }
}

window.benchmarkClass = StoriesBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 29;
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
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    await benchmark.initialize({ });
    benchmark._controller = new FakeController(benchmark);
    benchmark.run().then(function(testData) {

    });

}, false);
