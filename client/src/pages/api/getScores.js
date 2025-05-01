import { getScores } from '../../app/utils/redis';

export default async function handler(req, res) {
  const players = req.body.players.members;
  const token = req.body.token;
  console.log(players);
  const scores = await getScores(token, players);
  res.status(200).json(scores);
}
