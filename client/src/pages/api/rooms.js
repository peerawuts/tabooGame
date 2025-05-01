import { createRoom, searchRooms } from '../../app/utils/redis';
import { ivsRealtimeService } from '../../app/utils/stageUtils';
import { randomUUID } from 'crypto'

export default async function handler(req, res) {
   const body = req.body;
   const stageName = randomUUID();
   const roomName = req.body.roomName;
   let result = null;
   let stage = null;
   let participantToken = null;

   console.log(stageName);
   const foundRoom = await searchRooms(roomName);
   console.log(foundRoom);
   //console.log(ivsRealtimeService.stageExists(foundRoom));
   if (foundRoom.length !== 0) {
      stage = ivsRealtimeService.getStage(foundRoom.room);
      console.log(stage);
      result = roomName;
   }else{
      stage = await ivsRealtimeService.createStage(stageName);
      console.log(stage);
      const participant = randomUUID();
      participantToken = await ivsRealtimeService.createStageParticipantToken(stageName, stage.arn,participant,req.body.memberName);
      participantToken.tag = stage.arn;
      console.log(participantToken);
      req.body.room = stageName;
      req.body.roomKey = stage.arn;
      req.body.token = participantToken.token;
      req.body.member = participant;
      req.body.memberKey = participantToken.participantId;
      const id = await createRoom(req.body);
      console.log(id);
      result = participantToken;
   }
   res.status(200).json(result);
   //res.status(200).json({ id })
}