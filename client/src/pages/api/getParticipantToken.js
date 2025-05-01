import { getParticipantToken } from '../../app/utils/redis';

export default async function handler(req, res) {
  const participantId = req.body.participantId;
  console.log(participantId);
  const participantToken = await getParticipantToken(participantId);
  res.status(200).json(participantToken);
}
