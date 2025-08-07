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
 * ARISING IN ANY WAY OUT of THE USE of THIS SOFTWARE, EVEN IF ADVISED of
 * THE POSSIBILITY of SUCH DAMAGE.
 */

// === LOREM IPSUM GENERATOR ===

const LoremIpsum = {
    _words: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'curabitur', 'vel', 'hendrerit', 'libero',
        'eleifend', 'blandit', 'nunc', 'ornare', 'odio', 'ut', 'orci', 'gravida', 'imperdiet', 'nullam', 'purus', 'lacinia', 'a',
        'pretium', 'quis', 'congue', 'praesent', 'sagittis', 'laoreet', 'auctor', 'mauris', 'non', 'velit', 'eros', 'dictum',
        'proin', 'accumsan', 'sapien', 'nec', 'massa', 'volutpat', 'venenatis', 'sed', 'eu', 'molestie', 'lacus', 'quisque',
        'porttitor', 'ligula', 'dui', 'mollis', 'tempus', 'at', 'magna', 'vestibulum', 'turpis', 'ac', 'diam', 'tincidunt',
        'id', 'condimentum', 'enim', 'sodales', 'in', 'hac', 'habitasse', 'platea', 'dictumst', 'aenean', 'neque', 'fusce',
        'augue', 'leo', 'eget', 'semper', 'mattis', 'tortor', 'scelerisque', 'nulla', 'interdum', 'tellus', 'malesuada',
        'rhoncus', 'porta', 'sem', 'aliquet', 'et', 'nam', 'suspendisse', 'potenti', 'vivamus', 'luctus', 'fringilla', 'erat',
    ],

    generate(wordCount) {
        let words = [];
        let sentenceIndex = 0;
        while (words.length < wordCount) {
            const sentenceLength = Math.floor(Pseudo.random() * 12) + 8; // 8 to 20 words
            const paragraphLength = Math.floor(Pseudo.random() * 5) + 5; // 5 to 10 sentences                                                                                                     │
            for (let p = 0; p < paragraphLength && words.length < wordCount; p++) { 
                for (let i = 0; i < sentenceLength && words.length < wordCount; i++) {
                    let word = this._words[Math.floor(Pseudo.random() * this._words.length)];
                    if (i === 0) {
                        word = word.charAt(0).toUpperCase() + word.slice(1);
                    }
                    if (i === sentenceLength - 1) {
                        word += '.';
                    }
                    const endOfParagraph = (i === sentenceLength - 1) && (p === paragraphLength - 1);
                    words.push({ word, endOfParagraph, sentenceIndex });
                }
                sentenceIndex++;
            }
        }
        return words;
    }
};

// === TEXT LAYOUT ===

class TextLayout {
    constructor(words, context, pageWidth, pageHeight, fontSize) {
        this.words = words;
        this.context = context;
        this.pageWidth = pageWidth;
        this.pageHeight = pageHeight;
        this.pageMargin = 20;
        this.lineHeight = 1.2;
        this.fontSize = fontSize;
        this.pages = this._layoutPages();
    }

    _layoutPages() {
        const pages = [];
        const drawableWidth = this.pageWidth - this.pageMargin * 2;
        const drawableHeight = this.pageHeight - this.pageMargin * 2;

        if (this.words.length === 0)
            return pages;

        let currentPageWords = [];
        let x = this.pageMargin;
        let y = this.pageMargin + this.fontSize;

        for (const wordData of this.words) {
            let fontStyle = '';
            if (wordData.style === 'bold') fontStyle = 'bold ';
            if (wordData.style === 'italic') fontStyle = 'italic ';
            this.context.font = `${fontStyle}${this.fontSize}px sans-serif`;

            const word = wordData.word;
            const wordWidth = this.context.measureText(word + ' ').width;

            if (x + wordWidth > drawableWidth + this.pageMargin) {
                x = this.pageMargin;
                y += this.fontSize * this.lineHeight;
            }

            if (y > drawableHeight) {
                pages.push(currentPageWords);
                currentPageWords = [];
                x = this.pageMargin;
                y = this.pageMargin + this.fontSize;
            }

            currentPageWords.push({ text: word, x, y, width: wordWidth, sentenceIndex: wordData.sentenceIndex, style: wordData.style });
            x += wordWidth;

            if (wordData.endOfParagraph) {
                x = this.pageMargin;
                y += this.fontSize * this.lineHeight * 2;
            }
        }

        if (currentPageWords.length > 0) {
            pages.push(currentPageWords);
        }

        return pages;
    }
}


// === STAGE ===

class TextRenderingStage extends Stage {
    async initialize(benchmark, options) {
        await super.initialize(benchmark, options);

        this.context = this.element.getContext('2d');
        this.context.scale(this.devicePixelRatio, this.devicePixelRatio);

        Pseudo.resetRandomSeed();
        this.words = LoremIpsum.generate(100000);
        this._complexity = 0;
        this.numPagesToRender = 0;

        // Assign highlight colors and styles to each word
        const highlightColors = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFF99', '#99FF99', '#99FFFF', '#FF99FF'];
        const styles = ['bold', 'italic', 'underline'];
        this.sentenceColors = [];

        this.words.forEach(word => {
            // Assign sentence color
            if (!this.sentenceColors[word.sentenceIndex]) {
                this.sentenceColors[word.sentenceIndex] = highlightColors[Math.floor(Pseudo.random() * highlightColors.length)];
            }

            // Assign word style
            if (Pseudo.random() < 0.75) {
                word.style = 'normal';
            } else {
                word.style = styles[Math.floor(Pseudo.random() * styles.length)];
            }
        });

        // Virtual dimensions
        this.virtualDPI = 96;
        this.virtualPageWidth = 8.5 * this.virtualDPI;
        this.virtualPageHeight = 11 * this.virtualDPI;
        this.virtualFontSize = (8 / 72) * this.virtualDPI; // 8pt font

        // Perform a single, full layout on the virtual pages.
        this.virtualLayout = new TextLayout(this.words, this.context, this.virtualPageWidth, this.virtualPageHeight, this.virtualFontSize);
    }

