'use strict';

const mongoose = require("mongoose"),
      Schema   = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },

  summary: {
    type: String,
    required: true
  },

  link: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },
  
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

module.exports = mongoose.model("Article", ArticleSchema);