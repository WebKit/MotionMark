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

class ImageCanvas {
    static size = new Size(50, 50);
    static pixelStride = 4;
    static rowStride = ImageCanvas.size.width * ImageCanvas.pixelStride;
    static weightNegativeThreshold = 0.04;
    static weightPositiveThreshold = 0.96;
    stage;
    image;
    canvas;

    constructor(stage) {
        this.stage = stage;
        this.image = Random.itemInArray(stage.images);
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = ImageCanvas.size.width;
        this.canvas.height = ImageCanvas.size.height;
        this.canvas.style.width = ImageCanvas.size.width + 'px';
        this.canvas.style.height = ImageCanvas.size.height + 'px';
        this.stage.element.appendChild(this.canvas);

        this.reset();
    }

    show() {
        this.canvas.style.display = "block";
        this.reset();
    }

    hide() {
        this.canvas.style.display = "none";
    }

    reset() {
        let tiles = this.stage.size.dividedBy(ImageCanvas.size);
        let left = Random.integer(0, Math.floor(tiles.width) - 1) * ImageCanvas.size.width;
        let top = Random.integer(0, Math.floor(tiles.height) - 1) * ImageCanvas.size.height;

        this.canvas.style.top = top + 'px';
        this.canvas.style.left = left + 'px';
    }

    randomDistance()
    {
        let factor = ImageCanvas.weightPositiveThreshold - ImageCanvas.weightNegativeThreshold;
        let xOffset = Math.floor((Pseudo.random() - ImageCanvas.weightNegativeThreshold) / factor);
        let yOffset = Math.floor((Pseudo.random() - ImageCanvas.weightNegativeThreshold) / factor);
        return yOffset * ImageCanvas.rowStride + xOffset * ImageCanvas.pixelStride;
    }

    animate(timestamp, lastFrameLength) {
        let context = this.canvas.getContext("2d");

        let imageData = context.getImageData(0, 0, ImageCanvas.size.width, ImageCanvas.size.height);
        let dataLength = imageData.data.length;
        let didDraw = false;

        for (let j = 0; j < dataLength; j += ImageCanvas.pixelStride) {
            if (imageData.data[j + 3] === 0)
                continue;

            // Get random neighboring pixel color.
            let neighbor = (j + this.randomDistance()) % dataLength;

            // Update the RGB data
            imageData.data[j] = imageData.data[neighbor];
            imageData.data[j + 1] = imageData.data[neighbor + 1];
            imageData.data[j + 2] = imageData.data[neighbor + 2];
            imageData.data[j + 3] = imageData.data[neighbor + 3];
            didDraw = true;
        }

        if (didDraw)
            context.putImageData(imageData, 0, 0);
        else {
            this.reset();
            context.drawImage(this.image, 0, 0, ImageCanvas.size.width, ImageCanvas.size.height);
        }
    }
}

class ImageCanvasesStage extends ReusableParticlesStage {
    imageSources;
    images;

    constructor() {
        super();

        this.imageSources = [
            "compass",
            "console",
            "contribute",
            "debugger",
            "inspector",
            "layout",
            "performance",
            "script",
            "shortcuts",
            "standards",
            "storage",
            "styles",
            "timeline"
        ];
        this.images = [];
    }

    loadImages() {
        return this.imageSources.map((imageSource) => {
            return new Promise((resolve) => {
                let image = new Image;
                image.onload = (e) => {
                    resolve({ width: image.width, height: image.height });
                };
                image.src = "../core/images/" + imageSource + "100.png";
                this.images.push(image);             
            });
        });
    }

    createParticle() {
        return new ImageCanvas(this);
    }
}

class ImageCanvasesAnimator extends Animator {
    constructor(test, settings) {
        super(new ImageCanvasesStage(), test, settings);
    }

    async run() {
        await Promise.all(this.stage.loadImages());
        return super.run();
    }
}

window.animatorClass = ImageCanvasesAnimator;
