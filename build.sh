##!/usr/bin/env bash

rm -rf dist
mkdir dist
cp -rf server dist
rm -rf dist/server/config/sqlanywhere
rm -rf dist/**/.idea
cp package.json dist

echo build complete