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


// FIXME: Share the layout classes.
class ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        this._container = container;
        this._itemSize = itemSize;
        this._stageSize = stageSize;
    }
    
    arrangeItems()
    {
    }
}

class RandomPlacementLayout extends ItemLayout {
    constructor(container, itemSize, stageSize)
    {
        super(container, itemSize, stageSize);
        this._container.classList.add('layout-random');
    }

    arrangeItems()
    {
        // Choose a position that keeps the element mostly on-screen; 80% of the height and width have to be visible.
        const fractionVisible = 1;
        const allowedMinXClip = (1 - fractionVisible) * this._itemSize.width;
        const allowedMinYClip = (1 - fractionVisible) * this._itemSize.height;
        const allowedMaxXClip = fractionVisible * this._itemSize.width;
        const allowedMaxYClip = fractionVisible * this._itemSize.height;

        for (const child of this._container.children) {

            const x = Stage.randomInt(-allowedMinXClip, this._stageSize.width - allowedMaxXClip);
            const y = Stage.randomInt(-allowedMinYClip, this._stageSize.height - allowedMaxYClip);
        
            child.style.left = `${x}px`;
            child.style.top = `${y}px`;
        }
    }
}

/* -------------------------------------------------------- */

class Column {
    constructor(label, width, fillColor, cellClass, data)
    {
        this.label = label;
        this.width = width;
        this.fillColor = fillColor;
        this.cellClass = cellClass;
        this.data = data;
    }
}

class Row {
    constructor(label, height, fillColor, data)
    {
        this.label = label;
        this.height = height;
        this.fillColor = fillColor;
        this.data = data;
    }
}

/* -------------------------------------------------------- */

class SheetCell {
    static CELL_PADDING = 4;
    draw(ctx, cellSize)
    {
    }   
}

class TextDrawingSheetCell {
    constructor(fontSize, textStyle, alignment, wrap, rotation)
    {
        this.fontSize = fontSize ?? 18;
        this.textStyle = textStyle ?? '';
        this.alignment = alignment ?? 'left';
        this.wrapText = wrap ?? false;
        this.rotation = rotation ?? 0;
    }
    
    get textValue()
    {
        return '';
    }

    draw(ctx, cellSize)
    {
        this.drawText(ctx, cellSize, this.textValue);
    }
    
    drawText(ctx, cellSize, text)
    {
        ctx.font = `${this.textStyle} ${this.fontSize} Arial`;
        ctx.fillStyle = 'black';

        const availableWidth = cellSize.width - 2 * SheetCell.CELL_PADDING;
        const metrics = ctx.measureText(text);
        let location = this.textDrawingLocation(ctx, cellSize, metrics);

        if (metrics.width > availableWidth && this.wrapText) {
            if (text.indexOf(' ') > 0) {
                const textHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            
                // Find line breaks and get line count.
                let currLineStart = 0;
                const lineStartOffsets = [currLineStart];
                let currOffset = 0;

                let haveMoreText = true;
                let previousBreakOpportunity = 0;
                while (haveMoreText) {
                    let nextBreakOpportunity = text.indexOf(' ', currOffset);
                    if (nextBreakOpportunity === -1) {
                        nextBreakOpportunity = text.length;
                        haveMoreText = false;
                    }

                    const lineString = text.substring(currLineStart, nextBreakOpportunity);
                    const lineWidth = ctx.measureText(lineString).width;
                    currOffset = nextBreakOpportunity + 1;
                    if (lineWidth > availableWidth) {
                        currLineStart = previousBreakOpportunity + 1;
                        lineStartOffsets.push(currLineStart);
                    }
                    previousBreakOpportunity = nextBreakOpportunity;
                }
                
                const lineCount = lineStartOffsets.length;
                const totalHeight = lineCount * textHeight;
                
                location = new Point(location.x, (cellSize.height - totalHeight) / 2 - cellSize.height + metrics.fontBoundingBoxAscent);
            
                // Draw the text
                for (let lineIndex = 0; lineIndex < lineStartOffsets.length; ++lineIndex) {
                    const lineStart = lineStartOffsets[lineIndex];
                    const lineLength = (lineIndex < lineStartOffsets.length - 1) ? lineStartOffsets[lineIndex + 1] - lineStart : text.length - lineStart;
                    ctx.fillText(text.substring(lineStart, lineStart + lineLength), location.x, location.y + lineIndex * textHeight);
                }
             
                return;
            }
        }

        function deg2rad(degrees)
        {
            return degrees * Math.PI / 180;
        }
        
        if (this.rotation) {
            ctx.save();
            ctx.translate(location.x, location.y);
            ctx.rotate(deg2rad(this.rotation));
            ctx.translate(-location.x, -location.y);
            
            if (this.rotation === 270)
                location.x += metrics.fontBoundingBoxAscent / 2; // Fudge.
        }

        ctx.fillStyle='black';
        ctx.fillText(text, location.x, location.y);

        if (this.rotation)
            ctx.restore();
    }
    
