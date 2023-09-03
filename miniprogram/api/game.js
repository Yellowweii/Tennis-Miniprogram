import { cloudCall, cloudFunctionCall, formatDate, getDayOfWeek, getDateString } from "./util";

const db = wx.cloud.database();
const _ = db.command;

const COLLECTION_NAME = "games";
const CLOUD_FUNCTION = "gameFunctions";

const preProcessGames = (data) => {
  for (const game of data) {
    game.dayOfWeek = getDateString(game.startDate);
    game.startDateStr = formatDate(game.startDate);
    game.endDateStr = formatDate(game.endDate);
  }
};

function fetchGame(id) {
  return cloudCall(db.collection(COLLECTION_NAME).doc(id).get(), "fetchGame", (game) => {
    game.dayOfWeek = getDayOfWeek(game.startDate);
    game.startDateStr = formatDate(game.startDate);
    game.endDateStr = formatDate(game.endDate);
  });
}

function fetchAllGames() {
  return cloudCall(db.collection(COLLECTION_NAME).orderBy("endDate", "desc").get(), "fetchAllGames", preProcessGames);
}

function createGame(data) {
  return db.collection(COLLECTION_NAME).add({
    data,
  })
}

function joinGame(gameId, user) {
  const data = {
    id: gameId,
    user,
  };
  return cloudFunctionCall(CLOUD_FUNCTION, "joinGame", data);
}

function cancelGame(gameId) {
  const data = {
    id: gameId,
  };
  return cloudFunctionCall(CLOUD_FUNCTION, "cancelGame", data);
}

function fetchAllUserGames(userId) {
  const data = {
    id: userId,
  };
  return cloudFunctionCall(CLOUD_FUNCTION, "fetchAllUserGames", data);
}

function fetchHostedGames(userId) {
  const data = {
    id: userId,
  };
  return cloudFunctionCall(CLOUD_FUNCTION, "fetchHostedGames", data);
}

module.exports = {
  createGame,
  fetchAllGames,
  fetchGame,
  joinGame,
  cancelGame,
  fetchAllUserGames,
  fetchHostedGames,
};
