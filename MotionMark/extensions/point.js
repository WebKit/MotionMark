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

class Point {
    x;
    y;

    constructor(...args) {
        let x = 0;
        let y = 0;

        if (args.length == 2 && typeof args[0] == "number" && typeof args[1] == "number") {
            x = args[0];
            y = args[1];
        } else if (args.length == 1 && args[0] instanceof Point) {
            x = args[0].x;
            y = args[0].y;
        } else if (args.length == 1 && args[0] instanceof Size) {
            x = args[0].width;
            y = args[0].height;
        }

        this.x = x;
        this.y = y;
    }

    static zero() {
        return new Point();
    }

    static fromVector(magnitude, direction) {
        return new Point(magnitude * Math.cos(direction), magnitude * Math.sin(direction));
    }

    add(...args) {
        let dx = 0;
        let dy = 0;

        if (args.length == 1 && args[0] instanceof Point) {
            dx = args[0].x;
            dy = args[0].y;
        } else if (args.length == 1 && args[0] instanceof Size) {
            dx = args[0].width;
            dy = args[0].height;
        } 

        this.x += dx;
        this.y += dy;
    }

    subtract(...args) {
        let dx = 0;
        let dy = 0;

        if (args.length == 1 && args[0] instanceof Point) {
            dx = args[0].x;
            dy = args[0].y;
        } else if (args.length == 1 && args[0] instanceof Size) {
            dx = args[0].width;
            dy = args[0].height;
        } 

        this.x -= dx;
        this.y -= dy;
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

        this.x *= scaleX;
        this.y *= scaleY;
    }

    scaled(...args) {
        let point = new Point(this);
        point.scale(...args);
        return point;
    }

    normalize() {
        let length = this.length();
        this.x /= length;
        this.y /= length;
    }

    normalized() {
        let point = new Point(this);
        point.normalize();
        return point;
    }

    distanceTo(point) {
        return new Size(this.x - point.x, this.y - point.y);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
