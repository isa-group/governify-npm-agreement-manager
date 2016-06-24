/*!
 * Copyright(c) 2016 governify Research Group
 * ISC Licensed
 *
 * @author Daniel Artega <darteaga@us.es>
 */

'use strict'
var fs = require('fs');
var yaml = require('js-yaml');

module.exports = {
	translators : require('./translators/translators.js'),
	operations: require('./operations/operations.js')
}
