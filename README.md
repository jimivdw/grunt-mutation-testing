# grunt-mutation-testing

> Test your tests by mutate the code.

[![Build Status](https://travis-ci.org/shybyte/grunt-mutation-testing.svg?branch=master)](https://travis-ci.org/shybyte/grunt-mutation-testing)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-mutation-testing --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-mutation-testing');
```

## The "mutationTest" task

### Overview
In your project's Gruntfile, add a section named `mutationTest` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  mutationTest: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.test
Type: `String` or `Function` 
Default value: No Default value

This test is executed for every Mutation. If it succeeds, this mutation is reported.

#### options.karma
Type: `Object` 
Karma configuration

#### options.karma.configFile
Type: `String`
Karma config file

#### options.mocha.testFiles
Type: `[String]`
Mocha configuration 

#### options.ignore
Type: `RegExp` or `[RegExp]`
Default value: undefined

Mutated code which matches this option is ignored.

### Usage Examples

#### Default Options
In this example, the default options are used to report every possible mutation. 

```js
grunt.initConfig({
  mutationTest: {
    options: {},
    target: {
      files: {
        'tmp/report.txt': ['test/fixtures/mocha/script*.js']
      }
    }
  }
})
```

#### Custom Options
In this example all mutations are reported, which cause no failure of the grunt script.

```js
grunt.initConfig({
  mutationTest: {
    options: {
      ignore: /^log\(/,
      test: 'grunt mochaTest:fixtures'
    },
    target: {
      files: {
        'tmp/grunt.txt': ['test/fixtures/mocha/script*.js']
      }
    }
  }
})
```
Calling a test in this way is easy but **very slow**. 
It's much faster to call tests directly by providing a test function. 
This is demonstrated in this project's Gruntfile.js.

For your convenience you can easily configure fast mocha and karma tests:

##### Mocha

 ```js
 grunt.initConfig({
   mutationTest: {
      mocha: {
        options: {
          mocha: {
            testFiles: ['test/fixtures/mocha/mocha-test*.js']
          }
        },
        files: {
          'tmp/mocha.txt': ['test/fixtures/mocha/script*.js']
        }
   }
 })
 ```

##### Karma

 ```js
 grunt.initConfig({
   mutationTest: {
      karma: {
        options: {
          karma: {
            configFile: 'test/fixtures/karma-mocha/karma.conf.js'
          }
        },
        files: {
          'tmp/karma.txt': ['test/fixtures/karma-mocha/script*.js']
        }
      }
   }
 })
 ```

##### Logging results to console

You can provide 'LOG' as files key in order to log the results to the console. 

```js
grunt.initConfig({
  mutationTest: {
    options: {
      ignore: /^log\(/,
      test: 'grunt mochaTest:fixtures'
    },
    target: {
      files: {
        'LOG': ['test/fixtures/mocha/script*.js']
      }
    }
  }
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Marco Stahl. Licensed under the MIT license.
