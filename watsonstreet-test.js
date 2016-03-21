#!/usr/bin/env node
"use strict";

var util = require( 'util' );
var repl = require( 'repl' );
var netcdf = require( './watsonstreet.js' );
var imshow = require( 'ndarray-imshow' );
var ndarray = require( 'ndarray' );
var proj4 = require( 'proj4' );
var cwise = require( 'cwise' );

/*
var repl = repl.start( {
  prompt : " -> ",
  input  : process.stdin,
  output : process.stdout
} );
repl.context.netcdf = netcdf;
repl.context.imshow = imshow;
*/
/*
repl.context.t_sfc = new netcdf( {
  filename : "/Users/john/Temp/bom-weather/20141230_185400/IDV71000_VIC_T_SFC.nc"
} );
repl.context.curing = new netcdf( {
  filename : "/Users/john/Downloads/data.nc"
} );
*/
/*
repl.context.curing = new netcdf( {
  filename : "http://opendap.bom.gov.au:8080/thredds/dodsC/curing_modis_500m_8-day/aust/netcdf/mapvictoria/curing_modis-mapvictoria_8day_500m_aust_20150618-20150625.nc"
} );
*/

//imshow( t_sfc.variable( 0 ).ndarray().pick( 101 ).step( -4, 4 ), {min:0,max:40,colormap:'jet'} )

//repl.context.nd = {
//  imshow: imshow
//};

/*
var t_sfc = new netcdf( {
  //filename : "/Users/john/Temp/bom-weather/20141230_185400/IDV71000_VIC_T_SFC.nc"
  //filename : "/Users/john/Temp/bom-weather/20141230_185400/IDV71006_VIC_Wind_Mag_SFC.nc"
  //filename: "/Users/john/Development/home/watsonstreet/data.nc",
  debug : false
} );
*/

var orig = new netcdf( {} );
  orig.open( "/Users/john/Temp/bom-weather/20141230_185400/IDV71000_VIC_T_SFC.nc" );
var copy = new netcdf( {} );
  copy.create( "/Users/john/Development/home/watsonstreet/new.nc" );

//console.log( orig.get_attributes() );
console.log( orig.get_attribute( "Conventions" ) );
console.log( orig.get_attribute( netcdf.NC_GLOBAL, "Conventions" ) );
//console.log( orig.get_attribute( netcdf.NC_GLOBAL, 1 ) );

//var attrs = orig.get_attributes();
//for ( var i = 0, len = attrs.length; i < len; i++ ) {
//  copy.add_attribute( netcdf.NC_GLOBAL, attrs[ i ] );
//}
//
//var dims = orig.get_dimensions();
//for ( var i = 0, len = dims.length; i < len; i++ ) {
//  copy.add_dimension( dims[ i ] );
//}
//
//copy.enddef();
//
//var vars = orig.get_variables();
//for ( var i = 0, len = vars.length; i < len; i++ ) {
//  copy.add_variable( vars[ i ] );
//}
//
//copy.close();

var GDA94 = 'PROJCS["GDA94 / Vicgrid94",' +
            '  GEOGCS["GDA94",' +
            '    DATUM["Geocentric_Datum_of_Australia_1994",' +
            '      SPHEROID["GRS 1980",6378137,298.257222101,' +
            '        AUTHORITY["EPSG","7019"]],' +
            '      TOWGS84[0,0,0,0,0,0,0],' +
            '      AUTHORITY["EPSG","6283"]],' +
            '    PRIMEM["Greenwich",0,' +
            '      AUTHORITY["EPSG","8901"]],' +
            '    UNIT["degree",0.01745329251994328,' +
            '      AUTHORITY["EPSG","9122"]],' +
            '    AUTHORITY["EPSG","4283"]],' +
            '  UNIT["metre",1,' +
            '    AUTHORITY["EPSG","9001"]],' +
            '  PROJECTION["Lambert_Conformal_Conic_2SP"],' +
            '  PARAMETER["standard_parallel_1",-36],' +
            '  PARAMETER["standard_parallel_2",-38],' +
            '  PARAMETER["latitude_of_origin",-37],' +
            '  PARAMETER["central_meridian",145],' +
            '  PARAMETER["false_easting",2500000],' +
            '  PARAMETER["false_northing",2500000],' +
            '  AUTHORITY["EPSG","3111"],' +
            '  AXIS["Easting",EAST],' +
            '  AXIS["Northing",NORTH]]';

