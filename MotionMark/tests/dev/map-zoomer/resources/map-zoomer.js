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

// To be moved.
class MathHelpers {
    static random(min, max)
    {
        return min + Pseudo.random() * (max - min);
    }

    static rotatingColor(hueOffset, cycleLengthMs, saturation, lightness)
    {
        return "hsl("
            + MathHelpers.dateFractionalValue(cycleLengthMs, hueOffset) * 360 + ", "
            + ((saturation || .8) * 100).toFixed(0) + "%, "
            + ((lightness || .35) * 100).toFixed(0) + "%)";
    }

    // Returns a fractional value that wraps around within [0,1]
    static dateFractionalValue(cycleLengthMs, offset)
    {
        return (offset + Date.now() / (cycleLengthMs || 2000)) % 1;
    }
    
    static cheapHash(s)
    {
        let hash = 0, i = 0, len = s.length;
        while ( i < len )
            hash  = ((hash << 5) - hash + s.charCodeAt(i++)) << 0;

        return hash + 2147483647 + 1;
    }
    
    // JavaScripts % operator is remainder, not modulo.
    static modulo(dividend, divisor)
    {
        const quotient = Math.floor(dividend / divisor);
        return dividend - divisor * quotient;
    }

    static normalizeRadians(radians)
    {
        return MathHelpers.modulo(radians, Math.PI * 2);
    }
}

class RandomWalk {
    constructor(min, max, stepFraction)
    {
        this.min = min;
        this.max = max;
        this.stepFraction = stepFraction;
        this.value = MathHelpers.random(this.min, this.max);
    }
    
    nextValue()
    {
        const scale = (this.max - this.min) * this.stepFraction;
        const delta = scale * 2 * (Pseudo.random() - 0.5);
        this.value = Math.max(Math.min(this.value + delta, this.max), this.min);
        return this.value;
    }
}

class SmoothWalk {
    static timeOrigin;
    constructor(min, max)
    {
        this.min = min;
        this.max = max;
        
        const minWaveLength = 200;
        const maxWaveLength = 2000;

        const amplitudeMin = 0.2;
        const amplitudeMax = 1;
        // We superimpose some sin functions to generate the values.
        this.wave1Phase = Pseudo.random();
        this.wave1Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave1Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);

        this.wave2Phase = Pseudo.random();
        this.wave2Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave2Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);

        this.wave3Phase = Pseudo.random();
        this.wave3Length = MathHelpers.random(minWaveLength, maxWaveLength);
        this.wave3Amplitude = MathHelpers.random(amplitudeMin, amplitudeMax);
        
        if (!SmoothWalk.timeOrigin)
            SmoothWalk.timeOrigin = new Date();
    }
    
    nextValue()
    {
        this.value = this.#computeValue();
        return this.value;
    }
    
    #computeValue()
    {
        const elapsedTime = Date.now() - SmoothWalk.timeOrigin;
        const wave1Value = this.wave1Amplitude * (0.5 + Math.sin(this.wave1Amplitude + elapsedTime / this.wave1Length) / 2);
        const wave2Value = this.wave2Amplitude * (0.5 + Math.sin(this.wave2Amplitude + elapsedTime / this.wave2Length) / 2);
        const wave3Value = this.wave3Amplitude * (0.5 + Math.sin(this.wave3Amplitude + elapsedTime / this.wave3Length) / 2);
        
        return this.min + (this.max - this.min) * (wave1Value + wave2Value + wave3Value) / (this.wave1Amplitude + this.wave2Amplitude + this.wave3Amplitude);
    }
}

// FIXME: Move to shared code.
class Animator {
    constructor(min, max)
    {
        this.min = min;
        this.max = max;
    }
    
    valueForTime(timestampMS)
    {
        return this.min;
    }
}

class RampAnimator extends Animator {
    constructor(min, max, durationMS, phaseMS, alternate)
    {
        super(min, max);
        this.durationMS = durationMS;
        this.phaseMS = phaseMS;
    }

    valueForTime(timestampMS)
    {
        const offset = ((timestampMS + this.phaseMS) % this.durationMS) / this.durationMS;
        return Utilities.lerp(offset, this.min, this.max);
    }
}

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

