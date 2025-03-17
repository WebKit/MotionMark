/*
 * Copyright (C) 2025 Apple Inc. All rights reserved.
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


class ChartController {
    constructor(stage, containerElement)
    {
        this.stage = stage;
        this._complexity = 0;
        this.containerElement = containerElement;
    }

    async initialize()
    {
    }

    get complexity()
    {
        return this._complexity;
    }
    
    set complexity(complexity)
    {
        this._complexity = complexity;
    }
    
    animate(timestamp)
    {
    }    
}

class DashboardStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        const stageClientRect = this.element.getBoundingClientRect();

        await this.#loadData(benchmark);
        
        this.throughputController = new ThroughputController(this, document.getElementById('throughput'));
        await this.throughputController.initialize();

        this.trafficController = new TrafficController(this, document.getElementById('traffic'));
        await this.trafficController.initialize();

        this.utilizationController = new UtilizationController(this, document.getElementById('utilization'));
        await this.utilizationController.initialize();

        this.bandwidthController = new BandwidthController(this, document.getElementById('bandwidth'));
        await this.bandwidthController.initialize();

        this.domainsController = new DomainsController(this, document.getElementById('domains'));
        await this.domainsController.initialize();
    }

    async #loadData(benchmark)
    {

    }

    async #loadDataJSON()
    {
        const url = "resources/treeoflife.json";
        const response = await fetch(url);
        if (!response.ok) {
            const errorString = `Failed to load data source ${url} with error ${response.status}`
            console.error(errorString);
            throw errorString;
        }
    
        this.jsonData = await response.json();
        this.dataSet = new TreeOfLifeDataSet(this.jsonData);
    }
    
    async #loadImages()
    {
    }
    
    tune(count)
    {
        if (count === 0)
            return;

        this._complexity += count;

        console.log(`tune ${count} complexity ${this._complexity}`);
        this.throughputController.complexity = this._complexity;
        this.trafficController.complexity = this._complexity;
        this.utilizationController.complexity = this._complexity;
        this.bandwidthController.complexity = this._complexity;
        this.domainsController.complexity = this._complexity;
    }

    animate()
    {
        const timestamp = Date.now();
        this.throughputController.animate(timestamp);
        this.trafficController.animate(timestamp);
        this.utilizationController.animate(timestamp);
        this.bandwidthController.animate(timestamp);
        this.domainsController.animate(timestamp);
    }

    complexity()
    {
        return this._complexity;
    }
}

class DashboardBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new DashboardStage(stage), options);
    }
}

window.benchmarkClass = DashboardBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 200;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1000;
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
    benchmark._controller = new FakeController(benchmark);
    
    await benchmark.initialize({ });
    benchmark.run().then(function(testData) {

    });

}, false);
