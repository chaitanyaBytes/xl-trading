import { Kafka } from "kafkajs";
import { config } from "../config/config";

export const kafka = new Kafka({
  clientId: "xl-trading",
  brokers: [config.kafka.broker_url],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const producer = kafka.producer();

export const consumer = kafka.consumer({ groupId: "ticks-ingest" });

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
