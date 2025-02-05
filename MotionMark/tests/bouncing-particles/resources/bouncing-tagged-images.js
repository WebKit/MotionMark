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

class BouncingTaggedImage extends BouncingParticle {
    constructor(stage)
    {
        super(stage);

        this.element = document.createElement("img");
        this.element.style.width = this.size.x + "px";
        this.element.style.height = this.size.y + "px";
        this.element.setAttribute("src", Stage.randomElementInArray(stage.images).src);

        stage.element.appendChild(this.element);
        this._move();
    }

    _move()
    {
        this.element.style.transform = "translate(" + this.position.x + "px," + this.position.y + "px) " + this.rotater.rotateZ();
    }

    animate(timeDelta)
    {
        super.animate(timeDelta);
        this._move();
    }
}

class BouncingTaggedImagesStage extends BouncingParticlesStage {
    static imageSrcs = [
        "image1",
        "image2",
        "image3",
        "image4",
        "image5",
    ];

    constructor()
    {
        super();
        this.images = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        const loadingPromises = [];
        BouncingTaggedImagesStage.imageSrcs.forEach(imageSrc => {
            loadingPromises.push(this._loadImage("resources/" + imageSrc + ".jpg"));
        });
        await Promise.all(loadingPromises);
    }

    _loadImage(src)
    {
        return new Promise(resolve => {
            const img = new Image;
            img.addEventListener('load', () => resolve(img));
            img.src = src;
            this.images.push(img);
        });
    }

    createParticle()
    {
        return new BouncingTaggedImage(this);
    }

    particleWillBeRemoved(particle)
    {
        particle.element.remove();
    }
}

class BouncingTaggedImagesBenchmark extends Benchmark {
    constructor(options)
    {
        super(new BouncingTaggedImagesStage(), options);
    }
}

window.benchmarkClass = BouncingTaggedImagesBenchmark;