    textDrawingLocation(ctx, cellSize, textMetrics, lineCount = 1)
    {
        const textHeight = lineCount * (textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent);
        const yOffset = (cellSize.height - SheetCell.CELL_PADDING * 2 - textHeight) / 2 + textMetrics.fontBoundingBoxDescent;
        
        let xOffset = SheetCell.CELL_PADDING;
        switch (this.alignment) {
        case 'left':
            ctx.textAlign = 'left';
            break;
        case 'right':
            xOffset = cellSize.width - SheetCell.CELL_PADDING;
            ctx.textAlign = 'right';
            break;
        case 'center':
            xOffset = cellSize.width / 2;
            ctx.textAlign = 'center';
            break;
        }
        
        return new Point(xOffset, -yOffset);
    }
}

class TextSheetCell extends TextDrawingSheetCell {
    constructor(text, fontSize, textStyle, alignment, wrap, rotation)
    {
        super(fontSize, textStyle, alignment, wrap, rotation);
        this.text = text;
    }

    get textValue()
    {
        return this.text;
    }
}

class ImageSheetCell {
    constructor(image)
    {
        this.image = image;
    }

    draw(ctx, cellSize)
    {
        const imagePadding = 1;
        const insetRect = new Rect(new Point(0, 0), cellSize).inflatedBy(new Size(-imagePadding, -imagePadding));

        const destRect = GeometryHelpers.containRect(
            new Rect(new Point(0, 0), new Size(this.image.width, this.image.height)),
            insetRect
        );

        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(this.image, destRect.x, -cellSize.height + destRect.y, destRect.width, destRect.height);
    }
}

class NumericSheetCell extends TextDrawingSheetCell {
    constructor(value, fontSize, textStyle, alignment, wrap, rotation)
    {
        super(fontSize, textStyle, alignment, wrap, rotation);
        this.value = value;
    }

    get textValue()
    {
        return this.value.toString();
    }
}

class CurrencySheetCell extends TextDrawingSheetCell {
    constructor(value, fontSize, textStyle, alignment, wrap, rotation)
    {
        super(fontSize, textStyle, alignment, wrap, rotation);
        this.value = value;
    }

    get textValue()
    {
        const currency = '$';
        return `${currency}${this.value}`;
    }
    
    textDrawingLocation(ctx, cellSize, textMetrics)
    {
        let location = super.textDrawingLocation(ctx, cellSize, textMetrics);
        ctx.textAlign = 'left';

        let leadingWidth = 0;
        const currency = '$';
        const decimalOffset = this.textValue.indexOf('.');
        if (decimalOffset != -1)
            leadingWidth = ctx.measureText(this.textValue.substring(0, decimalOffset)).width;
        
        const zerosMetrics = ctx.measureText('000');
        const textHeight = zerosMetrics.fontBoundingBoxAscent + zerosMetrics.fontBoundingBoxDescent;
        const textStartX = cellSize.width - SheetCell.CELL_PADDING - leadingWidth - zerosMetrics.width;
        
        return new Point(textStartX, location.y);
    }
}

/* -------------------------------------------------------- */

class SheetView {
    static DIVIDER_THICKNESS = 4;

    constructor(stage)
    {
        this.stage = stage;

        this.devicePixelRatio = 2;

        this.container = document.createElement('section');
        this.container.className = 'sheet';
        
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        
        this.stage.element.appendChild(this.container);
        
        this.#prepare();

        switch (Stage.randomInt(0, 3)) {
        case 0:
            this.scrollDelta = new Size(2, 2);
            break;
        case 1:
            this.scrollDelta = new Size(-2, 2);
            break;
        case 2:
            this.scrollDelta = new Size(2, -2);
            break;
        case 3:
            this.scrollDelta = new Size(-2, -2);
            break;
        }
    }
    
