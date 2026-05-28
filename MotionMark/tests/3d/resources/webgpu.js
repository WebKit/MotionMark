/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

const wgslShaders = `
struct VertexOutput {
    @builtin(position)position : vec4f,
    @location(0) color : vec4f,
};

struct Uniforms {
    scale: f32,
    offsetX: f32,
    offsetY: f32,
    scalar: f32,
    scalarOffset: f32,
};

@group(0) @binding(0) var<uniform> timeUniform : f32;
@group(1) @binding(0) var<uniform> uniforms : Uniforms;

@vertex fn vertexMain(@location(0) position : vec4f,
                      @location(1) color : vec4f) -> VertexOutput {
    let scale = uniforms.scale;
    let offsetX = uniforms.offsetX;
    let offsetY = uniforms.offsetY;
    let scalar = uniforms.scalar;
    let scalarOffset = uniforms.scalarOffset;
    let time = timeUniform;

    var fade = (scalarOffset + time * scalar / 10.0) % 1.0;
    if (fade < 0.5) {
        fade = fade * 2.0;
    } else {
        fade = (1.0 - fade) * 2.0;
    }
    var xpos = position.x * scale;
    var ypos = position.y * scale;
    let angle = 3.14159 * 2.0 * fade;
    let xrot = xpos * cos(angle) - ypos * sin(angle);
    let yrot = xpos * sin(angle) + ypos * cos(angle);
    xpos = xrot + offsetX;
    ypos = yrot + offsetY;

    return VertexOutput(
        vec4f(xpos, ypos, 0.0, 1.0),
        vec4f(fade, 1.0 - fade, 0.0, 1.0) + color,
    );
}

@fragment fn fragmentMain(@location(0) inColor : vec4f) -> @location(0) vec4f {
    return inColor;
}
`;

class WebGPUStage extends Stage {
    constructor()
    {
        super();
    }

    async initialize(benchmark, options)
    {
        await super.initialize(benchmark, options);

        this._numTriangles = 0;

        this._gpuContext = this.element.getContext('webgpu');
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
        const device = await adapter.requestDevice();
        
        this._device = device;

        const swapChainFormat = navigator.gpu.getPreferredCanvasFormat();
        this._gpuContext.configure({
            device: device,
            format: swapChainFormat,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });

        const vec4Size = 4 * Float32Array.BYTES_PER_ELEMENT;

        const module = device.createShaderModule({ code: wgslShaders });

        const pipelineDesc = {
            layout: 'auto',
            vertex: {
                module,
                buffers: [{
                    // vertex buffer
                    arrayStride: 2 * vec4Size,
                    attributes: [{
                        // vertex positions
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x4"
                    }, {
                        // vertex colors
                        shaderLocation: 1,
                        offset: vec4Size,
                        format: "float32x4"
                    }],
                }],
            },
            fragment: {
                module,
                targets: [{ format: swapChainFormat }],
            },
        };

        this._pipeline = device.createRenderPipeline(pipelineDesc);

        const vertexBuffer = device.createBuffer({
            label: "vertex buffer",
            size: 2 * 3 * vec4Size,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        const vertexArrayBuffer = vertexBuffer.getMappedRange();
        const vertexWriteBuffer = new Float32Array(vertexArrayBuffer);
        vertexWriteBuffer.set([
            // position data  /**/ color data
            0, 0.1, 0, 1,     /**/ 1, 0, 0, 1,
            -0.1, -0.1, 0, 1, /**/ 0, 1, 0, 1,
            0.1, -0.1, 0, 1,  /**/ 0, 0, 1, 1,
        ]);
        vertexBuffer.unmap();

        this._vertexBuffer = vertexBuffer;

        this._resetIfNecessary();
    }

    _getFunctionSource(id)
    {
        return document.getElementById(id).text;
    }

    _resetIfNecessary()
    {
        if (this._bindGroups != undefined && this._numTriangles <= this._bindGroups.length)
            return;

        const numTriangles = this._numTriangles;

        const device = this._device;

        this._timeBuffer = device.createBuffer({
            label: "time buffer",
            size: Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        // Minimum buffer offset alignment is 256 bytes.
        const uniformBytes = 5 * Float32Array.BYTES_PER_ELEMENT;
        const alignedUniformBytes = Math.ceil(uniformBytes / 256) * 256;
        const alignedUniformFloats = alignedUniformBytes / Float32Array.BYTES_PER_ELEMENT;

        const uniformBuffer = device.createBuffer({
            size: numTriangles * alignedUniformBytes + Float32Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true,
        });
        const uniformArrayBuffer = uniformBuffer.getMappedRange();
        const uniformWriteArray = new Float32Array(uniformArrayBuffer);

        this._bindGroups = new Array(numTriangles);
        for (let i = 0; i < numTriangles; ++i) {
            uniformWriteArray[alignedUniformFloats * i + 0] = Stage.random(0.2, 0.4);   // scale
            uniformWriteArray[alignedUniformFloats * i + 1] = Stage.random(-0.9, 0.9);  // offsetX
            uniformWriteArray[alignedUniformFloats * i + 2] = Stage.random(-0.9, 0.9);  // offsetY
            uniformWriteArray[alignedUniformFloats * i + 3] = Stage.random(0.5, 2);     // scalar
            uniformWriteArray[alignedUniformFloats * i + 4] = Stage.random(0, 10);      // scalarOffset

            this._bindGroups[i] = device.createBindGroup({
                layout: this._pipeline.getBindGroupLayout(1),
                entries: [{
                    binding: 0,
                    resource: {
                        buffer: uniformBuffer,
                        offset: i * alignedUniformBytes,
                        size: 6 * Float32Array.BYTES_PER_ELEMENT,
                    }
                }]
            });
        }

        uniformBuffer.unmap();

        this._timeBindGroup = device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._timeBuffer,
                    size: Float32Array.BYTES_PER_ELEMENT,
                }
            }]
        });

        this._uniformBuffer = uniformBuffer;
    }

    tune(count)
    {
        if (!count)
            return;

        this._numTriangles += count;
        this._numTriangles = Math.max(this._numTriangles, 0);

        this._resetIfNecessary();
    }

    animate(timeDelta)
    {
        const device = this._device;

        if (!this._startTime)
            this._startTime = Stage.dateCounterValue(1000);

        const elapsedTimeData = new Float32Array([Stage.dateCounterValue(1000) - this._startTime]);

        // Update time uniform
        this._device.queue.writeBuffer(this._timeBuffer, 0, elapsedTimeData);

        const commandEncoder = device.createCommandEncoder({});

        const renderPassDescriptor = {
            colorAttachments: [{
                loadOp: "clear",
                storeOp: "store",
                clearValue: [1, 1, 1, 1],
                view: this._gpuContext.getCurrentTexture(),
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this._pipeline);
        passEncoder.setVertexBuffer(0, this._vertexBuffer);
        passEncoder.setBindGroup(0, this._timeBindGroup);
        for (let i = 0; i < this._numTriangles; ++i) {
            passEncoder.setBindGroup(1, this._bindGroups[i]);
            passEncoder.draw(3, 1, 0, 0);
        }
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
    }

    complexity()
    {
        return this._numTriangles;
    }
}

class WebGPUBenchmark extends Benchmark {
    constructor(options)
    {
        super(new WebGPUStage(), options);
    }
}

window.benchmarkClass = WebGPUBenchmark;
