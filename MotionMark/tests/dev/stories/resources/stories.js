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

// Move to shared code

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
}

const textLabels = [
    { value: 'design' },
    { value: 'σχέδιο' },
    { value: '设计' },
    { value: 'дизайн' },
    { value: 'تصميم', rtl: true },
    { value: '디자인' },
    { value: 'conception' },
    { value: 'デザイン' },
    { value: 'עיצוב', rtl: true },
    { value: 'diseño' },
];

const fillImages = [
  'robert-bye-36K5WckeU3o-unsplash.jpg',
  'andrey-andreyev-dh8ONmfQyQQ-unsplash.jpg',
  'fabian-burghardt-A81818EFqGQ-unsplash.jpg',
  'jonatan-pie-7FfG8zcPcXU-unsplash.jpg',
  'josh-reid-meOFNlRbHmY-unsplash.jpg',
  'khamkeo-rBRZLPVLQg0-unsplash.jpg',
  'luke-stackpoole-eWqOgJ-lfiI-unsplash.jpg',
  'matt-palmer-gK1s6P92EIE-unsplash.jpg',
  'redcharlie-O7zkyNkQ1lM-unsplash.jpg',
  'roan-lavery-hUj3aAg0W3Q-unsplash.jpg',
];

const paragraphText = [
    `Iceland[e] is a Nordic island country between the North Atlantic and Arctic Oceans, on the Mid-Atlantic Ridge between North America and Europe. It is culturally and politically linked with Europe and is the region's westernmost and most sparsely populated country.[12] Its capital and largest city is Reykjavík, which is home to about 36% of the country's roughly 380,000 residents (excluding nearby towns/suburbs, which are separate municipalities). The official language of the country is Icelandic.`,
    `Η Ισλανδία (ισλανδικά: Ísland‎‎) είναι νησιωτική χώρα της Βόρειας Ευρώπης, ευρισκόμενη στον βόρειο Ατλαντικό ωκεανό και ανάμεσα στη Γροιλανδία, τη Σκωτία, τις Νήσους Φερόες και τη Νορβηγία. Ο πληθυσμός της ανέρχεται σε 389.450 κάτοικους,[1] σύμφωνα με επίσημη εκτίμηση για το 2025, και πρωτεύουσά της είναι το Ρέικιαβικ. Κατά μια ερμηνεία, ταυτίζεται με το νησί Θούλη που επισκέφτηκε ο Πυθέας ο Μασσαλιώτης στο ταξίδι που έκανε τον 4ο αιώνα π.Χ., περί τα 332 - 310 π.Χ.. Η Εθνική εορτή στη χώρα είναι ανήμερα της 17ης Ιουνίου.`,
    `冰岛（冰島語：Ísland，发音：[ˈistlant] （ⓘ））[註 1]，是北大西洋中的一个岛国，位于北大西洋和北冰洋的交汇处，是北歐五國之一[10]。冰岛国土面积为10.3万平方公里，人口为39万，儘管面積不大，卻是欧洲人口密度最低的国家[11]，也是世界范围内人口密度很小的国家之一。冰岛的首都是雷克雅維克，也是冰岛的最大城市[12]，首都附近的西南地区人口占全国的三分之二，即24萬人左右。冰岛地处大西洋中洋脊上[13]，是一个多火山、地质活动频繁的国家。内陆主要是平原地貌，境内多分布沙質地、冷却的熔岩平原和冰川。冰岛虽然位于北极圈边缘，但有北大西洋暖流所以气温适中。`,
    `Исла́ндия (исл. Ísland, МФА: [ˈistlant]о файле — «страна льдов» или «ледяная страна») — островное государство, расположенное на западе Северной Европы в северной части Атлантического океана (к северо-западу от Великобритании). На севере и северо-востоке омывается Северным Ледовитым океаном. Территория государства состоит из одноимённого острова площадью 103 тыс. км² и небольших островков около него. Самая редконаселённая страна в Европе[6].`,
    `جمهورية آيسلندا أو إسلندة[14][15] أو أيسلند[16] هي دولة جزرية أوروبية في شمال المحيط الأطلسي على الحافة وسط الأطلسي.[17] يبلغ تعداد سكانها 320,000 نسمة ومساحتها الكلية 103,000 كم2.[18] عاصمتها هي ريكيافيك وهي أكبر مدن البلاد، حيث أنها والمناطق الجنوبية الغربية موطن لأكثر من ثلثي سكان البلاد. آيسلندا بلد نشط بركانياً وجيولوجياً. يتألف بر البلاد من هضبة تتميز بحقول الرمال والجبال والأنهار الجليدية، بينما تصب العديد من الأنهار الجليدية في البحار عبر الأراضي المنخفضة. يقوم تيار الخليج بتلطيف مناخ آيسلندا مما يجعله معتدلاً ومناسباً للحياة رغم موقعها على حدود الدائرة القطبية الشمالية.`,
    `아이슬란드(아이슬란드어: Ísland 이슬란드 [ˈiːslant], 영어: Iceland, 문화어: 이슬란드)는 북유럽에 위치한 섬나라이다. 그린란드의 남동쪽, 영국과 덴마크의 자치령인 페로 제도의 북서쪽에 위치하고 있으며, 수도는 레이캬비크이다. 대서양 중앙 해령의 위에 위치하고 있기 때문에, 아이슬란드는 화산 활동이 활발하며, 지열의 작용도 거대한 규모로 이뤄진다. 또한 북극권 바로 아래에 국토가 위치하고 있기 때문에, 수목의 생장에 제한을 받으며 빙하의 흐름도 활발하다. 이런 지질학적 특징은, 아이슬란드의 풍경을 다채롭게 만들었다. 황무지와 고원지대가 넓게 펼쳐져 있으며, 화산활동으로 높이 솟은 산들 사이로 형성된 거대한 빙하퇴가 바다를 향해 저지대로 흘러내린다. 멕시코 만류에 의해 위도에 비해 따뜻하다.`,
    `L'Islande (en islandais : Ísland /ˈistlant/b, littéralement « pays de glace »8,a) est un pays insulaire d'Europe du Nord situé dans l'océan Atlantique9,10. Ayant pour capitale sa plus grande ville Reykjavik, il est gouverné sous la forme d'une république parlementaire.`,
    `アイスランド（アイスランド語: Ísland [ˈiːstlant] ( 音声ファイル) イーストラント）は、北ヨーロッパの北大西洋上に位置する共和制国家[3]。首都はレイキャヴィーク。総人口は38万7758人。グリーンランドの南東方、ブリテン諸島やデンマークの自治領であるフェロー諸島の北西に位置する。`,
    `איסלנד (באנגלית : Iceland, באיסלנדית: Ísland) היא מדינת אי בצפון האוקיינוס האטלנטי הממוקמת בין גרינלנד, נורווגיה וסקוטלנד, צפון מערבית לאיי פארו. המדינה שוכנת על אי מרכזי ומספר איים סמוכים. צפיפות האוכלוסייה בה היא מהקטנות בעולם- הואיל ושטחה 103,000 קמ"ר ואוכלוסייתה מונה כ־406,032 איש נכון לינואר 2025.[7] כשבערך מחציתה מתרכזת בעיר הבירה רייקיאוויק.`,
    `Islandia (en islandés: Ísland, AFI: ['istlant])nota 1​es un país insular europeo, cuyo territorio abarca la isla homónima y algunas pequeñas islas e islotes adyacentes en el océano Atlántico. Su capital es Reikiavik. Cuenta con una población de cerca de 366 425 habitantes y un área de 103 000 km².1​6​ A causa de su localización en la dorsal mesoatlántica, es un país con gran actividad volcánica y geológica, factor que afecta en gran medida al paisaje del territorio islandés. El interior del país consiste en una meseta caracterizada por desiertos, montañas, glaciares y ríos glaciales que fluyen hacia el mar a través de las tierras bajas.`,
];

