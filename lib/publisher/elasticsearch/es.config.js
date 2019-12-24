'use strict';

//https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html
//https://www.elastic.co/blog/strings-are-dead-long-live-strings
//curl -X GET "http://localhost:9200/benchmarks/_mapping?pretty"
//curl -X DELETE "http://localhost:9200/benchmarks?pretty"

module.exports.benchmarks = Object.freeze({
  'settings': Object.freeze({
    'index.refresh_interval': '5s',
  }),
  'mappings': Object.freeze({
    // '_doc': {
      'dynamic_date_formats': [`yyyyDDD'T'HHmmss.SSSZ||yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z`],
      'properties': {
        'latency': {
          'type': 'nested',
          'properties': {
            'min': { 'type': 'float' },
            'max':  { 'type': 'float' },
            'median': { 'type': 'float' },
            'p90': { 'type': 'float' },
            'p95': { 'type': 'float' },
            'p99': { 'type': 'float' },
          }
        },
        'rps': { 'type': 'float' },
        'durations': {
          'type': 'nested',
          'properties': {
            'min': { 'type': 'float' },
            'max': { 'type': 'float' },
            'median': { 'type': 'float' },
            'p90': { 'type': 'float' },
            'p95': { 'type': 'float' },
            'p99': { 'type': 'float' },
          }
        },
        'codes': {
          'properties': {
            '2xx': { 'type': 'integer' },
            '3xx': { 'type': 'integer' },
            '5xx': { 'type': 'integer' }
          }
        },
        'timestamp': { 'type': 'date' }, //From results
        'total_time': { 'type': 'float' },
        'start_time': { 'type': 'date' },
        'end_time': { 'type': 'date' }
      }
    // }
  })
});
