#!/usr/bin/env bash
#ffi-generate -f /usr/local/Cellar/netcdf/4.3.3.1/include/netcdf.h \
#-l libnetcdf \
#-L /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib >> ./lib/netcdf.js

export LD_LIBRARY_PATH=/usr/local/Cellar/netcdf/4.3.3.1/lib
node watsonstreet-test.js