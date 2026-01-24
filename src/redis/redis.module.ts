import { Module, OnModuleInit } from "@nestjs/common";
import { redisClient } from "./redis.client";

@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useValue: redisClient,
    },
  ],
  exports: ["REDIS_CLIENT"],
})
export class RedisModule implements OnModuleInit {
  async onModuleInit() {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Redis connected");
    }
  }
}
