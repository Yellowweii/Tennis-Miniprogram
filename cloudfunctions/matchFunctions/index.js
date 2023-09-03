const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME = "users";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1);
}

function toRad(degree) {
  return (degree * Math.PI) / 180;
}

exports.main = async (event, context) => {
  const { userId, filteredUsers, longitude, latitude, gameHours, isChangeList } = event;
  const arr = filteredUsers.map((item) => item._id);
  const parsedLatitude = parseFloat(latitude);
  const parsedLongitude = parseFloat(longitude);
  const LEVEL_WEIGHT = 0.1;
  const DISTANCE_WEIGHT = 0.5;
  const MAX_LEVEL = 7;
  const MAX_DISTANCE = 20;
  const availabilityWeightOne = {
    "工作日,晚上": 0.2,
    "工作日,白天": 0.1,
  };
  const availabilityWeightTwo = {
    "周末,白天": 0.4,
    "周末,晚上": 0.3,
  };

  db.collection(COLLECTION_NAME)
    .doc(userId)
    .update({
      data: {
        longitude: parsedLongitude,
        latitude: parsedLatitude,
        gameHours: gameHours,
      },
    });

  const matchedUsers = await db
    .collection(COLLECTION_NAME)
    .where({
      _id: _.nin([userId, ...arr]),
    })
    .get();

  matchedUsers.data.forEach((person) => {
    const distance = calculateDistance(parsedLatitude, parsedLongitude, person.latitude, person.longitude);
    const normalizedLevel = (MAX_LEVEL - person.level) / MAX_LEVEL;
    const normalizedDistance = (MAX_DISTANCE - distance) / MAX_DISTANCE;

    let AVAILABILITY_WEIGHT_ONE = 0;
    let AVAILABILITY_WEIGHT_TWO = 0;

    if (person.availabilityOne) {
      const availabilityKeyOne = person.availabilityOne.join(",");
      AVAILABILITY_WEIGHT_ONE = availabilityWeightOne[availabilityKeyOne] || 0;
    }

    if (person.availabilityTwo) {
      const availabilityKeyTwo = person.availabilityTwo.join(",");
      AVAILABILITY_WEIGHT_TWO = availabilityWeightTwo[availabilityKeyTwo] || 0;
    }

    const matchScore = LEVEL_WEIGHT * normalizedLevel + DISTANCE_WEIGHT * normalizedDistance + AVAILABILITY_WEIGHT_ONE + AVAILABILITY_WEIGHT_TWO;

    person.distance = distance;
    person.matchScore = matchScore;
  });

  matchedUsers.data.sort((a, b) => b.matchScore - a.matchScore);

  const bestMatchedUsers = isChangeList === true ? matchedUsers.data.slice(0, 4) : matchedUsers.data.slice(0, 1);

  return {
    matchedUsers: bestMatchedUsers,
  };
};
