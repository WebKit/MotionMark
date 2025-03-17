# Map Zoomer

Goals
-----

A test that replicates what an embedded MapBox-style map might do.


Design
------

Each element is an emebdded map. The map tiles are `<img>` inside a container with a `scale` transform.

There is an SVG path overlay representing a GPS track.

There are controls layered on top, and photo "placards".


Features tested
---------------

* text drawing
* image drawing
* lines, arcs, curves
* clipping to a path
* gradients


Work per measued frame
----------------------

Redraw after changing the scale transform on the map tile container, the SVG path, and when repositioning the photo placards.


Remaining work
--------------

* Royalty free assets