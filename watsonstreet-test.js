#!/usr/bin/env node
"use strict";

var util = require( 'util' );
var repl = require( 'repl' );
var netcdf = require( './watsonstreet.js' );
var imshow = require( 'ndarray-imshow' );

var repl = repl.start( {
  prompt : " -> ",
  input  : process.stdin,
  output : process.stdout
} );
repl.context.netcdf = netcdf;
repl.context.imshow = imshow;
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

var attrs = orig.get_attributes();
for ( var i = 0, len = attrs.length; i < len; i++ ) {
  copy.add_attribute( netcdf.NC_GLOBAL, attrs[ i ] );
}

var dims = orig.get_dimensions();
for ( var i = 0, len = dims.length; i < len; i++ ) {
  copy.add_dimension( dims[ i ] );
}

copy.enddef();

var vars = orig.get_variables();
for ( var i = 0, len = vars.length; i < len; i++ ) {
  copy.add_variable( vars[ i ] );
}

copy.close();

console.log( "Fin" );

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