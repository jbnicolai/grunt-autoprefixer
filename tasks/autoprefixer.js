'use strict';

var path = require('path');
var autoprefixer = require('autoprefixer');
var diff = require('diff');
var chalk = require('chalk');

module.exports = function(grunt) {

    var options;
    var prefixer;

    /**
     * Returns an input source map if a map path was specified
     * or options.map value otherwise
     * @param {string} from
     * @returns {string|undefined}
     */
    function getPrevMap(from) {
        if (typeof options.map.prev === 'string') {
            var mapPath = options.map.prev + path.basename(from) + '.map';

            if (grunt.file.exists(mapPath)) {
                return grunt.file.read(mapPath);
            }
        }
    }

    /**
     * @param {string} input Input CSS
     * @param {string} from Input path
     * @param {string} to Output path
     * @returns {{css: string, map?: string}}
     */
    function prefix(input, from, to) {
        var output = prefixer.process(input, {
            map: (typeof options.map === 'boolean') ? options.map : {
                prev: getPrevMap(from),
                inline: options.map.inline,
                annotation: options.map.annotation,
                sourcesContent: options.map.sourcesContent
            },
            from: from,
            to: to
        });

        return output;
    }

    grunt.registerMultiTask('autoprefixer', 'Prefix CSS files.', function() {
        options = this.options({
            cascade: true,
            diff: false,
            map: false
        });

        prefixer = autoprefixer(options.browsers, {cascade: options.cascade});

        this.files.forEach(function(f) {
            if (!f.src.length) {
                return grunt.fail.warn('No source files were found.');
            }

            f.src
                .forEach(function(filepath) {
                    var dest = f.dest || filepath;
                    var input = grunt.file.read(filepath);
                    var output = prefix(input, filepath, dest);

                    grunt.file.write(dest, output.css);
                    grunt.log.writeln('File ' + chalk.cyan(dest) + ' created.');

                    if (output.map) {
                        grunt.file.write(dest + '.map', JSON.stringify(output.map.toJSON()));
                        grunt.log.writeln('File ' + chalk.cyan(dest + '.map') + ' created (source map).');
                    }

                    if (options.diff) {
                        var diffPath = (typeof options.diff === 'string') ? options.diff : dest + '.patch';

                        grunt.file.write(diffPath, diff.createPatch(dest, input, output.css));
                        grunt.log.writeln('File ' + chalk.cyan(diffPath) + ' created (diff).');
                    }
                });
        });
    });
};
