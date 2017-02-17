# OLAP.js

OLAP.js is a implementation of an in-memory OLAP Cube.

It has no external dependencies, and can be used both in NodeJS and in the browser.

## Installation

	npm install olapcube

## Usage

In NodeJS

	var olap = require('olapcube');
	var cube = new olap.Cube(...)

In the browser

	<html>
		<head>
			<script src="olap.js"></script>
			<script>

				var cube = new olap.Cube(...)
				...


			</script>
		</head>
	</html>