import { Inject, Injectable } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class AppService {
  constructor(
    @Inject("REDIS_CLIENT")
    private readonly redis: RedisClientType,
  ) { }

  async getMyData() {
    // Fetch the keys you set in the CLI
    const name = await this.redis.get("name:1");
    const user = await this.redis.get("User");
    const Student = await this.redis.get("Student");
    const productName = await this.redis.get("ProductName");
    const Range = await this.redis.getRange("MyKey", 0, 3)
    const EndRange = await this.redis.getRange("MyKey", -3, -1)
    const productData = await this.redis.json.set("Product", "$", {
      name: "Product",
      price: 100,
      description: "This is a product"
    });
    const JSONGet = await this.redis.json.get("Product")
    // const listLength = await this.redis.lPush(
    //   "MyList",
    //   ["value1", "value2", "value3"]
    // );
    // const List = await this.redis.lRange("MyList", 0, -4);
    const HashSet=await this.redis.hSet("hash",{
      name:"hash",
      age:25,
      city:"Delhi"
    })
    const hashGetAll=await this.redis.hGetAll("hash")
    return {
      message: "Data fetched from Redis Cloud!",
      data: {
        "name:1": name,
        "User": user,
        "ProductName": productName,
        "Student": Student,
        "Range": Range,
        "EndRange": EndRange,
        "JSONGet": JSONGet,
        // "List": List,
        "hashGetAll":hashGetAll,
        "valueAtIndexZero":await this.redis.LINDEX("MyList",-1)
      }
    };
  }
}