class PseudoMercator {
    static xyFromLongLat(long, lat)
    {
        return new Point(
            PseudoMercator.xFromLong(long),
            PseudoMercator.yFromLat(lat)
        );
    }

    static yFromLat(lat)
    {
        const latRadians = lat * DEG2RAD;
        return Math.log(Math.tan(latRadians) + 1 / Math.cos(latRadians)) * RAD2DEG;
    }

    static xFromLong(long)
    {
        return long;
    }
}

class OpenStreetMap {
    static tileIndexForLongLat(longLat, zoom)
    {
        const latRadians = longLat.y * DEG2RAD;
        const numTiles = Math.pow(2, zoom);
        return new Point(
            (longLat.x + 180) / 360 * numTiles,
            (1 - Math.log(Math.tan(latRadians) + 1 / Math.cos(latRadians)) / Math.PI) / 2 * numTiles
        );
    }

    static tileIndexForMercator(mercatorCoords, zoom)
    {
        const numTiles = Math.pow(2, zoom);
        return new Point(
            (0.5 + mercatorCoords.x / 360) * numTiles,
            (0.5 - mercatorCoords.y / 360) * numTiles
        );
    }

    static filePathForTile(column, row, zoom)
    {
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
        return `${zoom}/${column}/${row}.png`;
    }
}        

class GPSTrack {
    constructor(jsonURL, edgePaddingDegrees)
    {
        this.url = jsonURL;
        this.edgePaddingDegrees = edgePaddingDegrees;
    }
    
    async initialize()
    {
        const response = await fetch('resources/metadata/ride-gps.json');
        if (!response.ok)
            console.error(`Failed to fetch JSON`);
        
        const jsonData = await response.json();
        this.gpsPoints = jsonData.coords;

        // FIXME: We could subsample here: this.#subsampledGPSPoints()

        this.#computeProjectedCoordinates(this.gpsPoints);
    }

    #computeProjectedCoordinates()
    {
        const longIndex = 0;
        const latIndex = 1;

        const firstProjectedCoord = PseudoMercator.xyFromLongLat(this.gpsPoints[0][longIndex], this.gpsPoints[0][latIndex]);
        this.projectedMinCoord = firstProjectedCoord;
        this.projectedMaxCoord = firstProjectedCoord;

        this.projectedCoordinates = [];

        for (let [long, lat] of this.gpsPoints) {
            const projectedCoords = PseudoMercator.xyFromLongLat(long, lat);
            this.projectedMinCoord = this.projectedMinCoord.min(projectedCoords);
            this.projectedMaxCoord = this.projectedMaxCoord.max(projectedCoords);

            this.projectedCoordinates.push(projectedCoords);
        }
        
        const edgePadding = new Point(this.edgePaddingDegrees, this.edgePaddingDegrees);
        this.projectedMinCoord = this.projectedMinCoord.subtract(edgePadding);
        this.projectedMaxCoord = this.projectedMaxCoord.add(edgePadding);
    }

    // FIXME: Unused.
    #subsampledGPSPoints(subsampleDistanceMeters)
    {
        const EARTH_CIRCUMFERENCE_METERS = 40075016.686;
        const degreesPerMeter = 360 / EARTH_CIRCUMFERENCE_METERS;

        const subsampleDistance = subsampleDistanceMeters * degreesPerMeter;
        const subsampledCoords = [];

        let lastLong;
        let lastLat;

        for (let i = 0; i < this.gpsPoints.length; ++i) {
            let [long, lat] = this.gpsPoints[i];

            if (lastLong) {
                const xDistance = Math.abs(lastLong - long);
                const yDistance = Math.abs(lastLat - lat);
                const delta = Math.hypot(xDistance, yDistance);
                if (delta < subsampleDistance && i < coordinates.length - 1)
                    continue;
            }
            
            lastLong = long;
            lastLat = lat;

            subsampledCoords.push([long, lat]);
        }

        return subsampledCoords;
    }
}

const photoData = [
    {
        name: 'photo1.jpg',
        location: [-121.24030, 36.65313]
    },
    {
        name: 'photo2.jpg',
        location: [-121.03402, 36.49342]
    },
    {
        name: 'photo3.jpg',
        location: [-120.92240, 36.38022]
    },
    {
        name: 'photo4.jpg',
        location: [-120.74454, 36.37025]
    },
    {
        name: 'photo5.jpg',
        location: [-120.67648, 36.39135]
    },
    {
        name: 'photo6.jpg',
        location: [-120.6724, 36.41565]
    },
    {
        name: 'photo7.jpg',
        location: [-120.88513, 36.60696]
    },    
];

