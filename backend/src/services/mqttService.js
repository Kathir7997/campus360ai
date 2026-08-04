const mqtt = require('mqtt');

const topics = {
  attendanceScan: 'smartclassroom/attendance/scan',
  attendanceOffline: 'smartclassroom/attendance/offline',
  heartbeat: 'smartclassroom/device/+/heartbeat',
  diagnostics: 'smartclassroom/device/+/diagnostics',
  presence: 'smartclassroom/classroom/+/presence',
  firmware: 'smartclassroom/device/+/firmware',
  firmwareProgress: 'smartclassroom/device/+/firmware/progress',
};

let client = null;
let ioRef = null;

const parsePayload = (payload) => {
  try {
    return JSON.parse(payload.toString());
  } catch {
    return { raw: payload.toString() };
  }
};

const init = ({ io, onMessage } = {}) => {
  ioRef = io || null;

  const brokerUrl = process.env.MQTT_URL || process.env.MQTT_BROKER_URL;
  if (!brokerUrl) {
    return { client: null, topics };
  }

  const options = {};
  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME;
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD;

  client = mqtt.connect(brokerUrl, options);

  client.on('connect', () => {
    client.subscribe([
      topics.attendanceScan,
      topics.attendanceOffline,
      topics.heartbeat,
      topics.diagnostics,
      topics.presence,
      topics.firmware,
      topics.firmwareProgress,
    ]);
  });

  client.on('message', async (topic, payload) => {
    const message = parsePayload(payload);

    if (ioRef) {
      ioRef.emit('mqtt:message', { topic, message });
    }

    if (typeof onMessage === 'function') {
      await onMessage(topic, message);
    }
  });

  client.on('error', (error) => {
    console.error('MQTT error:', error.message);
  });

  return { client, topics };
};

const publish = (topic, message, options = {}) => {
  if (!client) return false;
  client.publish(topic, typeof message === 'string' ? message : JSON.stringify(message), options);
  return true;
};

module.exports = {
  init,
  publish,
  topics,
};