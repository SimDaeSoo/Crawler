'use strict';
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  index: async ctx => {
    const { id } = ctx.params;
    const users = await strapi.query('user', 'users-permissions').find();

    const userRatingsDictionary = {};
    const simillarityDictionary = {};
    for (const user of users) {
      userRatingsDictionary[user.id] = {};
      simillarityDictionary[user.id] = 0;
    }

    const reviews = await strapi.query('review').find();
    for (const review of reviews) {
      userRatingsDictionary[review.user.id][review.drama.id] = review.rate;
    }

    const ids = Object.keys(userRatingsDictionary);
    for (const _id of ids) {
      simillarityDictionary[_id] = getSimillarity(userRatingsDictionary[id], userRatingsDictionary[_id]);
    }

    delete simillarityDictionary[id];

    const simillarities = [];
    for (const id in simillarityDictionary) {
      const simillarity = simillarityDictionary[id];
      simillarities.push({ id, simillarity });
    }

    simillarities.sort((userA, userB) => userA.simillarity < userB.simillarity ? 1 : -1);

    const resultIdDictionary = {};
    for (const simillarity of simillarities) {
      const userReviews = reviews.filter(review => {
        const targetReview = review.user.id === Number(simillarity.id);
        const isNewDrama = userRatingsDictionary[id][review.drama.id] === undefined;
        return targetReview && isNewDrama;
      });

      userReviews.sort((reviewA, reviewB) => reviewA.rate < reviewB.rate ? 1 : -1);

      for (const userReview of userReviews) {
        if (!resultIdDictionary[userReview.drama.id]) {
          resultIdDictionary[userReview.drama.id] = userReview.rate * simillarity.simillarity;
        } else if (resultIdDictionary[userReview.drama.id] < userReview.rate * simillarity.simillarity) {
          resultIdDictionary[userReview.drama.id] = userReview.rate * simillarity.simillarity;
        }
      }
    }

    const dramaIDs = Object.keys(resultIdDictionary);
    dramaIDs.sort((idA, idB) => resultIdDictionary[idA] < resultIdDictionary[idB] ? 1 : -1);

    if (dramaIDs.length > 10) {
      dramaIDs.splice(10, dramaIDs.length);
    }

    const dramas = await strapi.query('drama').find({ id_in: dramaIDs });
    dramas.sort((dramaA, dramaB) => resultIdDictionary[dramaA.id] < resultIdDictionary[dramaB.id] ? 1 : -1);

    ctx.send(dramas);
  }
};

function getSimillarity(baseUser, targetUser) {
  const baseDramaIDs = Object.keys(baseUser);

  let accumulate = 0;
  const maxAccumulate = baseDramaIDs.length * 5;

  for (const dramaID of baseDramaIDs) {
    const baseRate = baseUser[dramaID];
    const targetRate = (targetUser[dramaID] || baseRate - 5);
    const diff = Math.abs(targetRate - baseRate);
    accumulate += diff;
  }

  const simillarity = (1 - accumulate / maxAccumulate);
  return simillarity;
}