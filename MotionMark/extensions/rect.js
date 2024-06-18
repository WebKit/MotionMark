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

class Rect {
    location;
    size;

    constructor(...args) {
        if (args.length == 4 && typeof args[0] == "number" && typeof args[1] == "number" && typeof args[2] == "number" && typeof args[3] == "number") {
            this.location = new Point(args[0], args[1]);
            this.size = new Size(args[2], args[3]);
        } else if (args.length == 2 &&  args[0] instanceof Point && args[1] instanceof Size) {
            this.location = new Point(args[0]);
            this.size = new Size(args[1]);
        } else if (args.length == 1 && args[0] instanceof Rect) {
            this.location = args[0].location;
            this.size = args[0].size;
        } else {
            this.location = new Point();
            this.size = new Size();
        }
    }

    static elementClientRect(element) {
        return new Rect(Point.zero(), Size.elementClientSize(element));
    }

    center() {
        return new Point(this.location.x + this.size.width / 2, this.location.y + this.size.height / 2);
    }

    inflateX(dx) {
        this.location.x -= dx;
        this.size.width += dx + dx;
    }

    inflateY(dy) {
        this.location.y -= dy;
        this.size.height += dy + dy;
    }

    inflate(...args) {
        let dx = 0;
        let dy = 0;

        if (args.length == 1 && typeof args[0] == "number") {
            dx = args[0];
            dy = args[0];
        } else if (args.length == 1 && args[0] instanceof Size) {
            dx = args[0].width;
            dy = args[0].height;
        }

        this.inflateX(dx);
        this.inflateY(dy);
    }

    expand(...args) {
        if (args.length == 1 && typeof args[0] instanceof Size)
            this.size.add(args[0]);
        else if (args.length == 1 && typeof args[0] instanceof Insets) {
            this.location.subtract(args[0].left, args[0].top);
            this.size.expand(args[0].left + args[0].right, args[0].top + args[0].bottom);
        }
    }

    contract(...args) {
        if (args.length == 1 && typeof args[0] instanceof Size)
            this.size.subtract(args[0]);
        else if (args.length == 1 && typeof args[0] instanceof Insets) {
            this.location.add(args[0].left, args[0].top);
            this.size.shrink(args[0].left + args[0].right, args[0].top + args[0].bottom);
        }
    }

    get x() {
        return this.location.x;
    }

    get y() {
        return this.location.y;
    }

    get width() {
        return this.size.width;
    }

    get height() {
        return this.size.height;
    }

    get maxX() {
        return this.x + this.width;
    }

    get maxY() {
        return this.y + this.height;
    }
}
