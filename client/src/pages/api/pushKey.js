import { updatePushKey } from '../../app/utils/redis';

export default async function handler(req, res) {
  console.log(req.body);
  const participantToken = req.body.participantToken;
  const subscription = req.body.subscription;
  const member = await updatePushKey(participantToken, subscription);
  res.status(200).json({ member });
}
