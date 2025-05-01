import { createRoom, checkRooms } from '../../app/utils/redis';
import { ivsRealtimeService } from '../../app/utils/stageUtils';
import { randomUUID } from 'crypto'

export default async function handler(req, res) {
   const body = req.body;
   console.log(body);
   const roomName = body.roomName;
   const roomKey = process.env.AWS_STAGE_REGION + body.roomKey;
   console.log("roomKey:" + roomKey);
   let result = null;
   let participantToken = null;
   let status = 200;

   const foundRoom = await checkRooms(roomKey);
   console.log(foundRoom);
   if(foundRoom !== null){
       const stageName = foundRoom.room;
       console.log(ivsRealtimeService.stageExists(stageName));
       const participant = randomUUID();
       participantToken = await ivsRealtimeService.createStageParticipantToken(stageName,roomKey,participant,req.body.memberName);
       console.log(participantToken);
       req.body.token = participantToken.token;
       req.body.member = participant;
       req.body.memberKey = participantToken.participantId;
       req.body.room = stageName;
       req.body.roomKey = roomKey;
       const id = await createRoom(req.body);
       console.log(id);
       result = participantToken.participantId;
   }else{
       result = "ชื่อห้อง " + roomName + " ไม่ถูกต้อง หรือ รหัสกุญแจห้องไม่ถูกต้อง!";
       status = 500;
   }
    res.status(status).json(result);
    //res.status(200).json({ id })
}