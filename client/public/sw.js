self.addEventListener('install', () => {
  console.info('service worker installed.');
});

const sendDeliveryReportAction = () => {
  console.log('Web push delivered.');
};

self.addEventListener('push', function (event) {

  if (!event.data) {
    return;
  }
  const localPage = '/';
  const urlToOpen = new URL(localPage, self.location.origin).href;

  const payload = event.data.json();
  const { body, icon, image, badge, url, title, subscription, playedWords } = payload;
/*
  const notificationTitle = title ?? 'Hi';
  const notificationOptions = {
    body,
    icon,
    image,
    data: {
      url,
    },
    badge,
  };
*/
  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      let matchingClient = null;

      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }

      if (matchingClient) {
        matchingClient.postMessage(JSON.stringify(payload));
        return  matchingClient.focus();

      } else {
        return self.registration.showNotification('No focused windows', {
                       body: 'Had to show a notification instead of messaging each page.',
               }).then(() => {
                       sendDeliveryReportAction();
               });
      }
    });

  event.waitUntil(promiseChain);

});
