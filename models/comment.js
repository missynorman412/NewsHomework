'use strict';

const mongoose = require("mongoose"),
      Schema   = mongoose.Schema;

const CommentSchema = new Schema({
  comment: {
    type: String
  },
});

module.exports = mongoose.model("Comment", CommentSchema);