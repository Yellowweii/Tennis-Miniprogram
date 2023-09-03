import { getMessageList } from "../../api/message";
import { fetchUserProfile } from "../../api/user";
import { navigateToChat } from "../../navigator";

const app = getApp();

Component({
  /**
   * Page initial data
   */
  properties: {},

  lifetimes: {
    attached(options) {
      this.checkNewMessages();
    },
  },

  /**
   * Lifecycle function--Called when page load
   */
  data: {
    messageList: [],
  },

  /**
   * Called when user click on the top right corner to share
   */
  methods: {
    checkNewMessages: async function () {
      const _id = app.userInfo._id;
      const res = await getMessageList(_id);
      const currentDate = new Date();

      // sendTime transforms and sorts the items in each messageList
      const transformedMessageList = await Promise.all(
        res.map(async (item) => {
          const transformSendTime = (sendTime) => {
            const date = new Date(sendTime);

            if (date.toDateString() === currentDate.toDateString()) {
              // On the same day, the 24-hour clock is displayed
              const hours = date.getHours().toString().padStart(2, "0");
              const minutes = date.getMinutes().toString().padStart(2, "0");
              return `${hours}:${minutes}`;
            } else {
              // Different day, display month/day/year format
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const day = date.getDate().toString().padStart(2, "0");
              const year = date.getFullYear();
              return `${month}/${day}/${year}`;
            }
          };

          item.messages.forEach((msg) => {
            msg.time = transformSendTime(msg.sendTime);
          });

          const userId = item.relationship.filter((id) => id !== _id)[0];
          const userInfo = await fetchUserProfile(userId);

          if (userInfo) {
            Object.assign(item, {
              avatar: userInfo.avatarUrl,
              nickname: userInfo.nickname,
              userId: userId,
            });
          }

          return item;
        })
      );
      transformedMessageList.sort((a, b) => b.messages[0].sendTime - a.messages[0].sendTime);

      this.setData({
        messageList: transformedMessageList,
      });
    },

    navigateToChatPage: function (e) {
      const id = e.currentTarget.dataset.id;
      navigateToChat(id);
    },
  },
});
