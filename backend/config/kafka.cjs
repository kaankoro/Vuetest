const Kafkaesque = require("kafkaesque");

const kafka = Kafkaesque({
  brokers: [{ host: "localhost", port: 9092 }],
  clientId: "video-upload-service",
  retry: {
    retries: 5,
    factor: 3,
    minTimeout: 1000,
    maxTimeout: 3000,
  },
  compression: "gzip",
});

module.exports = kafka;