    remove()
    {
        this.container.remove();
    }

    #prepare()
    {
        const size = this.measureSize();
        const integralSize = new Size(Math.floor(size.width), Math.floor(size.height));

        let totalWidth = 0;
        let totalHeight = 0;

        this.columns = [];

        for (let colInfo of this.stage.columns) {
            const colorAlpha = 0.2;
            const color = Stage.randomRGBColor(colorAlpha);

            const column = new Column(colInfo.title, parseFloat(colInfo.width), color, this.#cellClassFromColumnType(colInfo.type), colInfo);
            this.columns.push(column);
            totalWidth += column.width;
        }

        const rowHeight = 120;
        let rowLabel = '1';
        this.rows = [];
        for (let plantInfo of this.stage.plantList) {
            const color = 'rgba(0, 0, 0, 0)';
            const row = new Row(rowLabel++, rowHeight, color);
            this.rows.push(row);
            totalHeight += row.height;
        }

        this.headerRows = this.stage.headerRows.map((rowData) => new Row('', parseFloat(rowData.height), 'rgba(0, 0, 100, 0)', TextSheetCell, rowData));
        this.headerColumns = this.stage.headerColumns.map((colData) => new Column('', parseFloat(colData.width), 'rgba(0, 0, 100, 0)', TextSheetCell, colData));

        this.headerRowsHeight = this.headerRows.reduce((total, row) => total += row.height, 0);
        this.headerColumnsWidth = this.headerColumns.reduce((total, col) => total += col.width, 0);

        totalHeight += this.headerRowsHeight;
        totalWidth += this.headerColumnsWidth;
        
        this.contentsSize = new Size(totalWidth, totalHeight);

        this.#createCells(this.rows.length, this.columns.length);

        this.canvasSize = integralSize;
        this.backingSize = new Size(integralSize.width * this.devicePixelRatio, integralSize.height * this.devicePixelRatio);
        
        this.canvas.width = this.backingSize.width;
        this.canvas.height = this.backingSize.height;

        const minScrollOffset = new Size(0, 0);
        const maxScrollOffset = new Size(this.contentsSize.width - this.canvasSize.width, this.contentsSize.height - this.canvasSize.height);
        this.scrollOffset = new Size(Stage.randomInt(minScrollOffset.width, maxScrollOffset.width), Stage.randomInt(minScrollOffset.height, maxScrollOffset.height));

        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.backingSize.width, this.backingSize.height);

        this.#drawBodyCells(ctx);
        this.#drawHeaders(ctx);
    }

    #cellClassFromColumnType(columnType)
    {
        switch (columnType) {
        case 'text':
            return TextSheetCell;
        case 'image':
            return ImageSheetCell;
        case 'numeric':
            return NumericSheetCell;
        case 'currency':
            return CurrencySheetCell;
        }
    }
    
    #createCells(rowCount, columnCount)
    {
        this.cells = Array.from({ length: columnCount }, () => new Array(rowCount));

        for (let colIndex = 0; colIndex < columnCount; ++colIndex) {
            const columnData = this.stage.columns[colIndex];
            const column = this.columns[colIndex];

            for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                const row = this.rows[rowIndex];
                const plantData = this.stage.plantList[rowIndex];

                const dataType = plantData[columnData.key];
                let cellData = plantData[columnData.key];
                if (columnData.key === 'image')
                    cellData = this.stage.images[cellData];

                const cell = new column.cellClass(cellData, columnData.fontSize, columnData.textStyle, columnData.alignment, columnData.wraps);
                this.cells[colIndex][rowIndex] = cell;
            }
        }
        
        this.headerRowCells = this.headerRows.map(row => {
            const cells = new Array(columnCount);
            for (let colIndex = 0; colIndex < columnCount; ++colIndex) {
                const columnData = this.stage.columns[colIndex];
                cells[colIndex] = new TextSheetCell(columnData.title, this.stage.columns[0].fontSize, 'bold');
            }
            
            return cells;
        });

