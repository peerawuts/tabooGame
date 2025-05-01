import { Server } from "socket.io";
import { getRoomKey, resetPlayersScores } from '../../app/utils/redis';
import { getPlayedWords } from '../../app/utils/mysql';

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log("Socket Already Setup");
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on("connection", (socket) => {
      console.log("User Connected: " + socket.id);

      socket.on("join_room", async (participantToken) => {
        console.log("join room");
        const roomKey = await getRoomKey(participantToken);
        socket.join(roomKey);

        console.log("User with ID: " + socket.id + " joined room: " +roomKey);
      });

      socket.on("start_game", async (data) => {
          console.log("start game:" + JSON.stringify(data));

          const participants = data.body.members;
          const participantToken = data.token;
          const startTime = data.startTime;
          const selectedCategory = data.category;
          const isStartGame = data.isStartGame;
          const gameDuration = data.gameDuration;

          const roomKey = await getRoomKey(participantToken);
          const playedWords = await getPlayedWords(selectedCategory, participants);
          const hitWords = []

          const pushBody = {
              title: 'Send Game Start',
              body: startTime,
              url: 'https://acquaintedgame.com',
              playedWords: playedWords,
              hitWords: hitWords,
              isStartGame: isStartGame,
              gameDuration: gameDuration,
          };

          resetPlayersScores(participantToken, participants);
          io.sockets.in(roomKey).emit("receive-message",pushBody);

          console.log("Notify to Room: " + roomKey + " with payload: " + JSON.stringify(pushBody));
      });

      socket.on("hit", async (data) => {
          console.log(data);

          const participantToken = data.token;
          const roomKey = await getRoomKey(participantToken);

          io.sockets.in(roomKey).emit("receive-message",data);

          console.log('send hit word all to ' + roomKey + ' success');
      });

  /*    socket.on("disconnect", () => {
            log("User Disconnected " + socket.id);
            for (const [roomId, users] of Object.entries(roomUsers)) {
              if (users.includes(socket.id)) {
                roomUsers[roomId] = [...users.filter((id) => id !== socket.id)];
                io.emit("receive_message", {
                  text: "A user left the room.",
                  socketId: "kurakani",
                  roomId: roomId,
                });
              }
            }
            io.emit("users_response", roomUsers);
        });
  */
  });

  console.log("Setting Up Socket.io");
  res.end();
}