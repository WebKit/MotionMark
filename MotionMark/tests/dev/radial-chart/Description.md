# Canvas Radial Chart

Goals
-----

A single canvas test that exercises much of the canvas 2D API, replacing `Paths`, `Arcs` and `Lines`.


Design
------

A radial chart. Unit of work is a chart "segment". With higher complexities, more rings of segments are created.


Features tested
---------------

* text drawing
* image drawing
* lines, arcs, curves
* dashed lines
* clipping to a path
* gradients
* text with shadowBlur


Work per measured frame
----------------------

Redraw of the entire canvas


Licensing requirements
----------------------

French departements images, e.g. https://commons.wikimedia.org/wiki/File:Blason_département_fr_Ain.svg
Creative Commons, requires attribution.


Remaining work
--------------

* Add images for the rest of the departements. Maybe use a sprite image.
* Add some more canvas features?
* Revisit whether the concentric rings are best for high complexity. Perhaps have multiple, smaller non-overlapping rings.
