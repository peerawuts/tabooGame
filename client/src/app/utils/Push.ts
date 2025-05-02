import Swal from 'sweetalert2';

var moment = require('moment');
const util = require('util');
const SERVICE_WORKER_FILE_PATH = './sw.js';

export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('showNotification' in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): void {
  const state: NotificationPermission = Notification.permission;
  console.log(state);
  switch (state) {
    case 'denied':
      Notification.requestPermission().then(function(permission) { console.log('permiss', permission)});
      registerAndSubscribe(onSubscribe);
      break;
    case 'granted':
      registerAndSubscribe(onSubscribe);
      break;
    case 'default':
      Notification.requestPermission().then(function(permission) { console.log('permiss', permission)});
      registerAndSubscribe(onSubscribe);
      break;
  }
}

async function subscribe(onSubscribe: (subs: PushSubscription | null) => void): Promise<void> {
  navigator.serviceWorker.ready
    .then((registration: ServiceWorkerRegistration) => {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
    })
    .then((subscription: PushSubscription) => {
      console.info('Created subscription Object: ', subscription.toJSON());
      submitSubscription(subscription).then(_ => {
        onSubscribe(subscription);
      });
    })
    .catch(e => {
      console.error('Failed to subscribe cause of: ', e);
    });
}

async function submitSubscription(subscription: PushSubscription): Promise<void> {
  const endpointUrl = '/api/web-push/subscription';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription }),
  });
  const result = await res.json();
  console.log(result);

}

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    await subscribe(onSubscribe);
  } catch (e) {
    console.error('Failed to register service-worker: ', e);
  }
}

export async function sendWebPush(subscription: PushSubscription | null, playedWords, hitWords, isStartGame: boolean, startTime: string): Promise<void> {
  const endPointUrl = process.env.URL + '/api/web-push/send';
  const pushBody = {
    title: 'Send Game Start Time',
    body: startTime,
    image: '/next.png',
    icon: 'nextjs.png',
    url: 'https://acquaintedgame.com',
    subscription: subscription ?? 'No Subscription sent',
    playedWords: playedWords,
    hitWords: hitWords,
    isStartGame: isStartGame,
  };
  const res = await fetch(endPointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pushBody),
  });
  const result = await res.json();
  //console.log(result);
}

export async function sendWebPushParticipants(players, selectedCategory: string, participantToken: string): Promise<void> {
    const endPointUrl = '/api/pushParticipants';
    const pushBody = {
        title: 'Please keep game page opened for start playing.',
        body: players ?? 'No Player sent',
        image: '/next.png',
        icon: 'nextjs.png',
        url: 'https://acquaintedgame.com',
        token: participantToken,
        category: selectedCategory,
        isStartGame: 'true',
        startTime: moment().format('yyyy-MM-DD:hh:mm:ss'),
    };
    const res = await fetch(endPointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushBody),
    });
    const result = await res.json();
    console.log(result);
}

export async function sendWebPushHitWord(players, playedWords, hitWords): Promise<void> {
    const endPointUrl = '/api/pushHitWord';
    const pushBody = {
        title: 'Please keep game page opened for start playing.',
        body: players ?? 'No Player sent',
        image: '/next.png',
        icon: 'nextjs.png',
        url: 'https://acquaintedgame.com',
        playedWords: playedWords,
        hitWords: hitWords,
        isStartGame: 'false',
        startTime: moment().format('yyyy-MM-DD:hh:mm:ss'),
    };
    const res = await fetch(endPointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushBody),
    });
    const result = await res.json();
    console.log(result);
}

export async function updateSubscriptionToRedis(participantToken: string,subscription: PushSubscription): Promise<void> {
  const endpointUrl = '/api/pushKey';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ participantToken,  subscription }),
  });
  const result = await res.json();
  console.log(result);

}

export async function getScoresFromRedis(participantToken, players): Promise<void> {
  const endpointUrl = '/api/getScores';
  const pushBody = {
    token: participantToken,
    players: players,
  };
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pushBody),
  });
  const result = await res.json();
  console.log(result);
  return result;
}

export async function getParticipantTokenFromRedis(participantId: string): Promise<void> {
  const endpointUrl = '/api/getParticipantToken';
  const pushBody = {
    participantId: participantId
  };
  try{
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushBody),
      });
      const result = await res.json();
      console.log(result);
      return result;
  } catch(err) {
    console.log(err);
  }
}

export async function addScoreToPlayer(participantToken: string): Promise<void> {
  const endpointUrl = '/api/addScore';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({participantToken}),
  });
  const result = await res.json();
  console.log(result);
  return result;
}

export async function deductScoreToPlayer(participantToken: string): Promise<void> {
  const endpointUrl = '/api/deductScore';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({participantToken}),
  });
  const result = await res.json();
  console.log(result);
  return result;
}

export async function resetPlayerScores(roomId: string, players): Promise<void> {
  const endpointUrl = '/api/resetScores';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({players}),
  });
  const result = await res.json();
  console.log(result);
  return result;
}

export async function initPostMessageListener(setTabooWords, handleStartGameCountdown, setIsGameEnd, setHitWords): Promise<void> {
    console.log("event listener message")
    navigator.serviceWorker.addEventListener('message', function(e) {

      var payload = JSON.parse(e.data);
      var message = e.data;

      console.log("Message '" + message + "' handled.");
      console.log("Start Game :" + payload.isStartGame);
      const isStartGame = payload.isStartGame == "true" ? true : false;

      const members = new Array();
      let data = { members: []  }
      for(let i in payload.playedWords) {
        data.members.push( { member: payload.playedWords[i].member });
      }
      console.log(data);
      if(isStartGame) {
        console.log("Starting Game");
        setTabooWords(payload.playedWords);
        setIsGameEnd(false);
        countdown(handleStartGameCountdown, isStartGame, data);
      }else{
        setHitWords(payload.hitWords);
        console.log(payload.hitWords);
        console.log(payload.playedWords);
        console.log(payload.playedWords.length - payload.hitWords.length);
        console.log(payload.hitWords?.filter(hitWord => hitWord.member == localPlayer).length);
        if ((payload.playedWords.length - payload.hitWords.length) == 1) {
            setIsGameEnd(true);
            if(payload.hitWords?.filter(hitWord => hitWord.member == localPlayer).length > 0) {
                deductScoreToPlayer();
                handleStartGameCountdown(isStartGame,data);
            }
        }
      }
    });
}

export async function countdown(handleStartGameCountdown, isStartGame, players, selectedGameDuration) {
    let timerInterval;

    if(!Swal.isTimerRunning()) {

        Swal.fire({
            title: "Get Ready!",
            html: "Game is starting in <b></b> seconds.",
            customClass: {
                container: 'my-swal'
            },
            timer: 2000,
            timerProgressBar: true,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
                const timer = Swal.getPopup().querySelector("b");
                timerInterval = setInterval(() => {
                    timer.textContent = `${Math.round(Swal.getTimerLeft()/1000)}`;
                }, 100);
            },
            willClose: () => {
                clearInterval(timerInterval);
            }
        }).then((result) => {
            /* Read more about handling dismissals below */
            if (result.dismiss === Swal.DismissReason.timer) {
                console.log("I was closed by the timer");
                handleStartGameCountdown(isStartGame, players, selectedGameDuration);
            }
        });
    }
};