    tune(count) {
        this._complexity = Math.max(0, this._complexity + count);

        let wordsCounted = 0;
        let pages = 0;
        for (const page of this.virtualLayout.pages) {
            wordsCounted += page.length;
            pages++;
            if (wordsCounted >= this._complexity)
                break;
        }
        this.numPagesToRender = pages;
    }

    animate() {
        const context = this.context;
        const stageSize = this.size;

        // Determine grid and page dimensions
        let bestGrid = { cols: 0, rows: 0, aspectRatioDiff: Infinity };
        const stageAspectRatio = stageSize.x / stageSize.y;
        const pageAspectRatio = this.virtualPageWidth / this.virtualPageHeight;
        const gapToPageHeightRatio = 0.05;
        const numPages = this.numPagesToRender;

        if (numPages === 0) {
            context.clearRect(0, 0, stageSize.x, stageSize.y);
            return;
        }

        for (let cols = 1; cols <= numPages; cols++) {
            const rows = Math.ceil(numPages / cols);
            const gridAspectRatio = (cols * pageAspectRatio + (cols + 1) * gapToPageHeightRatio * pageAspectRatio) / (rows + (rows + 1) * gapToPageHeightRatio);
            const aspectRatioDiff = Math.abs(gridAspectRatio - stageAspectRatio);
            if (aspectRatioDiff < bestGrid.aspectRatioDiff) {
                bestGrid = { cols, rows, aspectRatioDiff };
            }
        }

        const { cols, rows } = bestGrid;

        let actualPageHeight, actualPageWidth, gap;
        const gridAspectRatio = (cols * pageAspectRatio + (cols + 1) * gapToPageHeightRatio * pageAspectRatio) / (rows + (rows + 1) * gapToPageHeightRatio);
        if (stageAspectRatio > gridAspectRatio) { // Height is constrained
            actualPageHeight = stageSize.y / (rows + (rows + 1) * gapToPageHeightRatio);
        } else { // Width is constrained
            actualPageHeight = stageSize.x / (cols * pageAspectRatio + (cols + 1) * gapToPageHeightRatio * pageAspectRatio);
        }
        actualPageWidth = actualPageHeight * pageAspectRatio;
        gap = actualPageHeight * gapToPageHeightRatio;

        const scale = actualPageHeight / this.virtualPageHeight;
        const scaledFontSize = this.virtualFontSize * scale;
        const scaledLineHeight = this.virtualLayout.lineHeight * scaledFontSize;

        // Draw background
        context.fillStyle = 'lightgray';
        context.fillRect(0, 0, stageSize.x, stageSize.y);

        const totalGridWidth = cols * actualPageWidth + (cols - 1) * gap;
        const totalGridHeight = rows * actualPageHeight + (rows - 1) * gap;
        const startX = (stageSize.x - totalGridWidth) / 2;
        const startY = (stageSize.y - totalGridHeight) / 2;

        let wordsDrawn = 0;
        for (let i = 0; i < numPages; i++) {
            const pageData = this.virtualLayout.pages[i];
            const pageColumn = i % cols;
            const pageRow = Math.floor(i / cols);
            const pageX = startX + pageColumn * (actualPageWidth + gap);
            const pageY = startY + pageRow * (actualPageHeight + gap);

            // Draw page
            context.fillStyle = 'white';
            context.fillRect(pageX, pageY, actualPageWidth, actualPageHeight);
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            context.strokeRect(pageX, pageY, actualPageWidth, actualPageHeight);

            // Draw text and highlights
            for (const word of pageData) {
                if (wordsDrawn >= this._complexity) break;

                const scaledX = pageX + word.x * scale;
                const scaledY = pageY + word.y * scale;
                const scaledWidth = word.width * scale;

                // Highlight
                context.fillStyle = this.sentenceColors[word.sentenceIndex];
                context.fillRect(scaledX, scaledY - scaledFontSize, scaledWidth, scaledLineHeight);

                // Text
                let fontStyle = '';
                if (word.style === 'bold') fontStyle = 'bold ';
                if (word.style === 'italic') fontStyle = 'italic ';
                context.font = `${fontStyle}${scaledFontSize}px sans-serif`;
                context.fillStyle = 'black';
                context.fillText(word.text, scaledX, scaledY);

                // Underline
                if (word.style === 'underline') {
                    const underlineHeight = 1 * scale;
                    context.fillRect(scaledX, scaledY + 2 * scale, scaledWidth, underlineHeight);
                }

                wordsDrawn++;
            }
            if (wordsDrawn >= this._complexity) break;
        }
    }

    complexity() {
        return this._complexity;
    }
}

// === BENCHMARK ===

class TextRenderingBenchmark extends Benchmark {
    constructor(options) {
        super(new TextRenderingStage(), options);
    }
}

window.benchmarkClass = TextRenderingBenchmark;