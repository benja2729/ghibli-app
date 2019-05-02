#!/bin/sh

# Set the port to the first positional parameter
port=$1

# If port is not given a value, set default to 8080
: ${port:=8080}

# Start a python file server
# NOTE: MacOS has python installed by default
python -m SimpleHTTPServer $port