        this.headerColumnCells = this.headerColumns.map(col => {
            const cells = new Array(rowCount);

            for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                let label = '';
                if (col.data.key === 'id')
                    label = (rowIndex + 1).toString();
                else if (col.data.key === 'species_summary') {
                    const plantData = this.stage.plantList[rowIndex];
                    const species = plantData['species_name'];
                    label = species.substring(0, species.indexOf(' '));
                }

                cells[rowIndex] = new TextSheetCell(label, col.data.fontSize, col.data.textStyle, col.data.alignment, col.data.wraps, parseFloat(col.data.rotation));
            }
            
            return cells;
        });

    }

    measureSize(container)
    {
        const bounds = this.container.getBoundingClientRect();
        return new Size(bounds.width, bounds.height);
    }

    animate()
    {
        this.#scrollSheet();
    }

    #scrollSheet()
    {
        const newOffset = new Size(this.scrollOffset.width + this.scrollDelta.width, this.scrollOffset.height + this.scrollDelta.height);

        const rightEdge = this.contentsSize.width - newOffset.width;
        const bottomEdge = this.contentsSize.height - newOffset.height;

        let flipX = false;
        let flipY = false;

        if (newOffset.width < 0) {
            flipX = true;
            newOffset.width = 0;
        } else if (rightEdge < this.canvasSize.width) {
            flipX = true;
            newOffset.width = this.contentsSize.width - this.canvasSize.width;
        }
        
        if (newOffset.height < 0) {
            flipY = true;
            newOffset.height = 0;
        } else if (bottomEdge < this.canvasSize.height) {
            flipY = true;
            newOffset.height = this.contentsSize.height - this.canvasSize.height;
        }
        
        if (flipX)
            this.scrollDelta.width = -this.scrollDelta.width;
        if (flipY)
            this.scrollDelta.height = -this.scrollDelta.height;

        const oldOffset = this.scrollOffset;
        this.scrollOffset = newOffset;

        const ctx = this.canvas.getContext('2d');
        
        const backingScrollX = (this.scrollOffset.width - oldOffset.width) * this.devicePixelRatio;
        const backingScrollY = (this.scrollOffset.height - oldOffset.height) * this.devicePixelRatio;
        
        ctx.drawImage(this.canvas, -backingScrollX, -backingScrollY);

        const headerBackingHeight = (this.headerRowsHeight + SheetView.DIVIDER_THICKNESS / 2) * this.devicePixelRatio;
        const headerBackingWidth = (this.headerColumnsWidth + SheetView.DIVIDER_THICKNESS / 2) * this.devicePixelRatio;

        ctx.save();
        ctx.beginPath();
        if (backingScrollX > 0)
            ctx.rect(this.backingSize.width - backingScrollX, 0, backingScrollX, this.backingSize.height);
        else if (backingScrollX < 0)
            ctx.rect(headerBackingWidth, 0, -backingScrollX, this.backingSize.height);
        
        if (backingScrollY > 0)
            ctx.rect(0, this.backingSize.height - backingScrollY, this.backingSize.width, backingScrollY);
        else if (backingScrollY < 0)
            ctx.rect(0, headerBackingHeight, this.backingSize.width, -backingScrollY);

        ctx.closePath();
        ctx.clip('nonzero');

        this.#drawBodyCells(ctx);
        ctx.restore();
        
        this.#drawHeaders(ctx);
    }
    
    #drawBodyCells(ctx)
    {
        ctx.save();

        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        ctx.translate(this.headerColumnsWidth - this.scrollOffset.width, this.headerRowsHeight - this.scrollOffset.height);

        this.#drawColumnBackgrounds(ctx);
        this.#drawCells(ctx);
        this.#drawGrid(ctx);

        ctx.restore();
    }
    
    #drawHeaders(ctx)
    {
        ctx.save();

        ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        this.#drawHeaderRows(ctx);
        this.#drawHeaderColumns(ctx);
        
        // Just splat a rect over the top left corner.
        const cornerRect = new Rect(new Point(0, 0), new Size(this.headerColumnsWidth, this.headerRowsHeight));
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(cornerRect.x, cornerRect.y, cornerRect.width, cornerRect.height);

        ctx.strokeStyle = 'rgba(31, 31, 31, 0.133)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cornerRect.x, cornerRect.y, cornerRect.width, cornerRect.height);
        
        // Dividers
        ctx.strokeStyle = 'rgba(220, 220, 220, 1)';
        ctx.lineWidth = SheetView.DIVIDER_THICKNESS;
        ctx.beginPath();
        ctx.moveTo(0, this.headerRowsHeight);
        ctx.lineTo(this.canvasSize.width, this.headerRowsHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.headerColumnsWidth, 0);
        ctx.lineTo(this.headerColumnsWidth, this.canvasSize.height);
        ctx.stroke();

        ctx.restore();
    }

    #drawHeaderRows(ctx)
    {
        let currX = this.headerColumnsWidth - this.scrollOffset.width;
        let currY = 0;
        const gridPath = new Path2D();
        
        for (let rowIndex = 0; rowIndex < this.headerRows.length; ++rowIndex) {
            const row = this.headerRows[rowIndex];
            const rowHeight = row.height;

            const headerRect = new Rect(new Point(0, currY), new Size(this.canvasSize.width, rowHeight));
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillRect(headerRect.x, headerRect.y, headerRect.width, headerRect.height);

            for (let colIndex = 0; colIndex < this.columns.length; ++colIndex) {
                const col = this.columns[colIndex];

                gridPath.moveTo(currX, 0);
                gridPath.lineTo(currX, rowHeight);
            
                ctx.save();

                const cellSize = new Size(col.width, rowHeight);
                const cellRect = new Rect(new Point(currX, rowHeight), cellSize);

                ctx.translate(cellRect.x, cellRect.y);
                const clipPath = new Path2D();
                clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
                ctx.clip(clipPath, 'evenodd');

                const cell = this.headerRowCells[rowIndex][colIndex];
                cell.draw(ctx, cellSize);

                ctx.restore();

                currX += col.width;
            }

            currY += row.height;
        }

        this.#strokeGridPath(ctx, gridPath);
    }

    #drawHeaderColumns(ctx)
    {
        let currX = 0;
        const gridPath = new Path2D();

        for (let colIndex = 0; colIndex < this.headerColumns.length; ++colIndex) {
            const col = this.headerColumns[colIndex];
            const columnWidth = col.width;

            let currY = this.headerRowsHeight - this.scrollOffset.height;

            const headerRect = new Rect(new Point(currX, 0), new Size(columnWidth, this.canvasSize.height));
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillRect(headerRect.x, headerRect.y, headerRect.width, headerRect.height);

            for (let rowIndex = 0; rowIndex < this.rows.length; ++rowIndex) {
                const row = this.rows[rowIndex];

                gridPath.moveTo(currX, currY);
                gridPath.lineTo(currX + columnWidth, currY);
            
                ctx.save();
            
                const cellSize = new Size(columnWidth, row.height);
                const cellRect = new Rect(new Point(currX, currY), cellSize);

                ctx.translate(cellRect.x, cellRect.y);
                const clipPath = new Path2D();
                clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
                ctx.clip(clipPath, 'evenodd');

                const cell = this.headerColumnCells[colIndex][rowIndex];
                cell.draw(ctx, cellSize);
            
                ctx.restore();

                currY += row.height;
            }

            currX += col.width;

            gridPath.moveTo(currX, this.headerRowsHeight - this.scrollOffset.height);
            gridPath.lineTo(currX, currY);
        }

        this.#strokeGridPath(ctx, gridPath);
    }
    
    #drawColumnBackgrounds(ctx)
    {
        const minX = 0;
        const maxX = this.contentsSize.width;
        const minY = 0;
        const maxY = this.contentsSize.height

        let currX = minX;

        for (let column of this.columns) {
            const columnRect = new Rect(new Point(currX, minY), new Size(column.width, maxY - minY));
            ctx.fillStyle = column.fillColor;
            ctx.fillRect(columnRect.x, columnRect.y, columnRect.width, columnRect.height);

            currX += column.width;
        }
    }

    #drawGrid(ctx)
    {
        const minX = 0;
        const maxX = this.contentsSize.width;
        const minY = 0;
        const maxY = this.contentsSize.height

        let currX = minX;

        ctx.save();

        const gridPath = new Path2D();

        for (let column of this.columns) {
            gridPath.moveTo(currX, minY);
            gridPath.lineTo(currX, maxY);
            currX += column.width;
        }
        
        let currY = 0;
        for (let row of this.rows) {
            gridPath.moveTo(0, currY);
            gridPath.lineTo(maxX, currY);
            currY += row.height;
        }

        this.#strokeGridPath(ctx, gridPath);
        ctx.restore();
    }
    
    #strokeGridPath(ctx, path)
    {
        ctx.strokeStyle = 'rgba(31, 31, 31, 0.133)';
        ctx.lineWidth = 1;
        
        if (ctx.lineCap != 'square')
            ctx.lineCap = 'square';

        if (ctx.lineJoin != 'miter')
            ctx.lineJoin = 'miter';

        if (ctx.miterLimit != 10)
            ctx.miterLimit = 10;

        ctx.lineDashOffset = 0;
        ctx.setLineDash([]);
        ctx.stroke(path);
    }
    
    #drawCells(ctx)
    {
        // FIXME: Google Sheets doesn't clip per cell, and draws all the images, and then all the text.
        
        let currY = 0;
        for (let rowIndex = 0; rowIndex < this.rows.length; ++rowIndex) {
            const row = this.rows[rowIndex];
            currY += row.height;

            let currX = 0;
            for (let colIndex = 0; colIndex < this.columns.length; ++colIndex) {
                const col = this.columns[colIndex];
                
                ctx.save();
                
                const cellSize = new Size(col.width, row.height);
                const cellRect = new Rect(new Point(currX, currY), cellSize);

                ctx.translate(cellRect.x, cellRect.y);
                const clipPath = new Path2D();
                clipPath.rect(0, -cellRect.height, cellRect.width, cellRect.height);
                ctx.clip(clipPath, 'evenodd');

                const cell = this.cells[colIndex][rowIndex];
                cell.draw(ctx, cellSize);

                ctx.restore();

                currX += col.width;
            }
        }
    }
}

