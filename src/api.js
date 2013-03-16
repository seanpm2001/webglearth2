/**
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 * Copyright 2013 Klokan Technologies Gmbh (www.klokantech.com)
 */

goog.provide('weapi');

goog.require('goog.math');

goog.require('we.canvas2image');
goog.require('weapi.App');
goog.require('weapi.Map');
goog.require('weapi.MiniGlobe');


//TODO: markers+popups, events, polygons, canvasProxy for screenshots
//      pauseRendering, pixelcolor, mapopts, zoom


//Constructor
goog.exportSymbol('WebGLEarth', weapi.App);


////////////////////////////////////////////////////////////////////////////////
/* Camera manipulation */

goog.exportSymbol('WebGLEarth.prototype.setAltitude', function(alt) {
  var cam = this.camera;
  cam.animator.cancel();

  var heading = cam.getHeading();
  var tilt = cam.getTilt();

  cam.setPos(undefined, undefined, alt);
  cam.setHeadingAndTilt(heading, tilt);
});

goog.exportSymbol('WebGLEarth.prototype.getAltitude', function() {
  return this.camera.getPos()[2];
});

goog.exportSymbol('WebGLEarth.prototype.setPosition', function(lat, lon,
    opt_zoom, opt_altitude, opt_heading, opt_tilt, opt_targetPosition) {
      if (goog.isDefAndNotNull(opt_zoom)) {
        window['console']['log']('Zoom is no longer supported.');
      }

      var cam = this.camera;
      cam.animator.cancel();

      lat = goog.math.toRadians(lat);
      lon = goog.math.toRadians(lon);
      var alt = opt_altitude || cam.getPos()[2];
      var heading = goog.math.toRadians(opt_heading) || cam.getHeading();
      var tilt = goog.math.toRadians(opt_tilt) || cam.getTilt();

      if (opt_targetPosition) {
        var newPos = weapi.Camera.calculatePositionForGivenTarget(
            lat, lon, alt,
            heading, tilt);

        lat = newPos[0];
        lon = newPos[1];
      }

      cam.setPosHeadingAndTilt(lat, lon, alt, heading, tilt);
    });

goog.exportSymbol('WebGLEarth.prototype.getPosition', function() {
  var pos = this.camera.getPos();
  return [goog.math.toDegrees(pos[0]), goog.math.toDegrees(pos[1])];
});

goog.exportSymbol('WebGLEarth.prototype.getHeading', function() {
  return goog.math.toDegrees(this.camera.getHeading());
});

goog.exportSymbol('WebGLEarth.prototype.getTilt', function() {
  return goog.math.toDegrees(this.camera.getTilt());
});

goog.exportSymbol('WebGLEarth.prototype.setHeading', function(heading) {
  this.camera.animator.cancel();
  this.camera.setHeading(goog.math.toRadians(heading));
});

goog.exportSymbol('WebGLEarth.prototype.setTilt', function(tilt) {
  this.camera.animator.cancel();
  this.camera.setTilt(goog.math.toRadians(tilt));
});

goog.exportSymbol('WebGLEarth.prototype.flyTo', function(latitude, longitude,
                                                         opt_altitude,
                                                         opt_heading,
                                                         opt_tilt,
                                                         opt_targetPosition) {
      this.camera.animator.flyTo(goog.math.toRadians(latitude),
          goog.math.toRadians(longitude),
          opt_altitude,
          goog.math.toRadians(opt_heading),
          goog.math.toRadians(opt_tilt),
          opt_targetPosition);
    });

goog.exportSymbol('WebGLEarth.prototype.flyToFitBounds', function(minlat,
                                                                  maxlat,
                                                                  minlon,
                                                                  maxlon) {
      minlat = goog.math.toRadians(minlat);
      maxlat = goog.math.toRadians(maxlat);
      minlon = goog.math.toRadians(minlon);
      maxlon = goog.math.toRadians(maxlon);

      var altitude = this.camera.calcDistanceToViewBounds(minlat, maxlat,
                                                          minlon, maxlon);

      minlon = goog.math.modulo(minlon, 2 * Math.PI);
      maxlon = goog.math.modulo(maxlon, 2 * Math.PI);

      var lonDiff = minlon - maxlon;
      if (lonDiff < -Math.PI) {
        minlon += 2 * Math.PI;
      } else if (lonDiff > Math.PI) {
        maxlon += 2 * Math.PI;
      }

      var center = [(minlat + maxlat) / 2, (minlon + maxlon) / 2];

      this.camera.animator.flyTo(center[0], center[1], altitude);
    });

