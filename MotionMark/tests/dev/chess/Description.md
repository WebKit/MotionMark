# Chess HTML Test

Goals
-----

Render some common CSS box decorations and effects.

Design
------

A fractal grid of absolutely positioned boxes, laid out via script. There are four types of boxes, each with its own style.

Animation occurs via one keyframe animation, and the rest via CSS variable resolution; script increments a single
"anim-value" property on the root each frame. This is propagated to different CSS properties via variables and calc.

Features tested
---------------

* inset box-shadow
* border-radius
* linear, radial and conic gradients
* oklch colors
* background-blend-mode
* mix-blend-mode
* repeating background-image
* background-clip: text
* text-shadow

Websites with related workloads
-------------------------------

* https://colorpicker.dev



Work per measured frame
----------------------

* One CSS keyframe animation
* CSS variable resolution
* Rendering

Licensing requirements
----------------------

None.

Remaining work
--------------

Tune the colors, perhaps.
