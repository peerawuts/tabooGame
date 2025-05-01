import { getPushKey } from '../../app/utils/redis';
import { sendWebPush } from '../../app/utils/Push';
import { getPlayedWords } from '../../app/utils/mysql';

export default async function handler(req, res) {
  console.log(req.body);
  const participants = req.body.body.members;
  const playedWords = req.body.playedWords;
  const hitWords = req.body.hitWords;
  const startTime = req.body.startTime;
  const isStartGame = req.body.isStartGame;

  for (let i in participants) {
      const subscription = await getPushKey(participants[i].member);
      const result = await sendWebPush(subscription, playedWords, hitWords, isStartGame, startTime);
      console.log('send push ' + participants[i].member + ' success.');
  }

  res.status(200).json('send hit word all ' + participants.length + ' success');
}