class Rect {
    constructor(position, size)
    {
        this.position = position;
        this.size = size;
    }
    
    get x()
    {
        return this.position.x;
    }

    get y()
    {
        return this.position.y;
    }

    get width()
    {
        return this.size.width;
    }

    get height()
    {
        return this.size.height;
    }
}

class Size {
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
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

class SinusoidalAnimator extends Animator {
    constructor(min, max, wavelengthMS, phaseMS)
    {
        super(min, max);
        this.wavelengthMS = wavelengthMS;
        this.phaseMS = phaseMS;
    }

    valueForTime(timestampMS)
    {
        // Scale between 0 and 2PI
        const offset = 2 * Math.PI * ((timestampMS + this.phaseMS) % this.wavelengthMS) / this.wavelengthMS;
        const value = Math.sin(offset);
        return this.min + (this.max - this.min) * (0.5 + value / 2);
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


Array.prototype.max = function()
{
  return Math.max.apply(null, this);
};

Array.prototype.min = function()
{
  return Math.min.apply(null, this);
};

Array.prototype.sum = function()
{
    return this.reduce((partialSum, a) => partialSum + a, 0);
};

class BoxItem {
    constructor(mainImage)
    {
        this.value = Stage.random(0.1, 1);
        
        const labelIndex = Math.floor(Stage.random(0, textLabels.length));
        this.label = textLabels[labelIndex].value;
        this.isRTL = textLabels[labelIndex].rtl || false;
        this.paragraphText = paragraphText[labelIndex];
        
        this.mainImage = mainImage.cloneNode();
        this.element = undefined;
    
        this.animator = new RampAnimator(1, 1.2, 5000, Stage.random(0, 1));
    }
    
    ensureElement()
    {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'box';
            if (this.isRTL)
                this.element.classList.add('rtl');
                
            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'badge';
            const badgeImage = document.createElement('img');
            
            // FIXME: Need more badge images.
            badgeImage.src = '../../core/resources/debugger100.png';
            badgeContainer.appendChild(badgeImage);
            this.element.appendChild(badgeContainer);
            this.element.appendChild(this.mainImage);

            const shadowBox = document.createElement('div');
            shadowBox.className = 'shadow';
            this.element.appendChild(shadowBox);

            const childBox = document.createElement('div');
            childBox.className = 'overlay';
            const childSpan = document.createElement('span');
            childSpan.textContent = this.label;

            childBox.appendChild(childSpan);
            
            const textContainer = document.createElement('div');
            textContainer.className = 'text-container';
            textContainer.textContent = this.paragraphText;
            this.element.appendChild(textContainer);

            this.element.appendChild(childBox);
        }
        
        return this.element;
    }
    
    animate(timestamp)
    {
        const scale =  this.animator.valueForTime(timestamp);
        this.element.style.setProperty('--image-scale', scale);
    }

    applyStyle(data)
    {
        const edgeInset = 4;
        this.element.style.left = `${data.x.toFixed(2) + edgeInset}px`;
        this.element.style.top = `${data.y.toFixed(2) + edgeInset}px`;
        this.element.style.width = `${Math.max(data.width - 2 * edgeInset, 0).toFixed(2)}px`;
        this.element.style.height = `${Math.max(data.height - 2 * edgeInset, 0).toFixed(2)}px`;        
    }
}

class LayoutState {
    constructor(position, size)
    {
        this.currentPosition = position;
        this.remainingSize = size;
    }
}

class TreeMapLayout {
    constructor(areaSize, data)
    {
        this.areaSize = areaSize;
        this.originalData = data;
        this.data = this.#normalizeData(this.originalData);
    }
    
