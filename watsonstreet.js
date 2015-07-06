"user strict";

(function ( root, factory ) {
  if ( typeof exports === 'object' ) {
    module.exports = factory();
  }
  else if ( typeof define === 'function' && define.amd ) {
    define( [], factory );
  }
  else {
    root.returnExports = factory();
  }
}( this, function () {

  var arr = require( 'ref-array' );
  var dbg = require( 'debug' )( 'netcdf' );

  var ffi = require( 'ffi' );
  var ref = require( 'ref' );
  var lib = require( './lib/libnetcdf.js' );
  var nda = require( 'ndarray' );

  var cdf = lib.netcdf;

  // Global Variable Id
  const NC_GLOBAL = -1;

  // Types
  const NC_NAT = 0;
  const NC_BYTE = 1;
  const NC_CHAR = 2;
  const NC_SHORT = 3;
  const NC_INT = 4;
  const NC_LONG = NC_INT;
  const NC_FLOAT = 5;
  const NC_DOUBLE = 6;
  const NC_UBYTE = 7;
  const NC_USHORT = 8;
  const NC_UINT = 9;
  const NC_INT64 = 10;
  const NC_UINT64 = 11;
  const NC_STRING = 12;
  const NC_MAX_ATOMIC_TYPE = NC_STRING;

  // Modes
  const NC_NOWRITE = 0x0000;
  const NC_WRITE = 0x0001;
  /* unused: 0x0002 */
  const NC_CLOBBER = 0x0000;
  const NC_NOCLOBBER = 0x0004;
  const NC_DISKLESS = 0x0008;
  const NC_MMAP = 0x0010;
  const NC_CLASSIC_MODEL = 0x0100;
  const NC_64BIT_OFFSET = 0x0200;
  const NC_LOCK = 0x0400;

  const NC_SHARE = 0x0800;

  const NC_NETCDF4 = 0x1000;
  const NC_MPIIO = 0x2000;

  const NC_MPIPOSIX = 0x4000;
  const NC_PNETCDF = 0x8000;

  var NetCDF = function ( options ) {

    function readCString( buf ) {
      return ref.reinterpretUntilZeros( buf, 1 ).toString( 'utf8' );
    }

    var ncid = ref.alloc( ref.types.int32 );

    var ndimsp = ref.alloc( ref.types.int32 );
    var nvarsp = ref.alloc( ref.types.int32 );
    var nattsp = ref.alloc( ref.types.int32 );

    var format = ref.alloc( ref.types.int32 );

    var unlimdimidp = ref.alloc( ref.types.int32 );

    if ( !(this instanceof NetCDF) ) {
      return new NetCDF( options );
    }

    var types = [];
    this.get_type = function ( i ) {
      if ( !types[i] ) {
        var type_name = new Buffer( 20 );
        var type_length = ref.alloc( ref.types.int32 );
        dbg( "nc_inq_type = " + cdf.nc_inq_type( ncid.deref(), i, type_name, type_length ) );
        dbg( "type_id = " + i );
        dbg( "type_name = " + type_name.readCString() );
        dbg( "type_length = " + type_length.deref() );
        types[i] = {
          name   : type_name.readCString(),
          length : type_length.deref()
        };
      }
      return types[i];
    };

    this.open = function ( file ) {
      dbg( "nc_open = " + cdf.nc_open( file, NC_NOCLOBBER, ncid ) );
      dbg( "ncid = " + ncid.deref() );

      dbg( "nc_inq = " + cdf.nc_inq( ncid.deref(), ndimsp, nvarsp, nattsp, unlimdimidp ) );
      dbg( "ndimsp = " + ndimsp.deref() );
      dbg( "nvarsp = " + nvarsp.deref() );
      dbg( "nattsp = " + nattsp.deref() );
      dbg( "unlimdimidp = " + unlimdimidp.deref() );

      dbg( "nc_inq_format = " + cdf.nc_inq_format( ncid.deref(), format ) );
      dbg( "format = " + format.deref() );
    };

    this.create = function ( file ) {
      //NC_DISKLESS | NC_WRITE | NC_CLOBBER | NC_64BIT_OFFSET | NC_NETCDF4
      dbg( "nc_create = " + cdf.nc_create( file, NC_CLOBBER | NC_NETCDF4, ncid ) );
      dbg( "ncid = " + ncid.deref() );
    };

    this.enddef = function () {
      dbg( "nc_enddef = " + cdf.nc_enddef( ncid.deref() ) );
    };

    this.close = function () {
      dbg( "nc_close = " + cdf.nc_close( ncid.deref() ) );
    };

    this.get_attribute = function ( var_id, att_id ) {
      function toValue( typ, buffer ) {
        if ( NC_CHAR == typ ) {
          return buffer.readCString();
        } else if ( NC_INT == typ ) {
          return buffer.readInt32LE( 0 );
        } else if ( NC_FLOAT == typ ) {
          return buffer.readFloatLE( 0 );
        } else if ( NC_STRING == typ ) {
          return buffer.readCString();
        } else {
          return "Fix me you lazy bum";
        }
      }

      var att_name = new Buffer( 100 );
      dbg( "nc_inq_attname = " + cdf.nc_inq_attname( ncid.deref(), var_id, att_id, att_name ) );
      var att_type = ref.alloc( ref.types.int32 );
      var att_length = ref.alloc( ref.types.int32 );
      dbg( "nc_inq_att = " + cdf.nc_inq_att( ncid.deref(), var_id, readCString( att_name ), att_type, att_length ) );
      var att_value = new Buffer( Math.max( att_length.deref(), 64 ) );
      dbg( "nc_get_att = " + cdf.nc_get_att( ncid.deref(), var_id, readCString( att_name ), att_value ) );

      return {
        id     : att_id,
        name   : att_name.readCString(),
        type   : att_type.deref(),
        value  : toValue( att_type.deref(), att_value ),
        length : att_length.deref()
      };
    };

    this.add_attribute = function ( var_id, attribute ) {
      dbg( "Add attribute", attribute );

      var att_name = ref.allocCString( attribute.name ).toString();
      if ( NC_INT == attribute.type ) {
        cdf.nc_put_att_int( ncid.deref(), var_id, att_name, attribute.type, attribute.length,
                            ref.alloc( ref.types.int32, attribute.value ) );
      } else if ( NC_FLOAT == attribute.type ) {
        cdf.nc_put_att_float( ncid.deref(), var_id, att_name, attribute.type, attribute.length,
                              ref.alloc( ref.types.float, attribute.value ) );
      } else if ( NC_STRING == attribute.type ) {
        cdf.nc_put_att_string( ncid.deref(), var_id, att_name, attribute.length,
                               ref.allocCString( attribute.value ).toString() );
      } else if ( NC_CHAR == attribute.type ) {
        cdf.nc_put_att_text( ncid.deref(), var_id, att_name, attribute.length,
                             ref.allocCString( attribute.value ).toString() );
      } else {
        cdf.nc_put_att( ncid.deref(), var_id, att_name, attribute.type, attribute.length, attribute.value );
      }
    };

    this.get_attributes = function ( var_id ) {
      var result = [];
      for ( var i = 0; i < nattsp.deref(); i++ ) {
        result.push( this.get_attribute( var_id || NC_GLOBAL, i ) );
      }
      return result;
    };

    this.get_dimension = function ( dim_id ) {
      var dim_name = new Buffer( 100 );
      var dim_length = ref.alloc( ref.types.size_t );
      cdf.nc_inq_dim( ncid.deref(), dim_id, dim_name, dim_length );
      return {
        id     : dim_id,
        name   : dim_name.readCString(),
        length : dim_length.deref()
      };
    };

    this.add_dimension = function ( dimension ) {
      dbg( "Add dimension", dimension );

      var dim_id = ref.alloc( ref.types.int32 );
      cdf.nc_def_dim( ncid.deref(), dimension.name, dimension.length, dim_id );
    };

    this.get_dimensions = function () {
      var result = [];
      for ( var i = 0; i < ndimsp.deref(); i++ ) {
        result.push( this.get_dimension( i ) );
      }
      return result;
    };

    this.get_variable = function ( var_id ) {
      var var_name = new Buffer( 100 );
      var var_type = ref.alloc( ref.types.int32 );
      var var_endian = ref.alloc( ref.types.int32 );
      var var_ndimsp = ref.alloc( ref.types.int32 );
      var var_dimidsp = new Buffer( 4 * ndimsp.deref() );
      var var_nattsp = ref.alloc( ref.types.int32 );

      cdf.nc_inq_var( ncid.deref(), var_id, var_name, var_type, var_ndimsp, var_dimidsp, var_nattsp );

      var dimensions = [];
      for ( var dim_id = 0; dim_id < var_ndimsp.deref(); dim_id++ ) {
        dimensions.push( this.get_dimension( var_dimidsp.readInt32LE( 4 * dim_id ) ) );
      }

      var attributes = [];
      for ( var att_id = 0; att_id < var_nattsp.deref(); att_id++ ) {
        attributes.push( this.get_attribute( var_id, att_id ) );
      }

      var shape = dimensions.map( function ( i ) {
        return i.length;
      } );

      var length = shape.reduce( function ( i, j ) {
        return i * j;
      }, 1 );

      if ( NC_CLASSIC_MODEL == format.deref() ) {
        dbg( "endian = " + cdf.nc_inq_var_endian( ncid.deref(), var_id, var_endian ) );
      }

      var buffer = new Buffer( 4 * length );
      cdf.nc_get_var( ncid.deref(), var_id, buffer );

      function toNdArray( buffer, type, dimensions ) {
        function toArrayBuffer( buffer ) {
          var ab = new ArrayBuffer( buffer.length );
          var view = new Uint8Array( ab );
          for ( var i = 0; i < buffer.length; ++i ) {
            view[i] = buffer[i];
          }
          return ab;
        }

        function toTypeArray( buffer, type ) {
          if ( NC_BYTE == type ) {
            return new Int8Array( buffer );
          } else if ( NC_INT == type ) {
            return new Int32Array( buffer );
          } else if ( NC_FLOAT == type ) {
            return new Float32Array( buffer );
          } else {
            return new Int32Array();
          }
        }

        return nda( toTypeArray( toArrayBuffer( buffer ), type ), dimensions );
      }

      var ndarray = toNdArray( buffer, var_type.deref(), shape );

      return {
        id         : var_id,
        name       : var_name.readCString(),
        type       : var_type.deref(),
        endian     : var_endian.deref(),
        dimensions : dimensions,
        attributes : attributes,
        length     : length,
        buffer     : buffer,
        ndarray    : function () {
          return ndarray;
        }
      };
    };

    this.add_variable = function ( variable ) {

      dbg( "Add variable", variable );

      var var_id = ref.alloc( ref.types.int32 );

      var var_dimidsp = new Buffer( 4 * variable.dimensions.length );
      for ( var i = 0; i < variable.dimensions.length; i++ ) {
        var_dimidsp.writeInt32LE( variable.dimensions[i].id, 4 * i );
      }

      dbg( ref.alloc( ref.types.int32, variable.dimensions.map( function ( d ) {
        return d.id;
      } ) ) );
      dbg( var_dimidsp );

      dbg( "def_var = ",
           cdf.nc_def_var( ncid.deref(), variable.name, variable.type, variable.dimensions.length, var_dimidsp,
                           var_id ) );

      for ( var i = 0; i < variable.attributes.length; i++ ) {
        this.add_attribute( var_id.deref(), variable.attributes[i] )
      }

      dbg( "nc_put_var = ", cdf.nc_put_var( ncid.deref(), var_id.deref(), variable.buffer ) );
    };

    this.get_variables = function () {
      var result = [];
      for ( var i = 0; i < nvarsp.deref(); i++ ) {
        result.push( this.get_variable( i ) );
      }
      return result;
    };
  };

  NetCDF.NC_GLOBAL = NC_GLOBAL;
  NetCDF.NC_ENDIAN_BIG = 2;
  NetCDF.NC_ENDIAN_LITTLE = 1;
  NetCDF.NC_ENDIAN_NATIVE = 0;

  return NetCDF;

} ));

