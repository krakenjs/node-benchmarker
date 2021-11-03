# benchmarker

Runs benchmarks and publishes results. 

Input for each benchmark execution is a set of scripts. Each benchmark execution sequencially executes the input scripts and publish the results.

There are two parts of each benchmark execution:

### Tool
Tool used to run the benchmark. Input for the tool is a script which defines the execution task. 

There is implementation for [artillery](https://artillery.io/docs/getting-started/) [_DEFAULT_]. 

Intent is to continue expanding supported tools, and include tools like [k6](https://docs.k6.io/docs/welcome) and [autocannon](https://github.com/mcollina/autocannon).

Custom tool can be implemented by extending `Tool` class.

```javascript
const { Tool } = require('@krakenjs/benchmarker');
class PerformanceTool extends Tool {
```

### Publishers
Publishes the result of a benchmark run. Multiple publishers are supported for each run. 

Implemented publishers are:
 - __console__ [_DEFAULT_],
 - [elasticsearch](https://www.elastic.co/webinars/getting-started-elasticsearch), and 
 - [mongodb](https://www.mongodb.com/what-is-mongodb). 
 
Custom publisher can be implemented by extending `Publisher` class.

```javascript
const { Publisher } = require('@krakenjs/benchmarker');
class CloudPublisher extends Publisher {
```

## Configuration

### Example
```json
  "tool": {
    "module": {
      "name": "@krakenjs/benchmarker/lib/tool/artillery"
    },
    // "options": { },
    // Any arguments (Array) required for the run
    "args": [ "-e", "development" ]
  },
  "publishers": [
    // mongodb
    {
      "module": {
        "name": "@krakenjs/benchmarker/lib/publisher/mongodb"
      },
      "connection": [
        {
          "uri": "mongodb://127.0.0.1:27017/benchmarks",
          "model": "benchmarks",
          "options": {
            "useNewUrlParser": true,
            "useUnifiedTopology": true
          }
        }
      ]
    },
    // elasticsearch
    {
      "module": {
        "name": "@krakenjs/benchmarker/lib/publisher/elasticsearch"
      },
      "connection": [
        {
          "indexNamePrefix": "benchmarks",
          "clientOptions": {
            "node": "http://localhost:9200"
          }
        }
      ]
    },
    // console
    {
      "module": {
        "name": "@krakenjs/benchmarker/lib/publisher/console"
      }
    }
  ],
```
### Default config
Default lookup of configuration leverages [confit](https://github.com/krakenjs/confit) to load environment specific configuration. To extend existing project configuration files, add the configuration under `benchmarker` property.

``` json
  {
    // ...
    "benchmarker": {
      "tool": {
        //...
      },
      "publishers": [
        {
          ///...
        }
      ]
    }
    //...
  }
```

### Custom config
Custom configuration file is also accepted. [slush](https://github.com/krakenjs/shush) is used to process the config file, and [shortstop](https://github.com/krakenjs/shortstop) is used to resolve modules for `Tool` and `Publishers`.

Example of configuring custom `Publisher`:

```json
  "publishers": [
    {
      "module": {
        "name": "custom-cloud-publisher"
      },
      "connection": [
        {
          "uri": "https://some-cloud-provider/zzzz"
          //...
        }
      ]
```

### Configuration for [artillery](https://artillery.io/docs/getting-started/)
There is no special configuration. The runs are controlled by [artillery scripts](https://artillery.io/docs/script-reference/). 
  
Artillery supports [environemts](https://artillery.io/docs/script-reference/#environments) and [dynamic values via environment variables](https://artillery.io/docs/script-reference/#using-dynamic-values-in-config), and they can be leveraged if additional configuration is needed.

If env `NODE_ENV` is set, it is passed to the artillery as `environment` with `-e` option.

Example configuration for dynamic `target` url:

```yml
  config:
    target: 'http://localhost:8080'
    environments:
      stage:
        target: 'https://testinstance.qa.company.com'
      test:
        target: '{{ $processEnvironment.APPLICATION_TARGET }}'
```

`BASE_URL` environment variable is supported for overriding above behavior with custom `target` value (passed with `-t` option).

Example
```
$ BASE_URL=https://testinstance2.qa.company.com benchmarker run "./benchmarks/**/*.yml" 
```

Note: `artillery` package should be either installed globally, or it should be a dev dependency in your `package.json`. 

### Configuration for [elasticsearch](https://www.elastic.co/webinars/getting-started-elasticsearch)

Supported configuration settings are:
- `esVersion`: [Number] Elastic search version. Default 7. Used to load version specific elasticsearch client module.
- `indexNamePrefix`: [String] Prefix for the index name. Default prefix is `benchmarks`. By default a new index for each week is created. Ex: `benchmarks20191020`
- `indexName`: [String] Name of the index. This overrides default index name generation. See `indexNamePrefix` for default index behavior.
- `clientOptions`: [Object] These are [configuration options](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html) for initializing elasticsearch client.
- `indexSettings`: [Object] Overrides for [index settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-modules-settings). 

Example:

```json
    "connection": [
      {
        // Elastic search version. Defaults 7. Used to load version specific module
        "esVersion": 7,
        "indexNamePrefix": "benchmarks",
        // Connection options: "node" should contain url of elasticsearch instance
        "clientOptions": {
          "node": "http://localhost:9200"
        },
        // index settings
        "indexSettings": {
          "index.number_of_shards": 2
        }
      }
    ]
```

### Configuration for [mongodb](https://www.mongodb.com/what-is-mongodb)

Supported configuration settings are:
- `uri`: [String] `mongodb` connection uri.
- `model`: [String] Name of the model. Default `benchmarks`
- `options`: [Object] Any additional [options](https://github.com/Automattic/mongoose#connecting-to-mongodb) for establishing connection.

Example:

```json
    "connection": [
      {
        "uri": "mongodb://127.0.0.1:27017/benchmarks",
        "model": "benchmarks",
        "options": {
          "useNewUrlParser": true,
          "useUnifiedTopology": true
        }
      }
    ]
```


## CLI options

```
Usage: benchmarker [options] [command]

Options:
  -v --version             output the version number
  -d, --debug              output extra debugging
  -n, --name <name>        Unique "name" for the run. This helps in comparing historic runs. This typically should be name of the application
  -t, --tag <tag>          Unique "tag" for the run. This helps in identiying a particular run. This can be app's semver, build number, or any friendly identifier
  -c, --config <filepath>  custom config file. default: loaded from `config` directory
  -h, --help               output usage information

Commands:
  run [script_path]        Run the scripts.
      "script_path" accepts *glob* pattern (https://en.wikipedia.org/wiki/Glob_(programming)). [Default: "./benchmarks/**/*[EXTNAME]"]
      ** [EXTNAME] is specific to the tool. ex: '.yml', '.json', '.js'
      ** [tool] and [publishers] for the run should be configured in the config file.
```

Example
```
$ benchmarker -d -n "myapp-name" -c "./benchmarks/config.json" run "./benchmarks/**/*.yml" 
```

## Output
For each benchmark run, following data is captured:
- __id__: [String] Unique identifier for the run.
- __name__: [String] Name of the application.
- __script__: [String] Script used for the run.
- __args__: [String] Stringified arguments for the run.
- __total_time__: [Float] Total elapsed time for the run.
- __start_time__: [Date] Timestamp when the run was started.
- __end_time__: [Date] Timestamp when the run ended.

The final results from the tool is expected to contain following: 
- __iterations__: [Number] Number of iterations for a run
- __completed__: [Number] [Optional] Number of iterations completed
- __requests__: [Number] [Optional] Number of HTTP requests made during the iterations. Each iteration can have multiple calls
- __rps__: [Float] Requests completed per second
- __codes__: [Object] Number of 2xx, 3xx, 4xx and 5xx status codes received for the requests
- __latency__: [Object]: Request latency. Depending on the tool, this may contain aggregates like `max`, `min`, `median`, and percentiles (`p90`, `p95`, `p99`)
- __durations__: [Object] Durations for the requests. Depending on the tool, this may contain aggregates like `max`, `min`, `median`, and percentiles (`p90`, `p95`, `p99`).
- __timestamp__: [Date] Timestamp returned by the tool
- __output__: [String] Stringified raw output