const mapWidth = 400;
const mapHeight = 320;

const tileWidth = 256;
const tileHeight = 256;

class MapRouteOverlay {
    constructor(map, index)
    {
        this.map = map;
        this.stage = map.stage;

        // First route sits at (0, 0); subsequent routes get a deterministic/random offset
        // chosen once at creation time so existing overlays never jump during tune().
        if (index === 0) {
            this.offsetX = 0;
            this.offsetY = 0;
            this.strokeColor = 'rgba(255, 0, 0, 0.8)';
        } else {
            const maxOffsetX = this.stage.mapWidth * 0.3;
            const maxOffsetY = this.stage.mapHeight * 0.3;
            this.offsetX = Stage.random(-maxOffsetX, maxOffsetX);
            this.offsetY = Stage.random(-maxOffsetY, maxOffsetY);
            this.strokeColor = Stage.randomRGBColor(0.8);
        }

        this.polyline = Utilities.createSVGElement('polyline', {
            points: this.stage.computeSVGPolyline(this.offsetX, this.offsetY),
            style: `stroke: ${this.strokeColor};`
        }, {}, this.map.pathGroup);

        this.placards = [];
        const initialScale = 1;
        for (const imageData of this.stage.photoData) {
            const placard = this.map.createPhotoPlacard(imageData.image.src);
            const photoGPS = new Point(imageData.location[0], imageData.location[1]);
            const baseCoords = this.stage.gpsToContainerPoint(photoGPS, 1);
            const x = baseCoords.x + this.offsetX;
            const y = baseCoords.y + this.offsetY;

            placard.baseX = x;
            placard.baseY = y;
            placard.style.left = `${(x * initialScale).toFixed(2)}px`;
            placard.style.top = `${(y * initialScale).toFixed(2)}px`;

            this.map.photosContainer.appendChild(placard);
            this.placards.push(placard);
        }
    }

    repositionPhotos(scale)
    {
        for (const placard of this.placards) {
            placard.style.left = `${(placard.baseX * scale).toFixed(2)}px`;
            placard.style.top = `${(placard.baseY * scale).toFixed(2)}px`;
        }
    }

    remove()
    {
        this.polyline.remove();
        for (const placard of this.placards)
            placard.remove();
    }
}

class ZoomableMap {
    constructor(stage)
    {
        this.stage = stage;
        this.animator = new RampAnimator(1, 1.2, 5000, Stage.random(0, 1));
        this.#buildElements();
    }
    
    #buildElements()
    {
        this.container = document.createElement('div');
        this.container.className = 'map-container';
        
        this.tilesContainer = document.createElement('div');
        this.tilesContainer.className = 'tiles-container';
        this.container.appendChild(this.tilesContainer);

        const controlsOverlay = document.createElement('div');
        controlsOverlay.className = 'controls-overlay';
        this.container.appendChild(controlsOverlay);

        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'map-controls';
        
        controlsContainer.innerHTML = `
            <a class='save-route'>Save Route</a>
            <a class='download-gpx'>GPX</a>
            <div class='drop-down'>
                <a class='map-type'>Standard Map</a>
            </div>
            <a class='reset-zoom'>Reset</a>
        `;
        controlsOverlay.appendChild(controlsContainer);

        const zoomControlsContainer = document.createElement('div');
        zoomControlsContainer.className = 'zoom-controls';
        
        zoomControlsContainer.innerHTML = `
            <a class="zoom-in" href="#" title="Zoom In" role="button" aria-label="Zoom In">+</a>
            <a class="zoom-out" href="#" title="Zoom In" role="button" aria-label="Zoom Out">-</a>
        `;        
        controlsOverlay.appendChild(zoomControlsContainer);

        const labelContainer = document.createElement('div');
        labelContainer.className = 'label';
        labelContainer.textContent = 'Map tiles from OpenStreetMap';
        this.container.appendChild(labelContainer);
        
        this.#setupTiles();
        this.#setupTrackContainer();
        this.#setupPhotosContainer();
    }
    
