#!/usr/bin/env bash
#ffi-generate -f /usr/local/Cellar/netcdf/4.3.3.1/include/netcdf.h \
#-l libnetcdf \
#-L /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib >> ./lib/netcdf.js

export LD_LIBRARY_PATH=/usr/local/Cellar/netcdf/4.3.3.1/lib
export DEBUG_FD=3
export DEBUG=netcdf
node watsonstreet-test.js 3>1 # debug.log
ncdump -h new.nc
