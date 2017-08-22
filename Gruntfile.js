// Generated on 2017-06-06 using generator-ovh-angular-component 0.1.0
module.exports = function (grunt) {
    "use strict";
    require("matchdep").filterAll("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        distdir: "dist",
        srcdir: "src",
        transdir: ".work/.trans",
        testdir: ".test/",
        builddir: ".work/.tmp",
        name: grunt.file.readJSON("package.json").name || "ovh-angular-chatbot", // module name

        // Watch
        delta: {
            dist: {
                files: ["<%= srcdir %>/**/*", "!<%= srcdir %>/**/*.spec.js"],
                tasks: ["buildProd"]
            },
            test: {
                files: ["<%= srcdir %>/**/*.spec.js"],
                tasks: ["test"]
            },
            less: {
                files: ["*.less"],
                tasks: ["buildProd"]
            },
            html: {
                files: ["*.html"],
                tasks: ["buildProd"]
            }
        },

        // Clean
        clean: {
            dist: {
                src: ["<%= builddir %>", "<%= distdir %>", "<%= transdir %>"]
            },
            test: {
                src: ["<%= builddir %>", "<%= distdir %>", "<%= transdir %>", "<%= testdir %>"]
            }
        },

        // Concatenation
        concat: {
            dist: {
                files: {
                    "<%= transdir %>/<%= name%>.js": ["<%= srcdir %>/<%= name%>.js", "<%= builddir %>/templates.js", "<%= srcdir %>/*.js", "<%= srcdir %>/**/*.js", "!<%= srcdir %>/**/*.spec.js"]
                }
            }
        },

        // ngMin
        ngAnnotate: {
            dist: {
                files: {
                    "<%= builddir %>/<%= name%>.js": ["<%= builddir %>/<%= name%>.js"]
                }
            }
        },

        // Obfuscate
        uglify: {
            js: {
                options: {
                    banner: '/*! chatbot - <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: {
                    "<%= distdir %>/<%= name%>.min.js": ["<%= builddir %>/<%= name%>.js"]
                }
            }
        },

        // JS Check
        eslint: {
            options: {
                quiet: true
            },
            target: ["src/**/*.js"]
        },

        // Babel
        babel: {
            options: {
                presets: ["es2015"]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "<%= transdir %>",
                        src: ["*.js"],
                        dest: "<%= builddir %>"
                    }
                ]
            },
            test: {
                files: [
                    {
                        expand: true,
                        cwd: "<%= srcdir %>",
                        src: ["*.js"],
                        dest: "<%= testdir %>"
                    }
                ]
            }
        },

        // Check complexity
        complexity: {
            generic: {
                src: ["<%= builddir %>/**/*.js", "!<%= builddir %>/**/*.spec.js"],
                options: {
                    errorsOnly: false,
                    cyclomatic: 12,
                    halstead: 45,
                    maintainability: 82
                }
            }
        },

        // To release
        bump: {
            options: {
                pushTo: "origin",
                files: ["package.json"],
                updateConfigs: ["pkg"],
                commitFiles: ["-a"]
            }
        },

        // Testing
        karma: {
            unit: {
                configFile: "karma.conf.js",
                singleRun: true
            }
        },

        // Documentation
        ngdocs: {
            options: {
                dest: "docs",
                html5Mode: false,
                title: "<%= name %>"
            },
            docs: {
                src: ["src/**/*.js"],
                title: "docs"
            }
        },

        // Package all the html partials into a single javascript payload
        ngtemplates: {
            options: {
                // This should be the name of your apps angular module
                module: "<%= name %>",
                htmlmin: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    removeEmptyAttributes: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                }
            },
            main: {
                cwd: "<%=srcdir%>/templates",
                src: ["**/*.html"],
                dest: "<%=builddir%>/templates.js"
            },
            test: {
                cwd: "<%=srcdir%>/templates",
                src: ["**/*.html"],
                dest: "<%=testdir%>/templates.js"
            }
        },

        // Less to css
        less: {
            dist: {
                options: {
                    paths: ["<%= srcdir %>", "node_modules"],
                    plugins: [require("less-plugin-remcalc")]
                },
                files: {
                    "<%= builddir %>/<%= name %>.css": "<%= srcdir %>/**/*.less"
                }
            }
        },

        // ... and its prefixed vendor styles
        postcss: {
            options: {
                processors: [require("autoprefixer-core")({ browsers: ["last 3 versions", "ie >= 9", "> 5%"] })]
            },
            dist: {
                files: {
                    "<%= builddir %>/<%= name%>.css": ["<%= builddir %>/<%= name%>.css"]
                }
            }
        },

        // ... and now minify it
        cssmin: {
            options: {},
            dist: {
                files: {
                    "<%= distdir %>/<%= name%>.min.css": ["<%= builddir %>/<%= name%>.css"]
                }
            }
        }
    });


    grunt.registerTask("buildProd", ["clean", "eslint", "ngtemplates:main", "concat:dist", "babel", "complexity", "ngAnnotate", "less:dist", "postcss", "cssmin", "uglify", "ngdocs"]);

    grunt.registerTask("lint", ["eslint"]);

    grunt.registerTask("default", ["buildProd"]);

    grunt.task.renameTask("watch", "delta");
    grunt.registerTask("watch", ["buildProd", "delta"]);

    grunt.registerTask("test", ["eslint", "ngtemplates:test", "babel:test", "karma"]);

     // Increase version number. Type = minor|major|patch
     grunt.registerTask("release", "Release", function () {
         var type = grunt.option("type");

         if (type && ~["patch", "minor", "major"].indexOf(type)) {
             grunt.task.run(["bump-only:" + type]);
         } else {
             grunt.verbose.or.write("You try to release in a weird version type [" + type + "]").error();
             grunt.fail.warn("Please try with --type=patch|minor|major");
         }
     });
};
