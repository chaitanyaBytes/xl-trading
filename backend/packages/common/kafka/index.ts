import { Kafka, Partitioners } from "kafkajs";
import { config } from "../config/config";

export const kafka = new Kafka({
  clientId: "xl-trading",
  brokers: [config.kafka.broker_url],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export const consumer = kafka.consumer({ groupId: "ticks-ingest" });
export const serverConsumer = kafka.consumer({
  groupId: "ticks-ingest-server",
});
export const wssConsumer = kafka.consumer({
  groupId: "ticks-ingest-wss",
});

let isProducerConnected = false;

export async function connectKafkaProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log("Kafka producer is connected");
  }
}

export async function disconnectKafkaProducer() {
  if (isProducerConnected) {
    await producer.disconnect();
    isProducerConnected = false;
    console.log("Kafka producer disconnected");
  }
}

let isConsumerConnected = false;

export async function connectKafkaConsumer() {
  if (!isConsumerConnected) {
    await consumer.connect();
    isConsumerConnected = true;
    console.log("Kafka consumer connected");
  }
}

export async function disconnectKafkaConsumer() {
  if (isConsumerConnected) {
    await consumer.disconnect();
    isConsumerConnected = false;
    console.log("Kafka consumer disconnected");
  }
}
