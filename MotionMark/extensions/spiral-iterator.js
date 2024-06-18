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

class SpiralIterator {
    gridSize;
    current;
    direction;
    size;
    count;

    directions = {
        top: 0,
        left: 1,
        bottom: 2,
        right: 3
    };

    moves = [
        new Size(0,  -1), // top
        new Size(-1,  0), // left
        new Size(0,  +1), // bottom
        new Size(+1,  0)  // right
    ];

    constructor(gridSize) {
        this.gridSize = gridSize;
        this.current = Point.zero();
        this.direction = this.directions.right;
        this.size = new Size(1, 1);
        this.count = 0;

    }

    isDone() {
        return this.count >= this.gridSize.area();
    }

    next() {
        ++this.count;

        if (this.isDone())
            return;

        let direction = this.direction;
        let move = this.moves[direction];

        if (Math.abs(this.current.x) == Math.abs(this.current.y)) {
            // Turn left.
            direction = (direction + 1) % 4;

            if (this.current.x >= 0 && this.current.y >= 0) {
                if (this.size.width < Math.min(this.gridSize.width, this.gridSize.height))
                    this.size.expand(2, 2);
                else if (this.size.width < this.gridSize.width)
                    ++this.size.width;

                move = this.moves[this.directions.right];
            } else
                move = this.moves[direction];
        }

        if (this.count < this.size.area()) {
            this.current.add(move);
            this.direction = direction;
            return;
        }

        // Make a U-turn.
        this.direction = (this.direction + 1) % 4;

        if (this.direction == this.directions.left || this.direction == this.directions.right)
            this.current.add(this.moves[this.direction].scaled(this.size.width++));
        else
            this.current.add(this.moves[this.direction].scaled(this.size.height++));

        this.direction = (this.direction + 1) % 4;
    }
}
