# Alice HTML Test

Goals
-----

Measure HTML/CSS workloads that replicate what a typography-heavy page might see.

Design
------

Each item is a header and paragraph, using text from Alice In Wonderland. There are size variants, each in a different language, including Japanese and Korean. The Japanese test uses the `vertical-rl` writing mode.

Features tested
---------------

* Variable fonts, WOFF2
* ::first-letter (until Firefox supports `initial-letter`)
* -webkit-text-stroke, -webkit-text-fill-color
* text decoration underline
* text shadow with zero radius


Work per measured frame
----------------------

* Animate element positions via CSS OM
* Drawing which results from changing the text color


Inspired by sites
----------------

Various text-heavy sites
https://forums.whirlpool.net.au (non-blurred text shadow)


Licensing requirements
----------------------

* https://github.com/theleagueof/ostrich-sans/blob/master/Open%20Font%20License.markdown
* https://github.com/theleagueof/linden-hill/blob/master/Open%20Font%20License.markdown
* Hebrew translation: https://benyehuda.org/read/34262

Remaining work
--------------

* Unique text
* Different languages
* More font features?
* Small layout differences per element to prevent instancing