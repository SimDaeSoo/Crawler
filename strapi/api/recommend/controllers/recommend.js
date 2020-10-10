'use strict';
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  index: async ctx => {
    ctx.send(['Hello', 'World?']);
  }
};