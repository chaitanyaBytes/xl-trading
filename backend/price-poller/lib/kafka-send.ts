import { producer, parseBigintString } from "@xl-trading/common";
import { type Tick } from "@xl-trading/common";

export async function sendTicksToKafka(tickData: Tick) {
  try {
    await producer.send({
      topic: "ticks",
      messages: [
        {
          key: tickData.symbol,
          value: parseBigintString(tickData),
          timestamp: tickData.ts.toString(),
        },
      ],
    });
  } catch (error: any) {
    console.log("Error sending tick data to kafka: ", error.message);
  }
}
