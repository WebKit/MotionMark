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

class Size {
    width;
    height;

    constructor(...args) {
        let width = 0;
        let height = 0;

        if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
            width = args[0];
            height = args[1];
        } else if (args.length == 1 && typeof args[0] == "number") {
            width = args[0];
            height = args[0];
        } else if (args.length == 1 && args[0] instanceof Size) {
            width = args[0].width;
            height = args[0].height;
        } else if (args.length == 1 && args[0] instanceof Point) {
            width = args[0].x;
            height = args[0].y;
        }

        this.width = width;
        this.height = height;
    }

    static elementClientSize(element) {
        var rect = element.getBoundingClientRect();
        return new Size(rect.width, rect.height);
    }

    expand(width, height) {
        this.width += width;
        this.height += height;
    }

    shrink(width, height) {
        this.width -= width;
        this.height -= height;
    }

    add(size) {
        this.expand(size.width, size.height);
    }

    subtract(size) {
        this.expand(-size.width, -size.height);
    }

    scale(...args) {
        let scaleX = 1;
        let scaleY = 1;

        if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
            scaleX = args[0];
            scaleY = args[1];
        } else if (args.length == 1 && typeof args[0] == "number") {
            scaleX = args[0];
            scaleY = args[0];
        } else if (args.length == 1 && args[0] instanceof Size) {
            scaleX = args[0].width;
            scaleY = args[0].height;
        }

        this.width *= scaleX;
        this.height *= scaleY;
    }

    scaled(...args) {
        let size = new Size(this);
        size.scale(...args);
        return size;
    }

    divideBy(...args) {
        let scaleX = 1;
        let scaleY = 1;

        if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
            scaleX = args[0];
            scaleY = args[1];
        } else if (args.length == 1 && typeof args[0] == "number") {
            scaleX = args[0];
            scaleY = args[0];
        } else if (args.length == 1 && args[0] instanceof Size) {
            scaleX = args[0].width;
            scaleY = args[0].height;
        }

        this.width /= scaleX ? scaleX : 1;
        this.height /= scaleY ? scaleY : 1
    }

    dividedBy(...args) {
        let size = new Size(this);
        size.divideBy(...args);
        return size;
    }

    area() {
        return this.width * this.height;
    }
}
