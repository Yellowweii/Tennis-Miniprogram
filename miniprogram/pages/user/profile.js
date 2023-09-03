import { fetchAllUserGames } from "../../api/game";
import { fetchUserProfile } from "../../api/user";
import { navigateToProfileSettings, navigateToUserGames } from "../../navigator";

const app = getApp();
const MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const WEEK_OFFSET = 24 * 60 * 60 * 1000; // 一天的毫秒数

function getDayOfWeekFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.getDay();
}

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * Component properties
   */
  properties: {
    userId: {
      type: String,
      value: "",
    },
    from: {
      type: String,
    },
  },

  /**
   * Component initial data
   */
  data: {
    gameHost: 0,
    gameJoined: 0,
    gameHours: 0,
    width: 0,
    height: 0,
  },

  pageLifetimes: {
    show() {
      if (this.data.userId) {
        this.loadUserInfo();
      }
    },
  },

  lifetimes: {
    async attached() {
      if (this.data.from === "personal") {
        this.loadUserInfo();
      }
    },

    async ready() {
      let activeTimestamps = [];
      if (this.data.userId) {
        const res = await fetchUserProfile(this.data.userId);
        activeTimestamps = res.activeTimestamps;
      } else {
        activeTimestamps = wx.getStorageSync("userInfo").activeTimestamps;
      }
      this.drawActivityGrid(activeTimestamps);
    },
  },

  /**
   * Component methods
   */
  methods: {
    handleSettingClick() {
      navigateToProfileSettings(true);
    },

    getHostedGames() {
      const symbol = "hostedGames";
      navigateToUserGames(symbol);
    },

    getJoinedGames() {
      const symbol = "joinedGames";
      navigateToUserGames(symbol);
    },

    async drawActivityGrid(activeTimestamps) {
      const canvas = await this.getCanvasNode(".myCanva");
      const ctx = canvas.getContext("2d");
      const dpr = wx.getSystemInfoSync().pixelRatio;
      //宽高乘像素比
      canvas.width = this.data.width * dpr;
      canvas.height = this.data.height * dpr;
      //再缩放
      ctx.scale(dpr, dpr);
      const today = new Date();
      const week = today.getDay();
      const date = new Date(today - week * WEEK_OFFSET);
      console.log(date);
      let x = 288;
      let y = 30 + week * 12;
      const WIDTH = 8;
      const Sundaytime = this.getSundayTimestamp(date);
      this.drawSquares(ctx, x, y, week, WIDTH);
      this.drawMonthLabels(ctx, date, x);
      this.drawActiveSquares(ctx, activeTimestamps, Sundaytime, WIDTH, week);
    },

    loadUserInfo() {
      fetchUserProfile(this.data.userId).then((userInfo) => {
        if (userInfo) {
          this.setData({
            userInfo,
          });
          fetchAllUserGames(userInfo._id).then((games) => {
            console.log(games);
            let gameHours = 0;
            let gameHost = 0;
            for (const game of games) {
              if (game.participants[0]._openid === this.data.userInfo._openid) {
                gameHost += 1;
              }
              if (game.participants.length > 1 && game.endDate < Date.now()) {
                gameHours += (game.endDate - game.startDate) / 60 / 60 / 1000;
              }
            }
            app.globalData.gameHours = gameHours;
            this.setData({
              gameHost,
              gameJoined: games.length,
              gameHours,
            });
          });
        }
      });
    },

    async getCanvasNode(selector) {
      return new Promise((resolve) => {
        const query = this.createSelectorQuery();
        query
          .select(selector)
          .fields({ node: true, size: true })
          .exec((res) => {
            console.log(res);
            this.setData({
              width: res[0].width,
              height: res[0].height,
            });
            resolve(res[0].node);
          });
      });
    },

    getSundayTimestamp(date) {
      date.setHours(0, 0, 0, 0);
      return date - date.getDay() * WEEK_OFFSET;
    },

    drawSquares(ctx, x, y, week, WIDTH) {
      for (let index = 1; index <= 500; index++) {
        ctx.fillStyle = "#343434";
        ctx.fillRect(x, y, WIDTH, WIDTH);
        if (week-- === 0) {
          week = 6;
          x -= WIDTH + 4;
          y = 30 + week * 12;
        } else {
          y = 30 + week * 12;
        }
        ctx.fillStyle = "#343434";
        ctx.fillRect(x, y, WIDTH, WIDTH);
      }
    },

    drawMonthLabels(ctx, date, x) {
      const gap = date.getDate() / 7;
      console.log(date.getDate());
      console.log(gap);
      x -= (Math.floor(gap) + 1) * 12;
      const monthIndex = date.getMonth();
      console.log(monthIndex);
      ctx.font = "13px PingFang HK";
      ctx.fillStyle = "#fff";
      ctx.fillText(MONTHS[monthIndex], x, 20);
      for (let count = monthIndex - 1; count >= 0 && x >= 0; count--) {
        x -= 4 * 12;
        x < 0 ? "return" : ctx.fillText(MONTHS[count], x, 20);
      }
    },

    drawActiveSquares(ctx, activeTimestamps, Sundaytime, WIDTH, week) {
      for (const item of activeTimestamps) {
        let x = 288;
        const dayOfWeek = getDayOfWeekFromTimestamp(item);
        const y = 30 + dayOfWeek * 12;
        if (Sundaytime - item < 0) {
          x = 288;
        } else {
          const gap = (Sundaytime - item) / (7 * WEEK_OFFSET);
          x -= (Math.floor(gap) + 1) * 12;
          if (x < 0) {
            return;
          }
        }
        ctx.fillStyle = "#DDF638";
        ctx.fillRect(x, y, WIDTH, WIDTH);
      }
    },
  },
});