    #setupTiles()
    {
        const tilesWrapper = document.createElement('div');
        tilesWrapper.className = 'tiles-wrapper';
        
        for (let row = 0; row < this.stage.tileGridImages.length; row++) {
            const tileRow = this.stage.tileGridImages[row];
            for (let col = 0; col < tileRow.length; ++col) {
                const preloadedImage = tileRow[col];
                const tileImage = new Image();
                tileImage.src = preloadedImage.src;
                tileImage.style.translate = `${col * tileWidth}px ${row * tileHeight}px`;
                tilesWrapper.appendChild(tileImage);
            }
        }

        const tilesFractionalOffset = this.stage.tilesFractionalOffset;
        tilesWrapper.style.transform = `scale(${this.stage.tilesScaleFactor}) translate(${-tilesFractionalOffset.x}px, ${-tilesFractionalOffset.y}px)`;

        this.tilesZoomer = document.createElement('div');
        this.tilesZoomer.className = 'zoomer';
        this.tilesZoomer.appendChild(tilesWrapper);

        this.tilesContainer.appendChild(this.tilesZoomer);
    }
    
    #setupTrackContainer()
    {
        this.trackContainer = document.createElement('div');
        this.trackContainer.className = 'track-container';
        this.container.appendChild(this.trackContainer);
        
        const svgElement = Utilities.createSVGElement('svg', {
            'xmlns' : 'http://www.w3.org/2000/svg',
            'viewBox': `0 0 ${this.stage.mapWidth} ${this.stage.mapHeight}`,
        }, { }, this.trackContainer);
        
        this.pathGroup = Utilities.createSVGElement('g', { class: 'path-group' }, { }, svgElement);
    }
    
    #setupPhotosContainer()
    {
        this.photosContainer = document.createElement('div');
        this.photosContainer.className = 'photos-container';
        this.container.appendChild(this.photosContainer);
    }

    createPhotoPlacard(photoURL)
    {
        const photoImg = new Image();
        photoImg.src = photoURL;
        
        const placard = document.createElement('div');
        placard.className = 'photo-placard';

        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-container';
        photoContainer.appendChild(photoImg);

        placard.appendChild(photoContainer);
        return placard;
    }

    animate(timestamp, overlays)
    {
        const scale = this.animator.valueForTime(timestamp);
        this.tilesZoomer.style.scale = scale;
        this.pathGroup.setAttribute('transform', `scale(${scale})`);
        
        for (const overlay of overlays)
            overlay.repositionPhotos(scale);
    }   
}

class MapZoomerStage extends Stage {
    constructor()
    {
        super();

        this.container = document.getElementById('container');
        this.container.innerText = '';

        const stageClientRect = this.container.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        this.mapWidth = this.stageSize.width || mapWidth;
        this.mapHeight = this.stageSize.height || mapHeight;

        this.tileImages = [];
        this.photoData = [];
        this.items = [];
        this.map = null;
        this._complexity = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const stageClientRect = this.container.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        this.mapWidth = this.stageSize.width || mapWidth;
        this.mapHeight = this.stageSize.height || mapHeight;

        await this.#loadDataJSON();
        await this.#loadImages();

        this.map = new ZoomableMap(this);
        this.container.appendChild(this.map.container);
    }

    tune(count)
    {
        if (count == 0)
            return;

        this._complexity += count;
        this.#setupOverlays();
    }

    async #loadDataJSON()
    {
        const edgePaddingDegrees = 0.2;
        this.gpsTrack = new GPSTrack('resources/metadata/ride-gps.json', edgePaddingDegrees);
        await this.gpsTrack.initialize();
        this.trackPointString = this.computeSVGPolyline(0, 0);
    }

    computeSVGPolyline(offsetX = 0, offsetY = 0)
    {
        const coordsRange = this.gpsTrack.projectedMaxCoord.subtract(this.gpsTrack.projectedMinCoord);

        const xScale = this.mapWidth / coordsRange.x;
        const yScale = this.mapHeight / coordsRange.y;

        const scaleFactor = Math.min(xScale, yScale);

        let polylinePoints = '';
        for (let coord of this.gpsTrack.projectedCoordinates) {
            const coordOffset = new Point(
                coord.x - this.gpsTrack.projectedMinCoord.x,
                this.gpsTrack.projectedMaxCoord.y - coord.y // This is a Y-flip.
            );
            const point = coordOffset.scale(scaleFactor);
            polylinePoints += ' ' + (point.x + offsetX).toFixed(2) + ',' + (point.y + offsetY).toFixed(2);
        }

        return polylinePoints;        
    }
    