    #normalizeData(data)
    {
        const factor = (this.areaSize.width * this.areaSize.height) / data.sum();
        return data.map((x) => (x * factor));
    }
    
    layout()
    {
        this.layoutResults = [];
        const inputData = [...this.data];
        this.#squarishLayoutIterative(inputData);        
    }
    
    #squarishLayoutIterative(items)
    {
        const layoutState = new LayoutState(new Point(0, 0), structuredClone(this.areaSize));
        const remainingItems = [...items];
        let itemsInCurrentRow = [];
        
        let { value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize);
        
        while (remainingItems.length > 1) {
            const rowWithChild = [...itemsInCurrentRow, remainingItems[0]]

            if (itemsInCurrentRow.length === 0 || TreeMapLayout.#worstRatio(itemsInCurrentRow, availableSpace) >= TreeMapLayout.#worstRatio(rowWithChild, availableSpace)) {
                remainingItems.shift();
                itemsInCurrentRow = rowWithChild;
                continue;
            }

            this.#layoutRow(itemsInCurrentRow, availableSpace, currentlyVertical, layoutState);
            ({ value: availableSpace, vertical: currentlyVertical } = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize));
            
            itemsInCurrentRow = [];
        }

        this.#layoutLastRow(itemsInCurrentRow, remainingItems, availableSpace, layoutState);
    }

    static #worstRatio(rowValues, width)
    {
        const rowMax = rowValues.max();
        const rowMin = rowValues.min();
        const sumSquared = Math.pow(rowValues.sum(), 2);
        const widthSquared = Math.pow(width, 2);
        return Math.max((widthSquared * rowMax) / sumSquared, sumSquared / (widthSquared * rowMin));
    }

