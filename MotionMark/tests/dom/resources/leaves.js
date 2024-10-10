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

class SimpleLeaf extends Leaf {
    static get sizeMinimum() { return 25; }
    static get sizeRange() { return 0; }
    static get usesOpacity() { return false; }

    constructor(stage)
    {
        super(stage);
    }

    move()
    {
        this.element.style.transform = "translate(" + this._position.x + "px, " + this._position.y + "px)" + this.rotater.rotateZ();
    }
}

class ScaleLeaf extends Leaf {
    static get sizeMinimum() { return 20; }
    static get sizeRange() { return 30; }
    static get usesOpacity() { return false; }

    constructor(stage)
    {
        super(stage);
    }

    move()
    {
        this.element.style.transform = "translate(" + this._position.x + "px, " + this._position.y + "px)" + this.rotater.rotateZ();
    }
}

class OpacityLeaf extends Leaf {
    static get sizeMinimum() { return 25; }
    static get sizeRange() { return 0; }
    static get usesOpacity() { return true; }

    constructor(stage)
    {
        super(stage);
    }

    move()
    {
        this.element.style.transform = "translate(" + this._position.x + "px, " + this._position.y + "px)" + this.rotater.rotateZ();
        this.element.style.opacity = this._opacity;
    }
}


class LeavesDerivedBenchmark extends LeavesBenchmark {
    constructor(options)
    {
        switch (options["style"]) {
        case "simple":
            window.Leaf = SimpleLeaf;
            break;
        case "scale":
            window.Leaf = ScaleLeaf;
            break;
        case "opacity":
            window.Leaf = OpacityLeaf;
            break;
        }
        super(options);
    }
}

window.benchmarkClass = LeavesDerivedBenchmark;
