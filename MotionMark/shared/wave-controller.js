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

class WaveController extends Controller {
    rampIndex;
    rampCount;
    controller;

    constructor(settings) {
        super(new Timeline, settings);

        this.rampIndex = -1;
        this.rampCount = Math.max(1, Math.floor(settings.testLength / RampController.rampLength));

        this.controller = new ExponentialController(this.timeline, this.settings);
    }

    nextComplexity(timestamp) {
        if (this.rampIndex >= this.rampCount)
            return 0;

        let nextComplexity = this.controller.nextComplexity(timestamp);
        if (nextComplexity > 0)
            return nextComplexity;

        if (++this.rampIndex == this.rampCount)
            return 0;

        let complexityRange = this.controller.nextComplexityRange();
        this.controller = new RampController(this.timeline, this.settings, complexityRange);
        return this.controller.nextComplexity(timestamp);
    }
}
