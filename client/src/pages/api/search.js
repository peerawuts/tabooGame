import { searchRooms } from '../../app/utils/redis';

export default async function handler(req, res) {
  const q = req.query.q;
  const rooms = await searchRooms(q);
  res.status(200).json({ rooms });
}
