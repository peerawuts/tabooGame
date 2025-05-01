import { Client, EntityId, Schema, Repository } from 'redis-om';
import { randomUUID } from 'crypto'

var moment = require('moment');

const client = new Client();

async function connect() {
    if (!client.isOpen()) {
        await client.open(process.env.REDIS_URL);
    }
}

let schema = new Schema(
  'Members',
  {
    room: { type: 'string' },
    roomName: { type: 'string' },
    roomKey: { type: 'string'},
    member: { type: 'string' },
    memberName: { type: 'string' },
    memberKey: { type: 'string' },
    score: { type: 'number' },
    token: { type: 'string' },
    endpoint: { type: 'string', path: '$.subscription.endpoint' },
    p256dh: { type: 'string', path: '$.subscription.key.p256dh'},
    auth: { type: 'string', path: '$.subscription.key.auth'},
    createdDatetime: { type: 'date' }
  },
  {
    dataStructure: 'JSON',
  }
);

export async function createRoom(data) {
  await connect();

  const repository = new Repository(schema, client);

//  const room = repository.createEntity(data);

  const jsonLd = {
    room: data.room,
    roomName: data.roomName,
    roomKey: data.roomKey,
    member: data.member,
    memberName: data.memberName,
    memberKey: data.memberKey,
    score: parseInt(data.score),
    token: data.token,
    endpoint: "",
    p256dh: "",
    auth: "",
    datetime: moment().format('yyyy-MM-DD:hh:mm:ss')
  }

  const id = await repository.save(jsonLd.roomName + ":" + jsonLd.memberKey, jsonLd);
  return id;
}

export async function getRoom(id) {
  await connect();

  const repository = new Repository(schema, client);
  return repository.fetch(id);
}

export async function createIndex() {
    await connect();

    const repository = new Repository(schema, client);
    await repository.createIndex()
}


export async function searchRooms(room) {
    await connect();

    const repository = new Repository(schema, client);

    const rooms = await repository.search().where('roomName').eq(room).return.all();
/*
    const rooms = await repository.search()
        .where('key').eq(q)
        .or('member').eq(q)
        .or('description').matches(q)
        .return.all();

    if (rooms.key == room) {
        return "true";
    }else{
        return "false";
    }
*/
    return rooms;
}

export async function checkRooms(roomKey) {
    await connect();

    const repository = new Repository(schema, client);
    console.log(roomKey);
    const room = await repository.search().where('roomKey').eq(roomKey).return.returnFirst();

    return room;
}

export async function getRoomKey(participantToken) {
    await connect();

    const repository = new Repository(schema, client);

    const room = await repository.search().where('token').eq(participantToken).return.returnFirst();

    console.log(room.roomKey);
    return room.roomKey;
}

export async function getParticipantToken(participantId) {
    await connect();

    const repository = new Repository(schema, client);

    const member = await repository.search().where('memberKey').eq(participantId).return.returnFirst();

    console.log(member.token);
    return member.token;
}

export async function updatePushKey(participantToken, subscription) {

    console.log(participantToken);
    console.log(subscription);
    await connect();

    const repository = new Repository(schema, client);

    const member = await repository.search().where('token').eq(participantToken).returnFirst();

    console.log(member);
    member.endpoint = subscription.endpoint;
    member.p256dh = subscription.keys.p256dh;
    member.auth = subscription.keys.auth;

    const id = await repository.save(member);
    return id;
}

export async function getPushKey(player) {

    console.log(player);
    await connect();

    const repository = new Repository(schema, client);

    const member = await repository.search().where('member').eq(player).returnFirst();

    console.log(member);
    const subscription = {
        endpoint: member.endpoint,
        keys: {
                p256dh: member.p256dh,
                auth: member.auth,
        }

    }
    return subscription;

}

export async function getScores(participantToken, players) {

    console.log("token:" + participantToken);
    await connect();

    const repository = new Repository(schema, client);

    const room = await repository.search().where('token').eq(participantToken).returnFirst();

    console.log("room:" + JSON.stringify(room));
    let roomKey = room.roomKey;

    let scores = [];

    for (let i in players) {
        let member = await repository.search().where('memberKey').equals(players[i].memberId).and('roomKey').equals(roomKey).returnFirst();

        //console.log(member);
        scores.push( { "member": member.memberName, "score": member.score } );

    }
    console.log(scores);
    return scores;
}

export async function addScore(participantToken) {

    await connect();

    const repository = new Repository(schema, client);

    const member = await repository.search().where('token').eq(participantToken).returnFirst();

    console.log(member);
    member.score = member.score + 1;

    const id = await repository.save(member);

    return member.score;
}

export async function deductScore(participantToken) {

    await connect();

    const repository = new Repository(schema, client);

    const member = await repository.search().where('token').eq(participantToken).returnFirst();

    console.log(member);
    member.score = -1;

    const id = await repository.save(member);

    return member.score;
}

export async function resetPlayersScores(participantToken, players) {

    await connect();

    const repository = new Repository(schema, client);

    const room = await repository.search().where('token').eq(participantToken).returnFirst();

    console.log("room:" + JSON.stringify(room));
    let roomKey = room.roomKey;

    for (let i in players) {

        let member = await repository.search().where('memberKey').equals(players[i].memberId).and('roomKey').equals(roomKey).returnFirst();

        console.log(member);
        member.score = 0;

        let id = await repository.save(member);
    }

    return players;
}