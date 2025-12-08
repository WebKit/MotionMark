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


class RandomAccessSet extends Set {
    random()
    {
        const index = Stage.randomInt(0, this.size - 1);
        return [...this][index];
    }
}

class GridPosition {
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

class TreeNode {
    constructor(parentNode, position)
    {
        this.parentNode = parentNode;
        this.position = position;
    }

    setGridPositionForIndex(index)
    {
        switch (index) {
        case 0:
            this.position = new GridPosition(0, 0);
            break;
        case 1:
            this.position = new GridPosition(1, 0);
            break;
        case 2:
            this.position = new GridPosition(0, 1);
            break;
        case 3:
            this.position = new GridPosition(1, 1);
            break;
        }
    }    
}

// A non-leaf node. This always has 4 children, either other nodes, or leaves (possibly mixed).
class ContainerNode extends TreeNode {
    constructor(parentNode, depth)
    {
        super(parentNode);
        
        this.depth = depth;
        this.children = new Array(FractalLayoutController.MAX_CHILDREN_PER_NODE);
    }
    
    addChildInRandomEmptySlot(node)
    {
        const index = this.#findRandomEmptyChildIndex();
        if (index === -1)
            return false;

        node.parentNode = this;
        this.children[index] = node;
        node.setGridPositionForIndex(index);
        return true;
    }
    
    setChildAtIndex(index, node)
    {
        node.parentNode = this;
        this.children[index] = node;
        node.setGridPositionForIndex(index);
    }

    removeChildNode(node)
    {
        const index = this.children.indexOf(node);
        if (index === -1)
            throw new TypeError('Tried to remove a node which is not a child');

        this.removeChildAtIndex(index);
    }
    
    removeChildAtIndex(index)
    {
        const childNode = this.children[index];
        childNode.parentNode = null;
        delete this.children[index];
    }
    
    get childCount()
    {
        return this.children.reduce(c => c + 1, 0);
    }
    
    get containerChildren()
    {
        const children = [];
        this.children.reduce((c, node) => {
            if (node instanceof ContainerNode)
                children.push(node);
        }, 0);
        return children;
    }
    
    hasAllLeafChildren()
    {
        return this.children.reduce((count, node) => {
            return (node instanceof LeafNode) ? count + 1 : count;
        }, 0) === FractalLayoutController.MAX_CHILDREN_PER_NODE;
    }

    findRandomContainerChildIndex()
    {
        const containerChildIndexes = this.containerChildIndices;
        return containerChildIndexes[Stage.randomInt(0, containerChildIndexes.length - 1)];
    }
    
    get containerChildIndices()
    {
        const containerChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] instanceof ContainerNode)
                containerChildIndexes.push(i);
        }
        
        return containerChildIndexes;
    }

    #findRandomEmptyChildIndex()
    {
        const emptyChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] === undefined)
                emptyChildIndexes.push(i);
        }
        
        if (emptyChildIndexes.length === 0)
            return -1;
        
        return emptyChildIndexes[Stage.randomInt(0, emptyChildIndexes.length - 1)];
    }

    findRandomLeafChildIndex()
    {
        const leafChildIndexes = [];
        
        for (let i = 0; i < this.children.length; ++i) {
            if (this.children[i] instanceof LeafNode)
                leafChildIndexes.push(i);
        }
        
        if (leafChildIndexes.length === 0)
            return -1;
        
        return leafChildIndexes[Stage.randomInt(0, leafChildIndexes.length - 1)];
    }    
}


class LeafNode extends TreeNode {
    static NUM_LEAF_TYPES = 4;
    constructor(parentNode)
    {
        super(parentNode);
        this.element = document.createElement('div');
        this.element.className = 'leaf';
        this.element.classList.add(`type-${Stage.randomInt(1, LeafNode.NUM_LEAF_TYPES)}`);
        
        const childElement = document.createElement('div');
        childElement.textContent = this.#randomTextContent();
        this.element.appendChild(childElement);
    }
    
    #randomTextContent()
    {
        const values = [
            '♚',
            '♛',
            '♞',
            '♜',
        ];
        
        return values[Stage.randomInt(0, values.length - 1)];
    }
}


class LayoutController {
    constructor(container, stageSize)
    {
        this._container = container;
        this._stageSize = stageSize;
    }
    
    arrangeItems()
    {
    }
}

class FractalLayoutController extends LayoutController {
    static MAX_CHILDREN_PER_NODE = 4;

    constructor(container, stageSize)
    {
        super(container, stageSize);
        this._container = container;
        this._stageSize = stageSize;
        this._rootNode = new ContainerNode(null, 0);
        this._rootNode.setGridPositionForIndex(0);

        // Keep track of leaf nodes at each depth level. The lists aren't sorted.
        this.leafNodes = new Array();
    }
    
    arrangeItems(countDelta)
    {
        if (countDelta > 0)
            this.#addNodes(countDelta);
        else if (countDelta < 0)
            this.#removeNodes(Math.abs(countDelta));
    }

    #addNodes(count)
    {
        for (let i = 0; i < count; ++i)
            this.#insertLeafNode(new LeafNode());
    }
    
    #removeNodes(count)
    {
        for (let i = 0; i < count; ++i)
            this.#removeLeafNode();
    }
    
    #ensureLeafSetForDepth(depth)
    {
        while (this.leafNodes.length <= depth)
            this.leafNodes.push(new RandomAccessSet());
    }
    
