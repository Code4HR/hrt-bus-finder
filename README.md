hrt-bus-finder
==============

The HRT Bus Finder is the front end / proof-of-concept to the [hrt-bus-api] (https://github.com/c4hrva/hrt-bus-api). The live demo can be found here: http://hrtb.us.

Requirements
============

The front end is developed using the following:

+ [BackboneJS] (http://backbonejs.org/)
  + also requires [jQuery] (http://jquery.com/) and [UnderscoreJS] (http://underscorejs.org/)
+ [Twitter Bootstrap] (http://getbootstrap.com/)
+ and the [Google Maps Api] (https://developers.google.com/maps/)


About the API
=============

The [hrt-bus-api] (https://github.com/c4hrva/hrt-bus-api) is a mash-up of two sources provided by [Hampton Roads Transport (HRT)] (http://www.gohrt.com/). Their bus scheduling information, which is published to [General Transit Feed Specification (GTFS)] (http://www.gtfs-data-exchange.com/agency/hampton-roads-transit-hrt/) and their in-transit routing information which is provided via an alternate source. These two sets of data are pulled into the API and processed, allowing en-route bus tracking.  

Front End Development
=====================

The hrt-bus-finder runs entirely in the browser. As such, development requires nothing more than an Internet connection and the ability to clone this repository.  However, it doesn't hurt to have Node and Grunt set up.

```
git clone git@github.com:c4hrva/hrt-bus-finder.git
cd hrt-bus-finder
npm install -g grunt-cli
npm install
grunt
```

Running grunt will start the app in your browser of choice.  Any changes that you make to the styles, markup, or JS will trigger an automatic refresh in your browser.

Issues / Questions
=========

Any bug reporting or feature requests should be done through the issues tracker in Github.

If you have any general questions regarding this product or Code for Hampton Roads, please feel free to contact us via the [Code for Hampton Roads Google Group] (https://groups.google.com/a/codeforamerica.org/forum/#!forum/c4hrva).