    #layoutRow(rowValues, width, isVertical, layoutState)
    {
        const rowHeight = rowValues.sum() / width;

        rowValues.forEach((rowItem) => {
            const rowWidth = rowItem / rowHeight;
            const curXPos = layoutState.currentPosition.x;
            const curYPos = layoutState.currentPosition.y;

            let data;
            if (isVertical) {
                layoutState.currentPosition.y += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowHeight,
                    height: rowWidth,
                    dataIndex: this.layoutResults.length,
                };
            } else {
                layoutState.currentPosition.x += rowWidth;
                data = {
                    x: curXPos,
                    y: curYPos,
                    width: rowWidth,
                    height: rowHeight,
                    dataIndex: this.layoutResults.length,
                };
            }
            
            this.layoutResults.push(data);
        });

        if (isVertical) {
            layoutState.currentPosition.x += rowHeight;
            layoutState.currentPosition.y -= width;
            layoutState.remainingSize.width -= rowHeight;
        } else {
            layoutState.currentPosition.x -= width;
            layoutState.currentPosition.y += rowHeight;
            layoutState.remainingSize.height -= rowHeight;
        }
    }

    #layoutLastRow(rowValues, remainingItems, width, layoutState)
    {
        const isVertical = TreeMapLayout.#getSmallerDimension(layoutState.remainingSize).vertical;
        if (rowValues.length)
            this.#layoutRow(rowValues, width, isVertical, layoutState);
        this.#layoutRow(remainingItems, width, isVertical, layoutState);
    }

    static #getSmallerDimension(remainingSpace)
    {
        if (remainingSpace.height ** 2 > remainingSpace.width ** 2)
            return { value: remainingSpace.width, vertical: false };

        return { value: remainingSpace.height, vertical: true };
    }
}

class StoriesController {
    constructor(stage)
    {
        this.stage = stage;

        this.container = document.getElementById('container');
        this.container.innerText = '';

        const stageClientRect = this.container.getBoundingClientRect();
        this.stageSize = new Size(stageClientRect.width, stageClientRect.height);
        this.nodeCount = 1;

        this._complexity = 0;        

        this.items = [];
    }

    set complexity(complexity)
    {
        if (complexity > this._complexity) {
            this.items.length = complexity;
          
            for (let i = this._complexity; i < this.items.length; ++i)
                this.items[i] = this.#createBox(i);
        } else {
            for (let i = complexity; i < this.items.length; ++i)
                this.items[i].element.remove();

            this.items.length = complexity;
        }
        
        this._complexity = complexity;
        
        const numericValues = this.items.map((x) => x.value);
        
        this.treeMap = new TreeMapLayout(this.stageSize, numericValues);
        this.treeMap.layout();
        
        let i = 0;
        for (const data of this.treeMap.layoutResults) {
            const item = this.items[data.dataIndex];
            const element = item.ensureElement();
            item.applyStyle(data);
            
            if (!element.parentElement)
                this.container.appendChild(element);
            ++i;
        }
    }
    
    #createBox(boxIndex)
    {
        return new BoxItem(this.stage.images[boxIndex % this.stage.images.length]);
    }
    
    animate()
    {
        const timestamp = Date.now();
        for (const boxItem of this.items)
            boxItem.animate(timestamp);
    }
}


class StoriesStage extends Stage {
    constructor()
    {
        super();
        Pseudo.randomSeed = Date.now();
        this._complexity = 0;
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        this.controller = new StoriesController(this);
        
        this.images = [];
        await this.#loadImages()
    }

    async #loadImages()
    {
        const promises = [];
        const imagePrefix = 'resources/images/';
        for (const imageURL of fillImages) {
            const loadingPromise = new Promise(resolve => {
                const image = new Image();
                image.onload = resolve;
                image.src = imagePrefix + imageURL;
                this.images.push(image);
            });
            promises.push(loadingPromise);
        }
        
        await Promise.all(promises);
    }
    
    tune(count)
    {
        if (count === 0)
            return;

        this._complexity += count;

        // console.log(`tune ${count} complexity ${this._complexity}`);
        this.controller.complexity = this._complexity;
    }

    animate()
    {
        this.controller.animate();
    }

    complexity()
    {
        return this._complexity;
    }
}

class StoriesBenchmark extends Benchmark {
    constructor(options)
    {
        const stage = document.getElementById('stage');
        super(new StoriesStage(stage), options);
    }
}

window.benchmarkClass = StoriesBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 10;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 5000;
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
    await benchmark.initialize({ });
    benchmark._controller = new FakeController(benchmark);
    benchmark.run().then(function(testData) {

    });

}, false);