    #positionLeaf(leafNode)
    {
        const sizeFraction = (depth) => { return 1 / Math.pow(2, depth) };
        
        const depth = leafNode.parentNode.depth + 1
        const cqFraction = sizeFraction(depth);
        const pixelGap = 2;
        leafNode.element.style.width = `calc(${100 * cqFraction}cqw - ${pixelGap}px)`;
        leafNode.element.style.height = `calc(${100 * cqFraction}cqh - ${pixelGap}px)`;
        
        let position = new Point(leafNode.position.x * cqFraction, leafNode.position.y * cqFraction);
        let currNode = leafNode.parentNode;
        while (currNode) {
            const fraction = sizeFraction(currNode.depth);
            position = new Point(position.x + currNode.position.x * fraction, position.y + currNode.position.y * fraction);
            currNode = currNode.parentNode;
        }

        leafNode.element.style.left = `${100 * position.x}cqw`;
        leafNode.element.style.top = `${100 * position.y}cqw`;
        
        leafNode.element.style.setProperty("--depth", depth);
        leafNode.element.style.setProperty("--random", Stage.randomInt(0, 100));
    }

    #leafWillBeRemoved(leafNode)
    {
        const depth = leafNode.parentNode.depth;
        this.#ensureLeafSetForDepth(depth);
        this.leafNodes[depth].delete(leafNode);
        leafNode.element.remove();
    }

    #leafWasAdded(leafNode)
    {
        const depth = leafNode.parentNode.depth;
        this.#ensureLeafSetForDepth(depth);
        this.leafNodes[depth].add(leafNode);
        this.#positionLeaf(leafNode);
        this._container.appendChild(leafNode.element);
    }
    
    #insertLeafNode(leafNode)
    {
        // First try to find the lowest hole in the tree.
        let container = this.#containerWithHole(this._rootNode);
        if (container) {
            container.addChildInRandomEmptySlot(leafNode);
            this.#leafWasAdded(leafNode);
            return;
        }

        const oldLeaf = this.#findRandomRootmostLeaf(this._rootNode);
        if (oldLeaf) {
            const parent = oldLeaf.parentNode;
            const index = parent.children.indexOf(oldLeaf);

            if (!(oldLeaf instanceof LeafNode))
                throw new TypeError('Old leaf node should be a LeafNode');
            
            const newContainer = new ContainerNode(parent, parent.depth + 1);
            parent.setChildAtIndex(index, newContainer);

            this.#leafWillBeRemoved(oldLeaf);
            newContainer.addChildInRandomEmptySlot(oldLeaf);
            this.#leafWasAdded(oldLeaf);

            newContainer.addChildInRandomEmptySlot(leafNode);
            this.#leafWasAdded(leafNode);
            return;
        }

        throw new TypeError('Failed to find insertion point for leaf node');
    }

    #deepestLeafNodeSet()
    {
        for (let i = this.leafNodes.length - 1; i >= 0; --i) {
            if (this.leafNodes[i].size > 0)
                return this.leafNodes[i];
        }
        return null;
    }

    #shallowestLeafNodeSet()
    {
        for (let leafSet of this.leafNodes) {
            if (leafSet.size > 0)
                return leafSet;
        }

        return null;
    }

    #removeLeafNode()
    {
        const targetSet = this.#deepestLeafNodeSet();
        if (!targetSet)
            return;

        const leafToRemove = targetSet.random();
        const container = leafToRemove.parentNode;
        this.#leafWillBeRemoved(leafToRemove);
        leafToRemove.parentNode.removeChildNode(leafToRemove);
        
        this.#removeEmptyContainers(container);
    }
    
    #removeEmptyContainers(containerNode)
    {
        while (containerNode.childCount === 0) {
            const nextContainer = containerNode.parentNode;
            if (!nextContainer)
                break;
            
            nextContainer.removeChildNode(containerNode);
            containerNode = nextContainer;
        }
    }

    #findRandomRootmostLeaf(currNode)
    {
        const targetSet = this.#shallowestLeafNodeSet();
        if (!targetSet)
            return null;
        
        return targetSet.random();
    }

    #containerWithHole(currNode)
    {
        if (currNode.childCount < FractalLayoutController.MAX_CHILDREN_PER_NODE)
            return currNode;

        // Make this breadth first
        for (let child of currNode.children) {
            if (!(child instanceof ContainerNode))
                continue;

            const found = this.#containerWithHole(child);
            if (found)
                return found;
        }
        return null;
    }
}

class ChessStage extends Stage {
    constructor()
    {
        super();

       //Pseudo.randomSeed = Date.now();

        this._complexity = 0;
        this._animValue = 0;
        this._items = [];
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);
        
        this.container = document.getElementById('container');
        const stageRect = this.container.getBoundingClientRect();
        
        this.layout = new FractalLayoutController(this.container, new Size(stageRect.width, stageRect.height));
    }

    tune(countDelta)
    {
        if (countDelta == 0)
            return;

        this.layout.arrangeItems(countDelta);
        this._complexity += countDelta;
    }

    animate()
    {
        this.element.style.setProperty("--anim-value", ++this._animValue);
    }

    complexity()
    {
        return this._complexity;
    }
}

class ChessBenchmark extends Benchmark {
    constructor(options)
    {
        super(new ChessStage(), options);
    }
}

window.benchmarkClass = ChessBenchmark;

class FakeController {
    constructor()
    {
        this.initialComplexity = 42;
        this.startTime = new Date;
    }

    shouldStop()
    {
        const now = new Date();
        return (now - this.startTime) > 50000;
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

    const benchmark = new window.benchmarkClass({ });
    benchmark._controller = new FakeController();
    await benchmark.initialize({ });

    benchmark.run().then(function(testData) {
        
    });

}, false);
