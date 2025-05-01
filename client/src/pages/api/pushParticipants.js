import { getPushKey, getRoomId, resetPlayersScores } from '../../app/utils/redis';
import { sendWebPush } from '../../app/utils/Push';
import { getPlayedWords } from '../../app/utils/mysql';

export default async function handler(req, res) {
  console.log(req.body);
  const participants = req.body.body.members;
  const participantToken = req.body.token;
  const startTime = req.body.startTime;
  const selectedCategory = req.body.category;
  const isStartGame = req.body.isStartGame;

  const playedWords = await getPlayedWords(selectedCategory, participants);
  const hitWords = []

  console.log(participants);
  resetPlayersScores(participants);

  for (let i in participants) {

      console.log(participants[i]);
      const subscription = await getPushKey(participants[i].member);
      const result = await sendWebPush(subscription, playedWords, hitWords, isStartGame, startTime);

      const roomId = await getRoomId(participantToken);
      console.log('send push ' + participants[i].member + ' success.');
  }

  res.status(200).json('send all ' + participants.length + ' push success');
}