goog.exportSymbol('WebGLEarth.prototype.getTarget', function() {
  var center = new Cesium.Cartesian2(this.canvas.width / 2,
                                     this.canvas.height / 2);
  var position = this.camera.camera.controller.pickEllipsoid(center);

  if (goog.isDefAndNotNull(position)) {
    var carto = this.camera.ellipsoid.cartesianToCartographic(position);
    return [goog.math.toDegrees(carto.latitude),
            goog.math.toDegrees(carto.longitude)];
  } else {
    return undefined;
  }
});


////////////////////////////////////////////////////////////////////////////////
/* Various */

goog.exportSymbol('WebGLEarth.prototype.handleResize',
                  weapi.App.prototype.handleResize);

goog.exportSymbol('WebGLEarth.prototype.saveScreenshot', function(name) {
  this.afterFrameOnce = goog.bind(function() {
    //var canvas_ = we.canvas2image.prepareCanvas(this.context.canvas,
    //                                            this.markerManager,
    //                                            this.context.scene.miniGlobe);
    we.canvas2image.saveCanvasAsPNG(this.scene.getCanvas(), name);
  }, this);
});

goog.exportSymbol('WebGLEarth.prototype.getScreenshot', function(callback) {
  this.afterFrameOnce = goog.bind(function() {
    //var canvas_ = we.canvas2image.prepareCanvas(this.context.canvas,
    //                                            this.markerManager,
    //                                            this.context.scene.miniGlobe);
    callback(we.canvas2image.getCanvasAsDataURL(this.scene.getCanvas()));
  }, this);
});

goog.exportSymbol('WebGLEarth.prototype.showMiniGlobe', function(src, size) {
  if (goog.isDefAndNotNull(src)) {
    this.miniglobe = new weapi.MiniGlobe(this, 32, 32, src);
    this.miniglobe.setSize(size);
  } else {
    this.miniglobe = null;
  }
});

////////////////////////////////////////////////////////////////////////////////
/* Maps */

goog.exportSymbol('WebGLEarth.Maps', weapi.maps.MapType);
goog.exportSymbol('WebGLEarth.prototype.initMap', weapi.maps.initMap);
goog.exportSymbol('WebGLEarth.prototype.setBaseMap',
                  weapi.App.prototype.setBaseMap);
goog.exportSymbol('WebGLEarth.prototype.setOverlayMap',
                  weapi.App.prototype.setOverlayMap);

goog.exportSymbol('WebGLEarth.Map', weapi.Map);
goog.exportSymbol('WebGLEarth.Map.prototype.setBoundingBox',
                  weapi.Map.prototype.setBoundingBox);
goog.exportSymbol('WebGLEarth.Map.prototype.setOpacity',
                  weapi.Map.prototype.setOpacity);
goog.exportSymbol('WebGLEarth.Map.prototype.getOpacity',
                  weapi.Map.prototype.getOpacity);


////////////////////////////////////////////////////////////////////////////////
/* DEPRECATED */
goog.exportSymbol('WebGLEarth.prototype.setCenter', function(coords) {
  var cam = this.camera;
  cam.animator.cancel();

  cam.setPosHeadingAndTilt(goog.math.toRadians(coords[0]),
                           goog.math.toRadians(coords[1]),
                           cam.getPos()[2], cam.getHeading(), 0);
});

goog.exportSymbol('WebGLEarth.prototype.getCenter', function() {
  var pos = this.camera.getPos();
  return [goog.math.toDegrees(pos[0]), goog.math.toDegrees(pos[1])];
});
