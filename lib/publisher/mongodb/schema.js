'use strict';
const mongoose = require('mongoose');

exports.benchmarks = new mongoose.Schema({
  _id: String,
  name: String,
  tag: String,
  script: String,
  args: String, //Stringified

  // Following are derived from results
  iterations: Number,
  completed: Number,
  requests: Number,
  latency: {
    min: Number,
    max: Number,
    median: Number,
    p90: Number,
    p95: Number,
    p99: Number
  },
  rps: Number,
  durations: {
    min: Number,
    max: Number,
    median: Number,
    p90: Number,
    p95: Number,
    p99: Number
  },
  codes: { 
    "2xx": Number,
    "3xx": Number,
    "4xx": Number,
    "5xx": Number
  },
  timestamp: Date, //From results

  output: String, //Stringified

  // Stats collected by this module
  total_time: Number,
  start_time: Date,
  end_time: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'benchmarks'
});
