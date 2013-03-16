/**
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 * Copyright 2013 Klokan Technologies Gmbh (www.klokantech.com)
 */

goog.provide('weapi.App');

goog.require('goog.dom');

goog.require('weapi.Camera');
goog.require('weapi.maps');



/**
 *
 * @param {string} divid .
 * @param {Object=} opt_options Application options.
 * @constructor
 */
weapi.App = function(divid, opt_options) {
  var options = opt_options || {};
  //TODO: map, zoom, proxyHost
  weapi.maps.initStatics();

  var container = goog.dom.getElement(divid);
  container.style.position = 'relative';
  this.canvas = goog.dom.createElement('canvas');
  this.canvas.style.width = '100%';
  this.canvas.style.height = '100%';
  this.canvas.oncontextmenu = function() {return false;};
  container.appendChild(this.canvas);

  /** @type {?Function} */
  this.afterFrameOnce = null;

  this.scene = new Cesium.Scene(this.canvas);

  /** @type {?weapi.MiniGlobe} */
  this.miniglobe = null;

  if (options['atmosphere'] !== false) {
    this.scene.skyAtmosphere = new Cesium.SkyAtmosphere();

    var skyBoxBaseUrl = '../Cesium/Source/Assets/Textures/SkyBox/tycho2t3_80';
    this.scene.skyBox = new Cesium.SkyBox({
      'positiveX' : skyBoxBaseUrl + '_px.jpg',
      'negativeX' : skyBoxBaseUrl + '_mx.jpg',
      'positiveY' : skyBoxBaseUrl + '_py.jpg',
      'negativeY' : skyBoxBaseUrl + '_my.jpg',
      'positiveZ' : skyBoxBaseUrl + '_pz.jpg',
      'negativeZ' : skyBoxBaseUrl + '_mz.jpg'
    });
  } else {
    //TODO: transparent color ?
  }

  var primitives = this.scene.getPrimitives();

  // Bing Maps
  var bing = new Cesium.BingMapsImageryProvider({
    'url' : 'http://dev.virtualearth.net',
    'mapStyle' : Cesium.BingMapsStyle.AERIAL_WITH_LABELS,
    // Some versions of Safari support WebGL, but don't correctly implement
    // cross-origin image loading, so we need to load Bing imagery using a proxy
    proxy: Cesium.FeatureDetection.supportsCrossOriginImagery() ?
        undefined : new Cesium.DefaultProxy('/proxy/')
  });

  var ellipsoid = Cesium.Ellipsoid.WGS84;
  this.centralBody = new Cesium.CentralBody(ellipsoid);
  this.centralBody.getImageryLayers().addImageryProvider(bing);

  this.camera = new weapi.Camera(this.scene.getCamera(), ellipsoid);

  primitives.setCentralBody(this.centralBody);

  function animate() {
    // INSERT CODE HERE to update primitives based on
    // changes to animation time, camera parameters, etc.
  }

  var tick = goog.bind(function() {
    this.scene.initializeFrame();
    animate();
    this.scene.render();
    if (goog.isDefAndNotNull(this.miniglobe)) {
      this.miniglobe.draw();
    }
    if (goog.isDefAndNotNull(this.afterFrameOnce)) {
      this.afterFrameOnce();
      this.afterFrameOnce = null;
    }
    Cesium.requestAnimationFrame(tick);
  }, this);
  tick();

  var handler = new Cesium.ScreenSpaceEventHandler(this.canvas);

  var stopAnim = goog.bind(function() {this.camera.animator.cancel();}, this);

  handler.setInputAction(stopAnim, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  handler.setInputAction(stopAnim, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
  handler.setInputAction(stopAnim, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
  handler.setInputAction(stopAnim, Cesium.ScreenSpaceEventType.WHEEL);
  handler.setInputAction(stopAnim, Cesium.ScreenSpaceEventType.PINCH_START);

  window.addEventListener('resize', this.handleResize, false);
  this.handleResize();


  var pos = options['position'];
  var center = options['center'];
  if (goog.isDefAndNotNull(pos) && pos.length > 1) {
    this.camera.setPos(goog.math.toRadians(pos[0]),
                       goog.math.toRadians(pos[1]),
                       undefined);
  } else if (goog.isDefAndNotNull(center) && center.length > 1) {
    this.camera.setPos(goog.math.toRadians(center[0]),
                       goog.math.toRadians(center[1]),
                       undefined);
  }

  // TODO: zoom support
  var z = options['zoom'];
  if (goog.isDefAndNotNull(z)) window['console']['log']('zoom not supported');

  var alt = options['altitude'];
  if (goog.isDefAndNotNull(alt)) this.camera.setPos(undefined, undefined, alt);

  var sscc = this.scene.getScreenSpaceCameraController();

  if (options['panning'] === false) sscc.enableRotate = false;
  if (options['tilting'] === false) sscc.enableTilt = false; //TODO: fix axis
  if (options['zooming'] === false) sscc.enableZoom = false;
};


/**
 *
 */
weapi.App.prototype.handleResize = function() {
  var width = this.canvas.clientWidth;
  var height = this.canvas.clientHeight;

  if (this.canvas.width === width && this.canvas.height === height) {
    return;
  }

  this.canvas.width = width;
  this.canvas.height = height;
  this.scene.getCamera().frustum.aspectRatio = width / height;
};


/**
 * @param {!weapi.Map} map Map.
 */
weapi.App.prototype.setBaseMap = function(map) {
  var layers = this.centralBody.getImageryLayers();
  //this.centralBody.getImageryLayers().get(0) = map.layer;
  layers.remove(layers.get(0), false);
  layers.add(map.layer, 0);
};


/**
 * @param {weapi.Map} map Map.
 */
weapi.App.prototype.setOverlayMap = function(map) {
  var length = this.centralBody.getImageryLayers().getLength();
  var layers = this.centralBody.getImageryLayers();
  if (length > 1) {
    layers.remove(layers.get(1), false);
  }
  if (goog.isDefAndNotNull(map)) {
    layers.add(map.layer);
  }
};
