# Départements

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
* canvas-to-canvas draw
* pattern drawing
* globalCompositeOperator


Work per measured frame
----------------------

Redraw of the entire canvas


Licensing requirements
----------------------

Départements data from https://www.regions-et-departements.fr/departements-francais
Map from https://mapsvg.com/maps/france-departments


Remaining work
--------------

* Revisit whether the concentric rings are best for high complexity. Perhaps have multiple, smaller non-overlapping rings.