proj4.defs( [
  [
    'EPSG:4326',
    '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
  [
    'EPSG:4269',
    '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees'
  ],
  [
    'EPSG:3111',
    GDA94
  ]
] );

var t_sfc = orig.get_variable( 0 ).ndarray().pick( 1 );
var orig_lats = orig.get_variable( 1 ).ndarray();
var orig_lngs = orig.get_variable( 2 ).ndarray();

var max = cwise({
  args: ["array"],
  pre: function() { this.val = -999999999; },
  body: function(a) { this.val = Math.max( this.val, a ); },
  post: function() { return this.val; }
});
var x_max = max( orig_lngs );
var y_max = max( orig_lats );

var min = cwise({
  args: ["array"],
  pre: function() { this.val = 999999999; },
  body: function(a) { this.val = Math.min( this.val, a ); },
  post: function() { return this.val; }
});
var y_min = min( orig_lats );
var x_min = min( orig_lngs );

var find = cwise({
  args: ["index", "array", "scalar"],
  pre: function() {
    this.val = -1;
    this.max = -1;
    this.set = false;
  },
  body: function(i, a, b) {
    this.max = i[0];
    if ( !this.set && ( a < b ) ) {
      this.val = i[0];
    } else {
      this.set = true;
    }
  },
  post: function() {
    return this.val == -1 ? this.max : this.val;
  }
});

//var extent = {
//  ll : { x : 2261958, y : 2126760 },
//  ur : { x : 2827038, y : 2939700 }
//};
var extent = {
  ll : { x : 2100000, y : 2200000 },
  ur : { x : 3000000, y : 2857038 }
};

var size = 1000;
//var size = 60000;
var long = [];
for ( var x = extent.ll.x ; x < extent.ur.x ; x += size ) {
  long.push( x );
}
var lat = [];
for ( var y = extent.ll.y ; y < extent.ur.y ; y += size ) {
  lat.push( y );
}

var output = ndarray( new Float32Array( lat.length * long.length ), [lat.length,long.length] );
for ( var y = extent.ll.y, j = 0; y < extent.ur.y; y += size, j++ ) {
  for ( var x = extent.ll.x, i = 0; x < extent.ur.x ; x += size, i++ ) {
    var coord = proj4( 'EPSG:3111', 'EPSG:4326', [ x, y ] );
    if ( coord[1] > y_min && coord[1] < y_max && coord[0] > x_min && coord[0] < x_max ) {
      var a = find( orig_lats, coord[1] );
      var b = find( orig_lngs, coord[0] );
      var val = t_sfc.get( a, b );
      output.set( j, i, val );
    } else {
      output.set( j, i, -31767 );
    }
  }
}

var ss = [2100000,2200000,3000000,2857038];

console.log( proj4( 'EPSG:3111', 'EPSG:4326', [ 2261958, 2126760 ] ) );
console.log( proj4( 'EPSG:3111', 'EPSG:4326', [ 2827038, 2939700 ] ) );

console.log( t_sfc.shape );
imshow( t_sfc.step( -1, 1 ), {min:0,max:40,colormap:'jet'} );

console.log( output.shape );
imshow( output.step( -1, 1 ), {min:0,max:40,colormap:'jet'} );

//console.log( proj4( 'EPSG:3111', [ 144.5, -37.5 ] ) );

//--extent 2261958,2126760,2827038,2939700
//--extent 2100000,2200000,3000000,2857038
//cellSize = 510

/*
console.log( "++++++++++++++++++++++" );
console.log( "++ Attributes       ++" );
console.log( "++++++++++++++++++++++" );
console.log( t_sfc.attributes() );
*/

/*
console.log( "++++++++++++++++++++++" );
console.log( "++ Dimensions       ++" );
console.log( "++++++++++++++++++++++" );
console.log( util.inspect( t_sfc.dimensions(), false, 3 ) );
*/

/*
console.log( "++++++++++++++++++++++" );
console.log( "++ Variables        ++" );
console.log( "++++++++++++++++++++++" );
console.log( util.inspect( t_sfc.variables(), false, 3 ) );
*/

/*
console.log( "++++++++++++++++++++++" );
console.log( "++ Variable Time   ++" );
console.log( "++++++++++++++++++++++" );
console.log( util.inspect( t_sfc.variable( 3 ), false, 3 ) );
var time = t_sfc.variable( 3 );
for ( var i = 0; i < time.length ; i++ ) {
  console.log( new Date( time.data.get( i ) * 1000 ) );
}
*/

/*
console.log( "++++++++++++++++++++++" );
console.log( "++ Variable T_SFC   ++" );
console.log( "++++++++++++++++++++++" );
console.log( util.inspect( t_sfc.variable( 0 ), false, 3 ) );
*/