/*
 * grunt-mutation-testing
 *
 *
 * Copyright (c) 2014 Marco Stahl
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    // load all npm grunt tasks
    require('load-grunt-tasks')(grunt);

    var chaiCode = '../../node_modules/chai/**/*.js';
    var karmaOptions = {
        configFile: 'test/fixtures/karma-mocha/karma.conf.js'
    };

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp'],
            reports: ['reports']
        },

        // Configuration to be run (and then tested).
        mutationTest: {
            options: {
                basePath: 'test/fixtures/',
                code: 'mocha/script*.js',
                specs: 'mocha/mocha-test.js',
                mutate: 'mocha/script*.js',

                testFramework: 'mocha',

                logLevel: 'WARN',
                maxReportedMutationLength: 0,
                reporters: {
                    html: {
                        successThreshold: 70
                    },
                    text: {
                        file: 'mutations.txt'
                    },
                    json: {
                        file: 'mutations.json'
                    }
                }
            },

            flagAllMutations: {
                options: {
                    testFramework: null,
                    test: function(done) {
                        done('SURVIVED');
                    },

                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/flag-all-mutations'
                        },
                        json: {
                            dir: 'reports/mutation-test/flag-all-mutations'
                        },
                        text: {
                            dir: 'reports/mutation-test/flag-all-mutations'
                        }
                    }
                }
            },
            ignore: {
                options: {
                    code: 'mocha/script1.js',
                    mutate: 'mocha/script1.js',

                    ignore: require('./.mutation-testing-conf.js').ignore,
                    testFramework: null,
                    test: function(done) {
                        done('SURVIVED');
                    },

                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/ignore'
                        },
                        json: {
                            dir: 'reports/mutation-test/ignore'
                        },
                        text: {
                            dir: 'reports/mutation-test/ignore'
                        }
                    }
                }
            },
            testIsFailingWithoutMutation: {
                options: {
                    testFramework: null,
                    test: function(done) {
                        done('KILLED');
                    },

                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/test-is-failing-without-mutation'
                        },
                        json: {
                            dir: 'reports/mutation-test/test-is-failing-without-mutation'
                        },
                        text: {
                            dir: 'reports/mutation-test/test-is-failing-without-mutation'
                        }
                    }
                }
            },
            flagAllMutationsDefault: {
                options: {
                    testFramework: null,
                    test: function(done) {
                        done('SURVIVED');
                    },

                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/flag-all-mutations-default'
                        },
                        json: {
                            dir: 'reports/mutation-test/flag-all-mutations-default'
                        },
                        text: {
                            dir: 'reports/mutation-test/flag-all-mutations-default'
                        }
                    }
                }
            },
            grunt: {
                options: {
                    ignore: /^log\(/,
                    test: 'grunt mochaTest:fixtures',
                    reporters: {
                        text: {
                            dir: 'reports/mutation-test/grunt'
                        }
                    }
                }
            },
            mocha: {
                options: {
                    code: 'mocha/script*.js',
                    specs: 'mocha/mocha-test*.js',
                    mutate: 'mocha/script*.js',
                    ignore: /^\s*log\(/,
                    ignoreReplacement: [/^console$/],
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/mocha'
                        },
                        json: {
                            dir: 'reports/mutation-test/mocha'
                        },
                        text: {
                            dir: 'reports/mutation-test/mocha'
                        }
                    }
                }
            },
            karma: {
                options: {
                    code: 'karma-mocha/script*.js',
                    specs: ['karma-mocha/karma-test.js', 'karma-mocha/karma-endlessLoop-test.js', 'karma-mocha/karma-update-expressions-test.js', 'karma-mocha/karma-mathoperators-test.js'],
                    mutate: 'karma-mocha/script*.js',
                    ignoreReplacement: ['^console$'],
                    testFramework: 'karma',
                    karma: {
                        frameworks: ['mocha', 'chai'],
                        browsers: ['PhantomJS']
                    },
                    logLevel: 'INFO',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/karma'
                        },
                        json: {
                            dir: 'reports/mutation-test/karma'
                        },
                        text: {
                            dir: 'reports/mutation-test/karma'
                        }
                    }
                }
            },

            attributes: {
                options: {
                    code: ['mocha/attribute.js', chaiCode],
                    specs: 'mocha/attribute-test.js',
                    mutate: 'mocha/attribute.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/attributes'
                        },
                        json: {
                            dir: 'reports/mutation-test/attributes'
                        },
                        text: {
                            dir: 'reports/mutation-test/attributes'
                        }
                    }
                }
            },
            arguments: {
                options: {
                    code: ['mocha/arguments.js', '../../node_modules/lodash/**/*', chaiCode],
                    specs: 'mocha/arguments-test.js',
                    mutate: 'mocha/arguments.js',
                    ignoreReplacement: /^_$/,
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/arguments'
                        },
                        json: {
                            dir: 'reports/mutation-test/arguments'
                        },
                        text: {
                            dir: 'reports/mutation-test/arguments'
                        }
                    }
                }
            },
            arrays: {
                options: {
                    code: ['mocha/array.js', chaiCode],
                    specs: 'mocha/array-test.js',
                    mutate: 'mocha/array.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/arrays'
                        },
                        json: {
                            dir: 'reports/mutation-test/arrays'
                        },
                        text: {
                            dir: 'reports/mutation-test/arrays'
                        }
                    }
                }
            },
            comparisons: {
                options: {
                    code: ['mocha/comparisons.js', chaiCode],
                    specs: 'mocha/comparisons-test.js',
                    mutate: 'mocha/comparisons.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/comparisons'
                        },
                        json: {
                            dir: 'reports/mutation-test/comparisons'
                        },
                        text: {
                            dir: 'reports/mutation-test/comparisons'
                        }
                    }
                }
            },
            functionCalls: {
                options: {
                    code: ['mocha/function-calls.js', chaiCode],
                    specs: 'mocha/function-calls-test.js',
                    mutate: 'mocha/function-calls.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/function-calls'
                        },
                        json: {
                            dir: 'reports/mutation-test/function-calls'
                        },
                        text: {
                            dir: 'reports/mutation-test/function-calls'
                        }
                    }
                }
            },
            literals: {
                options: {
                    code: ['mocha/literals.js', chaiCode],
                    specs: 'mocha/literals-test.js',
                    mutate: 'mocha/literals.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/literals'
                        },
                        json: {
                            dir: 'reports/mutation-test/literals'
                        },
                        text: {
                            dir: 'reports/mutation-test/literals'
                        }
                    }
                }
            },
            unaryExpressions: {
                options: {
                    code: ['mocha/unaryExpression.js', chaiCode],
                    specs: 'mocha/unaryExpression-test.js',
                    mutate: 'mocha/unaryExpression.js',
                    discardDefaultIgnore: true,
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/unary-expressions'
                        },
                        json: {
                            dir: 'reports/mutation-test/unary-expressions'
                        },
                        text: {
                            dir: 'reports/mutation-test/unary-expressions'
                        }
                    }
                }
            },
            logicalExpressions: {
                options: {
                    code: ['mocha/logicalExpression.js', chaiCode],
                    specs: 'mocha/logicalExpression-test.js',
                    mutate: 'mocha/logicalExpression.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/logical-expressions'
                        },
                        json: {
                            dir: 'reports/mutation-test/logical-expressions'
                        },
                        text: {
                            dir: 'reports/mutation-test/logical-expressions'
                        }
                    }
                }
            },
            mathoperators: {
                options: {
                    code: ['mocha/mathoperators.js', chaiCode],
                    specs: 'mocha/mathoperators-test.js',
                    mutate: 'mocha/mathoperators.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/math-operators'
                        },
                        json: {
                            dir: 'reports/mutation-test/math-operators'
                        },
                        text: {
                            dir: 'reports/mutation-test/math-operators'
                        }
                    }
                }
            },
            updateExpressions: {
                options: {
                    code: ['mocha/update-expressions.js', chaiCode],
                    specs: 'mocha/update-expressions-test.js',
                    mutate: 'mocha/update-expressions.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/update-expressions'
                        },
                        json: {
                            dir: 'reports/mutation-test/update-expressions'
                        },
                        text: {
                            dir: 'reports/mutation-test/update-expressions'
                        }
                    }
                }
            },
            htmlFragments: {
                options: {
                    code: ['mocha/html-fragments.js', chaiCode],
                    specs: 'mocha/html-fragments-test.js',
                    mutate: 'mocha/html-fragments.js',
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/html-fragments'
                        },
                        json: {
                            dir: 'reports/mutation-test/html-fragments'
                        },
                        text: {
                            dir: 'reports/mutation-test/html-fragments'
                        }
                    }
                }
            },

            dontTestInsideNotFailingMutations: {
                options: {
                    specs: 'mocha/mocha-test*.js',
                    dontTestInsideNotFailingMutations: true,
                    reporters: {
                        html: {
                            dir: 'reports/mutation-test/dont-test-inside-surviving-mutations'
                        },
                        json: {
                            dir: 'reports/mutation-test/dont-test-inside-surviving-mutations'
                        },
                        text: {
                            dir: 'reports/mutation-test/dont-test-inside-surviving-mutations'
                        }
                    }
                }
            }
        },

        mochaTest: {
            fixtures: {
                options: {
                    reporter: 'spec'
                },
                src: [
                    'test/fixtures/mocha/*-test.js',
                    'test/fixtures/mocha/**/*Spec.js'
                ]
            },
            mutations: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/mutations-test.js']
            },
            iTest: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*-itest.js']
            },
            iTestSlow: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*-itest-slow.js']
            }
        },

        karma: {
            options: karmaOptions,
            fixtures: {
                singleRun: true
            }
        }
    });


    grunt.loadNpmTasks('grunt-mocha-test');

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    grunt.registerTask('test', [
        'clean',
        'mochaTest:fixtures',
        'mochaTest:mutations',
        'karma',
        'mutationTest:flagAllMutations',
        'mutationTest:ignore',
        'mutationTest:flagAllMutationsDefault',
        'mutationTest:testIsFailingWithoutMutation',
        'mutationTest:dontTestInsideNotFailingMutations',
        'mutationTest:mocha',
        'mutationTest:attributes',
        'mutationTest:arguments',
        'mutationTest:comparisons',
        'mutationTest:mathoperators',
        'mutationTest:updateExpressions',
        'mutationTest:htmlFragments',
        'mutationTest:literals',
        'mutationTest:unaryExpressions',
        'mutationTest:logicalExpressions',
        'mutationTest:arrays',
        'mutationTest:functionCalls',
        'mutationTest:karma',
        'mochaTest:iTest'
    ]);

    grunt.registerTask('test:all', [
        'clean',
        'mochaTest:fixtures',
        'mochaTest:mutations',
        'karma',
        'mutationTest:flagAllMutations',
        'mutationTest:ignore',
        'mutationTest:flagAllMutationsDefault',
        'mutationTest:testIsFailingWithoutMutation',
        'mutationTest:mocha',
        'mutationTest:attributes',
        'mutationTest:arrays',
        'mutationTest:functionCalls',
        'mutationTest:arguments',
        'mutationTest:comparisons',
        'mutationTest:mathoperators',
        'mutationTest:updateExpressions',
        'mutationTest:htmlFragments',
        'mutationTest:literals',
        'mutationTest:unaryExpressions',
        'mutationTest:logicalExpressions',
        'mutationTest:dontTestInsideNotFailingMutations',
        'mutationTest:grunt',
        'mutationTest:karma',
        'mochaTest:iTest',
        'mochaTest:iTestSlow'
    ]);

    grunt.registerTask('test:karma', [
        'jshint',
        'mutationTest:karma'
    ]);

    grunt.registerTask('mocha2', [
        'clean',
        'mutationTest:dontTestInsideNotFailingMutations',
        'mutationTest:mocha',
        'mochaTest:iTest'
    ]);


    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);
};