class SheetsStage extends Stage {
    constructor()
    {
        super();

        Pseudo.randomSeed = Date.now();

        this._complexity = 0;
        this._sheetViews = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        const response = await fetch('resources/sheet-data.json');
        if (!response.ok)
            console.error(`Failed to fetch JSON`);
        
        const jsonData = await response.json();
        this.headerColumns = jsonData['header_columns'];
        this.headerRows = jsonData['header_rows'];
        this.columns = jsonData.columns;
        this.plantList = jsonData.houseplants;

        await this.#loadImages();

        const stageRect = this.element.getBoundingClientRect();

        const sheetView = new SheetView(this, this.sheetSize);
        this.sheetSize = sheetView.measureSize();
        sheetView.remove();
        
        this.layout = new RandomPlacementLayout(this.element, this.sheetSize, new Size(stageRect.width, stageRect.height));
    }

    tune(delta)
    {
        if (delta == 0)
            return;
        
        const newComplexity = this._complexity + delta;
        if (newComplexity < this._complexity) {

            let itemsToRemove = this._sheetViews.splice(newComplexity);
            itemsToRemove.forEach((item) => item.remove());
            
        } else {
            for (let itemCount = this._complexity; itemCount < newComplexity; ++itemCount) {
                const sheet = new SheetView(this, this.sheetSize);
                this._sheetViews.push(sheet);
            }
        }

        this._complexity = newComplexity;
        this.layout.arrangeItems();
    }

    animate()
    {
        for (let sheet of this._sheetViews) {
            sheet.animate();
        }
    }

    complexity()
    {
        return this._complexity;
    }
    
    async #loadImages()
    {
        this.images = { };
        const promises = this.plantList.map((data) => {
            const image = new Image();
            this.images[data.image] = image;
            return new Promise((resolve, reject) => {
                image.onload = () => image.decode().then(() => resolve());
                image.onerror = () => reject(new Error(`Failed to load image: ${data.image}`));
                image.src = data.image;
            });
        });

        await Promise.all(promises);
    }
}

class SheetsBenchmark extends Benchmark {
    constructor(options)
    {
        super(new SheetsStage(), options);
    }
}

window.benchmarkClass = SheetsBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 1;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 5000;
    }
    
    results()
    {
        return [];
    }
}

// This allows the test HTML file to be loaded directly and run the test with fixed complexity.
window.addEventListener('load', async () => {
    if (!(window === window.parent))
        return;

    var benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {

    });

}, false);
