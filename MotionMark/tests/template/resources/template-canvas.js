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

class TemplateCanvasObject
{
    constructor(stage)
    {
        super(stage);
    }

    // For the canvas stage, most likely you will need to create your
    // animated object since it's only draw time thing.

    // Fill in your object data.
    
    _draw()
    {
        // Draw your object.
    }

    animate(timeDelta)
    {
        // Redraw the animated object. The last time this animated
        // item was drawn before 'timeDelta'.

        // Move your object.

        // Redraw your object.
        this._draw();
    }
}

class TemplateCanvasStage extends Stage {
    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.context = this.element.getContext("2d");
        // Define a collection for your objects.
        // await any async work (e.g. image loading).
    }

    tune(count)
    {
        // If count is -ve, -count elements need to be removed form the
        // stage. If count is +ve, +count elements need to be added to
        // the stage.

        // Change objects in the stage.
    }

    animate(timeDelta)
    {
        // Animate the elements such that all of them are redrawn. Most
        // likely you will need to call TemplateCanvasObject.animate()
        // for all your animated objects here.

        // Most likely you will need to clear the canvas with every redraw.
        this.context.clearRect(0, 0, this.size.x, this.size.y);

        // Loop through all your objects and ask them to animate.
    }
}

class TemplateCanvasBenchmark extends Benchmark {
    constructor(options)
    {
        super(new TemplateCanvasStage(), options);
    }
}

window.benchmarkClass = TemplateCanvasBenchmark;
