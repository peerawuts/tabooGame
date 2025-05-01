import { addScore } from '../../app/utils/redis';

export default async function handler(req, res) {
  const token = req.body.participantToken;
  console.log(token);
  const score = await addScore(token);
  res.status(200).json(score);
}
