# Stories HTML Test

Goals
-----

Measure HTML/CSS workloads that are common on social media sites.


Design
------

An HTML/CSS test that replicates a "story" placard on a social media site. A unit of work is one story element;
more elements are placed randomly.


Features tested
---------------

* international text drawing
* image drawing
* border-radius, overflow:clip
* CSS gradients
* text-shadow
* drop-shadow
* CSS variables


Work per measured frame
----------------------

Style update in response to CSS variable change.
Redraw of each element triggered by a scale change on an image element which is z-ordered at the back.


Licensing requirements
----------------------

Free-to-use images from https://unsplash.com (https://unsplash.com/license)
No attribution required (but is appreciated)


Remaining work
--------------

* Decide is there's a nicer layout. Grid layout would be nice but it's hard to shrink things and maintain linear complexity.
* Add some more HTML/CSS features?
* Maybe use an animaiton of background-position/background-size?
