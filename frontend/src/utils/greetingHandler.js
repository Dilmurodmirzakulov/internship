// greetingHandler.js

const getGreetingMessage = (name, t) => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  let greetingKey;

  if (currentHour >= 5 && currentHour < 12) {
    greetingKey = 'common.greetings.goodMorning';
  } else if (currentHour >= 12 && currentHour < 18) {
    greetingKey = 'common.greetings.goodAfternoon';
  } else {
    greetingKey = 'common.greetings.goodEvening';
  }

  return t('common.greetings.hello', {
    name: name,
    greeting: t(greetingKey),
  });
};

export default getGreetingMessage;