    gpsToContainerPoint(gpsPoint, scale)
    {
        const projectedPhotoCoords = PseudoMercator.xyFromLongLat(gpsPoint.x, gpsPoint.y);

        const coordsRange = this.gpsTrack.projectedMaxCoord.subtract(this.gpsTrack.projectedMinCoord);

        const xScale = this.mapWidth / coordsRange.x;
        const yScale = this.mapHeight / coordsRange.y;

        const scaleFactor = Math.min(xScale, yScale) * scale;

        const coordOffset = new Point(
            projectedPhotoCoords.x - this.gpsTrack.projectedMinCoord.x,
            this.gpsTrack.projectedMaxCoord.y - projectedPhotoCoords.y // This is a Y-flip.
        );

        return coordOffset.scale(scaleFactor);
    }

    async #loadImages()
    {
        const promises = [];

        const minLongLat = this.gpsTrack.projectedMinCoord;
        const maxLongLat = this.gpsTrack.projectedMaxCoord;

        const zoom = 10; // Higher levels result in more images for more work.

        const minTile = OpenStreetMap.tileIndexForMercator(minLongLat, zoom);
        const maxTile = OpenStreetMap.tileIndexForMercator(maxLongLat, zoom);
        
        const topLeftTile = minTile.min(maxTile);
        const bottomRightTile = maxTile.max(minTile);

        const firstRow = Math.floor(topLeftTile.y);
        const lastRow = Math.floor(bottomRightTile.y);

        const firstColumn = Math.floor(topLeftTile.x);
        const lastColumn = Math.floor(bottomRightTile.x);

        const tilesAreaSize = bottomRightTile.subtract(topLeftTile).scale(tileWidth);

        const xScale = this.mapWidth / tilesAreaSize.x;
        const yScale = this.mapHeight / tilesAreaSize.y;
        this.tilesScaleFactor = Math.max(xScale, yScale);
        this.tilesFractionalOffset = new Point(tileWidth * (topLeftTile.x % 1), tileHeight * (topLeftTile.y % 1));

        this.tileGridImages = [];
        for (let row = firstRow; row <= lastRow; ++row) {
            const tileRowImages = [];
            for (let col = firstColumn; col <= lastColumn; ++col) {
                const tilePath = OpenStreetMap.filePathForTile(col, row, zoom);
                const tileURL = `resources/images/tiles/${tilePath}`;

                const loadingPromise = new Promise(resolve => {
                    const image = new Image();
                    image.onload = resolve;
                    image.src = tileURL;
                    tileRowImages.push(image);
                });
                promises.push(loadingPromise);
            }

            this.tileGridImages.push(tileRowImages);
        }

        const photoPrefix = 'resources/images/';
        for (const photoInfo of photoData) {
            const loadingPromise = new Promise(resolve => {
                const image = new Image();
                image.onload = resolve;
                image.src = photoPrefix + photoInfo.name;
                this.photoData.push({
                    image: image,
                    location: photoInfo.location
                });
            });
            promises.push(loadingPromise);
        }
        
        await Promise.all(promises);
    }

    #setupOverlays()
    {
        if (this._complexity > this.items.length) {
            const oldLength = this.items.length;
            this.items.length = this._complexity;
          
            for (let i = oldLength; i < this.items.length; ++i)
                this.items[i] = new MapRouteOverlay(this.map, i);
        } else {
            for (let i = this._complexity; i < this.items.length; ++i)
                this.items[i].remove();

            this.items.length = this._complexity;
        }
    }

    animate()
    {
        const timestamp = Date.now();
        if (this.map)
            this.map.animate(timestamp, this.items);
    }

    complexity()
    {
        return this._complexity;
    }
}

class MapZoomerBenchmark extends Benchmark {
    constructor(options)
    {
        const canvas = document.getElementById('stage-canvas');
        super(new MapZoomerStage(canvas), options);
    }
}

window.benchmarkClass = MapZoomerBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 1;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 1500;
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
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {

    });

}, false);
